<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Api\Concerns\ImportsSpreadsheet;
use App\Models\Staff;
use Illuminate\Http\Request;

class StaffController extends Controller
{
    use ImportsSpreadsheet;

    public function index(Request $request)
    {
        $perPage = $request->get('per_page', 15);

        return $this->applyFilters(Staff::query(), $request)
            ->withCount(['attendances', 'leaves'])
            ->paginate($perPage);
    }

    public function filters()
    {
        return [
            'positions' => Staff::whereNotNull('position')->where('position', '!=', '')
                ->distinct()->orderBy('position')->pluck('position'),
            'genders' => Staff::whereNotNull('gender')->where('gender', '!=', '')
                ->distinct()->orderBy('gender')->pluck('gender'),
        ];
    }

    public function store(Request $request)
    {
        $data = $request->validate($this->rules());
        $staff = Staff::create($data);

        return $this->show($staff);
    }

    public function show(Staff $staff)
    {
        $staff->load([
            'attendances.schedule.subject',
            'attendances.student',
            'leaves.student',
        ]);

        $staff->stats = [
            'total_attendances' => $staff->attendances->count(),
            'total_leaves' => $staff->leaves->count(),
            'pending_leaves' => $staff->leaves->where('status', 'pending')->count(),
            'days_employed' => now()->diffInDays($staff->hire_date) + 1,
        ];

        return $staff;
    }

    public function update(Request $request, Staff $staff)
    {
        $rules = $this->rules();
        $rules['email'] = 'email|unique:staff,email,' . $staff->id;

        $data = $request->validate($rules);
        $staff->update($data);

        return $this->show($staff);
    }

    public function destroy(Staff $staff)
    {
        $staff->delete();
        return response()->noContent();
    }

    public function import(Request $request)
    {
        $request->validate(['file' => 'required|file']);

        $file = $request->file('file');

        try {
            $rows = $this->readRows($file);
        } catch (\Throwable $e) {
            return response()->json(['message' => 'Could not parse the file: ' . $e->getMessage()], 422);
        }

        if (count($rows) < 2) {
            return response()->json(['message' => 'The file must contain a header row and at least one staff member.'], 422);
        }

        $header = array_map(fn ($h) => $this->normalizeHeader($h), $rows[0]);

        $created = 0;
        $skipped = 0;
        $errors = [];

        foreach ($rows as $ri => $row) {
            if ($ri === 0) {
                continue;
            }

            $record = $this->rowToRecord($row, $header);

            if (empty($record['name']) || empty($record['email'])) {
                $skipped++;
                $errors[] = 'Row ' . ($ri + 1) . ': name and email are required.';
                continue;
            }

            if (Staff::where('email', $record['email'])->exists()) {
                $skipped++;
                continue;
            }

            Staff::create([
                'name' => $record['name'],
                'gender' => $record['gender'] ?? 'Female',
                'dob' => $record['dob'] ?? '1990-01-01',
                'phone' => $record['phone'] ?? '',
                'email' => $record['email'],
                'address' => $record['address'] ?? '',
                'position' => $record['position'] ?? 'Staff',
                'salary' => $record['salary'] ?? 0,
                'hire_date' => $record['hire_date'] ?? now()->format('Y-m-d'),
            ]);

            $created++;
        }

        return response()->json([
            'message' => "Imported {$created} staff member" . ($created === 1 ? '' : 's') . ".",
            'created' => $created,
            'skipped' => $skipped,
            'errors' => array_slice($errors, 0, 25),
        ]);
    }

    public function export(Request $request)
    {
        $staff = $this->applyFilters(Staff::query(), $request)
            ->withCount(['attendances', 'leaves'])
            ->get();

        $headers = [
            'Name', 'Gender', 'Date of Birth', 'Phone', 'Email', 'Address',
            'Position', 'Salary', 'Hire Date', 'Attendances', 'Leaves',
        ];

        return response()->streamDownload(function () use ($staff, $headers) {
            $out = fopen('php://output', 'w');
            fputcsv($out, $headers);
            foreach ($staff as $s) {
                fputcsv($out, [
                    $s->name, $s->gender, $s->dob, $s->phone, $s->email, $s->address,
                    $s->position, $s->salary, $s->hire_date, $s->attendances_count, $s->leaves_count,
                ]);
            }
            fclose($out);
        }, 'staff-' . now()->format('Y-m-d') . '.csv', ['Content-Type' => 'text/csv']);
    }

    private function rules(): array
    {
        return [
            'name' => 'required|string',
            'gender' => 'required|string',
            'dob' => 'required|date',
            'phone' => 'required|string',
            'email' => 'required|email|unique:staff',
            'address' => 'required|string',
            'position' => 'required|string',
            'salary' => 'required|numeric',
            'hire_date' => 'required|date',
            'image' => 'nullable|string',
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
                    ->orWhere('position', 'like', "%{$search}%");
            });
        }

        foreach (['position', 'gender'] as $field) {
            if ($request->filled($field)) {
                $query->where($field, $request->input($field));
            }
        }

        return $query;
    }

    protected function headerAliases(): array
    {
        return [
            'name' => 'name', 'full name' => 'name', 'fullname' => 'name', 'staff name' => 'name',
            'gender' => 'gender', 'sex' => 'gender',
            'dob' => 'dob', 'birth date' => 'dob', 'birthdate' => 'dob', 'date of birth' => 'dob',
            'phone' => 'phone', 'mobile' => 'phone', 'phone number' => 'phone',
            'email' => 'email', 'email address' => 'email',
            'address' => 'address',
            'position' => 'position', 'job title' => 'position', 'role' => 'position',
            'salary' => 'salary',
            'hire date' => 'hire_date', 'hiredate' => 'hire_date', 'joining date' => 'hire_date',
            'image' => 'image', 'photo' => 'image',
        ];
    }
}
