<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class UbicacionSeeder extends Seeder
{
    public function run(): void
    {
        $ubicaciones = [
            'Laboratorio 1',
            'Laboratorio 2',
            'Biblioteca',
            'Sala de profesores',
            'Administración',
        ];

        foreach ($ubicaciones as $ubicacion) {
            DB::table('ubicaciones')->insert([
                'nombre' => $ubicacion,
                'activo' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }
}