<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class OrdenReparacion extends Model
{
    protected $table = 'ordenes_reparacion';

    protected $fillable = [
        'reporte_id',
        'tecnico_id',
        'estado_orden_id',
        'fecha_asignacion',
        'fecha_recepcion',
        'fecha_inicio',
        'fecha_finalizacion',
        'diagnostico',
        'detalle_reparacion',
        'observaciones',
    ];

    protected function casts(): array
    {
        return [
            'fecha_asignacion' => 'datetime',
            'fecha_recepcion' => 'datetime',
            'fecha_inicio' => 'datetime',
            'fecha_finalizacion' => 'datetime',
        ];
    }

    public function reporte()
    {
        return $this->belongsTo(ReporteAnomalia::class);
    }

    public function tecnico()
    {
        return $this->belongsTo(User::class, 'tecnico_id');
    }

    public function estado()
    {
        return $this->belongsTo(
            EstadoOrden::class,
            'estado_orden_id'
        );
    }
}
