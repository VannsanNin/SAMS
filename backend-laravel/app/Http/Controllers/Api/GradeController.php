<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Exam;
use App\Models\ExamMark;
use App\Models\GradeScale;
use App\Models\GradeScaleItem;
use App\Models\ResultCard;
use App\Models\Student;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class GradeController extends Controller
{
    // ─── Grade Scales ───────────────────────────────────────────────────────

    public function gradeScales()
    {
        return response()->json(
            GradeScale::with('items')->orderByDesc('is_default')->get()
        );
    }

    public function storeGradeScale(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'academic_year' => 'nullable|string',
            'is_default' => 'nullable|boolean',
            'items' => 'required|array|min:1',
            'items.*.grade' => 'required|string',
            'items.*.min_percentage' => 'required|numeric|min:0|max:100',
            'items.*.max_percentage' => 'required|numeric|min:0|max:100',
            'items.*.gpa_point' => 'required|numeric|min:0|max:4',
            'items.*.description' => 'nullable|string',
        ]);

        if ($request->boolean('is_default')) {
            GradeScale::where('is_default', true)->update(['is_default' => false]);
        }

        $scale = GradeScale::create($request->only('name', 'academic_year', 'is_default'));

        foreach ($request->items as $index => $item) {
            $scale->items()->create([
                'grade' => $item['grade'],
                'min_percentage' => $item['min_percentage'],
                'max_percentage' => $item['max_percentage'],
                'gpa_point' => $item['gpa_point'],
                'description' => $item['description'] ?? null,
                'sort_order' => $index,
            ]);
        }

        return response()->json($scale->load('items'), 201);
    }

    // ─── Student Grades ─────────────────────────────────────────────────────

    public function studentGrades(Request $request)
    {
        $user = $request->user();
        $studentId = $user->student_id;

        if (! $studentId) {
            return response()->json(['message' => 'Not a student account.'], 403);
        }

        $exams = Exam::whereHas('schoolClass.students', fn ($q) => $q->where('students.id', $studentId))
            ->with(['subject', 'schoolClass'])
            ->where('status', 'completed')
            ->orderByDesc('date')
            ->get();

        $grades = $exams->map(function ($exam) use ($studentId) {
            $mark = ExamMark::where('exam_id', $exam->id)
                ->where('student_id', $studentId)
                ->first();

            $obtained = $mark?->marks_obtained ?? 0;
            $percentage = $exam->total_marks > 0
                ? round($obtained * 100 / $exam->total_marks, 1)
                : 0;

            $grade = $this->getGrade($percentage);

            return [
                'exam_id' => $exam->id,
                'exam_name' => $exam->name,
                'exam_type' => $exam->type,
                'subject' => $exam->subject?->subject_name,
                'subject_code' => $exam->subject?->course_code,
                'date' => $exam->date->toDateString(),
                'total_marks' => $exam->total_marks,
                'passing_marks' => $exam->passing_marks,
                'marks_obtained' => $mark?->marks_obtained,
                'percentage' => $percentage,
                'grade' => $grade['grade'],
                'gpa_point' => $grade['gpa'],
                'status' => $mark?->is_absent ? 'absent' : ($obtained >= $exam->passing_marks ? 'pass' : 'fail'),
            ];
        });

        $passing = $grades->where('status', 'pass');
        $gpa = $passing->count() > 0 ? round($passing->avg('gpa_point'), 2) : 0;

        return response()->json([
            'student_id' => $studentId,
            'grades' => $grades,
            'summary' => [
                'total_exams' => $grades->count(),
                'passed' => $passing->count(),
                'failed' => $grades->where('status', 'fail')->count(),
                'absent' => $grades->where('status', 'absent')->count(),
                'gpa' => $gpa,
                'average_percentage' => $passing->count() > 0 ? round($passing->avg('percentage'), 1) : 0,
            ],
        ]);
    }

    public function classGrades(Request $request, int $classId)
    {
        $exams = Exam::where('class_id', $classId)
            ->where('status', 'completed')
            ->with('subject')
            ->get();

        $students = Student::where('class_id', $classId)
            ->with('class')
            ->orderBy('name')
            ->get();

        $results = $students->map(function ($student) use ($exams) {
            $totalObtained = 0;
            $totalMarks = 0;
            $subjectGrades = [];

            foreach ($exams as $exam) {
                $mark = ExamMark::where('exam_id', $exam->id)
                    ->where('student_id', $student->id)
                    ->first();

                $obtained = $mark?->marks_obtained ?? 0;
                $percentage = $exam->total_marks > 0
                    ? round($obtained * 100 / $exam->total_marks, 1)
                    : 0;

                $totalObtained += $obtained;
                $totalMarks += $exam->total_marks;

                $grade = $this->getGrade($percentage);

                $subjectGrades[] = [
                    'subject' => $exam->subject?->subject_name,
                    'exam_name' => $exam->name,
                    'total_marks' => $exam->total_marks,
                    'marks_obtained' => $obtained,
                    'percentage' => $percentage,
                    'grade' => $grade['grade'],
                    'gpa_point' => $grade['gpa'],
                ];
            }

            $overallPercentage = $totalMarks > 0
                ? round($totalObtained * 100 / $totalMarks, 1)
                : 0;
            $overallGrade = $this->getGrade($overallPercentage);

            return [
                'student_id' => $student->id,
                'student_name' => $student->name,
                'student_code' => $student->student_id,
                'subjects' => $subjectGrades,
                'total_marks' => $totalMarks,
                'obtained_marks' => $totalObtained,
                'percentage' => $overallPercentage,
                'grade' => $overallGrade['grade'],
                'gpa' => $overallGrade['gpa'],
            ];
        });

        // Sort by GPA descending and assign ranks
        $results = $results->sortByDesc('gpa')->values();
        foreach ($results as $index => &$result) {
            $result['rank'] = $index + 1;
        }

        return response()->json([
            'class_id' => $classId,
            'results' => $results,
            'stats' => [
                'total_students' => $results->count(),
                'average_gpa' => $results->count() > 0 ? round($results->avg('gpa'), 2) : 0,
                'average_percentage' => $results->count() > 0 ? round($results->avg('percentage'), 1) : 0,
                'pass_count' => $results->filter(fn ($r) => $r['percentage'] >= 50)->count(),
                'fail_count' => $results->filter(fn ($r) => $r['percentage'] < 50)->count(),
            ],
        ]);
    }

    // ─── Report Card ────────────────────────────────────────────────────────

    public function generateReportCard(Request $request)
    {
        $request->validate([
            'student_id' => 'required|exists:students,id',
            'class_id' => 'required|exists:classes,id',
            'academic_year' => 'required|string',
            'semester' => 'required|string',
        ]);

        $exams = Exam::where('class_id', $request->class_id)
            ->where('academic_year', $request->academic_year)
            ->where('semester', $request->semester)
            ->where('status', 'completed')
            ->with('subject')
            ->get();

        $totalObtained = 0;
        $totalMarks = 0;
        $subjectResults = [];

        foreach ($exams as $exam) {
            $mark = ExamMark::where('exam_id', $exam->id)
                ->where('student_id', $request->student_id)
                ->first();

            $obtained = $mark?->marks_obtained ?? 0;
            $percentage = $exam->total_marks > 0
                ? round($obtained * 100 / $exam->total_marks, 1)
                : 0;

            $totalObtained += $obtained;
            $totalMarks += $exam->total_marks;

            $grade = $this->getGrade($percentage);

            $subjectResults[] = [
                'subject_id' => $exam->subject_id,
                'subject_name' => $exam->subject?->subject_name,
                'course_code' => $exam->subject?->course_code,
                'total_marks' => $exam->total_marks,
                'obtained_marks' => $obtained,
                'percentage' => $percentage,
                'grade' => $grade['grade'],
                'gpa_point' => $grade['gpa'],
                'status' => $mark?->is_absent ? 'absent' : ($obtained >= $exam->passing_marks ? 'pass' : 'fail'),
            ];
        }

        $overallPercentage = $totalMarks > 0 ? round($totalObtained * 100 / $totalMarks, 1) : 0;
        $overallGrade = $this->getGrade($overallPercentage);

        $resultCard = ResultCard::updateOrCreate(
            [
                'student_id' => $request->student_id,
                'class_id' => $request->class_id,
                'academic_year' => $request->academic_year,
                'semester' => $request->semester,
            ],
            [
                'total_marks' => $totalMarks,
                'obtained_marks' => $totalObtained,
                'percentage' => $overallPercentage,
                'gpa' => $overallGrade['gpa'],
                'grade' => $overallGrade['grade'],
                'status' => 'published',
            ]
        );

        return response()->json([
            'result_card_id' => $resultCard->id,
            'student' => Student::with('class')->find($request->student_id),
            'academic_year' => $request->academic_year,
            'semester' => $request->semester,
            'subjects' => $subjectResults,
            'summary' => [
                'total_marks' => $totalMarks,
                'obtained_marks' => $totalObtained,
                'percentage' => $overallPercentage,
                'gpa' => $overallGrade['gpa'],
                'grade' => $overallGrade['grade'],
                'status' => 'published',
            ],
        ]);
    }

    public function resultCards(Request $request)
    {
        $query = ResultCard::with(['student.class', 'schoolClass']);

        if ($request->has('student_id')) {
            $query->where('student_id', $request->student_id);
        }
        if ($request->has('class_id')) {
            $query->where('class_id', $request->class_id);
        }
        if ($request->has('academic_year')) {
            $query->where('academic_year', $request->academic_year);
        }
        if ($request->has('semester')) {
            $query->where('semester', $request->semester);
        }

        return response()->json($query->orderByDesc('created_at')->paginate(25));
    }

    // ─── Rankings ───────────────────────────────────────────────────────────

    public function classRankings(Request $request, int $classId)
    {
        $request->validate([
            'academic_year' => 'required|string',
            'semester' => 'required|string',
        ]);

        $results = ResultCard::where('class_id', $classId)
            ->where('academic_year', $request->academic_year)
            ->where('semester', $request->semester)
            ->with('student')
            ->orderByDesc('gpa')
            ->get()
            ->map(function ($result, $index) {
                return [
                    'rank' => $index + 1,
                    'student_id' => $result->student_id,
                    'student_name' => $result->student?->name,
                    'student_code' => $result->student?->student_id,
                    'total_marks' => $result->total_marks,
                    'obtained_marks' => $result->obtained_marks,
                    'percentage' => $result->percentage,
                    'gpa' => $result->gpa,
                    'grade' => $result->grade,
                ];
            });

        return response()->json($results);
    }

    // ─── Helpers ────────────────────────────────────────────────────────────

    private function getGrade(float $percentage): array
    {
        $scale = GradeScaleItem::whereHas('gradeScale', fn ($q) => $q->where('is_default', true))
            ->where('min_percentage', '<=', $percentage)
            ->where('max_percentage', '>=', $percentage)
            ->first();

        if ($scale) {
            return ['grade' => $scale->grade, 'gpa' => $scale->gpa_point];
        }

        // Default grading scale
        return match (true) {
            $percentage >= 90 => ['grade' => 'A+', 'gpa' => 4.0],
            $percentage >= 80 => ['grade' => 'A', 'gpa' => 4.0],
            $percentage >= 75 => ['grade' => 'B+', 'gpa' => 3.5],
            $percentage >= 70 => ['grade' => 'B', 'gpa' => 3.0],
            $percentage >= 65 => ['grade' => 'C+', 'gpa' => 2.5],
            $percentage >= 60 => ['grade' => 'C', 'gpa' => 2.0],
            $percentage >= 55 => ['grade' => 'D+', 'gpa' => 1.5],
            $percentage >= 50 => ['grade' => 'D', 'gpa' => 1.0],
            default => ['grade' => 'F', 'gpa' => 0.0],
        };
    }
}
