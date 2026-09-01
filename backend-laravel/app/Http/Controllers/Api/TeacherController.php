<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Api\Concerns\ImportsSpreadsheet;
use App\Models\SchoolClass;
use App\Models\Subject;
use App\Models\Teacher;
use Illuminate\Http\Request;

class TeacherController extends Controller
{
    use ImportsSpreadsheet;

    public function index(Request $request)
    {
        $perPage = $request->get('per_page', 15);

        return $this->applyFilters(Teacher::query(), $request)
            ->withCount(['subjects', 'assignedClasses'])
            ->with([
                'classes:id,class_name',
                'assignedClasses:id,class_name',
                'subjects:id,subject_name',
            ])
            ->paginate($perPage);
    }

    public function filters()
    {
        return [
            'departments' => Teacher::whereNotNull('department')->where('department', '!=', '')
                ->distinct()->orderBy('department')->pluck('department'),
            'positions' => Teacher::whereNotNull('position')->where('position', '!=', '')
                ->distinct()->orderBy('position')->pluck('position'),
            'statuses' => ['active', 'inactive', 'on_leave', 'suspended'],
            'subjects' => Subject::orderBy('subject_name')->get(['id', 'subject_name']),
            'classes' => SchoolClass::orderBy('class_name')->get(['id', 'class_name']),
        ];
    }

    public function store(Request $request)
    {
        $data = $request->validate($this->rules());
        $teacher = Teacher::create($data);
        $this->syncAssignments($teacher, $request);

        return $this->show($teacher);
    }

    public function summary(Request $request)
    {
        $teachers = $this->applyFilters(Teacher::query(), $request)
            ->withCount('classes')
            ->withCount('assignedClasses')
            ->get();

        $rows = $teachers->map(function ($t) {
            return [
                'id' => $t->id,
                'teacher_id' => $t->teacher_id,
                'name' => $t->name,
                'dept' => $t->department,
                'classes' => (int) $t->classes_count + (int) $t->assigned_classes_count,
                'contact' => $t->phone,
                'position' => $t->position,
                'status' => $t->status,
            ];
        });

        $total = $rows->count();
        $deptCount = $rows->pluck('dept')->filter()->unique()->count();
        $onLeave = $rows->whereIn('status', ['on_leave', 'inactive'])->count();
        $avgClasses = $total > 0 ? round($rows->avg('classes'), 1) : 0;

        $deptMap = $rows->where('dept')->groupBy('dept')->map->count();

        return [
            'teachers' => $rows->values(),
            'total' => $total,
            'departments' => $deptCount,
            'on_leave' => $onLeave,
            'avg_classes' => $avgClasses,
            'department_distribution' => $deptMap->map(fn ($n, $d) => ['dept' => $d, 'count' => $n])->values(),
        ];
    }

    public function show(Teacher $teacher)
    {
        $teacher->load([
            'classes:id,class_name',
            'assignedClasses:id,class_name',
            'subjects:id,subject_name',
            'schedules.class:id,class_name',
            'schedules.subject:id,subject_name',
        ]);

        $teacher->teaching_stats = [
            'assigned_subjects' => $teacher->subjects->count(),
            'assigned_classes' => $teacher->assignedClasses->count(),
            'homeroom_classes' => $teacher->classes->count(),
            'weekly_schedules' => $teacher->schedules->count(),
            'weekly_hours' => round($teacher->schedules->sum(
                fn ($s) => (strtotime($s->time_end) - strtotime($s->time_start)) / 3600
            ), 1),
        ];

        return $teacher;
    }

    public function update(Request $request, Teacher $teacher)
    {
        $rules = $this->rules();
        $rules['email'] = 'required|email|unique:teachers,email,' . $teacher->id;
        $rules['teacher_id'] = 'nullable|string|max:50|unique:teachers,teacher_id,' . $teacher->id;

        $data = $request->validate($rules);
        $teacher->update($data);
        $this->syncAssignments($teacher, $request);

        return $this->show($teacher);
    }

    public function destroy(Teacher $teacher)
    {
        $teacher->delete();
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
            return response()->json(['message' => 'The file must contain a header row and at least one teacher.'], 422);
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

            if (Teacher::where('email', $record['email'])->exists()) {
                $skipped++;
                continue;
            }

            $teacher = Teacher::create([
                'name' => $record['name'],
                'gender' => $record['gender'] ?? 'Male',
                'dob' => $record['dob'] ?? '1985-01-01',
                'phone' => $record['phone'] ?? '',
                'email' => $record['email'],
                'address' => $record['address'] ?? '',
                'department' => $record['department'] ?? null,
                'position' => $record['position'] ?? 'Teacher',
                'salary' => $record['salary'] ?? 0,
                'hire_date' => $record['hire_date'] ?? now()->format('Y-m-d'),
                'status' => $record['status'] ?? 'active',
            ]);

            $subjectIds = $this->resolveSubjectIds($record['subjects'] ?? $record['courses'] ?? '');
            if ($subjectIds) {
                $teacher->subjects()->attach($subjectIds);
            }

            $classIds = $this->resolveClassIds($record['classes'] ?? '');
            if ($classIds) {
                $teacher->assignedClasses()->attach($classIds);
            }

            $created++;
        }

