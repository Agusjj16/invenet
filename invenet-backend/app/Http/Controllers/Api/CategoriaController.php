<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Activo;
use App\Models\Categoria;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class CategoriaController extends Controller
{
    // Catálogo activo para formularios de activos
    public function index()
    {
        return response()->json(
            Categoria::where('activo', true)
                ->orderBy('nombre')
                ->get()
        );
    }

    // Catálogo completo para administración
    public function todas()
    {
        return response()->json(
            Categoria::orderBy('nombre')->get()
        );
    }

    public function show(Categoria $categoria)
    {
        return response()->json(
            $categoria->load('caracteristicas')
        );
    }

    public function store(Request $request)
    {
        $datos = $request->validate([
            'nombre' => [
                'required',
                'string',
                'max:100',
                Rule::unique('categorias', 'nombre'),
            ],
            'descripcion' => [
                'nullable',
                'string',
                'max:255',
            ],
        ]);

        $categoria = Categoria::create($datos);

        return response()->json([
            'message' => 'Categoría creada correctamente.',
            'categoria' => $categoria,
        ], 201);
    }

    public function update(Request $request, Categoria $categoria)
    {
        $datos = $request->validate([
            'nombre' => [
                'sometimes',
                'required',
                'string',
                'max:100',
                Rule::unique('categorias', 'nombre')
                    ->ignore($categoria->id),
            ],
            'descripcion' => [
                'sometimes',
                'nullable',
                'string',
                'max:255',
            ],
        ]);

        $categoria->update($datos);

        return response()->json([
            'message' => 'Categoría actualizada correctamente.',
            'categoria' => $categoria->fresh(),
        ]);
    }

    // Desactivar solo si no tiene activos asociados
    public function destroy(Categoria $categoria)
    {
        return DB::transaction(function () use ($categoria) {
            $categoria = Categoria::whereKey($categoria->id)
                ->lockForUpdate()
                ->firstOrFail();

            if (!$categoria->activo) {
                return response()->json([
                    'message' => 'La categoría ya está desactivada.',
                ], 422);
            }

            $cantidadActivos = Activo::withTrashed()
                ->where('categoria_id', $categoria->id)
                ->count();

            if ($cantidadActivos > 0) {
                return response()->json([
                    'message' =>
                        "No se puede desactivar esta categoría porque tiene {$cantidadActivos} activo(s) asociado(s), incluidos los dados de baja.",
                ], 422);
            }

            $categoria->update([
                'activo' => false,
            ]);

            return response()->json([
                'message' => 'Categoría desactivada correctamente.',
                'categoria' => $categoria->fresh(),
            ]);
        });
    }

    // Reactivar una categoría desactivada
    public function reactivar(Categoria $categoria)
    {
        if ($categoria->activo) {
            return response()->json([
                'message' => 'La categoría ya está activa.',
            ], 422);
        }

        $categoria->update([
            'activo' => true,
        ]);

        return response()->json([
            'message' => 'Categoría reactivada correctamente.',
            'categoria' => $categoria->fresh(),
        ]);
    }
}
