<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateTrabajoOrdenRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'diagnostico' => [
                'required',
                'string',
                'min:10',
                'max:2000',
            ],

            'detalle_reparacion' => [
                'required',
                'string',
                'min:10',
                'max:3000',
            ],

            'observaciones' => [
                'nullable',
                'string',
                'max:2000',
            ],
        ];
    }
}