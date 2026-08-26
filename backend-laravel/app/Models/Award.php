<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Award extends Model
{
    protected $fillable = [
        'title', 'description', 'type', 'level', 'date', 'certificate_number',
    ];

    protected $casts = ['date' => 'date'];

    public function recipients()
    {
        return $this->hasMany(AwardRecipient::class);
    }
}
