<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class EstadoActivoSeeder extends Seeder
{
    public function run(): void
    {
        $estados = [
            'Operativo',
            'Con anomalía',
            'En reparación',
            'Dado de baja',
        ];

        foreach ($estados as $estado) {
            DB::table('estados_activo')->insert([
                'nombre' => $estado,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }
}