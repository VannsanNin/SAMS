<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Permission;
use Illuminate\Http\Request;

class PermissionController extends Controller
{
    public function index()
    {
        $permissions = Permission::orderBy('group')->orderBy('name')->get();

        return response()->json($permissions);
    }

    public function byGroup()
    {
        $permissions = Permission::orderBy('group')->orderBy('name')->get()->groupBy('group');

        return response()->json($permissions);
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255|unique:permissions',
            'group' => 'required|string|max:255',
            'description' => 'nullable|string',
        ]);

        $permission = Permission::create($request->only('name', 'group', 'description'));

        return response()->json($permission, 201);
    }

    public function destroy(Permission $permission)
    {
        $permission->delete();

        return response()->noContent();
    }

    public function assignToRole(Request $request)
    {
        $request->validate([
            'role' => 'required|string|in:' . implode(',', \App\Models\User::ROLES),
            'permission_ids' => 'required|array',
            'permission_ids.*' => 'exists:permissions,id',
        ]);

        $role = $request->role;
        $permissionIds = $request->permission_ids;

        \Illuminate\Support\Facades\DB::table('role_permissions')
            ->where('role', $role)
            ->delete();

        foreach ($permissionIds as $permissionId) {
            \Illuminate\Support\Facades\DB::table('role_permissions')->insert([
                'role' => $role,
                'permission_id' => $permissionId,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        return response()->json(['message' => "Permissions assigned to {$role} role successfully."]);
    }

    public function getRolePermissions(string $role)
    {
        $permissions = Permission::whereHas('roles', function ($query) use ($role) {
            $query->where('role', $role);
        })->get();

        return response()->json($permissions);
    }
}
