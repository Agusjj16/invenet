<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class PermisoSeeder extends Seeder
{
    public function run(): void
    {
        $permisos = [

            // Usuarios
            ['usuarios.ver', 'Consultar usuarios'],
            ['usuarios.crear', 'Crear usuarios'],
            ['usuarios.editar', 'Modificar usuarios'],
            ['usuarios.desactivar', 'Desactivar usuarios'],
            ['usuarios.roles', 'Asignar roles a usuarios'],

            // Activos
            ['activos.ver', 'Consultar activos'],
            ['activos.crear', 'Registrar activos'],
            ['activos.editar', 'Modificar activos'],
            ['activos.desactivar', 'Dar de baja activos'],

            // Catálogos
            ['catalogos.gestionar', 'Gestionar categorías, ubicaciones y otros catálogos'],

            // Reportes
            ['reportes.crear', 'Crear reportes de anomalías'],
            ['reportes.propios', 'Consultar reportes propios'],
            ['reportes.todos', 'Consultar todos los reportes'],
            ['reportes.estado', 'Modificar el estado de los reportes'],

            // Órdenes
            ['ordenes.crear', 'Crear órdenes de reparación'],
            ['ordenes.asignar', 'Asignar técnicos a órdenes'],
            ['ordenes.ver_todas', 'Consultar todas las órdenes'],
            ['ordenes.ver_asignadas', 'Consultar órdenes asignadas'],
            ['ordenes.reparar', 'Gestionar una reparación'],
            ['ordenes.finalizar', 'Finalizar una reparación'],

            // Historial
            ['historial.ver', 'Consultar historial de activos'],
            ['historial.ver_completo', 'Consultar historial administrativo completo'],

            // Notificaciones
            ['notificaciones.ver', 'Consultar notificaciones propias'],
        ];

        foreach ($permisos as [$nombre, $descripcion]) {
            DB::table('permisos')->insert([
                'nombre' => $nombre,
                'descripcion' => $descripcion,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }
}