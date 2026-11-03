<?php

namespace App\Http\Requests;

use App\Models\Categoria;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;
use App\Models\OpcionCaracteristica;

class UpdateActivoRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $activo = $this->route('activo');

        return [
            'codigo_inventario' => [
                'sometimes',
                'required',
                'string',
                'max:50',
                Rule::unique('activos', 'codigo_inventario')
                    ->ignore($activo->id)
            ],

            // Por ahora no permitimos cambiar la categoría.
            'categoria_id' => ['prohibited'],

            // El estado tendrá un proceso independiente.
            'estado_id' => ['prohibited'],

            'ubicacion_id' => [
                'sometimes',
                'required',
                'integer',
                Rule::exists('ubicaciones', 'id')
                    ->where('activo', true)
            ],

            'fecha_ingreso' => [
                'sometimes',
                'required',
                'date'
            ],

            'marca' => ['sometimes', 'nullable', 'string', 'max:100'],
            'modelo' => ['sometimes', 'nullable', 'string', 'max:100'],

            'numero_serie' => [
                'sometimes',
                'nullable',
                'string',
                'max:100',
                Rule::unique('activos', 'numero_serie')
                    ->ignore($activo->id)
            ],

            'observaciones' => [
                'sometimes',
                'nullable',
                'string'
            ],

            'caracteristicas' => [
                'sometimes',
                'array'
            ],

            'caracteristicas.*.caracteristica_id' => [
                'required',
                'integer',
                'distinct',
                Rule::exists('caracteristicas', 'id')
            ],

            'caracteristicas.*.valor' => [
                'required',
                'string',
                'max:255'
            ]
        ];
    }

    public function after(): array
    {
        return [
            function (Validator $validator) {
                if ($validator->errors()->isNotEmpty()) {
                    return;
                }

                $activo = $this->route('activo');

                $categoria = Categoria::with('caracteristicas')
                    ->find($activo->categoria_id);

                if (!$categoria) {
                    return;
                }

                // Si no enviamos características, no se modifican.
                if (!$this->exists('caracteristicas')) {
                    return;
                }

                $enviadas = collect(
                    $this->input('caracteristicas', [])
                );

                $permitidas = $categoria->caracteristicas->keyBy('id');

                foreach ($enviadas as $indice => $item) {
                    $id = $item['caracteristica_id'];

                    if (!$permitidas->has($id)) {
                        $validator->errors()->add(
                            "caracteristicas.$indice.caracteristica_id",
                            'La característica no pertenece a esta categoría.'
                        );
                        continue;
                    }

                    $tipo = $permitidas->get($id)->tipo_dato;
                    $valor = $item['valor'];

                    if ($tipo === 'numero' &&
                        !ctype_digit((string) $valor)) {
                        $validator->errors()->add(
                            "caracteristicas.$indice.valor",
                            'Debe ser un entero no negativo.'
                        );
                    }

                    if ($tipo === 'decimal' && !is_numeric($valor)) {
                        $validator->errors()->add(
                            "caracteristicas.$indice.valor",
                            'Debe ser numérico.'
                        );
                    }

                    if ($tipo === 'booleano' &&
                        !in_array($valor, ['0', '1'], true)) {
                        $validator->errors()->add(
                            "caracteristicas.$indice.valor",
                            'Debe ser 0 o 1.'
                        );
                    }

                    if ($tipo === 'select') {
                        $caracteristica = $permitidas->get($id);

                        $opcionValida = OpcionCaracteristica::where(
                            'caracteristica_id',
                            $caracteristica->id
                        )
                        ->where('valor', $valor)
                        ->exists();

                        if (!$opcionValida) {
                            $validator->errors()->add(
                                "caracteristicas.$indice.valor",
                                "El valor seleccionado no es válido para la característica {$caracteristica->nombre}."
                            );
                        }
                    }

                    if (!in_array(
                        $tipo,
                        ['texto', 'numero', 'decimal', 'booleano', 'select'],
                        true
                    )) {
                        $validator->errors()->add(
                            "caracteristicas.$indice.valor",
                            'Tipo de dato no válido.'
                        );
                    }
                }

                // sync() reemplazará el conjunto completo.
                $obligatorias = $categoria->caracteristicas
                    ->filter(fn ($c) => $c->pivot->obligatorio)
                    ->pluck('id');

                $idsEnviados = $enviadas->pluck('caracteristica_id');

                foreach ($obligatorias as $id) {
                    if (!$idsEnviados->contains($id)) {
                        $validator->errors()->add(
                            'caracteristicas',
                            "Falta la característica obligatoria ID: $id."
                        );
                    }
                }
            }
        ];
    }
}