<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Activo;
use App\Models\Categoria;
use App\Models\Caracteristica;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class CategoriaCaracteristicaController extends Controller
{
    // =========================================
    // ASOCIAR CARACTERÍSTICA A CATEGORÍA
    // =========================================

    public function store(Request $request, Categoria $categoria)
    {
        $datos = $request->validate([
            'caracteristica_id' => [
                'required',
                'integer',
                'exists:caracteristicas,id',
            ],
            'obligatorio' => [
                'required',
                'boolean',
            ],
        ]);

        return DB::transaction(function () use ($categoria, $datos) {

            $categoria = Categoria::whereKey($categoria->id)
                ->lockForUpdate()
                ->firstOrFail();

            if (!$categoria->activo) {
                return response()->json([
                    'message' => 'No se pueden modificar las características de una categoría desactivada.'
                ], 422);
            }

            $caracteristica = Caracteristica::findOrFail(
                $datos['caracteristica_id']
            );

            $existe = $categoria->caracteristicas()
                ->whereKey($caracteristica->id)
                ->exists();

            if ($existe) {
                return response()->json([
                    'message' => 'La característica ya está asociada a esta categoría.'
                ], 422);
            }

            if ($datos['obligatorio']) {
                $faltantes = $this->contarActivosSinCaracteristica(
                    $categoria,
                    $caracteristica
                );

                if ($faltantes > 0) {
                    return response()->json([
                        'message' =>
                            "No se puede establecer como obligatoria. Hay {$faltantes} activo(s) de esta categoría sin un valor registrado para la característica."
                    ], 422);
                }
            }

            $categoria->caracteristicas()->attach(
                $caracteristica->id,
                [
                    'obligatorio' => $datos['obligatorio'],
                ]
            );

            return response()->json([
                'message' => 'Característica asociada correctamente.',
            ], 201);
        });
    }

    // =========================================
    // CAMBIAR OBLIGATORIEDAD
    // =========================================

    public function update(
        Request $request,
        Categoria $categoria,
        Caracteristica $caracteristica
    ) {
        $datos = $request->validate([
            'obligatorio' => [
                'required',
                'boolean',
            ],
        ]);

        return DB::transaction(function () use (
            $categoria,
            $caracteristica,
            $datos
        ) {
            $categoria = Categoria::whereKey($categoria->id)
                ->lockForUpdate()
                ->firstOrFail();

            if (!$categoria->activo) {
                return response()->json([
                    'message' => 'No se pueden modificar las características de una categoría desactivada.'
                ], 422);
            }

            $existe = $categoria->caracteristicas()
                ->whereKey($caracteristica->id)
                ->exists();

            if (!$existe) {
                return response()->json([
                    'message' => 'La característica no está asociada a esta categoría.'
                ], 404);
            }

            if ($datos['obligatorio']) {
                $faltantes = $this->contarActivosSinCaracteristica(
                    $categoria,
                    $caracteristica
                );

                if ($faltantes > 0) {
                    return response()->json([
                        'message' =>
                            "No se puede establecer como obligatoria. Hay {$faltantes} activo(s) sin un valor registrado para esta característica."
                    ], 422);
                }
            }

            $categoria->caracteristicas()
                ->updateExistingPivot(
                    $caracteristica->id,
                    [
                        'obligatorio' => $datos['obligatorio'],
                    ]
                );

            return response()->json([
                'message' => 'Obligatoriedad actualizada correctamente.',
            ]);
        });
    }

    // =========================================
    // DESVINCULAR CARACTERÍSTICA
    // =========================================

    public function destroy(
        Categoria $categoria,
        Caracteristica $caracteristica
    ) {
        return DB::transaction(function () use (
            $categoria,
            $caracteristica
        ) {
            $categoria = Categoria::whereKey($categoria->id)
                ->lockForUpdate()
                ->firstOrFail();

            if (!$categoria->activo) {
                return response()->json([
                    'message' => 'No se pueden modificar las características de una categoría desactivada.'
                ], 422);
            }

            $existe = $categoria->caracteristicas()
                ->whereKey($caracteristica->id)
                ->exists();

            if (!$existe) {
                return response()->json([
                    'message' => 'La característica no está asociada a esta categoría.'
                ], 404);
            }

            $activosConValor = Activo::where(
                'categoria_id',
                $categoria->id
            )
                ->whereHas(
                    'caracteristicas',
                    function ($consulta) use ($caracteristica) {
                        $consulta->where(
                            'caracteristicas.id',
                            $caracteristica->id
                        );
                    }
                )
                ->count();

            if ($activosConValor > 0) {
                return response()->json([
                    'message' =>
                        "No se puede desvincular esta característica porque {$activosConValor} activo(s) tienen un valor registrado."
                ], 422);
            }

            $categoria->caracteristicas()
                ->detach($caracteristica->id);

            return response()->json([
                'message' => 'Característica desvinculada correctamente.',
            ]);
        });
    }

    // =========================================
    // CONTAR ACTIVOS SIN VALOR
    // =========================================

    private function contarActivosSinCaracteristica(
        Categoria $categoria,
        Caracteristica $caracteristica
    ): int {
        return Activo::where(
            'categoria_id',
            $categoria->id
        )
            ->whereDoesntHave(
                'caracteristicas',
                function ($consulta) use ($caracteristica) {
                    $consulta->where(
                        'caracteristicas.id',
                        $caracteristica->id
                    );
                }
            )
            ->count();
    }
}
