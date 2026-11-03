<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ReporteAnomalia extends Model
{
    protected $table = 'reportes_anomalias';

    protected $fillable = [
        'activo_id',
        'usuario_id',
        'estado_reporte_id',
        'descripcion',
        'fecha_reporte',
    ];

    protected function casts(): array
    {
        return [
            'fecha_reporte' => 'datetime',
        ];
    }

    public function activo()
    {
        return $this->belongsTo(Activo::class);
    }

    public function usuario()
    {
        return $this->belongsTo(User::class);
    }

    public function estado()
    {
        return $this->belongsTo(
            EstadoReporte::class,
            'estado_reporte_id'
        );
    }

    public function orden()
    {
        return $this->hasOne(OrdenReparacion::class, 'reporte_id');
    }
}
