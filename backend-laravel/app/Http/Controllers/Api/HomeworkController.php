<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Homework;
use App\Models\HomeworkSubmission;
use Illuminate\Http\Request;

class HomeworkController extends Controller
{
    public function index(Request $request)
    {
        $query = Homework::with(['subject', 'schoolClass', 'teacher']);

        if ($request->has('subject_id')) $query->where('subject_id', $request->subject_id);
        if ($request->has('class_id')) $query->where('class_id', $request->class_id);
        if ($request->has('teacher_id')) $query->where('teacher_id', $request->teacher_id);
        if ($request->has('priority')) $query->where('priority', $request->priority);

        $user = $request->user();
        if ($user->isStudent() && $user->student_id) {
            $query->where('class_id', $user->student->class_id);
        } elseif ($user->isTeacher() && $user->teacher_id) {
            $query->where('teacher_id', $user->teacher_id);
        }

        return response()->json($query->orderByDesc('due_date')->paginate(25));
    }

    public function store(Request $request)
    {
        $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'subject_id' => 'required|exists:subjects,id',
            'class_id' => 'required|exists:classes,id',
            'teacher_id' => 'required|exists:teachers,id',
            'assigned_date' => 'required|date',
            'due_date' => 'required|date|after_or_equal:assigned_date',
            'total_marks' => 'nullable|integer|min:1',
            'priority' => 'nullable|in:low,medium,high',
        ]);

        abort_unless($this->canManageHomework($request->user(), new Homework($request->only('teacher_id'))), 403);

        $homework = Homework::create($request->only([
            'title', 'description', 'subject_id', 'class_id', 'teacher_id',
            'assigned_date', 'due_date', 'total_marks', 'priority', 'attachment_path', 'is_active',
        ]));
        return response()->json($homework->load(['subject', 'schoolClass', 'teacher']), 201);
    }

    public function show(Homework $homework)
    {
        abort_unless($this->canViewHomework(request()->user(), $homework), 403);
        return response()->json($homework->load(['subject', 'schoolClass', 'teacher', 'submissions.student.class']));
    }

    public function update(Request $request, Homework $homework)
    {
        abort_unless($this->canManageHomework($request->user(), $homework), 403);
        $data = $request->validate([
            'title' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'subject_id' => 'sometimes|exists:subjects,id',
            'class_id' => 'sometimes|exists:classes,id',
            'teacher_id' => 'sometimes|exists:teachers,id',
            'assigned_date' => 'sometimes|date',
            'due_date' => 'sometimes|date',
            'total_marks' => 'sometimes|integer|min:1',
            'priority' => 'sometimes|in:low,medium,high',
            'is_active' => 'sometimes|boolean',
        ]);
        $homework->update($data);
        return response()->json($homework->load(['subject', 'schoolClass', 'teacher']));
    }

    public function destroy(Homework $homework)
    {
        abort_unless($this->canManageHomework(request()->user(), $homework), 403);
        $homework->delete();
        return response()->noContent();
    }

    // ─── Submissions ────────────────────────────────────────────────────────

    public function submissions(Request $request, Homework $homework)
    {
        abort_unless($this->canManageHomework($request->user(), $homework), 403);
        return response()->json(
            $homework->submissions()->with('student.class')->orderBy('student_id')->get()
        );
    }

    public function submitHomework(Request $request, Homework $homework)
    {
        $request->validate([
            'student_id' => 'required|exists:students,id',
            'submission_text' => 'nullable|string',
            'attachment_path' => 'nullable|string',
        ]);

        $user = $request->user();
        abort_unless($user && $user->isStudent() && (int) $user->student_id === (int) $request->student_id, 403);
        abort_unless((int) $homework->class_id === (int) $user->student?->class_id, 403);

        $existing = HomeworkSubmission::where('homework_id', $homework->id)
            ->where('student_id', $request->student_id)
            ->first();

        if ($existing) {
            return response()->json(['message' => 'Already submitted.'], 422);
        }

        $isLate = now()->toDateTimeString() > $homework->due_date->toDateTimeString();

        $submission = HomeworkSubmission::create([
            'homework_id' => $homework->id,
            'student_id' => $request->student_id,
            'submission_text' => $request->submission_text,
            'attachment_path' => $request->attachment_path,
            'status' => $isLate ? 'late' : 'submitted',
            'submitted_at' => now(),
        ]);

        return response()->json($submission, 201);
    }

    public function gradeSubmission(Request $request, HomeworkSubmission $submission)
    {
        $request->validate([
            'marks_obtained' => 'required|numeric|min:0',
            'feedback' => 'nullable|string',
        ]);

        abort_unless($this->canManageHomework($request->user(), $submission->homework), 403);
        abort_unless((float) $request->marks_obtained <= (float) $submission->homework->total_marks, 422);

        $submission->update([
            'marks_obtained' => $request->marks_obtained,
            'feedback' => $request->feedback,
            'status' => 'graded',
            'graded_at' => now(),
        ]);

        return response()->json($submission->load('student.class'));
    }

    private function canManageHomework(?\App\Models\User $user, Homework $homework): bool
    {
        if (! $user) {
            return false;
        }

        if ($user->isAdmin() || $user->isPrincipal()) {
            return true;
        }

        return $user->isTeacher()
            && $user->teacher_id
            && (int) $homework->teacher_id === (int) $user->teacher_id;
    }

    private function canViewHomework(?\App\Models\User $user, Homework $homework): bool
    {
        if (! $user) {
            return false;
        }

        if ($this->canManageHomework($user, $homework)) {
            return true;
        }

        return $user->isStudent()
            && $user->student_id
            && (int) $homework->class_id === (int) $user->student?->class_id;
    }

    public function homeworkStats(Request $request)
    {
        $user = $request->user();

        if ($user->isStudent() && $user->student_id) {
            $total = Homework::where('class_id', $user->student->class_id)->count();
            $submitted = HomeworkSubmission::where('student_id', $user->student_id)->count();
            $graded = HomeworkSubmission::where('student_id', $user->student_id)->where('status', 'graded')->count();

            return response()->json([
                'total' => $total,
                'submitted' => $submitted,
                'pending' => $total - $submitted,
                'graded' => $graded,
            ]);
        }

        return response()->json([
            'total' => Homework::count(),
            'active' => Homework::where('is_active', true)->count(),
        ]);
    }
}
