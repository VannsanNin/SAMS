<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureRole
{
    /**
     * Allow the request through only if the authenticated user has one of
     * the given roles (e.g. role:admin,teacher). Returns 403 otherwise.
     */
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $user = $request->user();

        if (! $user || ! in_array($user->role, $roles, true)) {
            return response()->json(['message' => 'Forbidden. You do not have permission to access this resource.'], 403);
        }

        return $next($request);
    }
}
