<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Api\Concerns\ImportsSpreadsheet;
use App\Models\Attendance;
use App\Models\SchoolClass;
use App\Models\Student;
use App\Models\StudentEnrollment;
use App\Models\Teacher;
use App\Models\ActivityLog;
use Illuminate\Http\Request;

class StudentController extends Controller
{
    use ImportsSpreadsheet;

    public function index(Request $request)
    {
        $perPage = $request->get('per_page', 15);
        $query = $this->applyFilters(Student::query(), $request);
        $this->applyTeacherScope($query, $request->user());

        return $query
            ->with('class')
            ->paginate($perPage);
    }

    public function filters()
    {
        return [
            'classes' => $this->classesForUser(request()->user()),
            'grade_levels' => range(1, 12),
            'education_levels' => ['primary', 'lower_secondary', 'upper_secondary'],
            'departments' => Student::whereNotNull('department')->where('department', '!=', '')
                ->distinct()->orderBy('department')->pluck('department'),
            'majors' => Student::whereNotNull('major')->where('major', '!=', '')
                ->distinct()->orderBy('major')->pluck('major'),
            'academic_years' => Student::whereNotNull('academic_year')->where('academic_year', '!=', '')
                ->distinct()->orderByDesc('academic_year')->pluck('academic_year'),
            'semesters' => Student::whereNotNull('semester')->where('semester', '!=', '')
                ->distinct()->orderBy('semester')->pluck('semester'),
            'statuses' => ['active', 'inactive', 'graduated', 'suspended'],
        ];
    }

    public function summary(Request $request)
    {
        $query = $this->applyFilters(Student::query(), $request);
        $this->applyTeacherScope($query, $request->user());
        $students = $query->with('class')->get();

        $attendance = Attendance::whereIn('student_id', $students->pluck('id'))
            ->selectRaw('student_id')
            ->selectRaw('COUNT(*) as total')
            ->selectRaw('SUM(status IN ("present","late")) as present_late')
            ->groupBy('student_id')
            ->get()
            ->keyBy('student_id');

        $rows = $students->map(function ($s) use ($attendance) {
            $agg = $attendance->get($s->id);
            $total = (int) ($agg->total ?? 0);
            $presentLate = (int) ($agg->present_late ?? 0);
            $attendanceRate = $total > 0 ? (int) round($presentLate * 100 / $total) : 0;

            $classParts = explode('-', (string) ($s->class?->class_name ?? ''));
            return [
                'id' => $s->id,
                'student_id' => $s->student_id,
                'name' => $s->name,
                'grade' => $classParts[0] ?? '',
                'section' => isset($classParts[1]) ? trim($classParts[1]) : '',
                'class_name' => $s->class?->class_name ?? '',
                'guardian' => $s->parent_name,
                'contact' => $s->parent_phone,
                'gender' => $s->gender,
                'status' => $s->status,
                'attendance' => $attendanceRate,
            ];
        });

        $active = $rows->where('status', 'active')->count();
        $avgAttendance = $rows->count() ? (int) round($rows->avg('attendance')) : 0;
        $newThisMonth = Student::whereBetween('created_at', [now()->startOfMonth(), now()])->count();

        $gender = $rows->map(fn ($s) => strtolower((string) $s['gender']));
        $gradeMap = $rows->groupBy('grade')->map->count();

        return [
            'students' => $rows->values(),
            'total' => $rows->count(),
            'active' => $active,
            'inactive' => $rows->where('status', '!=', 'active')->count(),
            'new_this_month' => $newThisMonth,
            'avg_attendance' => $avgAttendance,
            'grade_distribution' => $gradeMap->map(fn ($n, $g) => ['grade' => $g, 'students' => $n])->values(),
            'gender_ratio' => [
                ['name' => 'Female', 'value' => $gender->filter(fn ($g) => $g === 'female' || $g === 'f')->count()],
                ['name' => 'Male', 'value' => $gender->filter(fn ($g) => $g === 'male' || $g === 'm')->count()],
                ['name' => 'Other', 'value' => $rows->count() - $gender->filter(fn ($g) => in_array($g, ['male', 'female', 'm', 'f']))->count()],
            ],
        ];
    }

