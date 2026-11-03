<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class OpcionCaracteristica extends Model
{
    protected $table = 'opciones_caracteristica';

    protected $fillable = [
        'caracteristica_id',
        'valor'
    ];

    public function caracteristica()
    {
        return $this->belongsTo(Caracteristica::class);
    }
}