<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Attendance;
use App\Models\SchoolClass;
use App\Models\Schedule;
use App\Models\Staff;
use App\Models\Student;
use Illuminate\Http\Request;

class AttendanceController extends Controller
{
    public function index(Request $request)
    {
        $perPage = $request->get('per_page', 15);
        $query = $this->applyTeacherScope(Attendance::query(), $request->user());

        return $this->applyFilters($query, $request)
            ->with('student', 'schedule.subject', 'staff')
            ->orderByDesc('date')
            ->paginate($perPage);
    }

    public function filters(Request $request)
    {
        $teacherClassIds = $this->teacherClassIds($request->user());
        $students = Student::query();
        $classes = SchoolClass::query();
        $schedules = Schedule::with('subject', 'class')->orderBy('day');
        if ($request->user()?->isTeacher()) {
            $students->whereIn('class_id', $teacherClassIds);
            $classes->whereIn('id', $teacherClassIds);
            $schedules->where(function ($q) use ($request, $teacherClassIds) {
                $q->where('teacher_id', $request->user()->teacher_id)->orWhereIn('class_id', $teacherClassIds);
            });
        }

        return [
            'statuses' => ['present', 'absent', 'late', 'excused'],
            'students' => $students->orderBy('name')->get(['id', 'name']),
            'staff' => Staff::orderBy('name')->get(['id', 'name']),
            'classes' => $classes->orderBy('class_name')->get(['id', 'class_name']),
            'schedules' => $schedules
                ->get()
                ->map(fn ($s) => [
                    'id' => $s->id,
                    'label' => $s->day . ' ' . $s->time_start . '-' . $s->time_end
                        . ' — ' . ($s->subject?->subject_name ?? '?')
                        . ' (' . ($s->class?->class_name ?? '?') . ')',
                ]),
        ];
    }

    public function store(Request $request)
    {
        $data = $request->validate($this->rules());
        abort_unless($this->canManageSchedule($request->user(), (int) $data['schedule_id']), 403);
        abort_unless($this->studentBelongsToSchedule((int) $data['student_id'], (int) $data['schedule_id']), 422);
        $attendance = Attendance::create($data);

        return $this->show($request, $attendance);
    }

    public function show(Request $request, Attendance $attendance)
    {
        abort_unless($this->canViewAttendance($request->user(), $attendance), 403);
        return $attendance->load('student', 'schedule.subject', 'schedule.class', 'staff');
    }

    public function update(Request $request, Attendance $attendance)
    {
        $rules = $this->rules();
        $rules['student_id'] = 'exists:students,id';
        $rules['schedule_id'] = 'exists:schedules,id';
        $rules['staff_id'] = 'exists:staff,id';
        $rules['date'] = 'date';
        $rules['status'] = 'string|in:present,absent,late,excused';

        $data = $request->validate($rules);

        $scheduleId = (int) ($data['schedule_id'] ?? $attendance->schedule_id);
        abort_unless($this->canManageSchedule($request->user(), $scheduleId), 403);
        if (isset($data['student_id'])) {
            abort_unless($this->studentBelongsToSchedule((int) $data['student_id'], $scheduleId), 422);
        }

        $attendance->update($data);

        return $this->show($request, $attendance);
    }

    public function destroy(Request $request, Attendance $attendance)
    {
        abort_unless($this->canManageSchedule($request->user(), (int) $attendance->schedule_id), 403);
        $attendance->delete();
        return response()->noContent();
    }

    public function bulkStore(Request $request)
    {
        $data = $request->validate([
            'schedule_id' => 'required|exists:schedules,id',
            'staff_id' => 'required|exists:staff,id',
            'date' => 'required|date',
            'records' => 'required|array|min:1',
            'records.*.student_id' => 'required|exists:students,id',
            'records.*.status' => 'required|string|in:present,absent,late,excused',
        ]);

        abort_unless($this->canManageSchedule($request->user(), (int) $data['schedule_id']), 403);

        $attendances = [];
        foreach ($data['records'] as $record) {
            abort_unless($this->studentBelongsToSchedule((int) $record['student_id'], (int) $data['schedule_id']), 422);
            $attendances[] = Attendance::updateOrCreate(
                [
                    'student_id' => $record['student_id'],
                    'schedule_id' => $data['schedule_id'],
                    'date' => $data['date'],
                ],
                [
                    'staff_id' => $data['staff_id'],
                    'status' => $record['status'],
                ]
            );
        }

        return response()->json(['data' => $attendances], 201);
    }

