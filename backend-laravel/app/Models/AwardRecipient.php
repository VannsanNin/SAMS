<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AwardRecipient extends Model
{
    protected $fillable = ['award_id', 'student_id', 'remarks'];

    public function award()
    {
        return $this->belongsTo(Award::class);
    }

    public function student()
    {
        return $this->belongsTo(Student::class);
    }
}
