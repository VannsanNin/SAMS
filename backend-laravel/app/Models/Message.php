<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Message extends Model
{
    protected $fillable = [
        'sender_id', 'recipient_id', 'subject', 'body',
        'is_read', 'read_at', 'attachment_path', 'parent_message_id',
    ];

    protected $casts = [
        'is_read' => 'boolean',
        'read_at' => 'datetime',
    ];

    public function sender()
    {
        return $this->belongsTo(User::class, 'sender_id');
    }

    public function recipient()
    {
        return $this->belongsTo(User::class, 'recipient_id');
    }

    public function parentMessage()
    {
        return $this->belongsTo(self::class, 'parent_message_id');
    }

    public function replies()
    {
        return $this->hasMany(self::class, 'parent_message_id');
    }
}
