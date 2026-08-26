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
        $request->validate([
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
        }

        return response()->json($query->with('author')->orderByDesc('publish_date')->paginate(25));
    }

    public function storeAnnouncement(Request $request)
    {
        $request->validate([
            'title' => 'required|string|max:255',
            'body' => 'required|string',
            'priority' => 'nullable|in:low,normal,high,urgent',
            'target_roles' => 'nullable|array',
            'target_classes' => 'nullable|array',
            'publish_date' => 'required|date',
            'expiry_date' => 'nullable|date|after:publish_date',
        ]);

        $announcement = Announcement::create([
            ...$request->all(),
            'author_id' => $request->user()->id,
        ]);

        return response()->json($announcement->load('author'), 201);
    }
}
