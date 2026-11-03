<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Activo extends Model
{
    use SoftDeletes;

    protected $table = 'activos';

    protected $fillable = [
        'codigo_inventario',
        'categoria_id',
        'estado_id',
        'ubicacion_id',
        'fecha_ingreso',
        'marca',
        'modelo',
        'numero_serie',
        'observaciones',
    ];

    protected function casts(): array
    {
        return [
            'fecha_ingreso' => 'date',
        ];
    }

    public function categoria()
    {
        return $this->belongsTo(Categoria::class);
    }

    public function estado()
    {
        return $this->belongsTo(EstadoActivo::class, 'estado_id');
    }

    public function ubicacion()
    {
        return $this->belongsTo(Ubicacion::class);
    }

    public function caracteristicas()
    {
        return $this->belongsToMany(
            Caracteristica::class,
            'activo_caracteristica',
            'activo_id',
            'caracteristica_id'
        )->withPivot('valor');
    }

    public function reportes()
    {
        return $this->hasMany(ReporteAnomalia::class);
    }

    public function historial()
    {
        return $this->hasMany(HistorialActivo::class);
    }
}