<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Guardian;
use App\Models\Student;
use Illuminate\Http\Request;

class GuardianController extends Controller
{
    public function index(Request $request)
    {
        $perPage = $request->get('per_page', 15);

        return $this->applyFilters(Guardian::query(), $request)
            ->withCount('students')
            ->withCount('user as has_account')
            ->paginate($perPage);
    }

    public function filters()
    {
        return [
            'relationships' => Guardian::whereNotNull('relationship')->where('relationship', '!=', '')
                ->distinct()->orderBy('relationship')->pluck('relationship'),
            'genders' => Guardian::whereNotNull('gender')->where('gender', '!=', '')
                ->distinct()->orderBy('gender')->pluck('gender'),
            'students' => Student::orderBy('name')->get(['id', 'name', 'class_id']),
        ];
    }

    public function store(Request $request)
    {
        $data = $request->validate($this->rules());
        $studentIds = $request->input('student_ids', []);

        $guardian = Guardian::create($data);
        if (is_array($studentIds) && count($studentIds) > 0) {
            Student::whereIn('id', $studentIds)->update(['guardian_id' => $guardian->id]);
        }

        return $this->show($guardian);
    }

    public function show(Guardian $parent)
    {
        $parent->load(['students' => fn ($q) => $q->with('class')->orderBy('name')]);

        $parent->stats = [
            'children_count' => $parent->students->count(),
            'has_account' => $parent->user()->exists(),
        ];

        return $parent;
    }

    public function update(Request $request, Guardian $parent)
    {
        $rules = $this->rules();
        $rules['email'] = 'nullable|email|unique:guardians,email,' . $parent->id;

        $data = $request->validate($rules);
        $parent->update($data);

        if ($request->has('student_ids')) {
            $studentIds = $request->input('student_ids', []);

            Student::where('guardian_id', $parent->id)
                ->whereNotIn('id', $studentIds)
                ->update(['guardian_id' => null]);

            if (is_array($studentIds) && count($studentIds) > 0) {
                Student::whereIn('id', $studentIds)->update(['guardian_id' => $parent->id]);
            }
        }

        return $this->show($parent);
    }

    public function destroy(Guardian $parent)
    {
        $parent->delete();
        return response()->noContent();
    }

    public function export(Request $request)
    {
        $guardians = $this->applyFilters(Guardian::query(), $request)
            ->withCount('students')
            ->get();

        $headers = [
            'Name', 'Gender', 'Date of Birth', 'Phone', 'Email', 'Address',
            'Relationship', 'Emergency Contact', 'Children',
        ];

        return response()->streamDownload(function () use ($guardians, $headers) {
            $out = fopen('php://output', 'w');
            fputcsv($out, $headers);
            foreach ($guardians as $g) {
                fputcsv($out, [
                    $g->name, $g->gender, $g->dob, $g->phone, $g->email, $g->address,
                    $g->relationship, $g->emergency_contact, $g->students_count,
                ]);
            }
            fclose($out);
        }, 'guardians-' . now()->format('Y-m-d') . '.csv', ['Content-Type' => 'text/csv']);
    }

    private function rules(): array
    {
        return [
            'name' => 'required|string',
            'gender' => 'nullable|string',
            'dob' => 'nullable|date',
            'phone' => 'nullable|string',
            'email' => 'nullable|email|unique:guardians',
            'address' => 'nullable|string',
            'relationship' => 'nullable|string',
            'emergency_contact' => 'nullable|string',
            'image' => 'nullable|string',
            'student_ids' => 'nullable|array',
            'student_ids.*' => 'integer|exists:students,id',
        ];
    }

    private function applyFilters($query, Request $request)
    {
        if ($request->filled('search')) {
            $search = trim($request->search);
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('phone', 'like', "%{$search}%")
                    ->orWhere('relationship', 'like', "%{$search}%");
            });
        }

        foreach (['relationship', 'gender'] as $field) {
            if ($request->filled($field)) {
                $query->where($field, $request->input($field));
            }
        }

        return $query;
    }
}
