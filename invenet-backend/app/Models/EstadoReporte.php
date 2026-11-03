<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class EstadoReporte extends Model
{
    protected $table = 'estados_reporte';

    protected $fillable = [
        'nombre',
        'descripcion',
    ];

    public function reportes()
    {
        return $this->hasMany(
            ReporteAnomalia::class,
            'estado_reporte_id'
        );
    }
}