    public function export(Request $request)
    {
        $attendances = $this->applyFilters($this->applyTeacherScope(Attendance::query(), $request->user()), $request)
            ->with('student', 'schedule.subject', 'schedule.class', 'staff')
            ->orderByDesc('date')
            ->get();

        $headers = [
            'Attendance ID', 'Student', 'Class', 'Day', 'Time', 'Subject',
            'Staff', 'Date', 'Status',
        ];

        return response()->streamDownload(function () use ($attendances, $headers) {
            $out = fopen('php://output', 'w');
            fputcsv($out, $headers);
            foreach ($attendances as $a) {
                fputcsv($out, [
                    $a->id, $a->student?->name ?? '', $a->schedule?->class?->class_name ?? '',
                    $a->schedule?->day ?? '', $a->schedule?->time_start ?? '',
                    $a->schedule?->subject?->subject_name ?? '', $a->staff?->name ?? '',
                    $a->date, $a->status,
                ]);
            }
            fclose($out);
        }, 'attendances-' . now()->format('Y-m-d') . '.csv', ['Content-Type' => 'text/csv']);
    }

    private function rules(): array
    {
        return [
            'student_id' => 'required|exists:students,id',
            'schedule_id' => 'required|exists:schedules,id',
            'staff_id' => 'required|exists:staff,id',
            'date' => 'required|date',
            'status' => 'required|string|in:present,absent,late,excused',
        ];
    }

    private function canManageSchedule(?\App\Models\User $user, int $scheduleId): bool
    {
        if (! $user) {
            return false;
        }

        if ($user->isAdmin() || $user->isPrincipal()) {
            return (bool) $user;
        }

        if ($user->isTeacher() && $user->teacher_id) {
            $schedule = Schedule::find($scheduleId);

            return $schedule && (int) $schedule->teacher_id === (int) $user->teacher_id;
        }

        return false;
    }

    private function studentBelongsToSchedule(int $studentId, int $scheduleId): bool
    {
        $schedule = Schedule::find($scheduleId);
        return $schedule && Student::whereKey($studentId)->where('class_id', $schedule->class_id)->exists();
    }

    private function canViewAttendance(?\App\Models\User $user, Attendance $attendance): bool
    {
        if (! $user || $user->isAdmin() || $user->isPrincipal()) {
            return (bool) $user;
        }

        if (! $user->isTeacher() || ! $user->teacher_id) {
            return false;
        }

        $schedule = $attendance->schedule;
        return $schedule && (
            (int) $schedule->teacher_id === (int) $user->teacher_id
            || in_array((int) $schedule->class_id, $this->teacherClassIds($user), true)
        );
    }

    private function applyTeacherScope($query, $user)
    {
        if (! $user || ! $user->isTeacher()) {
            return $query;
        }

        $classIds = $this->teacherClassIds($user);
        return $query->whereHas('schedule', function ($scheduleQuery) use ($user, $classIds) {
            $scheduleQuery->where('teacher_id', $user->teacher_id)->orWhereIn('class_id', $classIds);
        });
    }

    private function teacherClassIds($user): array
    {
        $teacher = $user?->teacher_id ? \App\Models\Teacher::find($user->teacher_id) : null;
        if (! $teacher) {
            return [];
        }

        return $teacher->assignedClasses()->pluck('classes.id')
            ->merge($teacher->classes()->pluck('id'))
            ->unique()->map(fn ($id) => (int) $id)->all();
    }

    private function applyFilters($query, Request $request)
    {
        if ($request->filled('search')) {
            $search = trim($request->search);
            $query->whereHas('student', function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%");
            });
        }

        foreach (['student_id', 'schedule_id', 'status', 'staff_id'] as $field) {
            if ($request->filled($field)) {
                $query->where($field, $request->input($field));
            }
        }

        if ($request->filled('class_id')) {
            $query->whereHas('student', fn ($q) => $q->where('class_id', $request->input('class_id')));
        }

        if ($request->filled('date_from')) {
            $query->whereDate('date', '>=', $request->input('date_from'));
        }

        if ($request->filled('date_to')) {
            $query->whereDate('date', '<=', $request->input('date_to'));
        }

        return $query;
    }
}
