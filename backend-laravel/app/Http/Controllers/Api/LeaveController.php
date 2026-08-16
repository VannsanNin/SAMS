<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Leave;
use App\Models\Staff;
use App\Models\Student;
use Illuminate\Http\Request;

class LeaveController extends Controller
{
    public function index(Request $request)
    {
        $perPage = $request->get('per_page', 15);

        $query = Leave::query();
        $ids = $this->allowedStudentIds($request->user());
        if ($ids !== null) {
            $query->whereIn('student_id', $ids);
        }

        return $this->applyFilters($query, $request)
            ->with('student', 'staff')
            ->orderByDesc('date_from')
            ->paginate($perPage);
    }

    public function filters(Request $request)
    {
        $students = Student::orderBy('name')->get(['id', 'name']);
        $ids = $this->allowedStudentIds($request->user());
        if ($ids !== null) {
            $students = $students->whereIn('id', $ids)->values();
        }

        return [
            'statuses' => ['pending', 'approved', 'rejected'],
            'students' => $students,
            'staff' => Staff::orderBy('name')->get(['id', 'name']),
        ];
    }

    public function store(Request $request)
    {
        $user = $request->user();

        $rules = $this->rules();
        if ($user && ($user->isStudent() || $user->isParent())) {
            $rules['staff_id'] = 'nullable|exists:staff,id';
            $rules['status'] = 'nullable|string|in:pending,approved,rejected';
        }

        $data = $request->validate($rules);

        if ($user && $user->isStudent()) {
            abort_unless((int) $data['student_id'] === (int) $user->student_id, 403);
            $data['status'] = 'pending';
        }

        if ($user && $user->isParent()) {
            $allowed = Student::where('id', $data['student_id'])
                ->where('guardian_id', $user->guardian_id)
                ->exists();
            abort_unless($allowed, 403);
            $data['status'] = 'pending';
        }

        $leave = Leave::create($data);

        return $this->show($request, $leave);
    }

    public function show(Request $request, Leave $leave)
    {
        $ids = $this->allowedStudentIds($request->user());
        if ($ids !== null && ! in_array($leave->student_id, $ids)) {
            abort(403);
        }

        return $leave->load('student', 'staff');
    }

    public function update(Request $request, Leave $leave)
    {
        $rules = $this->rules();
        $rules['student_id'] = 'exists:students,id';
        $rules['staff_id'] = 'exists:staff,id';
        $rules['date_from'] = 'date';
        $rules['date_to'] = 'date|after_or_equal:date_from';
        $rules['reason'] = 'string';
        $rules['status'] = 'string|in:pending,approved,rejected';

        $data = $request->validate($rules);
        $leave->update($data);

        return $this->show($leave);
    }

    public function destroy(Leave $leave)
    {
        $leave->delete();
        return response()->noContent();
    }

    public function approve(Request $request, Leave $leave)
    {
        $leave->update(['status' => 'approved']);
        return $this->show($request, $leave);
    }

    public function reject(Request $request, Leave $leave)
    {
        $leave->update(['status' => 'rejected']);
        return $this->show($request, $leave);
    }

    public function export(Request $request)
    {
        $leaves = $this->applyFilters(Leave::query(), $request)
            ->with('student', 'staff')
            ->orderByDesc('date_from')
            ->get();

        $headers = ['Leave ID', 'Student', 'Staff', 'Date From', 'Date To', 'Reason', 'Status'];

        return response()->streamDownload(function () use ($leaves, $headers) {
            $out = fopen('php://output', 'w');
            fputcsv($out, $headers);
            foreach ($leaves as $l) {
                fputcsv($out, [
                    $l->id, $l->student?->name ?? '', $l->staff?->name ?? '',
                    $l->date_from, $l->date_to, $l->reason, $l->status,
                ]);
            }
            fclose($out);
        }, 'leaves-' . now()->format('Y-m-d') . '.csv', ['Content-Type' => 'text/csv']);
    }

    private function rules(): array
    {
        return [
            'student_id' => 'required|exists:students,id',
            'staff_id' => 'required|exists:staff,id',
            'date_from' => 'required|date',
            'date_to' => 'required|date|after_or_equal:date_from',
            'reason' => 'required|string',
            'status' => 'required|string|in:pending,approved,rejected',
        ];
    }

    private function allowedStudentIds($user): ?array
    {
        if (! $user) {
            return null;
        }

        if ($user->isStudent()) {
            return $user->student_id ? [(int) $user->student_id] : [];
        }

        if ($user->isParent()) {
            return $user->guardian
                ? $user->guardian->students()->pluck('id')->map(fn ($id) => (int) $id)->all()
                : [];
        }

        return null;
    }

    private function applyFilters($query, Request $request)
    {
        if ($request->filled('search')) {
            $search = trim($request->search);
            $query->whereHas('student', function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%");
            });
        }

        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        if ($request->filled('student_id')) {
            $query->where('student_id', $request->input('student_id'));
        }

        if ($request->filled('staff_id')) {
            $query->where('staff_id', $request->input('staff_id'));
        }

        if ($request->filled('date_from')) {
            $query->whereDate('date_to', '>=', $request->input('date_from'));
        }

        if ($request->filled('date_to')) {
            $query->whereDate('date_from', '<=', $request->input('date_to'));
        }

        return $query;
    }
}
