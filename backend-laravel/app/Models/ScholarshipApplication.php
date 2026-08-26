<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ScholarshipApplication extends Model
{
    protected $fillable = [
        'scholarship_id', 'student_id', 'status', 'approved_amount',
        'reason', 'admin_remarks',
    ];

    protected $casts = [
        'approved_amount' => 'decimal:2',
    ];

    public function scholarship()
    {
        return $this->belongsTo(Scholarship::class);
    }

    public function student()
    {
        return $this->belongsTo(Student::class);
    }
}
