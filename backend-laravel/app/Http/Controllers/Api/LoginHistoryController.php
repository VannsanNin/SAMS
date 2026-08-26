<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\LoginHistory;
use Illuminate\Http\Request;

class LoginHistoryController extends Controller
{
    public function index(Request $request)
    {
        $query = LoginHistory::with('user')->orderByDesc('created_at');

        if ($request->has('user_id')) {
            $query->where('user_id', $request->user_id);
        }

        if ($request->has('is_success')) {
            $query->where('is_success', $request->boolean('is_success'));
        }

        if ($request->has('date_from')) {
            $query->whereDate('created_at', '>=', $request->date_from);
        }

        if ($request->has('date_to')) {
            $query->whereDate('created_at', '<=', $request->date_to);
        }

        $history = $query->paginate($request->get('per_page', 25));

        return response()->json($history);
    }

    public function userHistory(Request $request, int $userId)
    {
        $history = LoginHistory::where('user_id', $userId)
            ->orderByDesc('created_at')
            ->limit(50)
            ->get();

        return response()->json($history);
    }

    public function stats()
    {
        $today = now()->toDateString();

        $stats = [
            'total_today' => LoginHistory::whereDate('created_at', $today)->count(),
            'successful_today' => LoginHistory::whereDate('created_at', $today)->where('is_success', true)->count(),
            'failed_today' => LoginHistory::whereDate('created_at', $today)->where('is_success', false)->count(),
            'unique_ips_today' => LoginHistory::whereDate('created_at', $today)->distinct('ip_address')->count(),
            'recent_failures' => LoginHistory::where('is_success', false)
                ->with('user')
                ->orderByDesc('created_at')
                ->limit(20)
                ->get(),
        ];

        return response()->json($stats);
    }
}
