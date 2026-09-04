<?php

namespace Tests\Feature;

use App\Models\SchoolClass;
use App\Models\Student;
use App\Models\Teacher;
use App\Models\User;
use App\Models\FeeInvoice;
use App\Models\FeeStructure;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class SchoolAccessTest extends TestCase
{
    use RefreshDatabase;

    public function test_teacher_cannot_view_a_student_from_an_unassigned_class(): void
    {
        $teacher = Teacher::create($this->teacherData('teacher@example.com'));
        $otherTeacher = Teacher::create($this->teacherData('other-teacher@example.com'));
        $assignedClass = SchoolClass::create($this->classData($teacher->id, '1-A'));
        $otherClass = SchoolClass::create($this->classData($otherTeacher->id, '2-A'));

        $user = User::create([
            'name' => 'Teacher',
            'email' => 'teacher-user@example.com',
            'password' => 'password123',
            'role' => 'teacher',
            'teacher_id' => $teacher->id,
        ]);

        $student = Student::create([
            'name' => 'Student',
            'gender' => 'Female',
            'dob' => '2015-01-01',
            'class_id' => $otherClass->id,
            'academic_year' => '2026-2027',
        ]);

        $teacher->assignedClasses()->attach($assignedClass->id);
        Sanctum::actingAs($user);

        $this->getJson('/api/students/' . $student->id)->assertForbidden();
    }

    public function test_finance_cannot_overpay_an_invoice(): void
    {
        $teacher = Teacher::create($this->teacherData('finance-teacher@example.com'));
        $class = SchoolClass::create($this->classData($teacher->id, '3-A'));
        $student = Student::create([
            'name' => 'Fee Student', 'gender' => 'Male', 'dob' => '2014-01-01',
            'class_id' => $class->id, 'academic_year' => '2026-2027',
        ]);
        $structure = FeeStructure::create([
            'name' => 'Tuition', 'type' => 'tuition', 'amount' => 100,
            'academic_year' => '2026-2027',
        ]);
        $invoice = FeeInvoice::create([
            'student_id' => $student->id, 'fee_structure_id' => $structure->id,
            'amount' => 100, 'discount' => 10, 'balance' => 90,
            'due_date' => '2026-12-31',
        ]);
        $accountant = User::create([
            'name' => 'Accountant', 'email' => 'accountant@example.com',
            'password' => 'password123', 'role' => 'accountant',
        ]);
        Sanctum::actingAs($accountant);

        $this->postJson('/api/fees/payments', [
            'invoice_id' => $invoice->id, 'amount' => 91,
            'payment_method' => 'cash', 'payment_date' => '2026-09-04',
        ])->assertStatus(422);

        $this->postJson('/api/fees/payments', [
            'invoice_id' => $invoice->id, 'amount' => 90,
            'payment_method' => 'cash', 'payment_date' => '2026-09-04',
        ])->assertCreated();
    }

    public function test_documents_are_uploaded_to_private_storage(): void
    {
        Storage::fake('local');
        $admin = User::create([
            'name' => 'Admin', 'email' => 'documents-admin@example.com',
            'password' => 'password123', 'role' => 'admin',
        ]);
        Sanctum::actingAs($admin);

        $response = $this->post('/api/documents', [
            'name' => 'Student Certificate',
            'type' => 'certificate',
            'file' => UploadedFile::fake()->create('certificate.pdf', 100, 'application/pdf'),
        ]);

        $response->assertCreated();
        $path = $response->json('file_path');
        Storage::disk('local')->assertExists($path);
        Storage::disk('public')->assertMissing($path);
    }

    private function teacherData(string $email): array
    {
        return [
            'name' => 'Teacher',
            'gender' => 'Female',
            'dob' => '1985-01-01',
            'phone' => '012345678',
            'email' => $email,
            'address' => 'Phnom Penh',
            'position' => 'Teacher',
            'salary' => 1000,
            'hire_date' => '2020-01-01',
        ];
    }

    private function classData(int $teacherId, string $name): array
    {
        return [
            'class_name' => $name,
            'teacher_id' => $teacherId,
            'academic_year' => '2026-2027',
            'grade_level' => (int) $name[0],
            'education_level' => 'primary',
        ];
    }
}
