<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreUsuarioRequest;
use App\Http\Requests\UpdateUsuarioRequest;
use App\Http\Requests\CambiarRolUsuarioRequest;
use App\Models\User;
use Illuminate\Http\Request;
use App\Models\Rol;
use Illuminate\Support\Facades\DB;

class UsuarioController extends Controller
{
    // Listar usuarios activos
    public function index()
    {
        $usuarios = User::with('rol')
            ->orderBy('apellido')
            ->get();

        return response()->json($usuarios);
    }

    // Mostrar un usuario
    public function show(User $usuario)
    {
        return response()->json(
            $usuario->load('rol')
        );
    }

    // Crear un usuario
    public function store(StoreUsuarioRequest $request)
    {
        $datos = $request->validated();

        $usuario = User::create($datos);

        return response()->json([
            'message' => 'Usuario creado correctamente.',
            'user' => $usuario->load('rol')
        ], 201);
    }

    // Actualizar un usuario
    public function update(
        UpdateUsuarioRequest $request,
        User $usuario
    ) {
        $datos = $request->validated();

        $usuario->update($datos);

        return response()->json([
            'message' => 'Usuario actualizado correctamente.',
            'user' => $usuario->fresh()->load('rol')
        ]);
    }

    // Desactivar un usuario
    public function destroy(Request $request, User $usuario)
    {
        if ($request->user()->id === $usuario->id) {
            return response()->json([
                'message' => 'No podés desactivar tu propia cuenta.'
            ], 422);
        }

        return DB::transaction(function () use ($usuario) {

            $administrador = Rol::where(
                'nombre',
                'Administrador'
            )->firstOrFail();

            Rol::whereKey($administrador->id)
            ->lockForUpdate()
            ->firstOrFail();

            $administradoresActivos = User::where(
                'rol_id',
                $administrador->id
            )->count();

            if (
                $usuario->rol_id === $administrador->id &&
                $administradoresActivos <= 1
            ) {
                return response()->json([
                    'message' => 'No se puede desactivar al último administrador activo.'
                ], 422);
            }

            $usuario->delete();

            return response()->json([
                'message' => 'Usuario desactivado correctamente.'
            ]);
        });
    }

    // Restaurar un usuario desactivado
    public function restaurar(int $id)
    {
        $usuario = User::onlyTrashed()->findOrFail($id);

        $usuario->restore();

        return response()->json([
            'message' => 'Usuario restaurado correctamente.',
            'user' => $usuario->load('rol')
        ]);
    }

    public function cambiarRol(CambiarRolUsuarioRequest $request, User $usuario) 
    {
        $datos = $request->validated();

        if ($request->user()->id === $usuario->id) {
            return response()->json([
                'message' => 'No podés modificar tu propio rol.'
            ], 422);
        }

        return DB::transaction(function () use ($usuario, $datos) {

            $administrador = Rol::where(
                'nombre',
                'Administrador'
            )->firstOrFail();

            Rol::whereKey($administrador->id)
            ->lockForUpdate()
            ->firstOrFail();

            if (
                $usuario->rol_id === $administrador->id &&
                $datos['rol_id'] !== $administrador->id
            ) {
                $administradoresActivos = User::where(
                    'rol_id',
                    $administrador->id
                )->count();

                if ($administradoresActivos <= 1) {
                    return response()->json([
                        'message' => 'No se puede cambiar el rol del último administrador activo.'
                    ], 422);
                }
            }

            $usuario->update([
                'rol_id' => $datos['rol_id']
            ]);

            return response()->json([
                'message' => 'Rol actualizado correctamente.',
                'user' => $usuario->fresh()->load('rol')
            ]);
        });
    }

    public function desactivados()
    {
        $usuarios = User::onlyTrashed()
            ->with('rol')
            ->orderBy('apellido')
            ->get();

        return response()->json($usuarios);
    }
}