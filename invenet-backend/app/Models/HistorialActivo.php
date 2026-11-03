<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class HistorialActivo extends Model
{
    protected $table = 'historial_activos';

    protected $fillable = [
        'activo_id',
        'usuario_id',
        'tipo_evento',
        'descripcion',
        'datos_anteriores',
        'datos_nuevos',
    ];

    protected function casts(): array
    {
        return [
            'datos_anteriores' => 'array',
            'datos_nuevos' => 'array',
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
}
