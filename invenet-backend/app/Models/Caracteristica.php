<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Caracteristica extends Model
{
    protected $table = 'caracteristicas';

    protected $fillable = [
        'nombre',
        'tipo_dato',
        'unidad',
    ];

    public function categorias()
    {
        return $this->belongsToMany(
            Categoria::class,
            'categoria_caracteristica',
            'caracteristica_id',
            'categoria_id'
        )->withPivot('obligatorio');
    }

    public function activos()
    {
        return $this->belongsToMany(
            Activo::class,
            'activo_caracteristica',
            'caracteristica_id',
            'activo_id'
        )->withPivot('valor');
    }

    public function opciones()
    {
        return $this->hasMany(
            OpcionCaracteristica::class,
            'caracteristica_id'
        );
    }
}