<?php

namespace App\Models;

use App\Models\Base\Person;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Student extends Person
{
    use HasFactory;

    protected $table = 'students';

    protected $fillable = [
        'student_id', 'name', 'gender', 'dob', 'phone', 'email', 'address',
        'class_id', 'grade_level', 'education_level', 'parent_name', 'parent_phone', 'guardian_id', 'image',
        'department', 'major', 'academic_year', 'semester',
        'enrollment_date', 'status',
    ];

    protected static function booted(): void
    {
        static::creating(function (Student $student) {
            if (empty($student->student_id)) {
                $student->student_id = 'STU-' . now()->format('Y')
                    . '-' . str_pad((string) (Student::count() + 1), 4, '0', STR_PAD_LEFT);
            }
            if (empty($student->status)) {
                $student->status = 'active';
            }
        });

        static::created(function (Student $student) {
            if ($student->academic_year && $student->class_id) {
                $student->enrollments()->firstOrCreate(
                    ['academic_year' => $student->academic_year],
                    [
                        'class_id' => $student->class_id,
                        'grade_level' => $student->grade_level ?? $student->class?->grade_level,
                        'enrollment_date' => $student->enrollment_date,
                        'status' => $student->status ?: 'active',
                        'promotion_status' => 'pending',
                    ]
                );
            }
        });
    }

    public function setClassID($id)
    {
        $this->class_id = $id;
        return $this;
    }

    public function getClassID()
    {
        return $this->class_id;
    }

    public function setParentName($name)
    {
        $this->parent_name = $name;
        return $this;
    }

    public function getParentName()
    {
        return $this->parent_name;
    }

    public function setParentPhone($phone)
    {
        $this->parent_phone = $phone;
        return $this;
    }

    public function getParentPhone()
    {
        return $this->parent_phone;
    }

    public function setImage($image)
    {
        $this->image = $image;
        return $this;
    }

    public function getImage()
    {
        return $this->image;
    }

    public function class()
    {
        return $this->belongsTo(SchoolClass::class, 'class_id');
    }

    public function enrollments()
    {
        return $this->hasMany(StudentEnrollment::class);
    }

    public function guardian()
    {
        return $this->belongsTo(Guardian::class);
    }

    public function attendances()
    {
        return $this->hasMany(Attendance::class);
    }

    public function leaves()
    {
        return $this->hasMany(Leave::class);
    }
}
