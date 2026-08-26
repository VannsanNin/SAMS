<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Department extends Model
{
    protected $fillable = ['name', 'code', 'description', 'head_id', 'is_active'];

    protected $casts = ['is_active' => 'boolean'];

    public function head()
    {
        return $this->belongsTo(Teacher::class, 'head_id');
    }
}
