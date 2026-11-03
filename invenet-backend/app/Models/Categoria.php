<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Categoria extends Model
{
    protected $table = 'categorias';

    protected $fillable = [
        'nombre',
        'descripcion',
        'activo',
    ];

    protected function casts(): array
    {
        return [
            'activo' => 'boolean',
        ];
    }

    public function activos()
    {
        return $this->hasMany(Activo::class);
    }

    public function caracteristicas()
    {
        return $this->belongsToMany(
            Caracteristica::class,
            'categoria_caracteristica',
            'categoria_id',
            'caracteristica_id'
        )->withPivot('obligatorio');
    }
}