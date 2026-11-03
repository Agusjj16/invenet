<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class CaracteristicaSeeder extends Seeder
{
    public function run(): void
    {
        $caracteristicas = [
            [
                'nombre' => 'Procesador',
                'tipo_dato' => 'texto',
                'unidad' => null,
            ],
            [
                'nombre' => 'Placa madre',
                'tipo_dato' => 'texto',
                'unidad' => null,
            ],
            [
                'nombre' => 'Memoria RAM',
                'tipo_dato' => 'numero',
                'unidad' => 'GB',
            ],
            [
                'nombre' => 'Tipo almacenamiento',
                'tipo_dato' => 'select',
                'unidad' => null,
            ],
            [
                'nombre' => 'Capacidad almacenamiento',
                'tipo_dato' => 'numero',
                'unidad' => 'GB',
            ],
            [
                'nombre' => 'Tarjeta gráfica',
                'tipo_dato' => 'texto',
                'unidad' => null,
            ],
            [
                'nombre' => 'Cantidad de puertos',
                'tipo_dato' => 'numero',
                'unidad' => null,
            ],
            [
                'nombre' => 'Tamaño de pantalla',
                'tipo_dato' => 'decimal',
                'unidad' => 'pulgadas',
            ],
        ];

        foreach ($caracteristicas as $caracteristica) {
            DB::table('caracteristicas')->insert([
                ...$caracteristica,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }
}