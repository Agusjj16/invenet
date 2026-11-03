<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Activo;
use App\Models\Ubicacion;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class UbicacionController extends Controller
{
    // Ubicaciones activas para formularios
    public function index()
    {
        return response()->json(
            Ubicacion::where('activo', true)
                ->orderBy('nombre')
                ->get()
        );
    }

    // Ubicaciones activas e inactivas para administración
    public function todas()
    {
        return response()->json(
            Ubicacion::orderBy('nombre')->get()
        );
    }

    public function show(Ubicacion $ubicacion)
    {
        return response()->json($ubicacion);
    }

    public function store(Request $request)
    {
        $datos = $request->validate([
            'nombre' => ['required', 'string', 'max:100'],
            'descripcion' => ['nullable', 'string', 'max:255'],
        ]);

        $ubicacion = Ubicacion::create($datos);

        return response()->json([
            'message' => 'Ubicación creada correctamente.',
            'ubicacion' => $ubicacion,
        ], 201);
    }

    public function update(Request $request, Ubicacion $ubicacion)
    {
        $datos = $request->validate([
            'nombre' => ['sometimes', 'required', 'string', 'max:100'],
            'descripcion' => ['sometimes', 'nullable', 'string', 'max:255'],
        ]);

        $ubicacion->update($datos);

        return response()->json([
            'message' => 'Ubicación actualizada correctamente.',
            'ubicacion' => $ubicacion->fresh(),
        ]);
    }

    // Desactivar solo si no tiene activos asociados
    public function destroy(Ubicacion $ubicacion)
    {
        return DB::transaction(function () use ($ubicacion) {
            $ubicacion = Ubicacion::whereKey($ubicacion->id)
                ->lockForUpdate()
                ->firstOrFail();

            if (!$ubicacion->activo) {
                return response()->json([
                    'message' => 'La ubicación ya está desactivada.',
                ], 422);
            }

            $cantidadActivos = Activo::withTrashed()
                ->where('ubicacion_id', $ubicacion->id)
                ->count();

            if ($cantidadActivos > 0) {
                return response()->json([
                    'message' =>
                        "No se puede desactivar esta ubicación porque tiene {$cantidadActivos} activo(s) asociado(s), incluidos los dados de baja.",
                ], 422);
            }

            $ubicacion->update([
                'activo' => false,
            ]);

            return response()->json([
                'message' => 'Ubicación desactivada correctamente.',
                'ubicacion' => $ubicacion->fresh(),
            ]);
        });
    }

    // Reactivar ubicación
    public function reactivar(Ubicacion $ubicacion)
    {
        if ($ubicacion->activo) {
            return response()->json([
                'message' => 'La ubicación ya está activa.',
            ], 422);
        }

        $ubicacion->update([
            'activo' => true,
        ]);

        return response()->json([
            'message' => 'Ubicación reactivada correctamente.',
            'ubicacion' => $ubicacion->fresh(),
        ]);
    }
}
