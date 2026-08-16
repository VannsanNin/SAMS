<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SchoolClass;
use App\Models\Student;
use App\Models\Subject;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ReportController extends Controller
{
    public function filters()
    {
        return [
            'classes' => SchoolClass::orderBy('class_name')->get(['id', 'class_name']),
            'departments' => Student::whereNotNull('department')->where('department', '!=', '')
                ->distinct()->orderBy('department')->pluck('department'),
            'students' => Student::with('class')
                ->orderBy('name')
                ->get(['id', 'name', 'class_id'])
                ->map(fn ($s) => [
                    'id' => $s->id,
                    'name' => $s->name,
                    'class' => $s->class?->class_name ?? null,
                ]),
            'statuses' => ['present', 'absent', 'late', 'excused'],
            'courses' => Subject::orderBy('subject_name')->get(['id', 'subject_name']),
        ];
    }

    public function attendance(Request $request)
    {
        $scope = $this->scope($request);

        $summaryQuery = DB::table('attendances as a')
            ->join('students as s', 's.id', '=', 'a.student_id')
            ->selectRaw('SUM(a.status = "present") as present')
            ->selectRaw('SUM(a.status = "absent") as absent')
            ->selectRaw('SUM(a.status = "late") as late')
            ->selectRaw('SUM(a.status = "excused") as excused');

        $this->applyScopeToStudentJoin($summaryQuery, $scope);

        $summaryRows = collect([$summaryQuery->first()]);

        return [
            'summary' => $this->summaryFromRows($summaryRows),
            'by_class' => $this->byClass($scope),
            'by_course' => $this->byCourse($scope),
            'by_department' => $this->byDepartment($scope),
            'trend' => $this->trend($scope),
            'low_attendance' => $this->lowAttendance($scope, (int) $request->get('threshold', 75)),
        ];
    }

    public function student(Request $request)
    {
        $data = $request->validate([
            'student_id' => 'required|exists:students,id',
        ]);

        $user = $request->user();

        if ($user && $user->isStudent()) {
            abort_unless((int) $data['student_id'] === (int) $user->student_id, 403);
        }

        if ($user && $user->isParent()) {
            $allowed = Student::where('id', $data['student_id'])
                ->where('guardian_id', $user->guardian_id)
                ->exists();
            abort_unless($allowed, 403);
        }

        $student = Student::with('class')->find($data['student_id']);

        $query = DB::table('attendances as a')
            ->join('schedules as sc', 'sc.id', '=', 'a.schedule_id')
            ->join('subjects as su', 'su.id', '=', 'sc.subject_id')
            ->where('a.student_id', $student->id);

        if ($request->filled('date_from')) {
            $query->whereDate('a.date', '>=', $request->input('date_from'));
        }
        if ($request->filled('date_to')) {
            $query->whereDate('a.date', '<=', $request->input('date_to'));
        }

        $courses = $query
            ->select('su.subject_name as name')
            ->selectRaw('COUNT(*) as total')
            ->selectRaw('SUM(a.status = "present") as present')
            ->selectRaw('SUM(a.status = "absent") as absent')
            ->selectRaw('SUM(a.status = "late") as late')
            ->selectRaw('SUM(a.status = "excused") as excused')
            ->groupBy('su.subject_name')
            ->orderBy('su.subject_name')
            ->get()
            ->map(fn ($r) => $this->decorate($r))
            ->values()
            ->all();

        $summary = $this->summaryFromRows(collect($courses));

        return [
            'student' => [
                'id' => $student->id,
                'name' => $student->name,
                'class' => $student->class?->class_name,
                'department' => $student->department,
            ],
            'courses' => $courses,
            'summary' => $summary,
        ];
    }

    public function warnings(Request $request)
    {
        $warningBelow = (float) $request->get('warning_below', 80);
        $criticalBelow = (float) $request->get('critical_below', 70);

        $query = DB::table('attendances as a')
            ->join('students as s', 's.id', '=', 'a.student_id')
            ->join('classes as c', 'c.id', '=', 's.class_id')
            ->join('schedules as sc', 'sc.id', '=', 'a.schedule_id')
            ->join('subjects as su', 'su.id', '=', 'sc.subject_id')
            ->selectRaw('s.id as student_db_id, s.student_id as student_code, s.name as student_name, c.class_name as class')
            ->selectRaw('su.id as course_id, su.subject_name as course')
            ->selectRaw('COUNT(*) as total')
            ->selectRaw('SUM(a.status = "absent") as absent')
            ->selectRaw('SUM(a.status = "late") as late')
            ->selectRaw('SUM(a.status = "excused") as excused')
            ->groupByRaw('s.id, s.student_id, s.name, c.class_name, su.id, su.subject_name');

        $this->applyScopeToStudentJoin($query, $this->scope($request));

        if ($request->filled('course_id')) {
            $query->where('su.id', (int) $request->input('course_id'));
        }

        $items = $query->get()
            ->map(function ($r) use ($warningBelow, $criticalBelow) {
                $total = (int) $r->total;
                $absent = (int) $r->absent;
                $late = (int) $r->late;
                $excused = (int) $r->excused;
                $present = $total - $absent - $late - $excused;
                $rate = $this->rate($present + $late, $total);

                $level = null;
                if ($rate < $criticalBelow) {
                    $level = 'critical';
                } elseif ($rate < $warningBelow) {
                    $level = 'warning';
                }

                return [
                    'student_id' => (int) $r->student_db_id,
                    'student_code' => $r->student_code,
                    'student_name' => $r->student_name,
                    'class' => $r->class,
                    'course_id' => (int) $r->course_id,
                    'course' => $r->course,
                    'rate' => $rate,
                    'total' => $total,
                    'present' => $present,
                    'absent' => $absent,
                    'late' => $late,
                    'excused' => $excused,
                    'level' => $level,
                ];
            })
            ->filter(fn ($r) => $r['level'] !== null)
            ->values();

        if ($request->filled('level') && in_array($request->input('level'), ['warning', 'critical'], true)) {
            $items = $items->filter(fn ($r) => $r['level'] === $request->input('level'))->values();
        }

        if ($request->filled('search')) {
            $search = strtolower(trim($request->search));
            $items = $items->filter(function ($r) use ($search) {
                return str_contains(strtolower((string) $r['student_name']), $search)
                    || str_contains(strtolower((string) ($r['student_code'] ?? '')), $search);
            })->values();
        }

        $items = $items->sortBy('rate')->values();

        $criticalIds = $items->where('level', 'critical')->pluck('student_id')->unique();
        $atRiskIds = $items->pluck('student_id')->unique();
        $warningIds = $atRiskIds->diff($criticalIds);

        $summary = [
            'warning_below' => $warningBelow,
            'critical_below' => $criticalBelow,
            'at_risk_students' => $atRiskIds->count(),
            'warning_students' => $warningIds->count(),
            'critical_students' => $criticalIds->count(),
            'healthy_students' => max(0, $this->studentsWithRecords($request) - $atRiskIds->count()),
            'at_risk_courses' => $items->count(),
        ];

        return [
            'summary' => $summary,
            'items' => $items,
        ];
    }

    private function studentsWithRecords(Request $request): int
    {
        $query = DB::table('attendances as a')
            ->join('students as s', 's.id', '=', 'a.student_id')
            ->selectRaw('COUNT(DISTINCT s.id) as c');

        $this->applyScopeToStudentJoin($query, $this->scope($request));

        if ($request->filled('course_id')) {
            $query->whereIn('a.schedule_id', function ($q) use ($request) {
                $q->select('sc.id')
                    ->from('schedules as sc')
                    ->where('sc.subject_id', (int) $request->input('course_id'));
            });
        }

        return (int) $query->value('c');
    }

    private function scope(Request $request): array
    {
        $scope = [];
        if ($request->filled('class_id')) {
            $scope['class_id'] = (int) $request->input('class_id');
        }
        if ($request->filled('department')) {
            $scope['department'] = $request->input('department');
        }
        if ($request->filled('date_from')) {
            $scope['date_from'] = $request->input('date_from');
        }
        if ($request->filled('date_to')) {
            $scope['date_to'] = $request->input('date_to');
        }

        return $scope;
    }

    private function byClass(array $scope): array
    {
        $query = DB::table('attendances as a')
            ->join('students as s', 's.id', '=', 'a.student_id')
            ->join('classes as c', 'c.id', '=', 's.class_id')
            ->select('c.id', 'c.class_name as name')
            ->selectRaw('COUNT(*) as total')
            ->selectRaw('SUM(a.status = "present") as present')
            ->selectRaw('SUM(a.status = "absent") as absent')
            ->selectRaw('SUM(a.status = "late") as late')
            ->selectRaw('SUM(a.status = "excused") as excused')
            ->groupBy('c.id', 'c.class_name');

        $this->applyScopeToStudentJoin($query, $scope);

        $rows = $query->orderBy('c.class_name')->get();

        $studentCounts = Student::selectRaw('class_id, COUNT(*) as c')
            ->groupBy('class_id')
            ->pluck('c', 'class_id');

        return $rows
            ->map(fn ($r) => $this->decorate($r) + [
                'total_students' => (int) ($studentCounts[$r->id] ?? 0),
            ])
            ->all();
    }

    private function byCourse(array $scope): array
    {
        $query = DB::table('attendances as a')
            ->join('schedules as sc', 'sc.id', '=', 'a.schedule_id')
            ->join('subjects as su', 'su.id', '=', 'sc.subject_id')
            ->join('students as s', 's.id', '=', 'a.student_id')
            ->select('su.id', 'su.subject_name as name')
            ->selectRaw('COUNT(*) as total')
            ->selectRaw('SUM(a.status = "present") as present')
            ->selectRaw('SUM(a.status = "absent") as absent')
            ->selectRaw('SUM(a.status = "late") as late')
            ->selectRaw('SUM(a.status = "excused") as excused')
            ->groupBy('su.id', 'su.subject_name');

        $this->applyScopeToStudentJoin($query, $scope);

        return $query->orderBy('su.subject_name')
            ->get()
            ->map(fn ($r) => $this->decorate($r))
            ->all();
    }

    private function byDepartment(array $scope): array
    {
        $query = DB::table('attendances as a')
            ->join('students as s', 's.id', '=', 'a.student_id')
            ->selectRaw("COALESCE(NULLIF(s.department, ''), 'Unassigned') as name")
            ->selectRaw('COUNT(*) as total')
            ->selectRaw('SUM(a.status = "present") as present')
            ->selectRaw('SUM(a.status = "absent") as absent')
            ->selectRaw('SUM(a.status = "late") as late')
            ->selectRaw('SUM(a.status = "excused") as excused')
            ->groupByRaw("COALESCE(NULLIF(s.department, ''), 'Unassigned')");

        $this->applyScopeToStudentJoin($query, $scope);

        return $query->orderBy('name')
            ->get()
            ->map(fn ($r) => $this->decorate($r))
            ->all();
    }

    private function trend(array $scope): array
    {
        $query = DB::table('attendances as a')
            ->join('students as s', 's.id', '=', 'a.student_id')
            ->selectRaw('a.date, a.status, COUNT(*) as c')
            ->whereDate('a.date', '>=', Carbon::now()->subDays(29)->toDateString())
            ->groupBy('a.date', 'a.status');

        $this->applyScopeToStudentJoin($query, $scope);

        $rows = $query->get();

        $map = [];
        foreach ($rows as $row) {
            $map[$row->date][$row->status] = (int) $row->c;
        }

        $trend = [];
        $day = Carbon::now()->subDays(29);
        for ($i = 0; $i < 30; $i++) {
            $key = $day->toDateString();
            $row = $map[$key] ?? [];
            $present = $row['present'] ?? 0;
            $absent = $row['absent'] ?? 0;
            $late = $row['late'] ?? 0;
            $excused = $row['excused'] ?? 0;
            $total = $present + $absent + $late + $excused;

            $trend[] = [
                'date' => $key,
                'label' => $day->format('M j'),
                'present' => $present,
                'absent' => $absent,
                'late' => $late,
                'excused' => $excused,
                'total' => $total,
                'attendance_rate' => $this->rate($present + $late, $total),
            ];
            $day->addDay();
        }

        return $trend;
    }

    private function lowAttendance(array $scope, int $threshold): array
    {
        $query = DB::table('attendances as a')
            ->join('students as s', 's.id', '=', 'a.student_id')
            ->leftJoin('classes as c', 'c.id', '=', 's.class_id')
            ->select('s.id', 's.name', 'c.class_name as class')
            ->selectRaw('COUNT(*) as total')
            ->selectRaw('SUM(a.status = "absent") as absent')
            ->selectRaw('SUM(a.status = "late") as late')
            ->selectRaw('SUM(a.status = "excused") as excused')
            ->groupBy('s.id', 's.name', 'c.class_name');

        $this->applyScopeToStudentJoin($query, $scope);

        $students = $query->get()
            ->map(function ($r) {
                $total = (int) $r->total;
                $absent = (int) $r->absent;
                $late = (int) $r->late;
                $excused = (int) $r->excused;

                return [
                    'id' => (int) $r->id,
                    'name' => $r->name,
                    'class' => $r->class,
                    'total' => $total,
                    'present' => $total - $absent - $late - $excused,
                    'absent' => $absent,
                    'late' => $late,
                    'excused' => $excused,
                    'attendance_rate' => $this->rate($total - $absent - $late - $excused + $late, $total),
                ];
            })
            ->filter(fn ($s) => $s['total'] > 0 && $s['attendance_rate'] < $threshold)
            ->sortBy('attendance_rate')
            ->values()
            ->take(20);

        return $students->all();
    }

    private function summaryFromRows(iterable $rows): array
    {
        $summary = ['present' => 0, 'absent' => 0, 'late' => 0, 'excused' => 0];
        foreach ($rows as $r) {
            $r = (object) $r;
            $summary['present'] += (int) $r->present;
            $summary['absent'] += (int) $r->absent;
            $summary['late'] += (int) $r->late;
            $summary['excused'] += (int) $r->excused;
        }
        $summary['total'] = array_sum($summary);
        $summary['attendance_rate'] = $this->rate($summary['present'] + $summary['late'], $summary['total']);

        return $summary;
    }

    private function applyScopeToStudentJoin($query, array $scope): void
    {
        if (isset($scope['class_id'])) {
            $query->where('s.class_id', $scope['class_id']);
        }
        if (isset($scope['department'])) {
            $query->where('s.department', $scope['department']);
        }
        if (isset($scope['date_from'])) {
            $query->whereDate('a.date', '>=', $scope['date_from']);
        }
        if (isset($scope['date_to'])) {
            $query->whereDate('a.date', '<=', $scope['date_to']);
        }
    }

    private function decorate(object $row): array
    {
        $total = (int) $row->total;
        $present = (int) $row->present;
        $absent = (int) $row->absent;
        $late = (int) $row->late;
        $excused = (int) $row->excused;

        return [
            'id' => $row->id ?? null,
            'name' => $row->name,
            'total' => $total,
            'present' => $present,
            'absent' => $absent,
            'late' => $late,
            'excused' => $excused,
            'attendance_rate' => $this->rate($present + $late, $total),
        ];
    }

    private function rate(int $attended, int $total): float
    {
        return $total > 0 ? round($attended * 100 / $total, 1) : 0.0;
    }
}
