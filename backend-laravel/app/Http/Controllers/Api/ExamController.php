<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Exam;
use App\Models\ExamMark;
use App\Models\Teacher;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ExamController extends Controller
{
    public function index(Request $request)
    {
        $query = Exam::with(['subject', 'schoolClass']);
        $this->applyTeacherScope($query, $request->user());

        if ($request->has('subject_id')) {
            $query->where('subject_id', $request->subject_id);
        }
        if ($request->has('class_id')) {
            $query->where('class_id', $request->class_id);
        }
        if ($request->has('type')) {
            $query->where('type', $request->type);
        }
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }
        if ($request->has('academic_year')) {
            $query->where('academic_year', $request->academic_year);
        }
        if ($request->has('semester')) {
            $query->where('semester', $request->semester);
        }
        if ($request->has('date_from')) {
            $query->where('date', '>=', $request->date_from);
        }
        if ($request->has('date_to')) {
            $query->where('date', '<=', $request->date_to);
        }

        $exams = $query->orderByDesc('date')->paginate($request->get('per_page', 20));

        return response()->json($exams);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'type' => 'required|in:quiz,midterm,final,monthly,practical,oral',
            'subject_id' => 'required|exists:subjects,id',
            'class_id' => 'required|exists:classes,id',
            'date' => 'required|date',
            'time_start' => 'nullable|date_format:H:i',
            'time_end' => 'nullable|date_format:H:i|after_or_equal:time_start',
            'total_marks' => 'required|integer|min:1',
            'passing_marks' => 'required|integer|min:0|lte:total_marks',
            'room' => 'nullable|string',
            'description' => 'nullable|string',
            'academic_year' => 'nullable|string',
            'semester' => 'nullable|string',
        ]);

        $exam = Exam::create($request->only([
            'name', 'type', 'subject_id', 'class_id', 'date',
            'time_start', 'time_end', 'total_marks', 'passing_marks',
            'room', 'description', 'academic_year', 'semester',
        ]));

        return response()->json($exam->load(['subject', 'schoolClass']), 201);
    }

    public function show(Request $request, Exam $exam)
    {
        abort_unless($this->canViewExam($request->user(), $exam), 403);
        return response()->json($exam->load([
            'subject',
            'schoolClass',
            'marks.student.class',
        ]));
    }

    public function update(Request $request, Exam $exam)
    {
        $data = $request->validate([
            'name' => 'sometimes|string|max:255',
            'type' => 'sometimes|in:quiz,midterm,final,monthly,practical,oral',
            'subject_id' => 'sometimes|exists:subjects,id',
            'class_id' => 'sometimes|exists:classes,id',
            'date' => 'sometimes|date',
            'time_start' => 'nullable|date_format:H:i',
            'time_end' => 'nullable|date_format:H:i',
            'total_marks' => 'sometimes|integer|min:1',
            'passing_marks' => 'sometimes|integer|min:0',
            'room' => 'nullable|string',
            'description' => 'nullable|string',
            'status' => 'sometimes|in:draft,scheduled,ongoing,completed,cancelled',
        ]);

        $exam->update($data);

        return response()->json($exam->load(['subject', 'schoolClass']));
    }

    public function destroy(Exam $exam)
    {
        $exam->delete();
        return response()->noContent();
    }

    // ─── Marks ──────────────────────────────────────────────────────────────

    public function marks(Request $request, Exam $exam)
    {
        abort_unless($this->canViewExam($request->user(), $exam), 403);
        $marks = ExamMark::where('exam_id', $exam->id)
            ->with('student.class')
            ->orderBy('student_id')
            ->get();

        return response()->json($marks);
    }

    public function storeMarks(Request $request, Exam $exam)
    {
        abort_unless($this->canManageExam($request->user(), $exam), 403);

        $request->validate([
            'marks' => 'required|array',
            'marks.*.student_id' => 'required|exists:students,id',
            'marks.*.marks_obtained' => 'nullable|numeric|min:0|max:' . $exam->total_marks,
            'marks.*.marks_obtained_practical' => 'nullable|numeric|min:0|max:' . $exam->total_marks,
            'marks.*.remarks' => 'nullable|string',
            'marks.*.is_absent' => 'nullable|boolean',
            'marks.*.is_excused' => 'nullable|boolean',
        ]);

        foreach ($request->marks as $markData) {
            abort_unless(
                \App\Models\Student::whereKey($markData['student_id'])
                    ->where('class_id', $exam->class_id)
                    ->exists(),
                422
            );

            ExamMark::updateOrCreate(
                ['exam_id' => $exam->id, 'student_id' => $markData['student_id']],
                [
                    'marks_obtained' => $markData['marks_obtained'] ?? null,
                    'marks_obtained_practical' => $markData['marks_obtained_practical'] ?? null,
                    'remarks' => $markData['remarks'] ?? null,
                    'is_absent' => $markData['is_absent'] ?? false,
                    'is_excused' => $markData['is_excused'] ?? false,
                ]
            );
        }

        return response()->json(['message' => 'Marks saved successfully.']);
    }

    private function canManageExam(?\App\Models\User $user, Exam $exam): bool
    {
        if (! $user) {
            return false;
        }

        if ($user->isAdmin() || $user->isPrincipal()) {
            return true;
        }

        if (! $user->isTeacher() || ! $user->teacher_id) {
            return false;
        }

        return \App\Models\Teacher::whereKey($user->teacher_id)
            ->where(function ($query) use ($exam, $user) {
                $query->whereHas('assignedClasses', fn ($q) => $q->whereKey($exam->class_id))
                    ->orWhereHas('classes', fn ($q) => $q->whereKey($exam->class_id))
                    ->orWhereHas('subjects', fn ($q) => $q->whereKey($exam->subject_id));
            })
            ->exists();
    }

    public function studentMarks(Request $request, Exam $exam)
    {
        $studentId = $request->user()->student_id;

        if (! $studentId) {
            return response()->json(['message' => 'Not a student account.'], 403);
        }

        $mark = ExamMark::where('exam_id', $exam->id)
            ->where('student_id', $studentId)
            ->with('exam.subject', 'exam.schoolClass')
            ->first();

        return response()->json($mark);
    }

    public function classResults(Request $request, Exam $exam)
    {
        abort_unless($this->canViewExam($request->user(), $exam), 403);
        $marks = ExamMark::where('exam_id', $exam->id)
            ->where('is_absent', false)
            ->with('student.class')
            ->orderByDesc('marks_obtained')
            ->get()
            ->map(function ($mark, $index) {
                return [
                    'rank' => $index + 1,
                    'student_id' => $mark->student_id,
                    'student_name' => $mark->student?->name,
                    'student_code' => $mark->student?->student_id,
                    'marks_obtained' => $mark->marks_obtained,
                    'total_marks' => $mark->exam->total_marks,
                    'percentage' => $mark->exam->total_marks > 0
                        ? round($mark->marks_obtained * 100 / $mark->exam->total_marks, 1)
                        : 0,
                    'status' => $mark->marks_obtained >= $mark->exam->passing_marks ? 'pass' : 'fail',
                ];
            });

        $passCount = $marks->where('status', 'pass')->count();
        $totalCount = $marks->count();

        return response()->json([
            'exam' => $exam->load(['subject', 'schoolClass']),
            'results' => $marks,
            'stats' => [
                'total' => $totalCount,
                'pass' => $passCount,
                'fail' => $totalCount - $passCount,
                'pass_rate' => $totalCount > 0 ? round($passCount * 100 / $totalCount, 1) : 0,
                'average' => $marks->isNotEmpty() ? round($marks->avg('percentage'), 1) : 0,
                'highest' => $marks->isNotEmpty() ? $marks->max('percentage') : 0,
                'lowest' => $marks->isNotEmpty() ? $marks->min('percentage') : 0,
            ],
        ]);
    }

    private function canViewExam(?\App\Models\User $user, Exam $exam): bool
    {
        if (! $user) {
            return false;
        }

        if ($user->isAdmin() || $user->isPrincipal()) {
            return true;
        }

        if (! $user->isTeacher() || ! $user->teacher_id) {
            return false;
        }

        return Teacher::whereKey($user->teacher_id)
            ->where(function ($query) use ($exam) {
                $query->whereHas('assignedClasses', fn ($q) => $q->whereKey($exam->class_id))
                    ->orWhereHas('classes', fn ($q) => $q->whereKey($exam->class_id))
                    ->orWhereHas('subjects', fn ($q) => $q->whereKey($exam->subject_id));
            })->exists();
    }

    private function applyTeacherScope($query, ?\App\Models\User $user): void
    {
        if (! $user || ! $user->isTeacher() || ! $user->teacher_id) {
            return;
        }

        $teacher = Teacher::find($user->teacher_id);
        if (! $teacher) {
            $query->whereRaw('1 = 0');
            return;
        }

        $classIds = $teacher->assignedClasses()->pluck('classes.id')
            ->merge($teacher->classes()->pluck('id'))->unique();
        $subjectIds = $teacher->subjects()->pluck('subjects.id');

        $query->where(function ($q) use ($classIds, $subjectIds) {
            $q->whereIn('class_id', $classIds)->orWhereIn('subject_id', $subjectIds);
        });
    }
}
