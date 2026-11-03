<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class AdminSeeder extends Seeder
{
    public function run(): void
    {
        $rolAdministrador = DB::table('roles')
            ->where('nombre', 'Administrador')
            ->value('id');

        DB::table('users')->insert([
            'rol_id' => $rolAdministrador,
            'nombre' => 'Administrador',
            'apellido' => 'Sistema',
            'email' => 'admin@invenet.local',
            'password' => Hash::make('Admin1234!'),
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }
}