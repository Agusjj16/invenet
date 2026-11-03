<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Activo;
use App\Models\Caracteristica;
use App\Models\OpcionCaracteristica;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class OpcionCaracteristicaController extends Controller
{
    // =========================================
    // LISTAR OPCIONES DE UNA CARACTERÍSTICA
    // =========================================

    public function index(Caracteristica $caracteristica)
    {
        if ($caracteristica->tipo_dato !== 'select') {
            return response()->json([
                'message' => 'La característica no es de tipo selección.'
            ], 422);
        }

        $opciones = $caracteristica->opciones()
            ->orderBy('valor')
            ->get();

        return response()->json([
            'caracteristica' => [
                'id' => $caracteristica->id,
                'nombre' => $caracteristica->nombre,
                'tipo_dato' => $caracteristica->tipo_dato,
            ],
            'opciones' => $opciones,
        ]);
    }

    private function normalizarValor(Request $request): void
    {
        if ($request->has('valor') && is_string($request->input('valor'))) {
            $request->merge([
                'valor' => trim($request->input('valor')),
            ]);
        }
    }

    // =========================================
    // CREAR OPCIÓN
    // =========================================

    public function store(
        Request $request,
        Caracteristica $caracteristica
    ) {
        $this->normalizarValor($request);
        $datos = $request->validate([
            'valor' => [
                'required',
                'string',
                'max:100',
                Rule::unique('opciones_caracteristica', 'valor')
                    ->where(
                        'caracteristica_id',
                        $caracteristica->id
                    ),
            ],
        ]);

        if ($caracteristica->tipo_dato !== 'select') {
            return response()->json([
                'message' => 'Solo se pueden crear opciones para características de tipo selección.'
            ], 422);
        }

        $opcion = $caracteristica->opciones()->create([
            'valor' => trim($datos['valor']),
        ]);

        return response()->json([
            'message' => 'Opción creada correctamente.',
            'opcion' => $opcion,
        ], 201);
    }

    // =========================================
    // EDITAR OPCIÓN
    // =========================================

    public function update(
        Request $request,
        Caracteristica $caracteristica,
        OpcionCaracteristica $opcion
    ) {
        if ($opcion->caracteristica_id !== $caracteristica->id) {
            return response()->json([
                'message' => 'La opción no pertenece a esta característica.'
            ], 404);
        }

        if ($caracteristica->tipo_dato !== 'select') {
            return response()->json([
                'message' => 'La característica no es de tipo selección.'
            ], 422);
        }
        $this->normalizarValor($request);
        $datos = $request->validate([
            'valor' => [
                'required',
                'string',
                'max:100',
                Rule::unique('opciones_caracteristica', 'valor')
                    ->where(
                        'caracteristica_id',
                        $caracteristica->id
                    )
                    ->ignore($opcion->id),
            ],
        ]);

        $nuevoValor = trim($datos['valor']);

        if ($nuevoValor === $opcion->valor) {
            return response()->json([
                'message' => 'La opción no presenta cambios.',
                'opcion' => $opcion,
            ]);
        }

        return DB::transaction(function () use (
            $caracteristica,
            $opcion,
            $nuevoValor
        ) {
            $opcion = OpcionCaracteristica::whereKey($opcion->id)
                ->lockForUpdate()
                ->firstOrFail();

            if ($this->estaEnUso(
                $caracteristica->id,
                $opcion->valor
            )) {
                return response()->json([
                    'message' => 'No se puede modificar esta opción porque está utilizada por uno o más activos.'
                ], 422);
            }

            $opcion->update([
                'valor' => $nuevoValor,
            ]);

            return response()->json([
                'message' => 'Opción actualizada correctamente.',
                'opcion' => $opcion->fresh(),
            ]);
        });
    }

    // =========================================
    // ELIMINAR OPCIÓN
    // =========================================

    public function destroy(
        Caracteristica $caracteristica,
        OpcionCaracteristica $opcion
    ) {
        if ($opcion->caracteristica_id !== $caracteristica->id) {
            return response()->json([
                'message' => 'La opción no pertenece a esta característica.'
            ], 404);
        }

        return DB::transaction(function () use (
            $caracteristica,
            $opcion
        ) {
            $opcion = OpcionCaracteristica::whereKey($opcion->id)
                ->lockForUpdate()
                ->firstOrFail();

            if ($this->estaEnUso(
                $caracteristica->id,
                $opcion->valor
            )) {
                return response()->json([
                    'message' => 'No se puede eliminar esta opción porque está utilizada por uno o más activos.'
                ], 422);
            }

            $opcion->delete();

            return response()->json([
                'message' => 'Opción eliminada correctamente.',
            ]);
        });
    }

    // =========================================
    // COMPROBAR SI UNA OPCIÓN ESTÁ EN USO
    // =========================================

    private function estaEnUso(
        int $caracteristicaId,
        string $valor
    ): bool {
        return DB::table('activo_caracteristica')
            ->join(
                'activos',
                'activos.id',
                '=',
                'activo_caracteristica.activo_id'
            )
            ->where(
                'activo_caracteristica.caracteristica_id',
                $caracteristicaId
            )
            ->where(
                'activo_caracteristica.valor',
                $valor
            )
            ->exists();
    }
}
