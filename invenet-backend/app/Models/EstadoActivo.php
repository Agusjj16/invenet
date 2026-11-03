<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class EstadoActivo extends Model
{
    protected $table = 'estados_activo';

    protected $fillable = [
        'nombre',
        'descripcion',
    ];

    public function activos()
    {
        return $this->hasMany(Activo::class, 'estado_id');
    }
}