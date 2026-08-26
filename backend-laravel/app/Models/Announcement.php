<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Announcement extends Model
{
    protected $fillable = [
        'title', 'body', 'author_id', 'priority', 'target_roles',
        'target_classes', 'publish_date', 'expiry_date', 'is_published',
    ];

    protected $casts = [
        'target_roles' => 'array',
        'target_classes' => 'array',
        'publish_date' => 'date',
        'expiry_date' => 'date',
        'is_published' => 'boolean',
    ];

    public function author()
    {
        return $this->belongsTo(User::class, 'author_id');
    }
}
