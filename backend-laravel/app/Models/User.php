<?php

namespace App\Models;

use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    public const ROLES = [
        'admin', 'principal', 'teacher', 'student', 'class_president',
        'parent', 'accountant', 'librarian', 'receptionist', 'staff',
    ];

    public const STAFF_ROLES = ['admin', 'principal', 'accountant', 'librarian', 'receptionist', 'staff'];
    public const ACADEMIC_ROLES = ['admin', 'principal', 'teacher', 'student', 'class_president'];
    public const FINANCE_ROLES = ['admin', 'principal', 'accountant'];

    protected $fillable = [
        'name', 'email', 'password', 'role', 'is_active',
        'student_id', 'teacher_id', 'guardian_id', 'staff_id',
        'two_factor_enabled', 'two_factor_secret', 'two_factor_recovery_codes',
        'last_login_at', 'last_login_ip', 'login_pin', 'pin_changed_at',
    ];

    protected $hidden = [
        'password', 'remember_token', 'two_factor_secret', 'two_factor_recovery_codes', 'login_pin',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'is_active' => 'boolean',
            'two_factor_enabled' => 'boolean',
            'last_login_at' => 'datetime',
            'pin_changed_at' => 'datetime',
        ];
    }

    // --- Relationships ---

    public function student()
    {
        return $this->belongsTo(Student::class);
    }

    public function teacher()
    {
        return $this->belongsTo(Teacher::class);
    }

    public function guardian()
    {
        return $this->belongsTo(Guardian::class);
    }

    public function staffMember()
    {
        return $this->belongsTo(Staff::class, 'staff_id');
    }

    public function loginHistory()
    {
        return $this->hasMany(LoginHistory::class);
    }

    public function activityLogs()
    {
        return $this->hasMany(ActivityLog::class);
    }

    public function notifications()
    {
        return $this->hasMany(Notification::class);
    }

    // --- Role checks ---

    public function isAdmin(): bool
    {
        return $this->role === 'admin';
    }

    public function isPrincipal(): bool
    {
        return $this->role === 'principal';
    }

    public function isTeacher(): bool
    {
        return $this->role === 'teacher';
    }

    public function isParent(): bool
    {
        return $this->role === 'parent';
    }

    public function isStudent(): bool
    {
        return in_array($this->role, ['student', 'class_president']);
    }

    public function isClassPresident(): bool
    {
        return $this->role === 'class_president';
    }

    public function isAccountant(): bool
    {
        return $this->role === 'accountant';
    }

    public function isLibrarian(): bool
    {
        return $this->role === 'librarian';
    }

    public function isReceptionist(): bool
    {
        return $this->role === 'receptionist';
    }

    public function isStaff(): bool
    {
        return in_array($this->role, self::STAFF_ROLES);
    }

    public function isAcademic(): bool
    {
        return in_array($this->role, self::ACADEMIC_ROLES);
    }

    public function isFinance(): bool
    {
        return in_array($this->role, self::FINANCE_ROLES);
    }

    // --- Permissions ---

    public function hasPermission(string $permission): bool
    {
        if ($this->role === 'admin') {
            return true;
        }

        return $this->rolePermissions()->contains('name', $permission);
    }

    public function hasAnyPermission(array $permissions): bool
    {
        if ($this->role === 'admin') {
            return true;
        }

        return $this->rolePermissions()->whereIn('name', $permissions)->exists();
    }

    public function rolePermissions()
    {
        return Permission::whereHas('roles', function ($query) {
            $query->where('role', $this->role);
        });
    }

    public function getUnreadNotificationCount(): int
    {
        return $this->notifications()->where('is_read', false)->count();
    }
}
