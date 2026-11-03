<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateUsuarioRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'nombre' => [
                'sometimes',
                'required',
                'string',
                'max:100'
            ],

            'apellido' => [
                'sometimes',
                'required',
                'string',
                'max:100'
            ],

            'email' => [
                'sometimes',
                'required',
                'email',
                'max:150',
                Rule::unique('users', 'email')
                    ->ignore($this->route('usuario')->id)
            ],

            'password' => [
                'sometimes',
                'required',
                'string',
                'min:8',
                'confirmed'
            ],

            'rol_id' => ['prohibited']
        ];
    }
}