    public function store(Request $request)
    {
        $data = $request->validate($this->rules());
        $student = Student::create($data);
        $this->syncEnrollment($student);

        return $student->load('class', 'enrollments.schoolClass');
    }

    public function show(Student $student)
    {
        abort_unless($this->canViewStudent(request()->user(), $student), 403);
        $student->load('class');

        $stats = Attendance::where('student_id', $student->id)
            ->selectRaw('COUNT(*) as total')
            ->selectRaw('SUM(status = "present") as present')
            ->selectRaw('SUM(status = "absent") as absent')
            ->selectRaw('SUM(status = "late") as late')
            ->selectRaw('SUM(status = "excused") as excused')
            ->first();

        $total = (int) $stats->total;
        $present = (int) $stats->present;
        $late = (int) $stats->late;

        $student->attendance_stats = [
            'total' => $total,
            'present' => $present,
            'absent' => (int) $stats->absent,
            'late' => $late,
            'excused' => (int) $stats->excused,
            'attendance_rate' => $total > 0 ? round(($present + $late) * 100 / $total, 1) : 0,
        ];

        $student->recent_attendances = Attendance::where('student_id', $student->id)
            ->with('schedule.subject')
            ->latest('date')
            ->limit(10)
            ->get()
            ->map(fn ($a) => [
                'id' => $a->id,
                'date' => $a->date,
                'time' => substr((string) ($a->schedule?->time_start ?? ''), 0, 5),
                'subject' => $a->schedule?->subject?->subject_name,
                'status' => $a->status,
            ]);

        return $student;
    }

    public function update(Request $request, Student $student)
    {
        $rules = $this->rules();
        $rules['email'] = 'email|unique:students,email,' . $student->id;
        $rules['student_id'] = 'nullable|string|max:50|unique:students,student_id,' . $student->id;

        $data = $request->validate($rules);
        $student->update($data);
        $this->syncEnrollment($student);
        return $student->load('class', 'enrollments.schoolClass');
    }

    public function enrollments(Student $student)
    {
        return response()->json($student->enrollments()->with('schoolClass')->latest()->get());
    }

    public function promote(Request $request, Student $student)
    {
        $data = $request->validate([
            'class_id' => 'required|exists:classes,id',
            'academic_year' => 'required|string|max:50',
            'grade_level' => 'nullable|integer|between:1,12',
            'enrollment_date' => 'nullable|date',
            'status' => 'nullable|in:active,inactive,graduated,suspended',
        ]);

        $class = SchoolClass::findOrFail($data['class_id']);
        $grade = $data['grade_level'] ?? $class->grade_level;

        StudentEnrollment::updateOrCreate(
            ['student_id' => $student->id, 'academic_year' => $data['academic_year']],
            [
                'class_id' => $class->id,
                'grade_level' => $grade,
                'enrollment_date' => $data['enrollment_date'] ?? now()->toDateString(),
                'status' => $data['status'] ?? 'active',
                'promotion_status' => 'promoted',
            ]
        );

        $student->update([
            'class_id' => $class->id,
            'academic_year' => $data['academic_year'],
            'grade_level' => $grade,
            'status' => $data['status'] ?? 'active',
            'enrollment_date' => $data['enrollment_date'] ?? now()->toDateString(),
        ]);

        ActivityLog::create([
            'user_id' => $request->user()->id,
            'action' => 'student_promoted',
            'subject_type' => Student::class,
            'subject_id' => $student->id,
            'properties' => [
                'class_id' => $class->id,
                'academic_year' => $data['academic_year'],
                'grade_level' => $grade,
            ],
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
        ]);

        return response()->json($student->fresh()->load('class', 'enrollments.schoolClass'));
    }

