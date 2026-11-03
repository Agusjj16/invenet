<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Caracteristica;
use App\Models\OpcionCaracteristica;

class OpcionCaracteristicaSeeder extends Seeder
{
    public function run(): void
    {
        $caracteristica = Caracteristica::where(
            'nombre',
            'Tipo almacenamiento'
        )->firstOrFail();

        foreach (['HDD', 'SSD', 'NVMe'] as $valor) {
            OpcionCaracteristica::firstOrCreate([
                'caracteristica_id' => $caracteristica->id,
                'valor' => $valor
            ]);
        }
    }
}