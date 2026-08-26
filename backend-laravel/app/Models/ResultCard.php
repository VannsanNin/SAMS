<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ResultCard extends Model
{
    protected $fillable = [
        'student_id', 'class_id', 'academic_year', 'semester',
        'total_marks', 'obtained_marks', 'percentage', 'gpa',
        'grade', 'rank', 'status', 'remarks',
    ];

    protected $casts = [
        'total_marks' => 'decimal:2',
        'obtained_marks' => 'decimal:2',
        'percentage' => 'decimal:2',
        'gpa' => 'decimal:2',
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
