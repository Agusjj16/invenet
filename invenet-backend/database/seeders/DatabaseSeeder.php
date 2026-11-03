<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            RolSeeder::class,
            PermisoSeeder::class,
            RolPermisoSeeder::class,

            CategoriaSeeder::class,
            EstadoActivoSeeder::class,
            UbicacionSeeder::class,

            CaracteristicaSeeder::class,
            OpcionCaracteristicaSeeder::class,
            CategoriaCaracteristicaSeeder::class,

            EstadoReporteSeeder::class,
            EstadoOrdenSeeder::class,

            AdminSeeder::class,
        ]);
    }
}