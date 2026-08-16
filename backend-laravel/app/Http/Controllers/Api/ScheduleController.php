<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Schedule;
use App\Models\SchoolClass;
use App\Models\Subject;
use App\Models\Teacher;
use Illuminate\Http\Request;

class ScheduleController extends Controller
{
    private const DAYS = [
        'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday',
    ];

    public function index(Request $request)
    {
        $perPage = $request->get('per_page', 15);

        return $this->applyFilters(Schedule::query(), $request)
            ->with([
                'class:id,class_name',
                'subject:id,subject_name',
                'teacher:id,name',
            ])
            ->orderByRaw("FIELD(day, 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday')")
            ->orderBy('time_start')
            ->paginate($perPage);
    }

    public function filters()
    {
        return [
            'days' => self::DAYS,
            'classes' => SchoolClass::orderBy('class_name')->get(['id', 'class_name']),
            'teachers' => Teacher::orderBy('name')->get(['id', 'name']),
            'subjects' => Subject::orderBy('subject_name')->get(['id', 'subject_name']),
            'rooms' => Schedule::whereNotNull('room')->where('room', '!=', '')
                ->distinct()->orderBy('room')->pluck('room'),
            'recurrences' => ['weekly', 'biweekly', 'monthly', 'none'],
        ];
    }

    public function store(Request $request)
    {
        $data = $request->validate($this->rules());

        $conflicts = $this->detectConflicts($data);
        if (count($conflicts) > 0) {
            return response()->json([
                'message' => 'Schedule conflicts detected — ' . count($conflicts) . ' overlapping slot(s).',
                'errors' => ['conflicts' => $conflicts],
            ], 422);
        }

        $schedule = Schedule::create($data);

        return $this->show($schedule);
    }

    public function show(Schedule $schedule)
    {
        return $schedule->load([
            'class:id,class_name',
            'subject:id,subject_name',
            'teacher:id,name',
        ]);
    }

    public function update(Request $request, Schedule $schedule)
    {
        $data = $request->validate($this->rules());

        $conflicts = $this->detectConflicts($data, $schedule->id);
        if (count($conflicts) > 0) {
            return response()->json([
                'message' => 'Schedule conflicts detected — ' . count($conflicts) . ' overlapping slot(s).',
                'errors' => ['conflicts' => $conflicts],
            ], 422);
        }

        $schedule->update($data);

        return $this->show($schedule);
    }

    public function destroy(Schedule $schedule)
    {
        $schedule->delete();
        return response()->noContent();
    }

    public function conflicts(Request $request)
    {
        $request->validate([
            'day' => 'required|string|in:' . implode(',', self::DAYS),
            'time_start' => 'required|date_format:H:i',
            'time_end' => 'required|date_format:H:i|after:time_start',
        ]);

        $data = $request->only(['day', 'time_start', 'time_end', 'teacher_id', 'class_id', 'room']);
        $conflicts = $this->detectConflicts($data, $request->integer('exclude_id') ?: null);

        return response()->json([
            'conflicts' => $conflicts,
            'total' => count($conflicts),
        ]);
    }

    public function export(Request $request)
    {
        $schedules = $this->applyFilters(Schedule::query(), $request)
            ->with([
                'class:id,class_name',
                'subject:id,subject_name',
                'teacher:id,name',
            ])
            ->orderByRaw("FIELD(day, 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday')")
            ->orderBy('time_start')
            ->get();

        $headers = ['Day', 'Start Time', 'End Time', 'Course', 'Teacher', 'Class', 'Room', 'Recurring'];

        return response()->streamDownload(function () use ($schedules, $headers) {
            $out = fopen('php://output', 'w');
            fputcsv($out, $headers);
            foreach ($schedules as $s) {
                fputcsv($out, [
                    $s->day, substr($s->time_start, 0, 5), substr($s->time_end, 0, 5),
                    $s->subject->subject_name ?? '', $s->teacher->name ?? '', $s->class->class_name ?? '',
                    $s->room ?? '', $s->recurrence,
                ]);
            }
            fclose($out);
        }, 'timetable-' . now()->format('Y-m-d') . '.csv', ['Content-Type' => 'text/csv']);
    }

    private function rules(): array
    {
        return [
            'class_id' => 'required|exists:classes,id',
            'subject_id' => 'required|exists:subjects,id',
            'teacher_id' => 'required|exists:teachers,id',
            'day' => 'required|string|in:' . implode(',', self::DAYS),
            'time_start' => 'required|date_format:H:i',
            'time_end' => 'required|date_format:H:i|after:time_start',
            'room' => 'nullable|string',
            'recurrence' => 'nullable|string|in:weekly,biweekly,monthly,none',
        ];
    }

    private function applyFilters($query, Request $request)
    {
        if ($request->filled('day')) {
            $query->where('day', $request->input('day'));
        }
        foreach (['class_id', 'subject_id', 'teacher_id', 'recurrence'] as $field) {
            if ($request->filled($field)) {
                $query->where($field, $request->input($field));
            }
        }
        if ($request->filled('room')) {
            $query->where('room', $request->input('room'));
        }

        return $query;
    }

    private function detectConflicts(array $data, ?int $excludeId = null): array
    {
        $day = $data['day'];
        $start = $data['time_start'];
        $end = $data['time_end'];
        $conflicts = [];

        $overlap = function ($q) use ($day, $start, $end) {
            $q->where('day', $day)
                ->where('time_start', '<', $end)
                ->where('time_end', '>', $start);
        };

        if (!empty($data['teacher_id'])) {
            $q = Schedule::where('teacher_id', $data['teacher_id']);
            if ($excludeId) {
                $q->where('id', '!=', $excludeId);
            }
            $overlap($q);
            foreach ($q->with(['class:id,class_name', 'subject:id,subject_name'])->get() as $s) {
                $conflicts[] = [
                    'type' => 'teacher',
                    'message' => "Teacher is already scheduled for {$s->subject->subject_name} ({$s->class->class_name}) on {$s->day} " . substr($s->time_start, 0, 5) . "–" . substr($s->time_end, 0, 5) . '.',
                    'schedule' => $s,
                ];
            }
        }

        if (!empty($data['class_id'])) {
            $q = Schedule::where('class_id', $data['class_id']);
            if ($excludeId) {
                $q->where('id', '!=', $excludeId);
            }
            $overlap($q);
            foreach ($q->with(['subject:id,subject_name'])->get() as $s) {
                $conflicts[] = [
                    'type' => 'class',
                    'message' => "Class already has {$s->subject->subject_name} on {$s->day} " . substr($s->time_start, 0, 5) . "–" . substr($s->time_end, 0, 5) . '.',
                    'schedule' => $s,
                ];
            }
        }

        if (!empty($data['room'])) {
            $q = Schedule::where('room', $data['room']);
            if ($excludeId) {
                $q->where('id', '!=', $excludeId);
            }
            $overlap($q);
            foreach ($q->with(['class:id,class_name', 'subject:id,subject_name'])->get() as $s) {
                $conflicts[] = [
                    'type' => 'room',
                    'message' => "Room is already used by {$s->subject->subject_name} ({$s->class->class_name}) on {$s->day} " . substr($s->time_start, 0, 5) . "–" . substr($s->time_end, 0, 5) . '.',
                    'schedule' => $s,
                ];
            }
        }

        return $conflicts;
    }
}
