<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Event;
use App\Models\EventRegistration;
use App\Models\DisciplineRecord;
use App\Models\Award;
use App\Models\AwardRecipient;
use App\Models\Document;
use App\Models\Student;
use App\Models\Teacher;
use App\Models\Staff;
use App\Models\SchoolClass;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class EventController extends Controller
{
    public function index(Request $request)
    {
        $query = Event::with('organizer');

        if ($request->has('type')) $query->where('type', $request->type);
        if ($request->has('is_active')) $query->where('is_active', $request->boolean('is_active'));
        if ($request->has('date_from')) $query->where('start_date', '>=', $request->date_from);
        if ($request->has('date_to')) $query->where('start_date', '<=', $request->date_to);

        return response()->json($query->orderBy('start_date')->paginate(25));
    }

    public function store(Request $request)
    {
        $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'type' => 'required|in:sports,club,competition,field_trip,ceremony,meeting,holiday,exam,other',
            'start_date' => 'required|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
            'start_time' => 'nullable|date_format:H:i',
            'end_time' => 'nullable|date_format:H:i',
            'location' => 'nullable|string',
            'target_roles' => 'nullable|array',
            'target_classes' => 'nullable|array',
        ]);

        $event = Event::create([
            ...$request->only([
                'title', 'description', 'type', 'start_date', 'end_date',
                'start_time', 'end_time', 'location', 'target_roles', 'target_classes',
            ]),
            'organizer_id' => $request->user()->id,
        ]);

        return response()->json($event, 201);
    }

    public function show(Event $event)
    {
        return response()->json($event->load(['organizer', 'registrations.user']));
    }

    public function update(Request $request, Event $event)
    {
        $data = $request->validate([
            'title' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'type' => 'sometimes|in:sports,club,competition,field_trip,ceremony,meeting,holiday,exam,other',
            'start_date' => 'sometimes|date',
            'end_date' => 'nullable|date',
            'start_time' => 'nullable|date_format:H:i',
            'end_time' => 'nullable|date_format:H:i',
            'location' => 'nullable|string',
            'target_roles' => 'nullable|array',
            'target_classes' => 'nullable|array',
            'is_active' => 'sometimes|boolean',
        ]);
        $event->update($data);
        return response()->json($event);
    }

    public function destroy(Event $event)
    {
        $event->delete();
        return response()->noContent();
    }

    public function register(Request $request, Event $event)
    {
        $registration = EventRegistration::create([
            'event_id' => $event->id,
            'user_id' => $request->user()->id,
        ]);

        return response()->json($registration, 201);
    }

    // ─── Discipline ─────────────────────────────────────────────────────────

    public function disciplineRecords(Request $request)
    {
        $query = DisciplineRecord::with(['student.class', 'reporter']);

        $this->applyTeacherStudentScope($query, $request->user());

        if ($request->has('student_id')) $query->where('student_id', $request->student_id);
        if ($request->has('severity')) $query->where('severity', $request->severity);

        return response()->json($query->orderByDesc('incident_date')->paginate(25));
    }

    public function storeDisciplineRecord(Request $request)
    {
        $data = $request->validate([
            'student_id' => 'required|exists:students,id',
            'severity' => 'required|in:minor,moderate,major,critical',
            'incident_type' => 'required|string|max:255',
            'description' => 'required|string',
            'incident_date' => 'required|date',
            'action_taken' => 'nullable|string',
            'action_details' => 'nullable|string',
        ]);

        $this->assertTeacherStudentAccess($request->user(), (int) $data['student_id']);

        $record = DisciplineRecord::create([
            ...$data,
            'reported_by' => $request->user()->id,
        ]);

        return response()->json($record->load('student.class'), 201);
    }

    // ─── Awards ─────────────────────────────────────────────────────────────

    public function awards(Request $request)
    {
        $query = Award::withCount('recipients');

        if ($request->has('type')) $query->where('type', $request->type);
        if ($request->has('level')) $query->where('level', $request->level);

        return response()->json($query->orderByDesc('date')->paginate(25));
    }

    public function storeAward(Request $request)
    {
        $data = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'type' => 'required|in:academic,sports,competition,behavior,attendance,other',
            'level' => 'required|in:class,school,district,national,international',
            'date' => 'required|date',
            'student_ids' => 'required|array',
            'student_ids.*' => 'exists:students,id',
        ]);

        foreach ($data['student_ids'] as $studentId) {
            $this->assertTeacherStudentAccess($request->user(), (int) $studentId);
        }

        $award = Award::create($data);

        foreach ($data['student_ids'] as $studentId) {
            AwardRecipient::create([
                'award_id' => $award->id,
                'student_id' => $studentId,
            ]);
        }

        return response()->json($award->load('recipients.student.class'), 201);
    }

    // ─── Documents ──────────────────────────────────────────────────────────

    public function documents(Request $request)
    {
        $query = Document::with(['documentable', 'uploader']);

        if ($request->has('documentable_type')) $query->where('documentable_type', $request->documentable_type);
        if ($request->has('documentable_id')) $query->where('documentable_id', $request->documentable_id);
        if ($request->filled('type') || $request->filled('category')) $query->where('type', $request->input('type', $request->category));
        if ($request->filled('search')) $query->where('name', 'like', '%' . $request->search . '%');

        $documents = $query->orderByDesc('created_at')->paginate(25);
        $documents->getCollection()->transform(fn ($document) => $this->documentPayload($document));

        return response()->json($documents);
    }

    public function storeDocument(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'type' => 'required|in:transcript,certificate,id_card,report_card,admission,medical,photo,other',
            'documentable_type' => 'nullable|in:student,teacher,staff',
            'documentable_id' => 'nullable|integer',
            'file' => 'required|file|mimes:pdf,jpg,jpeg,png,webp,doc,docx|max:10240',
        ]);

        $file = $request->file('file');
        $modelMap = [
            'student' => Student::class,
            'teacher' => Teacher::class,
            'staff' => Staff::class,
        ];
        $documentableType = $data['documentable_type'] ?? null;
        if ($documentableType && (! isset($data['documentable_id']) || ! $modelMap[$documentableType]::whereKey($data['documentable_id'])->exists())) {
            return response()->json(['message' => 'The related record was not found.'], 422);
        }

        $path = $file->store('documents', 'local');

        $document = Document::create([
            'name' => $data['name'],
            'type' => $data['type'],
            'documentable_type' => $documentableType ? $modelMap[$documentableType] : null,
            'documentable_id' => $data['documentable_id'] ?? null,
            'file_path' => $path,
            'file_type' => $file->getMimeType(),
            'file_size' => $file->getSize(),
            'uploaded_by' => $request->user()->id,
        ]);

        return response()->json($this->documentPayload($document), 201);
    }

    public function downloadDocument(Document $document)
    {
        $disk = Storage::disk('local');
        if (! $disk->exists($document->file_path)) {
            $disk = Storage::disk('public');
        }

        abort_unless($disk->exists($document->file_path), 404);

        return $disk->download($document->file_path, $document->name);
    }

    public function destroyDocument(Document $document)
    {
        Storage::disk('local')->delete($document->file_path);
        Storage::disk('public')->delete($document->file_path);
        $document->delete();
        return response()->noContent();
    }

    private function applyTeacherStudentScope($query, $user): void
    {
        if (! $user || ! $user->isTeacher()) {
            return;
        }

        $classIds = $this->teacherClassIds($user);
        $query->whereHas('student', fn ($studentQuery) => $studentQuery->whereIn('class_id', $classIds));
    }

    private function assertTeacherStudentAccess($user, int $studentId): void
    {
        if (! $user || ! $user->isTeacher()) {
            return;
        }

        abort_unless(
            Student::whereKey($studentId)->whereIn('class_id', $this->teacherClassIds($user))->exists(),
            403
        );
    }

    private function teacherClassIds($user): array
    {
        $teacher = $user?->teacher_id ? Teacher::find($user->teacher_id) : null;
        if (! $teacher) {
            return [];
        }

        return $teacher->assignedClasses()->pluck('classes.id')
            ->merge($teacher->classes()->pluck('id'))
            ->unique()->map(fn ($id) => (int) $id)->all();
    }

    private function documentPayload(Document $document): Document
    {
        $document->setAttribute('file_url', url('/api/documents/' . $document->id . '/download'));
        $document->setAttribute('title', $document->name);
        $document->setAttribute('category', $document->type);
        return $document;
    }
}
