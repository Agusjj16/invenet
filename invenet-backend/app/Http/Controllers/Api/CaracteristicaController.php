<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Categoria;
use App\Models\Caracteristica;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class CaracteristicaController extends Controller
{
    // =========================================
    // LISTAR CARACTERÍSTICAS
    // =========================================

    public function index()
    {
        return response()->json(
            Caracteristica::with('categorias')
                ->orderBy('nombre')
                ->get()
        );
    }

    // =========================================
    // CONSULTAR CARACTERÍSTICA
    // =========================================

    public function show(Caracteristica $caracteristica)
    {
        return response()->json(
            $caracteristica->load([
                'categorias',
                'opciones'
            ])
        );
    }

    // =========================================
    // CREAR CARACTERÍSTICA
    // =========================================

    public function store(Request $request)
    {
        $datos = $request->validate([
            'nombre' => [
                'required',
                'string',
                'max:100',
            ],
            'tipo_dato' => [
                'required',
                Rule::in([
                    'texto',
                    'numero',
                    'decimal',
                    'booleano',
                    'select',
                ]),
            ],
            'unidad' => [
                'nullable',
                'string',
                'max:50',
            ],
        ]);

        $caracteristica = Caracteristica::create($datos);

        return response()->json([
            'message' => 'Característica creada correctamente.',
            'caracteristica' => $caracteristica,
        ], 201);
    }

    // =========================================
    // ACTUALIZAR CARACTERÍSTICA
    // =========================================

    public function update(
        Request $request,
        Caracteristica $caracteristica
    ) {
        $datos = $request->validate([
            'nombre' => [
                'sometimes',
                'required',
                'string',
                'max:100',
            ],
            'unidad' => [
                'sometimes',
                'nullable',
                'string',
                'max:50',
            ],
            'tipo_dato' => [
                'prohibited',
            ],
        ]);

        $caracteristica->update($datos);

        return response()->json([
            'message' => 'Característica actualizada correctamente.',
            'caracteristica' => $caracteristica->fresh(),
        ]);
    }

    // =========================================
    // CARACTERÍSTICAS POR CATEGORÍA
    // =========================================

    public function porCategoria(Categoria $categoria)
    {
        if (!$categoria->activo) {
            return response()->json([
                'message' =>
                    'La categoría se encuentra desactivada.'
            ], 422);
        }

        return response()->json([
            'categoria' => $categoria->nombre,
            'caracteristicas' => $categoria
                ->caracteristicas()
                ->with('opciones')
                ->get(),
        ]);
    }
}