    public function destroy(Student $student)
    {
        $student->delete();
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
            return response()->json(['message' => 'The file must contain a header row and at least one student.'], 422);
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

            if (empty($record['name'])) {
                $skipped++;
                $errors[] = "Row " . ($ri + 1) . ": name is required.";
                continue;
            }

            if (! empty($record['email']) && Student::where('email', $record['email'])->exists()) {
                $skipped++;
                continue;
            }

            $class = null;
            if (! empty($record['class']) && ! empty($record['class_id'])) {
                $class = is_numeric($record['class_id'])
                    ? SchoolClass::find((int) $record['class_id'])
                    : SchoolClass::where('class_name', $record['class_id'])->first();
            } elseif (! empty($record['class'])) {
                $class = is_numeric($record['class'])
                    ? SchoolClass::find((int) $record['class'])
                    : SchoolClass::where('class_name', $record['class'])->first();
            }

            if (! $class) {
                $skipped++;
                $errors[] = 'Row ' . ($ri + 1) . ': class "' . ($record['class'] ?? $record['class_id'] ?? '') . '" not found.';
                continue;
            }

            $studentId = $record['student_id'] ?? null;
            if ($studentId && Student::where('student_id', $studentId)->exists()) {
                $studentId = null;
            }

            Student::create([
                'name' => $record['name'],
                'gender' => $record['gender'] ?? 'Male',
                'dob' => $record['dob'] ?? '2008-01-01',
                'phone' => $record['phone'] ?? '',
                'email' => $record['email'] ?? null,
                'address' => $record['address'] ?? null,
                'class_id' => $class->id,
                'parent_name' => $record['parent_name'] ?? null,
                'parent_phone' => $record['parent_phone'] ?? null,
                'department' => $record['department'] ?? null,
                'major' => $record['major'] ?? null,
                'academic_year' => $record['academic_year'] ?? null,
                'semester' => $record['semester'] ?? null,
                'enrollment_date' => $record['enrollment_date'] ?? null,
                'status' => $record['status'] ?? 'active',
                'student_id' => $studentId,
            ]);

            $created++;
        }

