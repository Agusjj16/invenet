<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreOrdenReparacionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'reporte_id' => [
                'required',
                'integer',
                Rule::exists('reportes_anomalias', 'id'),
                Rule::unique('ordenes_reparacion', 'reporte_id'),
            ],

            'tecnico_id' => [
                'required',
                'integer',
                Rule::exists('users', 'id')
                    ->whereNull('deleted_at'),
            ],
        ];
    }
}