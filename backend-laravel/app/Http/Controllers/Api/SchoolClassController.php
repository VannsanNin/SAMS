<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Api\Concerns\ImportsSpreadsheet;
use App\Models\SchoolClass;
use App\Models\Subject;
use App\Models\Teacher;
use Illuminate\Http\Request;

class SchoolClassController extends Controller
{
    use ImportsSpreadsheet;

    public function index(Request $request)
    {
        $perPage = $request->get('per_page', 15);

        return $this->applyFilters(SchoolClass::query(), $request)
            ->withCount(['students', 'schedules', 'courses'])
            ->with([
                'teacher:id,name',
                'courses:id,subject_name',
            ])
            ->orderBy('class_name')
            ->paginate($perPage);
    }

    public function filters()
    {
        return [
            'departments' => SchoolClass::whereNotNull('department')->where('department', '!=', '')
                ->distinct()->orderBy('department')->pluck('department'),
            'academic_years' => SchoolClass::whereNotNull('academic_year')->where('academic_year', '!=', '')
                ->distinct()->orderByDesc('academic_year')->pluck('academic_year'),
            'semesters' => SchoolClass::whereNotNull('semester')->where('semester', '!=', '')
                ->distinct()->orderBy('semester')->pluck('semester'),
            'teachers' => Teacher::orderBy('name')->get(['id', 'name']),
            'subjects' => Subject::orderBy('subject_name')->get(['id', 'subject_name']),
        ];
    }

    public function store(Request $request)
    {
        $data = $request->validate($this->rules());
        $class = SchoolClass::create($data);
        $this->syncCourses($class, $request);

        return $this->show($class);
    }

    public function show(SchoolClass $schoolClass)
    {
        $schoolClass->load([
            'teacher:id,name',
            'courses:id,subject_name,course_code',
            'schedules.subject:id,subject_name',
            'schedules.teacher:id,name',
            'students:id,name,student_id,gender,status,class_id',
        ]);

        return $schoolClass;
    }

    public function update(Request $request, SchoolClass $schoolClass)
    {
        $rules = $this->rules();
        $rules['class_name'] = 'required|string|unique:classes,class_name,' . $schoolClass->id;

        $data = $request->validate($rules);
        $schoolClass->update($data);
        $this->syncCourses($schoolClass, $request);

        return $this->show($schoolClass);
    }

    public function destroy(SchoolClass $schoolClass)
    {
        $schoolClass->delete();
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
            return response()->json(['message' => 'The file must contain a header row and at least one class.'], 422);
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

            if (empty($record['class_name'])) {
                $skipped++;
                $errors[] = 'Row ' . ($ri + 1) . ': class name/code is required.';
                continue;
            }

            if (SchoolClass::where('class_name', $record['class_name'])->exists()) {
                $skipped++;
                continue;
            }

            $teacher = !empty($record['teacher'])
                ? Teacher::where('name', $record['teacher'])->orWhere('teacher_id', $record['teacher'])->first()
                : null;

            $class = SchoolClass::create([
                'class_name' => $record['class_name'],
                'department' => $record['department'] ?? null,
                'academic_year' => $record['academic_year'] ?? now()->format('Y') . '-' . (now()->format('Y') + 1),
                'semester' => $record['semester'] ?? 'Semester 1',
                'room' => $record['room'] ?? null,
                'teacher_id' => $teacher->id ?? Teacher::orderBy('id')->first()->id,
            ]);

            $courseIds = $this->resolveCourseIds($record['courses'] ?? '');
            if ($courseIds) {
                $class->courses()->attach($courseIds);
            }

            $created++;
        }

        return response()->json([
            'message' => "Imported {$created} class" . ($created === 1 ? '' : 'es') . ".",
            'created' => $created,
            'skipped' => $skipped,
            'errors' => array_slice($errors, 0, 25),
        ]);
    }

    public function export(Request $request)
    {
        $classes = $this->applyFilters(SchoolClass::query(), $request)
            ->with(['teacher:id,name', 'courses:id,subject_name'])
            ->orderBy('class_name')
            ->get();

        $headers = [
            'Class Name/Code', 'Department', 'Academic Year', 'Semester', 'Room',
            'Teacher', 'Courses',
        ];

        return response()->streamDownload(function () use ($classes, $headers) {
            $out = fopen('php://output', 'w');
            fputcsv($out, $headers);
            foreach ($classes as $c) {
                fputcsv($out, [
                    $c->class_name, $c->department, $c->academic_year, $c->semester, $c->room,
                    $c->teacher->name ?? '',
                    $c->courses->pluck('subject_name')->implode('; '),
                ]);
            }
            fclose($out);
        }, 'classes-' . now()->format('Y-m-d') . '.csv', ['Content-Type' => 'text/csv']);
    }

    private function rules(): array
    {
        return [
            'class_name' => 'required|string',
            'department' => 'nullable|string',
            'academic_year' => 'required|string',
            'semester' => 'nullable|string',
            'room' => 'nullable|string',
            'teacher_id' => 'required|exists:teachers,id',
            'subject_ids' => 'nullable|array',
            'subject_ids.*' => 'exists:subjects,id',
        ];
    }

    private function applyFilters($query, Request $request)
    {
        if ($request->filled('search')) {
            $search = trim($request->search);
            $query->where(function ($q) use ($search) {
                $q->where('class_name', 'like', "%{$search}%")
                    ->orWhere('room', 'like', "%{$search}%")
                    ->orWhere('department', 'like', "%{$search}%");
            });
        }

        foreach (['department', 'academic_year', 'semester'] as $field) {
            if ($request->filled($field)) {
                $query->where($field, $request->input($field));
            }
        }

        if ($request->filled('teacher_id')) {
            $query->where('teacher_id', $request->input('teacher_id'));
        }

        if ($request->filled('subject_id')) {
            $query->whereHas('courses', fn ($q) => $q->where('subjects.id', $request->input('subject_id')));
        }

        return $query;
    }

    private function syncCourses(SchoolClass $class, Request $request)
    {
        if ($request->has('subject_ids')) {
            $class->courses()->sync($request->input('subject_ids', []));
        }
    }

    private function resolveCourseIds(string $list): array
    {
        $parts = preg_split('/[;,]/', $list);
        $ids = [];
        foreach ($parts as $part) {
            $part = trim($part);
            if ($part === '') {
                continue;
            }
            $subject = is_numeric($part)
                ? Subject::find((int) $part)
                : Subject::where('subject_name', $part)->orWhere('course_code', $part)->first();
            if ($subject) {
                $ids[] = $subject->id;
            }
        }

        return array_values(array_unique($ids));
    }

    protected function headerAliases(): array
    {
        return [
            'class name' => 'class_name', 'class' => 'class_name', 'class name/code' => 'class_name',
            'class code' => 'class_name', 'class_code' => 'class_name', 'name' => 'class_name',
            'department' => 'department', 'faculty' => 'department',
            'academic year' => 'academic_year', 'academic_year' => 'academic_year', 'year' => 'academic_year',
            'semester' => 'semester',
            'room' => 'room', 'room number' => 'room',
            'teacher' => 'teacher', 'homeroom teacher' => 'teacher', 'class teacher' => 'teacher',
            'courses' => 'courses', 'course' => 'courses', 'subjects' => 'courses', 'subject' => 'courses',
        ];
    }
}
