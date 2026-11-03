<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class EstadoOrden extends Model
{
    protected $table = 'estados_orden';

    protected $fillable = [
        'nombre',
        'descripcion',
    ];

    public function ordenes()
    {
        return $this->hasMany(
            OrdenReparacion::class,
            'estado_orden_id'
        );
    }
}