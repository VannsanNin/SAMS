<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ExamMark extends Model
{
    protected $fillable = [
        'exam_id', 'student_id', 'marks_obtained', 'marks_obtained_practical',
        'remarks', 'is_absent', 'is_excused',
    ];

    protected $casts = [
        'marks_obtained' => 'decimal:2',
        'marks_obtained_practical' => 'decimal:2',
        'is_absent' => 'boolean',
        'is_excused' => 'boolean',
    ];

    public function exam()
    {
        return $this->belongsTo(Exam::class);
    }

    public function student()
    {
        return $this->belongsTo(Student::class);
    }
}
