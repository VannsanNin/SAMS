<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Event;
use App\Models\EventRegistration;
use App\Models\DisciplineRecord;
use App\Models\Award;
use App\Models\AwardRecipient;
use App\Models\Document;
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
            ...$request->all(),
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
        $event->update($request->all());
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

        if ($request->has('student_id')) $query->where('student_id', $request->student_id);
        if ($request->has('severity')) $query->where('severity', $request->severity);

        return response()->json($query->orderByDesc('incident_date')->paginate(25));
    }

    public function storeDisciplineRecord(Request $request)
    {
        $request->validate([
            'student_id' => 'required|exists:students,id',
            'severity' => 'required|in:minor,moderate,major,critical',
            'incident_type' => 'required|string|max:255',
            'description' => 'required|string',
            'incident_date' => 'required|date',
            'action_taken' => 'nullable|string',
            'action_details' => 'nullable|string',
        ]);

        $record = DisciplineRecord::create([
            ...$request->all(),
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
        $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'type' => 'required|in:academic,sports,competition,behavior,attendance,other',
            'level' => 'required|in:class,school,district,national,international',
            'date' => 'required|date',
            'student_ids' => 'required|array',
            'student_ids.*' => 'exists:students,id',
        ]);

        $award = Award::create($request->only('title', 'description', 'type', 'level', 'date'));

        foreach ($request->student_ids as $studentId) {
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
        if ($request->has('type')) $query->where('type', $request->type);

        return response()->json($query->orderByDesc('created_at')->paginate(25));
    }

    public function storeDocument(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'type' => 'required|string',
            'documentable_type' => 'required|string',
            'documentable_id' => 'required|integer',
            'file' => 'required|file|max:10240',
        ]);

        $file = $request->file('file');
        $path = $file->store('documents', 'public');

        $document = Document::create([
            'name' => $request->name,
            'type' => $request->type,
            'documentable_type' => $request->documentable_type,
            'documentable_id' => $request->documentable_id,
            'file_path' => $path,
            'file_type' => $file->getMimeType(),
            'file_size' => $file->getSize(),
            'uploaded_by' => $request->user()->id,
        ]);

        return response()->json($document, 201);
    }

    public function destroyDocument(Document $document)
    {
        Storage::disk('public')->delete($document->file_path);
        $document->delete();
        return response()->noContent();
    }
}