        return response()->json([
            'message' => "Imported {$created} teacher" . ($created === 1 ? '' : 's') . ".",
            'created' => $created,
            'skipped' => $skipped,
            'errors' => array_slice($errors, 0, 25),
        ]);
    }

    public function export(Request $request)
    {
        $teachers = $this->applyFilters(Teacher::query(), $request)
            ->with(['assignedClasses:id,class_name', 'subjects:id,subject_name'])
            ->get();

        $headers = [
            'Teacher ID', 'Name', 'Gender', 'Date of Birth', 'Phone', 'Email', 'Address',
            'Department', 'Position', 'Salary', 'Hire Date', 'Status',
            'Assigned Courses', 'Assigned Classes',
        ];

        return response()->streamDownload(function () use ($teachers, $headers) {
            $out = fopen('php://output', 'w');
            fputcsv($out, $headers);
            foreach ($teachers as $t) {
                fputcsv($out, [
                    $t->teacher_id, $t->name, $t->gender, $t->dob, $t->phone, $t->email, $t->address,
                    $t->department, $t->position, $t->salary, $t->hire_date, $t->status,
                    $t->subjects->pluck('subject_name')->implode('; '),
                    $t->assignedClasses->pluck('class_name')->implode('; '),
                ]);
            }
            fclose($out);
        }, 'teachers-' . now()->format('Y-m-d') . '.csv', ['Content-Type' => 'text/csv']);
    }

    private function rules(): array
    {
        return [
            'teacher_id' => 'nullable|string|max:50|unique:teachers,teacher_id',
            'name' => 'required|string',
            'gender' => 'required|string',
            'dob' => 'required|date',
            'phone' => 'required|string',
            'email' => 'required|email|unique:teachers',
            'address' => 'required|string',
            'department' => 'nullable|string',
            'position' => 'required|string',
            'salary' => 'required|numeric',
            'hire_date' => 'required|date',
            'status' => 'nullable|string|in:active,inactive,on_leave,suspended',
            'image' => 'nullable|string',
            'subject_ids' => 'nullable|array',
            'subject_ids.*' => 'exists:subjects,id',
            'class_ids' => 'nullable|array',
            'class_ids.*' => 'exists:classes,id',
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
                    ->orWhere('teacher_id', 'like', "%{$search}%")
                    ->orWhere('position', 'like', "%{$search}%");
            });
        }

        foreach (['department', 'position', 'status'] as $field) {
            if ($request->filled($field)) {
                $query->where($field, $request->input($field));
            }
        }

        if ($request->filled('subject_id')) {
            $query->whereHas('subjects', fn ($q) => $q->where('subjects.id', $request->input('subject_id')));
        }

        if ($request->filled('class_id')) {
            $query->whereHas('assignedClasses', fn ($q) => $q->where('classes.id', $request->input('class_id')));
        }

        return $query;
    }

    private function syncAssignments(Teacher $teacher, Request $request)
    {
        if ($request->has('subject_ids')) {
            $teacher->subjects()->sync($request->input('subject_ids', []));
        }
        if ($request->has('class_ids')) {
            $teacher->assignedClasses()->sync($request->input('class_ids', []));
        }
    }

    private function resolveSubjectIds(string $list): array
    {
        return $this->resolveIds($list, fn ($value) => is_numeric($value)
            ? Subject::find((int) $value)
            : Subject::where('subject_name', $value)->first());
    }

    private function resolveClassIds(string $list): array
    {
        return $this->resolveIds($list, fn ($value) => is_numeric($value)
            ? SchoolClass::find((int) $value)
            : SchoolClass::where('class_name', $value)->first());
    }

    private function resolveIds(string $list, callable $finder): array
    {
        $parts = preg_split('/[;,]/', $list);
        $ids = [];
        foreach ($parts as $part) {
            $part = trim($part);
            if ($part === '') {
                continue;
            }
            $model = $finder($part);
            if ($model) {
                $ids[] = $model->id;
            }
        }

        return array_values(array_unique($ids));
    }

    protected function headerAliases(): array
    {
        return [
            'teacher id' => 'teacher_id', 'teacherid' => 'teacher_id', 'id' => 'teacher_id',
            'staff id' => 'teacher_id', 'code' => 'teacher_id',
            'name' => 'name', 'full name' => 'name', 'fullname' => 'name', 'teacher name' => 'name',
            'gender' => 'gender', 'sex' => 'gender',
            'dob' => 'dob', 'birth date' => 'dob', 'birthdate' => 'dob', 'date of birth' => 'dob',
            'phone' => 'phone', 'mobile' => 'phone', 'phone number' => 'phone',
            'email' => 'email', 'email address' => 'email',
            'address' => 'address',
            'department' => 'department', 'faculty' => 'department',
            'position' => 'position', 'job title' => 'position', 'role' => 'position',
            'salary' => 'salary',
            'hire date' => 'hire_date', 'hiredate' => 'hire_date', 'joining date' => 'hire_date',
            'status' => 'status',
            'subjects' => 'subjects', 'subject' => 'subjects',
            'courses' => 'courses', 'assigned courses' => 'courses', 'assigned subjects' => 'courses',
            'classes' => 'classes', 'class' => 'classes', 'assigned classes' => 'classes',
        ];
    }
}
