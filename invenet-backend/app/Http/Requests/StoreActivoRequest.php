<?php

namespace App\Http\Requests;

use App\Models\Categoria;
use App\Models\Caracteristica;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;
use App\Models\OpcionCaracteristica;

class StoreActivoRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'codigo_inventario' => [
                'required',
                'string',
                'max:50',
                Rule::unique('activos', 'codigo_inventario')
            ],

            'categoria_id' => [
                'required',
                'integer',
                Rule::exists('categorias', 'id')
                    ->where('activo', true)
            ],

            'ubicacion_id' => [
                'required',
                'integer',
                Rule::exists('ubicaciones', 'id')
                    ->where('activo', true)
            ],

            'fecha_ingreso' => [
                'required',
                'date'
            ],

            'marca' => [
                'nullable',
                'string',
                'max:100'
            ],

            'modelo' => [
                'nullable',
                'string',
                'max:100'
            ],

            'numero_serie' => [
                'nullable',
                'string',
                'max:100',
                Rule::unique('activos', 'numero_serie')
            ],

            'observaciones' => [
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
            ],

            // El estado inicial lo determina el servidor.
            'estado_id' => ['prohibited']
        ];
    }

    public function after(): array
    {
        return [
            function (Validator $validator) {

                if ($validator->errors()->isNotEmpty()) {
                    return;
                }

                $categoria = Categoria::with('caracteristicas')
                    ->find($this->input('categoria_id'));

                if (!$categoria) {
                    return;
                }

                $caracteristicas = collect(
                    $this->input('caracteristicas', [])
                );

                $permitidas = $categoria->caracteristicas
                    ->keyBy('id');

                foreach ($caracteristicas as $indice => $item) {

                    $id = $item['caracteristica_id'];

                    if (!$permitidas->has($id)) {
                        $validator->errors()->add(
                            "caracteristicas.$indice.caracteristica_id",
                            'La característica no pertenece a la categoría seleccionada.'
                        );

                        continue;
                    }

                    $caracteristica = $permitidas->get($id);

                    $valor = $item['valor'];

                    switch ($caracteristica->tipo_dato) {

                        case 'numero':
                            if (
                                !ctype_digit((string) $valor)
                            ) {
                                $validator->errors()->add(
                                    "caracteristicas.$indice.valor",
                                    'El valor debe ser un número entero no negativo.'
                                );
                            }
                            break;

                        case 'decimal':
                            if (!is_numeric($valor)) {
                                $validator->errors()->add(
                                    "caracteristicas.$indice.valor",
                                    'El valor debe ser numérico.'
                                );
                            }
                            break;

                        case 'booleano':
                            if (!in_array(
                                $valor,
                                ['0', '1'],
                                true
                            )) {
                                $validator->errors()->add(
                                    "caracteristicas.$indice.valor",
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
                                    "caracteristicas.$indice.valor",
                                    "El valor seleccionado no es válido para la característica {$caracteristica->nombre}."
                                );
                            }
                            break;

                        default:
                            $validator->errors()->add(
                                "caracteristicas.$indice.valor",
                                'Tipo de característica no válido.'
                            );
                    }
                }

                // Verificar características obligatorias.
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
                            'caracteristicas',
                            "Falta la característica obligatoria ID: $id."
                        );
                    }
                }
            }
        ];
    }
}