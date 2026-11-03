<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class EstadoReporteSeeder extends Seeder
{
    public function run(): void
    {
        $estados = [
            'Pendiente',
            'En revisión',
            'Derivado a reparación',
            'Cerrado',
        ];

        foreach ($estados as $estado) {
            DB::table('estados_reporte')->insert([
                'nombre' => $estado,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }
}