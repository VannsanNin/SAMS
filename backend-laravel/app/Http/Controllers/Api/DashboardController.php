<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Attendance;
use App\Models\Leave;
use App\Models\Schedule;
use App\Models\SchoolClass;
use App\Models\Staff;
use App\Models\Student;
use App\Models\Subject;
use App\Models\Teacher;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $now = Carbon::now();
        $today = $now->toDateString();

        if ($user && ($user->isParent() || $user->isStudent())) {
            return $this->personalDashboard($user, $today);
        }

        $weekday = $now->format('l');

        return [
            'date' => $today,
            'weekday' => $weekday,
            'counts' => $this->counts(),
            'today' => $this->todaySummary($today),
            'trend' => $this->dailyTrend($now),
            'monthly' => $this->monthlyTrend($now),
            'by_class' => $this->byClass(),
            'by_subject' => $this->bySubject(),
            'by_department' => $this->byDepartment(),
            'by_teacher' => $this->byTeacher(),
            'top' => $this->topPerformers(),
            'alerts' => $this->alerts($today, $weekday),
            'schedule' => $this->todaySchedule($weekday, $now),
            'exams_today' => [],
            'events_today' => [],
            'recent' => $this->recentRecords(),
            'reports' => $this->reports(),
        ];
    }

    private function personalDashboard(\App\Models\User $user, string $today): array
    {
        $students = collect();

        if ($user->isParent()) {
            $students = $user->guardian
                ? $user->guardian->students()->with('class')->orderBy('name')->get()
                : collect();
        } elseif ($user->student) {
            $students = collect([$user->student->load('class')]);
        }

        $studentIds = $students->pluck('id')->all();

        $children = $students->map(function ($student) use ($today) {
            return [
                'id' => $student->id,
                'name' => $student->name,
                'student_code' => $student->student_id,
                'class' => $student->class?->class_name,
                'stats' => $this->studentStat($student->id),
                'today' => Attendance::where('student_id', $student->id)
                    ->whereDate('date', $today)
                    ->with('schedule.subject')
                    ->orderBy('schedule_id')
                    ->get()
                    ->map(fn ($a) => [
                        'id' => $a->id,
                        'subject' => $a->schedule?->subject?->subject_name,
                        'time' => substr((string) ($a->schedule?->time_start ?? ''), 0, 5),
                        'status' => $a->status,
                    ]),
            ];
        })->values()->all();

        return [
            'view' => $user->isParent() ? 'parent' : 'student',
            'date' => $today,
            'children' => $children,
            'recent' => $this->recentRecordsFor($studentIds),
        ];
    }

    private function studentStat(int $studentId): array
    {
        $row = DB::table('attendances as a')
            ->where('a.student_id', $studentId)
            ->selectRaw('COUNT(*) as total')
            ->selectRaw('SUM(a.status = "present") as present')
            ->selectRaw('SUM(a.status = "absent") as absent')
            ->selectRaw('SUM(a.status = "late") as late')
            ->selectRaw('SUM(a.status = "excused") as excused')
            ->first();

        $total = (int) $row->total;

        return [
            'total' => $total,
            'present' => (int) $row->present,
            'absent' => (int) $row->absent,
            'late' => (int) $row->late,
            'excused' => (int) $row->excused,
            'attendance_rate' => self::rate((int) $row->present + (int) $row->late, $total),
        ];
    }

    private function recentRecordsFor(array $studentIds): array
    {
        if (empty($studentIds)) {
            return [];
        }

        return Attendance::with('student.class', 'schedule.subject')
            ->whereIn('student_id', $studentIds)
            ->orderByDesc('date')
            ->orderByDesc('id')
            ->limit(15)
            ->get()
            ->map(fn ($a) => [
                'id' => $a->id,
                'student' => $a->student?->name,
                'class' => $a->student?->class?->class_name,
                'subject' => $a->schedule?->subject?->subject_name,
                'time' => substr((string) ($a->schedule?->time_start ?? ''), 0, 5),
                'date' => $a->date,
                'status' => $a->status,
            ])
            ->all();
    }

    private function counts(): array
    {
        return [
            'students' => Student::count(),
            'teachers' => Teacher::count(),
            'classes' => SchoolClass::count(),
            'subjects' => Subject::count(),
            'staff' => Staff::count(),
            'schedules' => Schedule::count(),
            'leaves' => Leave::count(),
            'departments' => Student::whereNotNull('department')
                ->where('department', '!=', '')
                ->distinct('department')
                ->count(),
        ];
    }

    private function todaySummary(string $today): array
    {
        $rows = Attendance::whereDate('date', $today)
            ->selectRaw('status, COUNT(*) as c')
            ->groupBy('status')
            ->pluck('c', 'status');

        $summary = ['present' => 0, 'absent' => 0, 'late' => 0, 'excused' => 0];
        foreach ($rows as $status => $count) {
            if (isset($summary[$status])) {
                $summary[$status] = (int) $count;
            }
        }
        $summary['total'] = array_sum($summary);
        $summary['attendance_rate'] = self::rate(
            $summary['present'] + $summary['late'],
            $summary['total']
        );

        return $summary;
    }

    private function dailyTrend(Carbon $now): array
    {
        $from = $now->copy()->subDays(29)->toDateString();
        $rows = Attendance::whereDate('date', '>=', $from)
            ->selectRaw('date, status, COUNT(*) as c')
            ->groupBy('date', 'status')
            ->get();

        $map = [];
        foreach ($rows as $row) {
            $map[$row->date][$row->status] = (int) $row->c;
        }

        $trend = [];
        $day = $now->copy()->subDays(29);
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
                'attendance_rate' => self::rate($present + $late, $total),
            ];
            $day->addDay();
        }

        return $trend;
    }

    private function monthlyTrend(Carbon $now): array
    {
        $from = $now->copy()->subMonths(5)->startOfMonth()->toDateString();
        $rows = Attendance::whereDate('date', '>=', $from)
            ->selectRaw("DATE_FORMAT(date, '%Y-%m') as month, status, COUNT(*) as c")
            ->groupBy('month', 'status')
            ->get();

        $map = [];
        foreach ($rows as $row) {
            $map[$row->month][$row->status] = (int) $row->c;
        }

        $monthly = [];
        $month = $now->copy()->startOfMonth()->subMonths(5);
        for ($i = 0; $i < 6; $i++) {
            $key = $month->format('Y-m');
            $row = $map[$key] ?? [];
            $present = $row['present'] ?? 0;
            $absent = $row['absent'] ?? 0;
            $late = $row['late'] ?? 0;
            $excused = $row['excused'] ?? 0;
            $total = $present + $absent + $late + $excused;

            $monthly[] = [
                'month' => $key,
                'label' => $month->format('M'),
                'present' => $present,
                'absent' => $absent,
                'late' => $late,
                'excused' => $excused,
                'total' => $total,
                'attendance_rate' => self::rate($present + $late, $total),
            ];
            $month->addMonth();
        }

        return $monthly;
    }

    private function byClass(): array
    {
        return DB::table('attendances as a')
            ->join('students as s', 's.id', '=', 'a.student_id')
            ->join('classes as c', 'c.id', '=', 's.class_id')
            ->select('c.id', 'c.class_name as name')
            ->selectRaw('COUNT(*) as total')
            ->selectRaw('SUM(a.status = "present") as present')
            ->selectRaw('SUM(a.status = "absent") as absent')
            ->selectRaw('SUM(a.status = "late") as late')
            ->selectRaw('SUM(a.status = "excused") as excused')
            ->groupBy('c.id', 'c.class_name')
            ->orderBy('c.class_name')
            ->get()
            ->map(fn ($r) => $this->decorate($r))
            ->all();
    }

    private function bySubject(): array
    {
        return DB::table('attendances as a')
            ->join('schedules as sc', 'sc.id', '=', 'a.schedule_id')
            ->join('subjects as su', 'su.id', '=', 'sc.subject_id')
            ->select('su.id', 'su.subject_name as name')
            ->selectRaw('COUNT(*) as total')
            ->selectRaw('SUM(a.status = "present") as present')
            ->selectRaw('SUM(a.status = "absent") as absent')
            ->selectRaw('SUM(a.status = "late") as late')
            ->selectRaw('SUM(a.status = "excused") as excused')
            ->groupBy('su.id', 'su.subject_name')
            ->orderBy('su.subject_name')
            ->get()
            ->map(fn ($r) => $this->decorate($r))
            ->all();
    }

    private function byTeacher(): array
    {
        return DB::table('attendances as a')
            ->join('schedules as sc', 'sc.id', '=', 'a.schedule_id')
            ->join('teachers as t', 't.id', '=', 'sc.teacher_id')
            ->select('t.id', 't.name')
            ->selectRaw('COUNT(*) as total')
            ->selectRaw('SUM(a.status = "present") as present')
            ->selectRaw('SUM(a.status = "absent") as absent')
            ->selectRaw('SUM(a.status = "late") as late')
            ->selectRaw('SUM(a.status = "excused") as excused')
            ->groupBy('t.id', 't.name')
            ->orderByDesc('total')
            ->get()
            ->map(fn ($r) => $this->decorate($r))
            ->all();
    }

    private function byDepartment(): array
    {
        return DB::table('attendances as a')
            ->join('students as s', 's.id', '=', 'a.student_id')
            ->selectRaw("COALESCE(NULLIF(s.department, ''), 'Unassigned') as name")
            ->selectRaw('COUNT(*) as total')
            ->selectRaw('SUM(a.status = "present") as present')
            ->selectRaw('SUM(a.status = "absent") as absent')
            ->selectRaw('SUM(a.status = "late") as late')
            ->selectRaw('SUM(a.status = "excused") as excused')
            ->groupByRaw("COALESCE(NULLIF(s.department, ''), 'Unassigned')")
            ->orderBy('name')
            ->get()
            ->map(fn ($r) => $this->decorate($r))
            ->all();
    }

    private function topPerformers(): array
    {
        $classes = $this->byClass();
        $departments = $this->byDepartment();
        $teachers = $this->byTeacher();

        $studentStats = $this->studentStats();

        $best = function (array $list): ?array {
            $scored = array_filter($list, fn ($r) => $r['total'] > 0);
            if (empty($scored)) {
                return null;
            }
            usort($scored, fn ($a, $b) => $b['attendance_rate'] <=> $a['attendance_rate']);

            return $scored[0];
        };

        $perfect = collect($studentStats)
            ->filter(fn ($s) => $s['total'] > 0 && $s['absent'] === 0 && $s['attendance_rate'] == 100)
            ->sortByDesc('total')
            ->take(10)
            ->map(fn ($s) => [
                'id' => $s['id'],
                'name' => $s['name'],
                'class' => $s['class'],
                'total' => $s['total'],
                'attendance_rate' => $s['attendance_rate'],
            ])
            ->values()
            ->all();

        return [
            'best_class' => $best($classes),
            'best_department' => $best($departments),
            'perfect_students' => $perfect,
            'top_teachers' => array_slice($teachers, 0, 5),
        ];
    }

    private function studentStats(): array
    {
        return DB::table('attendances as a')
            ->join('students as s', 's.id', '=', 'a.student_id')
            ->leftJoin('classes as c', 'c.id', '=', 's.class_id')
            ->select('s.id', 's.name', 'c.class_name as class')
            ->selectRaw('COUNT(*) as total')
            ->selectRaw('SUM(a.status = "absent") as absent')
            ->selectRaw('SUM(a.status = "late") as late')
            ->selectRaw('SUM(a.status = "excused") as excused')
            ->groupBy('s.id', 's.name', 'c.class_name')
            ->get()
            ->map(function ($r) {
                $total = (int) $r->total;
                $present = $total - (int) $r->absent - (int) $r->late - (int) $r->excused;

                return [
                    'id' => (int) $r->id,
                    'name' => $r->name,
                    'class' => $r->class,
                    'total' => $total,
                    'present' => $present,
                    'absent' => (int) $r->absent,
                    'late' => (int) $r->late,
                    'excused' => (int) $r->excused,
                    'attendance_rate' => self::rate($present + (int) $r->late, $total),
                ];
            })
            ->all();
    }

    private function alerts(string $today, string $weekday): array
    {
        $studentStats = $this->studentStats();
        $statsByStudent = collect($studentStats)->keyBy('id');

        return [
            'consecutive_absent' => $this->consecutiveAbsentStudents(),
            'below_75' => collect($studentStats)
                ->filter(fn ($s) => $s['total'] > 0 && $s['attendance_rate'] < 75)
                ->sortBy('attendance_rate')
                ->take(10)
                ->values()
                ->all(),
            'teachers_no_submission' => $this->teachersWithoutSubmission($today, $weekday),
            'holidays' => [],
        ];
    }

    private function consecutiveAbsentStudents(): array
    {
        $absences = Attendance::where('status', 'absent')
            ->orderBy('student_id')
            ->orderBy('date')
            ->get(['student_id', 'date']);

        $result = [];
        foreach ($absences->groupBy('student_id') as $studentId => $rows) {
            $dates = $rows->pluck('date')->unique()->values()->sort()->values();
            if ($dates->count() < 3) {
                continue;
            }

            $run = 1;
            $maxRun = 0;
            $maxEnd = null;
            for ($i = 1; $i < $dates->count(); $i++) {
                $prev = Carbon::parse($dates[$i - 1]);
                $next = Carbon::parse($dates[$i]);
                if ($this->isNextSchoolDay($prev, $next)) {
                    $run++;
                } else {
                    $run = 1;
                }
                if ($run > $maxRun) {
                    $maxRun = $run;
                    $maxEnd = $i;
                }
            }
            if ($maxRun >= 3) {
                $student = Student::with('class')->find($studentId);
                $result[] = [
                    'student_id' => $studentId,
                    'name' => $student?->name,
                    'class' => $student?->class?->class_name,
                    'days' => $maxRun,
                    'since' => $dates[$maxEnd - $maxRun + 1],
                    'last_date' => $dates[$maxEnd],
                ];
            }
        }

        return $result;
    }

    private function teachersWithoutSubmission(string $today, string $weekday): array
    {
        $schedulesToday = Schedule::where('day', $weekday)
            ->with('teacher')
            ->get();

        $recorded = Attendance::whereDate('date', $today)
            ->pluck('schedule_id')
            ->unique()
            ->flip();

        $pending = [];
        foreach ($schedulesToday as $schedule) {
            if (isset($recorded[$schedule->id]) || ! $schedule->teacher) {
                continue;
            }
            $key = $schedule->teacher->id;
            if (! isset($pending[$key])) {
                $pending[$key] = [
                    'id' => $schedule->teacher->id,
                    'name' => $schedule->teacher->name,
                    'pending_schedules' => 0,
                ];
            }
            $pending[$key]['pending_schedules']++;
        }

        return array_values($pending);
    }

    private function todaySchedule(string $weekday, Carbon $now): array
    {
        $recorded = Attendance::whereDate('date', $now->toDateString())
            ->pluck('schedule_id')
            ->unique()
            ->flip();

        return Schedule::where('day', $weekday)
            ->with('class', 'subject', 'teacher')
            ->orderBy('time_start')
            ->get()
            ->map(function ($schedule) use ($now, $recorded) {
                $start = Carbon::parse($schedule->time_start);
                $end = Carbon::parse($schedule->time_end);

                $status = 'upcoming';
                if ($now->gte($start) && $now->lte($end)) {
                    $status = 'current';
                } elseif ($now->gt($end)) {
                    $status = 'past';
                }

                return [
                    'id' => $schedule->id,
                    'day' => $schedule->day,
                    'time_start' => substr((string) $schedule->time_start, 0, 5),
                    'time_end' => substr((string) $schedule->time_end, 0, 5),
                    'class' => $schedule->class?->class_name,
                    'subject' => $schedule->subject?->subject_name,
                    'teacher' => $schedule->teacher?->name,
                    'status' => $status,
                    'recorded' => isset($recorded[$schedule->id]),
                ];
            })
            ->all();
    }

    private function recentRecords(): array
    {
        return Attendance::with('student.class', 'schedule.subject')
            ->orderByDesc('date')
            ->orderByDesc('id')
            ->limit(10)
            ->get()
            ->map(fn ($a) => [
                'id' => $a->id,
                'student' => $a->student?->name,
                'class' => $a->student?->class?->class_name,
                'subject' => $a->schedule?->subject?->subject_name,
                'time' => substr((string) ($a->schedule?->time_start ?? ''), 0, 5),
                'date' => $a->date,
                'status' => $a->status,
            ])
            ->all();
    }

    private function reports(): array
    {
        $now = Carbon::now();
        $periods = [
            'weekly' => [$now->copy()->subDays(6)->toDateString(), $now->toDateString()],
            'monthly' => [$now->copy()->subDays(29)->toDateString(), $now->toDateString()],
            'yearly' => [$now->copy()->startOfYear()->toDateString(), $now->toDateString()],
        ];

        $rows = Attendance::whereDate('date', '>=', $now->copy()->startOfYear()->toDateString())
            ->selectRaw('date, status, COUNT(*) as c')
            ->groupBy('date', 'status')
            ->get()
            ->groupBy('date');

        $reports = [];
        foreach ($periods as $key => [$from, $to]) {
            $counts = ['present' => 0, 'absent' => 0, 'late' => 0, 'excused' => 0];
            foreach ($rows as $date => $dayRows) {
                if ($date < $from || $date > $to) {
                    continue;
                }
                foreach ($dayRows as $row) {
                    if (isset($counts[$row->status])) {
                        $counts[$row->status] += (int) $row->c;
                    }
                }
            }
            $total = array_sum($counts);
            $reports[$key] = $counts + [
                'total' => $total,
                'attendance_rate' => self::rate($counts['present'] + $counts['late'], $total),
            ];
        }

        $reports['department_comparison'] = $this->byDepartment();

        return $reports;
    }

    private function decorate(object|array $row): array
    {
        $row = (object) $row;
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
            'attendance_rate' => self::rate($present + $late, $total),
        ];
    }

    private static function rate(int $attended, int $total): float
    {
        return $total > 0 ? round($attended * 100 / $total, 1) : 0.0;
    }

    private function isNextSchoolDay(Carbon $prev, Carbon $next): bool
    {
        $cursor = $prev->copy()->addDay();
        while ($cursor->isWeekend()) {
            $cursor->addDay();
        }

        return $cursor->equalTo($next);
    }
}
