<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\LoginHistory;
use App\Models\ActivityLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Validation\ValidationException;
use PragmaRX\Google2FA\Google2FA;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required',
            'two_factor_code' => 'nullable|string',
        ]);

        $user = User::where('email', $request->email)->first();

        if (! $user) {
            $this->logLoginAttempt(null, $request, false, 'User not found');
            throw ValidationException::withMessages([
                'email' => ['The provided credentials are incorrect.'],
            ]);
        }

        if (! $user->is_active) {
            $this->logLoginAttempt($user, $request, false, 'Account deactivated');
            throw ValidationException::withMessages([
                'email' => ['Your account has been deactivated. Please contact the administrator.'],
            ]);
        }

        if (! Hash::check($request->password, $user->password)) {
            $this->logLoginAttempt($user, $request, false, 'Invalid password');
            throw ValidationException::withMessages([
                'email' => ['The provided credentials are incorrect.'],
            ]);
        }

        // Check 2FA if enabled
        if ($user->two_factor_enabled) {
            if (! $request->two_factor_code) {
                return response()->json([
                    'requires_2fa' => true,
                    'message' => 'Two-factor authentication code is required.',
                ], 200);
            }

            $google2fa = new Google2FA();
            if (! $google2fa->verifyKey($user->two_factor_secret, $request->two_factor_code)) {
                $this->logLoginAttempt($user, $request, false, 'Invalid 2FA code');
                throw ValidationException::withMessages([
                    'two_factor_code' => ['The provided two-factor authentication code is invalid.'],
                ]);
            }
        }

        $token = $user->createToken('auth-token')->plainTextToken;

        // Update login info
        $user->update([
            'last_login_at' => now(),
            'last_login_ip' => $request->ip(),
        ]);

        $this->logLoginAttempt($user, $request, true);

        return response()->json([
            'token' => $token,
            'user' => $this->userPayload($user),
        ]);
    }

    public function logout(Request $request)
    {
        $user = $request->user();

        ActivityLog::create([
            'user_id' => $user->id,
            'action' => 'logout',
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
        ]);

        $request->user()->currentAccessToken()->delete();

        return response()->noContent();
    }

    public function me(Request $request)
    {
        $user = $request->user()->load(['student.class', 'teacher', 'guardian.students.class', 'staffMember']);

        $profile = null;
        if ($user->role === 'teacher' && $user->teacher) {
            $profile = $user->teacher;
        } elseif ($user->role === 'parent' && $user->guardian) {
            $profile = $user->guardian->load('students.class');
        } elseif (in_array($user->role, ['student', 'class_president']) && $user->student) {
            $profile = $user->student->load('class');
        } elseif ($user->staffMember) {
            $profile = $user->staffMember;
        }

        return response()->json([
            'user' => $this->userPayload($user),
            'profile' => $profile,
            'unread_notifications' => $user->getUnreadNotificationCount(),
        ]);
    }

    public function changePassword(Request $request)
    {
        $request->validate([
            'current_password' => 'required|string',
            'new_password' => 'required|string|min:8|confirmed',
        ]);

        $user = $request->user();

        if (! Hash::check($request->current_password, $user->password)) {
            throw ValidationException::withMessages([
                'current_password' => ['The current password is incorrect.'],
            ]);
        }

        $user->password = $request->new_password;
        $user->save();

        ActivityLog::create([
            'user_id' => $user->id,
            'action' => 'password_changed',
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
        ]);

        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => 'Password changed successfully. Please sign in again.']);
    }

    public function forgotPassword(Request $request)
    {
        $request->validate(['email' => 'required|email']);

        $user = User::where('email', $request->email)->first();

        if (! $user) {
            return response()->json(['message' => 'If that email exists, a password reset token has been generated.']);
        }

        Password::broker()->sendResetLink(['email' => $user->email]);

        return response()->json([
            'message' => 'If that email exists, a password reset link has been sent.',
        ]);
    }

    public function resetPassword(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'token' => 'required|string',
            'password' => 'required|string|min:8|confirmed',
        ]);

        $status = Password::broker()->reset(
            $request->only('email', 'token', 'password', 'password_confirmation'),
            function ($user, $password) {
                $user->password = $password;
                $user->save();
            }
        );

        if ($status !== Password::PASSWORD_RESET) {
            throw ValidationException::withMessages([
                'email' => [__($status)],
            ]);
        }

        return response()->json(['message' => __($status)]);
    }

    // --- Two-Factor Authentication ---

    public function enable2FA(Request $request)
    {
        $user = $request->user();
        $google2fa = new Google2FA();

        $secret = $google2fa->generateSecretKey();
        $qrCodeUrl = $google2fa->getQRCodeUrl(
            config('app.name'),
            $user->email,
            $secret
        );

        $user->update(['two_factor_secret' => $secret]);

        return response()->json([
            'secret' => $secret,
            'qr_code_url' => $qrCodeUrl,
            'message' => 'Scan the QR code with your authenticator app, then verify with a code.',
        ]);
    }

    public function confirm2FA(Request $request)
    {
        $request->validate([
            'code' => 'required|string|size:6',
        ]);

        $user = $request->user();
        $google2fa = new Google2FA();

        if (! $google2fa->verifyKey($user->two_factor_secret, $request->code)) {
            throw ValidationException::withMessages([
                'code' => ['The provided code is invalid.'],
            ]);
        }

        $recoveryCodes = collect();
        for ($i = 0; $i < 10; $i++) {
            $recoveryCodes->push(bin2hex(random_bytes(4)));
        }

        $user->update([
            'two_factor_enabled' => true,
            'two_factor_recovery_codes' => $recoveryCodes->implode(','),
        ]);

        ActivityLog::create([
            'user_id' => $user->id,
            'action' => '2fa_enabled',
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
        ]);

        return response()->json([
            'message' => 'Two-factor authentication has been enabled.',
            'recovery_codes' => $recoveryCodes->toArray(),
        ]);
    }

    public function disable2FA(Request $request)
    {
        $request->validate([
            'password' => 'required|string',
        ]);

        $user = $request->user();

        if (! Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'password' => ['The password is incorrect.'],
            ]);
        }

        $user->update([
            'two_factor_enabled' => false,
            'two_factor_secret' => null,
            'two_factor_recovery_codes' => null,
        ]);

        ActivityLog::create([
            'user_id' => $user->id,
            'action' => '2fa_disabled',
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
        ]);

        return response()->json(['message' => 'Two-factor authentication has been disabled.']);
    }

    // --- Login History & Account ---

    public function loginHistory(Request $request)
    {
        $history = $request->user()
            ->loginHistory()
            ->orderByDesc('created_at')
            ->limit(50)
            ->get();

        return response()->json($history);
    }

    public function sessions(Request $request)
    {
        $tokens = $request->user()->tokens()->get();

        return response()->json($tokens);
    }

    public function revokeAllSessions(Request $request)
    {
        $request->user()->tokens()->delete();

        return response()->json(['message' => 'All sessions have been revoked.']);
    }

    // --- Helpers ---

    private function logLoginAttempt(?User $user, Request $request, bool $success, ?string $reason = null): void
    {
        LoginHistory::create([
            'user_id' => $user?->id,
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'is_success' => $success,
            'failure_reason' => $reason,
        ]);

        if ($success && $user) {
            ActivityLog::create([
                'user_id' => $user->id,
                'action' => 'login',
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
            ]);
        }
    }

    private function userPayload(User $user): array
    {
        return [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'role' => $user->role,
            'is_active' => $user->is_active,
            'student_id' => $user->student_id,
            'teacher_id' => $user->teacher_id,
            'guardian_id' => $user->guardian_id,
            'staff_id' => $user->staff_id,
            'two_factor_enabled' => $user->two_factor_enabled,
        ];
    }
}