        return response()->json([
            'message' => "Imported {$created} student" . ($created === 1 ? '' : 's') . ".",
            'created' => $created,
            'skipped' => $skipped,
            'errors' => array_slice($errors, 0, 25),
        ]);
    }

    public function export(Request $request)
    {
        $query = $this->applyFilters(Student::query(), $request);
        $this->applyTeacherScope($query, $request->user());
        $students = $query->with('class')->get();

        $headers = [
            'Student ID', 'Name', 'Gender', 'Date of Birth', 'Phone', 'Email', 'Address',
            'Department', 'Major', 'Academic Year', 'Semester', 'Grade Level', 'Education Level', 'Class',
            'Enrollment Date', 'Status', 'Parent Name', 'Parent Phone',
        ];

        return response()->streamDownload(function () use ($students, $headers) {
            $out = fopen('php://output', 'w');
            fputcsv($out, $headers);
            foreach ($students as $s) {
                fputcsv($out, [
                    $s->student_id, $s->name, $s->gender, $s->dob, $s->phone, $s->email, $s->address,
                    $s->department, $s->major, $s->academic_year, $s->semester, $s->grade_level,
                    $s->education_level, $s->class?->class_name,
                    $s->enrollment_date, $s->status, $s->parent_name, $s->parent_phone,
                ]);
            }
            fclose($out);
        }, 'students-' . now()->format('Y-m-d') . '.csv', ['Content-Type' => 'text/csv']);
    }

    private function rules(): array
    {
        return [
            'student_id' => 'nullable|string|max:50|unique:students,student_id',
            'name' => 'required|string',
            'gender' => 'required|string',
            'dob' => 'required|date',
            'phone' => 'nullable|string',
            'email' => 'nullable|email|unique:students',
            'address' => 'nullable|string',
            'class_id' => 'required|exists:classes,id',
            'grade_level' => 'nullable|integer|between:1,12',
            'education_level' => 'nullable|string|in:primary,lower_secondary,upper_secondary',
            'parent_name' => 'nullable|string',
            'parent_phone' => 'nullable|string',
            'guardian_id' => 'nullable|exists:guardians,id',
            'image' => 'nullable|string',
            'department' => 'nullable|string',
            'major' => 'nullable|string',
            'academic_year' => 'nullable|string|max:50',
            'semester' => 'nullable|string|max:50',
            'enrollment_date' => 'nullable|date',
            'status' => 'nullable|string|in:active,inactive,graduated,suspended',
        ];
    }

    private function syncEnrollment(Student $student): void
    {
        if (! $student->academic_year || ! $student->class_id) {
            return;
        }

        StudentEnrollment::updateOrCreate(
            ['student_id' => $student->id, 'academic_year' => $student->academic_year],
            [
                'class_id' => $student->class_id,
                'grade_level' => $student->grade_level ?? $student->class?->grade_level,
                'enrollment_date' => $student->enrollment_date,
                'status' => $student->status ?: 'active',
            ]
        );
    }

    private function applyTeacherScope($query, $user): void
    {
        if (! $user || ! $user->isTeacher()) {
            return;
        }

        $classIds = $this->classIdsForTeacher($user);
        $query->whereIn('class_id', $classIds);
    }

    private function canViewStudent($user, Student $student): bool
    {
        if (! $user) {
            return false;
        }

        if ($user->isTeacher()) {
            return in_array((int) $student->class_id, $this->classIdsForTeacher($user), true);
        }

        return $user->isAdmin() || $user->isPrincipal();
    }

    private function classIdsForTeacher($user): array
    {
        if (! $user?->teacher_id) {
            return [];
        }

        $teacher = Teacher::find($user->teacher_id);
        if (! $teacher) {
            return [];
        }

        return $teacher->assignedClasses()->pluck('classes.id')
            ->merge($teacher->classes()->pluck('id'))
            ->unique()->map(fn ($id) => (int) $id)->all();
    }

    private function classesForUser($user)
    {
        if ($user?->isTeacher()) {
            return SchoolClass::whereIn('id', $this->classIdsForTeacher($user))
                ->orderBy('class_name')->get(['id', 'class_name']);
        }

        return SchoolClass::orderBy('class_name')->get(['id', 'class_name']);
    }

    private function applyFilters($query, Request $request)
    {
        if ($request->filled('search')) {
            $search = trim($request->search);
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('phone', 'like', "%{$search}%")
                    ->orWhere('student_id', 'like', "%{$search}%")
                    ->orWhere('parent_name', 'like', "%{$search}%");
            });
        }

        foreach (['class_id', 'grade_level', 'education_level', 'status', 'department', 'major', 'academic_year', 'semester'] as $field) {
            if ($request->filled($field)) {
                $query->where($field, $request->input($field));
            }
        }

        return $query;
    }

    protected function headerAliases(): array
    {
        return [
            'student id' => 'student_id', 'studentid' => 'student_id', 'id' => 'student_id',
            'student no' => 'student_id', 'student no.' => 'student_id', 'no' => 'student_id', 'code' => 'student_id',
            'name' => 'name', 'full name' => 'name', 'fullname' => 'name', 'student name' => 'name',
            'gender' => 'gender', 'sex' => 'gender',
            'dob' => 'dob', 'birth date' => 'dob', 'birthdate' => 'dob', 'date of birth' => 'dob',
            'phone' => 'phone', 'mobile' => 'phone', 'phone number' => 'phone',
            'email' => 'email', 'email address' => 'email',
            'address' => 'address',
            'class' => 'class', 'class name' => 'class', 'classname' => 'class',
            'class id' => 'class_id', 'classid' => 'class_id',
            'department' => 'department', 'faculty' => 'department',
            'major' => 'major', 'field' => 'major', 'course' => 'major',
            'academic year' => 'academic_year', 'academicyear' => 'academic_year',
            'semester' => 'semester',
            'enrollment date' => 'enrollment_date', 'enrollmentdate' => 'enrollment_date', 'enrolled date' => 'enrollment_date',
            'status' => 'status',
            'parent name' => 'parent_name', 'parent' => 'parent_name', 'guardian' => 'parent_name',
            'parent phone' => 'parent_phone', 'parentphone' => 'parent_phone', 'guardian phone' => 'parent_phone',
        ];
    }
}
