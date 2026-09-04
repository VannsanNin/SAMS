<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Message;
use App\Models\Announcement;
use Illuminate\Http\Request;

class MessageController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        $inbox = Message::where('recipient_id', $user->id)
            ->with('sender')
            ->orderByDesc('created_at')
            ->paginate($request->get('per_page', 20));

        return response()->json($inbox);
    }

    public function sent(Request $request)
    {
        $sent = Message::where('sender_id', $request->user()->id)
            ->with('recipient')
            ->orderByDesc('created_at')
            ->paginate($request->get('per_page', 20));

        return response()->json($sent);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'recipient_id' => 'required|exists:users,id',
            'subject' => 'nullable|string|max:255',
            'body' => 'required|string',
            'parent_message_id' => 'nullable|exists:messages,id',
        ]);

        $message = Message::create([
            'sender_id' => $request->user()->id,
            'recipient_id' => $request->recipient_id,
            'subject' => $request->subject,
            'body' => $request->body,
            'parent_message_id' => $request->parent_message_id,
        ]);

        return response()->json($message->load('sender'), 201);
    }

    public function show(Message $message)
    {
        if ($message->recipient_id !== request()->user()->id && $message->sender_id !== request()->user()->id) {
            return response()->json(['message' => 'Not found.'], 404);
        }

        if ($message->recipient_id === request()->user()->id && ! $message->is_read) {
            $message->update(['is_read' => true, 'read_at' => now()]);
        }

        return response()->json($message->load(['sender', 'recipient', 'replies.sender']));
    }

    public function destroy(Message $message)
    {
        $user = request()->user();
        if ($message->sender_id !== $user->id && $message->recipient_id !== $user->id) {
            return response()->json(['message' => 'Not found.'], 404);
        }

        $message->delete();
        return response()->noContent();
    }

    public function unreadCount(Request $request)
    {
        $count = Message::where('recipient_id', $request->user()->id)
            ->where('is_read', false)
            ->count();

        return response()->json(['count' => $count]);
    }

    // ─── Announcements ──────────────────────────────────────────────────────

    public function announcements(Request $request)
    {
        $user = $request->user();

        $query = Announcement::where('is_published', true)
            ->where(function ($q) {
                $q->whereNull('expiry_date')
                    ->orWhere('expiry_date', '>=', now());
            });

        if (! in_array($user->role, ['admin', 'principal'])) {
            $query->where(function ($q) use ($user) {
                $q->whereNull('target_roles')
                    ->orWhereJsonContains('target_roles', $user->role);
            });

            $classIds = collect();
            if ($user->isStudent() && $user->student_id) {
                $classIds = collect([(int) optional($user->student)->class_id]);
            } elseif ($user->isParent() && $user->guardian_id) {
                $classIds = optional($user->guardian)->students()->pluck('class_id');
            }

            $query->where(function ($q) use ($classIds) {
                $q->whereNull('target_classes');
                if ($classIds->filter()->isNotEmpty()) {
                    foreach ($classIds->filter()->unique() as $classId) {
                        $q->orWhereJsonContains('target_classes', $classId);
                    }
                }
            });
        }

        return response()->json($query->with('author')->orderByDesc('publish_date')->paginate(25));
    }

    public function storeAnnouncement(Request $request)
    {
        $data = $request->validate([
            'title' => 'required|string|max:255',
            'body' => 'required|string',
            'priority' => 'nullable|in:low,normal,high,urgent',
            'target_roles' => 'nullable|array',
            'target_roles.*' => 'string|in:admin,principal,teacher,student,class_president,parent,accountant,librarian,receptionist,staff',
            'target_classes' => 'nullable|array',
            'target_classes.*' => 'integer|exists:classes,id',
            'publish_date' => 'required|date',
            'expiry_date' => 'nullable|date|after:publish_date',
        ]);

        $announcement = Announcement::create([
            ...$data,
            'author_id' => $request->user()->id,
        ]);

        return response()->json($announcement->load('author'), 201);
    }
}
