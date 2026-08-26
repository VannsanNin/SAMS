<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Notification;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    public function index(Request $request)
    {
        $notifications = Notification::where('user_id', $request->user()->id)
            ->orderByDesc('created_at')
            ->paginate($request->get('per_page', 20));

        return response()->json($notifications);
    }

    public function unreadCount(Request $request)
    {
        $count = Notification::where('user_id', $request->user()->id)
            ->where('is_read', false)
            ->count();

        return response()->json(['count' => $count]);
    }

    public function markAsRead(Request $request, Notification $notification)
    {
        if ($notification->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Not found.'], 404);
        }

        $notification->markAsRead();

        return response()->json(['message' => 'Notification marked as read.']);
    }

    public function markAllAsRead(Request $request)
    {
        Notification::where('user_id', $request->user()->id)
            ->where('is_read', false)
            ->update(['is_read' => true, 'read_at' => now()]);

        return response()->json(['message' => 'All notifications marked as read.']);
    }

    public function destroy(Request $request, Notification $notification)
    {
        if ($notification->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Not found.'], 404);
        }

        $notification->delete();

        return response()->noContent();
    }

    public function store(Request $request)
    {
        $request->validate([
            'user_id' => 'required|exists:users,id',
            'type' => 'nullable|string|in:info,success,warning,error,reminder',
            'title' => 'required|string|max:255',
            'message' => 'required|string',
            'data' => 'nullable|array',
            'url' => 'nullable|string',
        ]);

        $notification = Notification::create([
            'user_id' => $request->user_id,
            'type' => $request->get('type', 'info'),
            'title' => $request->title,
            'message' => $request->message,
            'data' => $request->data,
            'url' => $request->url,
        ]);

        return response()->json($notification, 201);
    }

    public function broadcast(Request $request)
    {
        $request->validate([
            'roles' => 'required|array',
            'roles.*' => 'string|in:' . implode(',', \App\Models\User::ROLES),
            'type' => 'nullable|string|in:info,success,warning,error,reminder',
            'title' => 'required|string|max:255',
            'message' => 'required|string',
            'data' => 'nullable|array',
            'url' => 'nullable|string',
        ]);

        $users = \App\Models\User::whereIn('role', $request->roles)
            ->where('is_active', true)
            ->pluck('id');

        $notifications = [];
        foreach ($users as $userId) {
            $notifications[] = Notification::create([
                'user_id' => $userId,
                'type' => $request->get('type', 'info'),
                'title' => $request->title,
                'message' => $request->message,
                'data' => $request->data,
                'url' => $request->url,
            ]);
        }

        return response()->json([
            'message' => count($notifications) . ' notifications sent.',
            'count' => count($notifications),
        ], 201);
    }
}
