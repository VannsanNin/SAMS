<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DisciplineRecord extends Model
{
    protected $fillable = [
        'student_id', 'reported_by', 'severity', 'incident_type',
        'description', 'incident_date', 'action_taken', 'action_details',
        'parent_notified_by', 'parent_notified_at',
    ];

    protected $casts = [
        'incident_date' => 'date',
        'parent_notified_at' => 'datetime',
    ];

    public function student()
    {
        return $this->belongsTo(Student::class);
    }

    public function reporter()
    {
        return $this->belongsTo(User::class, 'reported_by');
    }
}
