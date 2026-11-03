<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class CategoriaCaracteristicaSeeder extends Seeder
{
    public function run(): void
    {
        $configuracion = [

            'CPU' => [
                'Procesador',
                'Placa madre',
                'Memoria RAM',
                'Tipo almacenamiento',
                'Capacidad almacenamiento',
                'Tarjeta gráfica',
            ],

            'Netbook' => [
                'Procesador',
                'Memoria RAM',
                'Tipo almacenamiento',
                'Capacidad almacenamiento',
                'Tamaño de pantalla',
            ],

            'Monitor' => [
                'Tamaño de pantalla',
            ],

            'Televisor' => [
                'Tamaño de pantalla',
            ],

            'Switch' => [
                'Cantidad de puertos',
            ],

            'Router' => [
                'Cantidad de puertos',
            ],

            'Proyector' => [],
        ];

        foreach ($configuracion as $categoriaNombre => $caracteristicas) {

            $categoriaId = DB::table('categorias')
                ->where('nombre', $categoriaNombre)
                ->value('id');

            foreach ($caracteristicas as $caracteristicaNombre) {

                $caracteristicaId = DB::table('caracteristicas')
                    ->where('nombre', $caracteristicaNombre)
                    ->value('id');

                DB::table('categoria_caracteristica')->insert([
                    'categoria_id' => $categoriaId,
                    'caracteristica_id' => $caracteristicaId,
                    'obligatorio' => false,
                ]);
            }
        }
    }
}