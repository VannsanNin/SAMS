<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class UserController extends Controller
{
    public function index(Request $request)
    {
        $query = User::query();

        if ($request->has('role')) {
            $query->where('role', $request->role);
        }

        if ($request->has('is_active')) {
            $query->where('is_active', $request->boolean('is_active'));
        }

        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
            });
        }

        $users = $query->orderBy('name')
            ->paginate($request->get('per_page', 25));

        return response()->json($users);
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users',
            'password' => 'required|string|min:8',
            'role' => 'required|string|in:' . implode(',', User::ROLES),
            'student_id' => 'nullable|exists:students,id',
            'teacher_id' => 'nullable|exists:teachers,id',
            'guardian_id' => 'nullable|exists:guardians,id',
            'staff_id' => 'nullable|exists:staff,id',
        ]);

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => $request->password,
            'role' => $request->role,
            'student_id' => $request->student_id,
            'teacher_id' => $request->teacher_id,
            'guardian_id' => $request->guardian_id,
            'staff_id' => $request->staff_id,
        ]);

        return response()->json($user, 201);
    }

    public function show(User $user)
    {
        return response()->json($user->load(['student.class', 'teacher', 'guardian', 'staffMember']));
    }

    public function update(Request $request, User $user)
    {
        $request->validate([
            'name' => 'sometimes|string|max:255',
            'email' => 'sometimes|email|unique:users,email,' . $user->id,
            'role' => 'sometimes|string|in:' . implode(',', User::ROLES),
            'is_active' => 'sometimes|boolean',
        ]);

        $user->update($request->only('name', 'email', 'role', 'is_active'));

        return response()->json($user);
    }

    public function activate(User $user)
    {
        $user->update(['is_active' => true]);

        return response()->json(['message' => 'User activated successfully.', 'user' => $user]);
    }

    public function deactivate(User $user)
    {
        $user->update(['is_active' => false]);

        return response()->json(['message' => 'User deactivated successfully.', 'user' => $user]);
    }

    public function resetPassword(Request $request, User $user)
    {
        $request->validate([
            'password' => 'required|string|min:8',
        ]);

        $user->password = $request->password;
        $user->save();

        return response()->json(['message' => 'Password reset successfully.']);
    }

    public function destroy(User $user)
    {
        if ($user->role === 'admin') {
            return response()->json(['message' => 'Cannot delete admin users.'], 403);
        }

        $user->delete();

        return response()->noContent();
    }
}
