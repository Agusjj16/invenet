<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreReporteAnomaliaRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'activo_id' => [
                'required',
                'integer',
                Rule::exists('activos', 'id')
                    ->whereNull('deleted_at'),
            ],

            'descripcion' => [
                'required',
                'string',
                'min:10',
                'max:2000'
            ]
        ];
    }
}