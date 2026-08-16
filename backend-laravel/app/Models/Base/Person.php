<?php

namespace App\Models\Base;

use Illuminate\Database\Eloquent\Model;

abstract class Person extends Model
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

    public function setName($name)
    {
        $this->name = $name;
        return $this;
    }

    public function getName()
    {
        return $this->name;
    }

    public function setGender($gender)
    {
        $this->gender = $gender;
        return $this;
    }

    public function getGender()
    {
        return $this->gender;
    }

    public function setDob($dob)
    {
        $this->dob = $dob;
        return $this;
    }

    public function getDob()
    {
        return $this->dob;
    }

    public function setPhone($phone)
    {
        $this->phone = $phone;
        return $this;
    }

    public function getPhone()
    {
        return $this->phone;
    }

    public function setEmail($email)
    {
        $this->email = $email;
        return $this;
    }

    public function getEmail()
    {
        return $this->email;
    }

    public function setAddress($address)
    {
        $this->address = $address;
        return $this;
    }

    public function getAddress()
    {
        return $this->address;
    }
}
