<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use Illuminate\Http\Request;

class ActivityLogController extends Controller
{
    public function index(Request $request)
    {
        $query = ActivityLog::with('user')->orderByDesc('created_at');

        if ($request->has('user_id')) {
            $query->where('user_id', $request->user_id);
        }

        if ($request->has('action')) {
            $query->where('action', $request->action);
        }

        if ($request->has('subject_type')) {
            $query->where('subject_type', $request->subject_type);
        }

        if ($request->has('date_from')) {
            $query->whereDate('created_at', '>=', $request->date_from);
        }

        if ($request->has('date_to')) {
            $query->whereDate('created_at', '<=', $request->date_to);
        }

        $logs = $query->paginate($request->get('per_page', 25));

        return response()->json($logs);
    }

    public function myLogs(Request $request)
    {
        $logs = ActivityLog::where('user_id', $request->user()->id)
            ->orderByDesc('created_at')
            ->limit(50)
            ->get();

        return response()->json($logs);
    }

    public function recent()
    {
        $logs = ActivityLog::with('user')
            ->orderByDesc('created_at')
            ->limit(50)
            ->get();

        return response()->json($logs);
    }

    public function actions()
    {
        $actions = ActivityLog::distinct('action')
            ->pluck('action');

        return response()->json($actions);
    }
}
