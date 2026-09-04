<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class StudentEnrollment extends Model
{
    protected $fillable = [
        'student_id', 'class_id', 'academic_year', 'grade_level',
        'enrollment_date', 'withdrawal_date', 'status', 'promotion_status',
    ];

    protected $casts = [
        'enrollment_date' => 'date',
        'withdrawal_date' => 'date',
        'grade_level' => 'integer',
    ];

    public function student()
    {
        return $this->belongsTo(Student::class);
    }

    public function schoolClass()
    {
        return $this->belongsTo(SchoolClass::class, 'class_id');
    }
}
