<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Activo;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $usuario = $request->user();
        $rol = $usuario->rol->nombre;

        // =====================================
        // 1. ESTADÍSTICAS GENERALES DE ACTIVOS
        // =====================================

        $totalActivos = Activo::count();

        $activosPorEstado = Activo::query()
            ->join(
                'estados_activo',
                'activos.estado_id',
                '=',
                'estados_activo.id'
            )
            ->selectRaw(
                'estados_activo.nombre as estado, COUNT(*) as total'
            )
            ->groupBy(
                'estados_activo.id',
                'estados_activo.nombre'
            )
            ->get();

        $respuesta = [
            'usuario' => [
                'nombre' => $usuario->nombre,
                'apellido' => $usuario->apellido,
                'rol' => $rol,
            ],

            'activos' => [
                'total' => $totalActivos,
                'por_estado' => $activosPorEstado,
            ],

            'reportes' => null,
            'ordenes' => null,
        ];

        // =====================================
        // 2. ESTADÍSTICAS DE REPORTES
        // =====================================

        if ($rol === 'Administrador' || $rol === 'Docente') {

            $consultaReportes = DB::table('reportes_anomalias')
                ->join(
                    'estados_reporte',
                    'reportes_anomalias.estado_reporte_id',
                    '=',
                    'estados_reporte.id'
                );

            // Docente: solamente sus propios reportes
            if ($rol === 'Docente') {
                $consultaReportes->where(
                    'reportes_anomalias.usuario_id',
                    $usuario->id
                );
            }

            $reportesPorEstado = (clone $consultaReportes)
                ->selectRaw(
                    'estados_reporte.nombre as estado, COUNT(*) as total'
                )
                ->groupBy(
                    'estados_reporte.id',
                    'estados_reporte.nombre'
                )
                ->get();

            $totalReportes = $reportesPorEstado->sum('total');

            $cantidadReporte = function ($estado) use ($reportesPorEstado) {
                return (int) (
                    $reportesPorEstado
                        ->firstWhere('estado', $estado)
                        ?->total ?? 0
                );
            };

            $respuesta['reportes'] = [
                'total' => $totalReportes,
                'pendientes' => $cantidadReporte('Pendiente'),
                'en_revision' => $cantidadReporte('En revisión'),
                'derivados' => $cantidadReporte('Derivado a reparación'),
                'cerrados' => $cantidadReporte('Cerrado'),
            ];
        }

        // =====================================
        // 3. ESTADÍSTICAS DE ÓRDENES
        // =====================================

        if ($rol === 'Administrador' || $rol === 'Técnico') {

            $consultaOrdenes = DB::table('ordenes_reparacion')
                ->join(
                    'estados_orden',
                    'ordenes_reparacion.estado_orden_id',
                    '=',
                    'estados_orden.id'
                );

            // Técnico: solamente sus órdenes asignadas
            if ($rol === 'Técnico') {
                $consultaOrdenes->where(
                    'ordenes_reparacion.tecnico_id',
                    $usuario->id
                );
            }

            $ordenesPorEstado = (clone $consultaOrdenes)
                ->selectRaw(
                    'estados_orden.nombre as estado, COUNT(*) as total'
                )
                ->groupBy(
                    'estados_orden.id',
                    'estados_orden.nombre'
                )
                ->get();

            $totalOrdenes = $ordenesPorEstado->sum('total');

            $cantidadOrden = function ($estado) use ($ordenesPorEstado) {
                return (int) (
                    $ordenesPorEstado
                        ->firstWhere('estado', $estado)
                        ?->total ?? 0
                );
            };

            $respuesta['ordenes'] = [
                'total' => $totalOrdenes,
                'pendientes' => $cantidadOrden('Pendiente'),
                'en_proceso' => $cantidadOrden('En proceso'),
                'finalizadas' => $cantidadOrden('Finalizada'),
            ];
        }

        return response()->json($respuesta);
    }
}