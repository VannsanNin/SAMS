<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Api\Concerns\ImportsSpreadsheet;
use App\Models\Subject;
use App\Models\Teacher;
use Illuminate\Http\Request;

class SubjectController extends Controller
{
    use ImportsSpreadsheet;

    public function index(Request $request)
    {
        $perPage = $request->get('per_page', 15);

        return $this->applyFilters(Subject::query(), $request)
            ->withCount(['teachers', 'schedules'])
            ->with('teachers:id,name')
            ->orderBy('subject_name')
            ->paginate($perPage);
    }

    public function filters()
    {
        return [
            'departments' => Subject::whereNotNull('department')->where('department', '!=', '')
                ->distinct()->orderBy('department')->pluck('department'),
            'statuses' => ['active', 'inactive', 'archived'],
            'semesters' => Subject::whereNotNull('semester')->where('semester', '!=', '')
                ->distinct()->orderBy('semester')->pluck('semester'),
            'academic_years' => Subject::whereNotNull('academic_year')->where('academic_year', '!=', '')
                ->distinct()->orderByDesc('academic_year')->pluck('academic_year'),
            'teachers' => Teacher::orderBy('name')->get(['id', 'name']),
        ];
    }

    public function store(Request $request)
    {
        $data = $request->validate($this->rules());
        $subject = Subject::create($data);
        $this->syncTeachers($subject, $request);

        return $this->show($subject);
    }

    public function show(Subject $subject)
    {
        $subject->load(['teachers:id,name']);
        $subject->schedules_count = $subject->schedules()->count();
        $subject->recent_schedules = $subject->schedules()
            ->with(['class:id,class_name', 'teacher:id,name'])
            ->orderBy('day')
            ->limit(20)
            ->get();

        return $subject;
    }

    public function update(Request $request, Subject $subject)
    {
        $rules = $this->rules();
        $rules['subject_name'] = 'required|string|unique:subjects,subject_name,' . $subject->id;
        $rules['course_code'] = 'nullable|string|max:20|unique:subjects,course_code,' . $subject->id;

        $data = $request->validate($rules);
        $subject->update($data);
        $this->syncTeachers($subject, $request);

        return $this->show($subject);
    }

    public function destroy(Subject $subject)
    {
        $subject->delete();
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
            return response()->json(['message' => 'The file must contain a header row and at least one course.'], 422);
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

            if (empty($record['subject_name'])) {
                $skipped++;
                $errors[] = 'Row ' . ($ri + 1) . ': course name is required.';
                continue;
            }

            if (Subject::where('subject_name', $record['subject_name'])->exists()) {
                $skipped++;
                continue;
            }

            $subject = Subject::create([
                'subject_name' => $record['subject_name'],
                'course_code' => $record['course_code'] ?? null,
                'credits' => $record['credits'] ?? 3,
                'description' => $record['description'] ?? null,
                'department' => $record['department'] ?? null,
                'semester' => $record['semester'] ?? null,
                'academic_year' => $record['academic_year'] ?? null,
                'status' => $record['status'] ?? 'active',
            ]);

            $teacherIds = $this->resolveTeacherIds($record['teachers'] ?? '');
            if ($teacherIds) {
                $subject->teachers()->attach($teacherIds);
            }

            $created++;
        }

        return response()->json([
            'message' => "Imported {$created} course" . ($created === 1 ? '' : 's') . ".",
            'created' => $created,
            'skipped' => $skipped,
            'errors' => array_slice($errors, 0, 25),
        ]);
    }

    public function export(Request $request)
    {
        $subjects = $this->applyFilters(Subject::query(), $request)
            ->with('teachers:id,name')
            ->orderBy('subject_name')
            ->get();

        $headers = [
            'Course Code', 'Course Name', 'Credits', 'Description', 'Department',
            'Semester', 'Academic Year', 'Status', 'Teachers',
        ];

        return response()->streamDownload(function () use ($subjects, $headers) {
            $out = fopen('php://output', 'w');
            fputcsv($out, $headers);
            foreach ($subjects as $s) {
                fputcsv($out, [
                    $s->course_code, $s->subject_name, $s->credits, $s->description,
                    $s->department, $s->semester, $s->academic_year, $s->status,
                    $s->teachers->pluck('name')->implode('; '),
                ]);
            }
            fclose($out);
        }, 'courses-' . now()->format('Y-m-d') . '.csv', ['Content-Type' => 'text/csv']);
    }

    private function rules(): array
    {
        return [
            'subject_name' => 'required|string',
            'course_code' => 'nullable|string|max:20|unique:subjects,course_code',
            'credits' => 'required|integer|min:0|max:30',
            'description' => 'nullable|string',
            'department' => 'nullable|string',
            'semester' => 'nullable|string',
            'academic_year' => 'nullable|string',
            'status' => 'nullable|string|in:active,inactive,archived',
            'teacher_ids' => 'nullable|array',
            'teacher_ids.*' => 'exists:teachers,id',
        ];
    }

    private function applyFilters($query, Request $request)
    {
        if ($request->filled('search')) {
            $search = trim($request->search);
            $query->where(function ($q) use ($search) {
                $q->where('subject_name', 'like', "%{$search}%")
                    ->orWhere('course_code', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%");
            });
        }

        foreach (['department', 'status', 'semester', 'academic_year'] as $field) {
            if ($request->filled($field)) {
                $query->where($field, $request->input($field));
            }
        }

        if ($request->filled('teacher_id')) {
            $query->whereHas('teachers', fn ($q) => $q->where('teachers.id', $request->input('teacher_id')));
        }

        return $query;
    }

    private function syncTeachers(Subject $subject, Request $request)
    {
        if ($request->has('teacher_ids')) {
            $subject->teachers()->sync($request->input('teacher_ids', []));
        }
    }

    private function resolveTeacherIds(string $list): array
    {
        $parts = preg_split('/[;,]/', $list);
        $ids = [];
        foreach ($parts as $part) {
            $part = trim($part);
            if ($part === '') {
                continue;
            }
            $teacher = is_numeric($part)
                ? Teacher::find((int) $part)
                : Teacher::where('name', $part)->first();
            if ($teacher) {
                $ids[] = $teacher->id;
            }
        }

        return array_values(array_unique($ids));
    }

    protected function headerAliases(): array
    {
        return [
            'course code' => 'course_code', 'code' => 'course_code', 'course id' => 'course_code',
            'subject code' => 'course_code', 'subject_code' => 'course_code',
            'course name' => 'subject_name', 'subject name' => 'subject_name', 'name' => 'subject_name',
            'subject' => 'subject_name', 'course' => 'subject_name',
            'credits' => 'credits', 'credit' => 'credits',
            'description' => 'description', 'desc' => 'description',
            'department' => 'department', 'faculty' => 'department',
            'semester' => 'semester',
            'academic year' => 'academic_year', 'academic_year' => 'academic_year', 'year' => 'academic_year',
            'status' => 'status',
            'teachers' => 'teachers', 'teacher' => 'teachers', 'assigned teachers' => 'teachers',
            'instructor' => 'teachers', 'instructors' => 'teachers',
        ];
    }
}
