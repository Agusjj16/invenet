<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable, SoftDeletes;

    protected $fillable = [
        'rol_id',
        'nombre',
        'apellido',
        'email',
        'password',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    public function rol()
    {
        return $this->belongsTo(Rol::class);
    }

    public function reportes()
    {
        return $this->hasMany(ReporteAnomalia::class, 'usuario_id');
    }

    public function ordenesAsignadas()
    {
        return $this->hasMany(OrdenReparacion::class, 'tecnico_id');
    }

    public function historial()
    {
        return $this->hasMany(HistorialActivo::class, 'usuario_id');
    }

    public function tienePermiso(string $permiso): bool
    {
        // Cargar el rol si todavía no está disponible.
        $this->loadMissing('rol');

        if (!$this->rol) {
            return false;
        }

        // Cargar los permisos una sola vez.
        $this->rol->loadMissing('permisos');

        // Comprobar el permiso en la colección cargada.
        return $this->rol->permisos->contains(
            'nombre',
            $permiso
        );
    }
}