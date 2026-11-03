<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class EstadoOrdenSeeder extends Seeder
{
    public function run(): void
    {
        $estados = [
            'Pendiente',
            'En proceso',
            'Finalizada',
        ];

        foreach ($estados as $estado) {
            DB::table('estados_orden')->insert([
                'nombre' => $estado,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }
}