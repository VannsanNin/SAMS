<?php

namespace App\Models;

use App\Models\Base\Event;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Leave extends Event
{
    use HasFactory;

    protected $table = 'leaves';

    protected $fillable = [
        'student_id', 'staff_id', 'date_from', 'date_to',
        'reason', 'status',
    ];

    public function setStudentID($id)
    {
        $this->student_id = $id;
        return $this;
    }

    public function getStudentID()
    {
        return $this->student_id;
    }

    public function setDateFrom($date)
    {
        $this->date_from = $date;
        return $this;
    }

    public function getDateFrom()
    {
        return $this->date_from;
    }

    public function setDateTo($date)
    {
        $this->date_to = $date;
        return $this;
    }

    public function getDateTo()
    {
        return $this->date_to;
    }

    public function setReason($reason)
    {
        $this->reason = $reason;
        return $this;
    }

    public function getReason()
    {
        return $this->reason;
    }

    public function setStatus($status)
    {
        $this->status = $status;
        return $this;
    }

    public function getStatus()
    {
        return $this->status;
    }

    public function student()
    {
        return $this->belongsTo(Student::class, 'student_id');
    }

    public function staff()
    {
        return $this->belongsTo(Staff::class, 'staff_id');
    }
}
