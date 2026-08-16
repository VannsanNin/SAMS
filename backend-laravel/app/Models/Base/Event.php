<?php

namespace App\Models\Base;

use Illuminate\Database\Eloquent\Model;

abstract class Event extends Model
{
    public function setID($id)
    {
        $this->id = $id;
        return $this;
    }

    public function getID()
    {
        return $this->id;
    }

    public function setStaffID($id)
    {
        $this->staff_id = $id;
        return $this;
    }

    public function getStaffID()
    {
        return $this->staff_id;
    }

    public function setDate($date)
    {
        $this->date = $date;
        return $this;
    }

    public function getDate()
    {
        return $this->date;
    }
}
