<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Building extends Model
{
    protected $fillable = ['name', 'code', 'address', 'total_floors', 'is_active'];

    protected $casts = ['is_active' => 'boolean'];

    public function rooms()
    {
        return $this->hasMany(Room::class);
    }
}
