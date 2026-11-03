<?php

namespace App\Http\Requests;

use App\Models\Categoria;
use App\Models\OpcionCaracteristica;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class StoreActivosLoteRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'activos' => ['required', 'array', 'min:1', 'max:100'],

            'activos.*.codigo_inventario' => [
                'required',
                'string',
                'max:50',
                'distinct',
                Rule::unique('activos', 'codigo_inventario'),
            ],

            'activos.*.categoria_id' => [
                'required',
                'integer',
                Rule::exists('categorias', 'id')->where('activo', true),
            ],

            'activos.*.ubicacion_id' => [
                'required',
                'integer',
                Rule::exists('ubicaciones', 'id')->where('activo', true),
            ],

            'activos.*.fecha_ingreso' => [
                'required',
                'date',
            ],

            'activos.*.marca' => [
                'nullable',
                'string',
                'max:100',
            ],

            'activos.*.modelo' => [
                'nullable',
                'string',
                'max:100',
            ],

            'activos.*.numero_serie' => [
                'nullable',
                'string',
                'max:100',
                'distinct',
                Rule::unique('activos', 'numero_serie'),
            ],

            'activos.*.observaciones' => [
                'nullable',
                'string',
            ],

            'activos.*.caracteristicas' => [
                'sometimes',
                'array',
            ],

            'activos.*.caracteristicas.*.caracteristica_id' => [
                'required',
                'integer',
                Rule::exists('caracteristicas', 'id'),
            ],

            'activos.*.caracteristicas.*.valor' => [
                'required',
                'string',
                'max:255',
            ],

            // El estado inicial lo determina Laravel.
            'activos.*.estado_id' => ['prohibited'],
        ];
    }

    public function after(): array
    {
        return [
            function (Validator $validator) {
                if ($validator->errors()->isNotEmpty()) {
                    return;
                }

                $activos = $this->input('activos', []);

                // Evitamos repetir consultas para una misma categoría.
                $categorias = [];

                foreach ($activos as $indiceActivo => $activo) {
                    $categoriaId = $activo['categoria_id'];

                    if (!isset($categorias[$categoriaId])) {
                        $categorias[$categoriaId] = Categoria::with(
                            'caracteristicas'
                        )->find($categoriaId);
                    }

                    $categoria = $categorias[$categoriaId];

                    if (!$categoria) {
                        continue;
                    }

                    $caracteristicas = collect(
                        $activo['caracteristicas'] ?? []
                    );

                    $permitidas = $categoria->caracteristicas
                        ->keyBy('id');

                    foreach ($caracteristicas as $indiceCaracteristica => $item) {
                        $id = $item['caracteristica_id'];
                        $valor = $item['valor'];

                        $rutaError = "activos.$indiceActivo.caracteristicas.$indiceCaracteristica";

                        if (!$permitidas->has($id)) {
                            $validator->errors()->add(
                                "$rutaError.caracteristica_id",
                                'La característica no pertenece a la categoría seleccionada.'
                            );

                            continue;
                        }

                        $caracteristica = $permitidas->get($id);

                        switch ($caracteristica->tipo_dato) {
                            case 'numero':
                                if (!ctype_digit((string) $valor)) {
                                    $validator->errors()->add(
                                        "$rutaError.valor",
                                        'El valor debe ser un número entero no negativo.'
                                    );
                                }
                                break;

                            case 'decimal':
                                if (!is_numeric($valor)) {
                                    $validator->errors()->add(
                                        "$rutaError.valor",
                                        'El valor debe ser numérico.'
                                    );
                                }
                                break;

                            case 'booleano':
                                if (!in_array($valor, ['0', '1'], true)) {
                                    $validator->errors()->add(
                                        "$rutaError.valor",
                                        'El valor debe ser 0 o 1.'
                                    );
                                }
                                break;

                            case 'texto':
                                break;

                            case 'select':
                                $opcionValida = OpcionCaracteristica::where(
                                    'caracteristica_id',
                                    $caracteristica->id
                                )
                                    ->where('valor', $valor)
                                    ->exists();

                                if (!$opcionValida) {
                                    $validator->errors()->add(
                                        "$rutaError.valor",
                                        "El valor seleccionado no es válido para la característica {$caracteristica->nombre}."
                                    );
                                }
                                break;

                            default:
                                $validator->errors()->add(
                                    "$rutaError.valor",
                                    'Tipo de característica no válido.'
                                );
                        }
                    }

                    // Características obligatorias de la categoría.
                    $obligatorias = $categoria->caracteristicas
                        ->filter(
                            fn ($caracteristica) =>
                                $caracteristica->pivot->obligatorio
                        )
                        ->pluck('id');

                    $enviadas = $caracteristicas
                        ->pluck('caracteristica_id');

                    foreach ($obligatorias as $id) {
                        if (!$enviadas->contains($id)) {
                            $validator->errors()->add(
                                "activos.$indiceActivo.caracteristicas",
                                "Falta la característica obligatoria ID: $id."
                            );
                        }
                    }
                }
            },
        ];
    }
}
