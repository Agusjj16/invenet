<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreOrdenReparacionRequest;
use App\Models\Activo;
use App\Models\EstadoActivo;
use App\Models\EstadoOrden;
use App\Models\EstadoReporte;
use App\Models\HistorialActivo;
use App\Models\OrdenReparacion;
use App\Models\ReporteAnomalia;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Http\Request;
use App\Http\Requests\UpdateTrabajoOrdenRequest;
use App\Notifications\NotificacionInvenet;

class OrdenReparacionController extends Controller
{
    public function store(StoreOrdenReparacionRequest $request)
    {
        $datos = $request->validated();

        return DB::transaction(function () use ($request, $datos) {

            // 1. Bloquear el reporte para evitar operaciones simultáneas.
            $reporte = ReporteAnomalia::whereKey($datos['reporte_id'])
                ->lockForUpdate()
                ->firstOrFail();

            // 2. Comprobar que el reporte esté en revisión.
            $estadoRevision = EstadoReporte::where(
                'nombre',
                'En revisión'
            )->firstOrFail();

            if ($reporte->estado_reporte_id !== $estadoRevision->id) {
                return response()->json([
                    'message' => 'El reporte debe estar en revisión para generar una orden.'
                ], 422);
            }

            // 3. Evitar generar una segunda orden.
            if (OrdenReparacion::where('reporte_id', $reporte->id)->exists()) {
                return response()->json([
                    'message' => 'Este reporte ya tiene una orden de reparación.'
                ], 422);
            }

            // 4. Verificar que el usuario asignado sea un técnico activo.
            $tecnico = User::with('rol')
                ->whereKey($datos['tecnico_id'])
                ->firstOrFail();

            if ($tecnico->rol?->nombre !== 'Técnico') {
                return response()->json([
                    'message' => 'El usuario seleccionado no tiene el rol Técnico.'
                ], 422);
            }

            // 5. Bloquear y verificar el activo.
            $activo = Activo::whereKey($reporte->activo_id)
                ->lockForUpdate()
                ->first();

            if (!$activo) {
                return response()->json([
                    'message' => 'El activo no está disponible para reparación.'
                ], 422);
            }

            // 6. Verificar que el activo tenga una anomalía.
            $estadoConAnomalia = EstadoActivo::where(
                'nombre',
                'Con anomalía'
            )->firstOrFail();

            if ($activo->estado_id !== $estadoConAnomalia->id) {
                return response()->json([
                    'message' => 'El activo debe estar en estado Con anomalía para generar una orden.'
                ], 422);
            }

            // Obtener el estado al que pasará el activo.
            $estadoReparacion = EstadoActivo::where(
                'nombre',
                'En reparación'
            )->firstOrFail();

            // 7. Obtener el estado inicial de la orden.
            $estadoPendiente = EstadoOrden::where(
                'nombre',
                'Pendiente'
            )->firstOrFail();

            // 8. Crear la orden.
            $orden = OrdenReparacion::create([
                'reporte_id' => $reporte->id,
                'tecnico_id' => $tecnico->id,
                'estado_orden_id' => $estadoPendiente->id,
                'fecha_asignacion' => now(),
            ]);

            // 9. Actualizar el reporte.
            $estadoDerivado = EstadoReporte::where(
                'nombre',
                'Derivado a reparación'
            )->firstOrFail();

            $reporte->estado_reporte_id = $estadoDerivado->id;
            $reporte->save();

            // 10. Actualizar el estado del activo.
            $estadoAnteriorId = $activo->estado_id;

            $activo->estado_id = $estadoReparacion->id;
            $activo->save();

            // 11. Registrar el evento en el historial.
            HistorialActivo::create([
                'activo_id' => $activo->id,
                'usuario_id' => $request->user()->id,
                'tipo_evento' => 'CAMBIO_ESTADO',
                'descripcion' => 'Activo derivado a reparación mediante la orden #' . $orden->id . '.',
                'datos_anteriores' => [
                    'estado_id' => $estadoAnteriorId
                ],
                'datos_nuevos' => [
                    'estado_id' => $estadoReparacion->id,
                    'orden_id' => $orden->id
                ]
            ]);

            // Notificar al técnico asignado después del commit.
            $ordenId = $orden->id;
            $tecnicoId = $tecnico->id;
            $codigoActivo = $activo->codigo_inventario;

            DB::afterCommit(function () use ($ordenId, $tecnicoId, $codigoActivo) {

                $tecnico = User::find($tecnicoId);

                if ($tecnico) {
                    $tecnico->notify(
                        new NotificacionInvenet(
                            'Nueva orden de reparación',
                            "Se le asignó la orden #{$ordenId} para el activo {$codigoActivo}.",
                            'ORDEN_ASIGNADA',
                            "/ordenes-reparacion/{$ordenId}"
                        )
                    );
                }
            });

            return response()->json([
                'message' => 'Orden de reparación creada correctamente.',
                'orden' => $orden->load([
                    'reporte',
                    'tecnico',
                    'estado'
                ])
            ], 201);
        });
    }

    public function index(Request $request)
    {
        $filtros = $request->validate([
            'estado_orden_id' => [
                'nullable',
                'integer',
                'exists:estados_orden,id'
            ],

            'tecnico_id' => [
                'nullable',
                'integer',
                'exists:users,id'
            ],

            'page' => [
                'nullable',
                'integer',
                'min:1'
            ],

            'por_pagina' => [
                'nullable',
                'integer',
                'min:1',
                'max:100'
            ]
        ]);

        $query = OrdenReparacion::with([
            'reporte.activo',
            'reporte.usuario',
            'tecnico',
            'estado'
        ]);

        // Filtrar por estado de la orden.
        if (isset($filtros['estado_orden_id'])) {
            $query->where(
                'estado_orden_id',
                $filtros['estado_orden_id']
            );
        }

        // Filtrar por técnico asignado.
        if (isset($filtros['tecnico_id'])) {
            $query->where(
                'tecnico_id',
                $filtros['tecnico_id']
            );
        }

        $porPagina = $filtros['por_pagina'] ?? 15;

        $ordenes = $query
            ->orderByDesc('fecha_asignacion')
            ->orderByDesc('id')
            ->paginate($porPagina)
            ->withQueryString();

        return response()->json($ordenes);
    }

    public function asignadas(Request $request)
    {
        $filtros = $request->validate([
            'estado_orden_id' => [
                'nullable',
                'integer',
                'exists:estados_orden,id'
            ],

            'page' => [
                'nullable',
                'integer',
                'min:1'
            ],

            'por_pagina' => [
                'nullable',
                'integer',
                'min:1',
                'max:100'
            ]
        ]);

        $query = OrdenReparacion::with([
            'reporte.activo',
            'reporte.usuario',
            'estado'
        ])
        ->where('tecnico_id', $request->user()->id);

        if (isset($filtros['estado_orden_id'])) {
            $query->where(
                'estado_orden_id',
                $filtros['estado_orden_id']
            );
        }

        $porPagina = $filtros['por_pagina'] ?? 15;

        $ordenes = $query
            ->orderByDesc('fecha_asignacion')
            ->orderByDesc('id')
            ->paginate($porPagina)
            ->withQueryString();

        return response()->json($ordenes);
    }

    public function show(Request $request, OrdenReparacion $orden)
    {
        $usuario = $request->user();

        // Verificar si puede consultar todas las órdenes.
        $puedeVerTodas = $usuario->tienePermiso(
            'ordenes.ver_todas'
        );

        // Verificar si puede consultar órdenes asignadas.
        $puedeVerAsignadas = $usuario->tienePermiso(
            'ordenes.ver_asignadas'
        );

        // El usuario debe tener al menos uno de los permisos.
        if (!$puedeVerTodas && !$puedeVerAsignadas) {
            return response()->json([
                'message' => 'No tiene permiso para consultar órdenes de reparación.'
            ], 403);
        }

        // Si no puede ver todas, solamente puede ver las suyas.
        if (
            !$puedeVerTodas &&
            $orden->tecnico_id !== $usuario->id
        ) {
            return response()->json([
                'message' => 'No tiene permiso para consultar esta orden.'
            ], 403);
        }

        return response()->json(
            $orden->load([
                'reporte.activo.categoria',
                'reporte.activo.ubicacion',
                'reporte.usuario',
                'reporte.estado',
                'tecnico',
                'estado'
            ])
        );
    }

    public function recibir(Request $request, OrdenReparacion $orden)
    {
        return DB::transaction(function () use ($request, $orden) {

            $orden = OrdenReparacion::whereKey($orden->id)
                ->lockForUpdate()
                ->firstOrFail();

            if ($orden->tecnico_id !== $request->user()->id) {
                return response()->json([
                    'message' => 'Esta orden no está asignada a usted.'
                ], 403);
            }

            $pendiente = EstadoOrden::where(
                'nombre', 'Pendiente'
            )->firstOrFail();

            if ($orden->estado_orden_id !== $pendiente->id) {
                return response()->json([
                    'message' => 'Solo se pueden recibir órdenes pendientes.'
                ], 422);
            }

            if ($orden->fecha_recepcion !== null) {
                return response()->json([
                    'message' => 'La recepción ya fue registrada.'
                ], 422);
            }

            $orden->fecha_recepcion = now();
            $orden->save();

            return response()->json([
                'message' => 'Recepción registrada correctamente.',
                'orden' => $orden->load(['reporte', 'estado'])
            ]);
        });
    }

    public function iniciar(Request $request, OrdenReparacion $orden)
    {
        return DB::transaction(function () use ($request, $orden) {

            $orden = OrdenReparacion::whereKey($orden->id)
                ->lockForUpdate()
                ->firstOrFail();

            if ($orden->tecnico_id !== $request->user()->id) {
                return response()->json([
                    'message' => 'Esta orden no está asignada a usted.'
                ], 403);
            }

            $pendiente = EstadoOrden::where(
                'nombre', 'Pendiente'
            )->firstOrFail();

            $enProceso = EstadoOrden::where(
                'nombre', 'En proceso'
            )->firstOrFail();

            if ($orden->estado_orden_id !== $pendiente->id) {
                return response()->json([
                    'message' => 'La orden debe estar pendiente para iniciar.'
                ], 422);
            }

            if ($orden->fecha_recepcion === null) {
                return response()->json([
                    'message' => 'Primero debe registrar la recepción del equipo.'
                ], 422);
            }

            $orden->estado_orden_id = $enProceso->id;
            $orden->fecha_inicio = now();
            $orden->save();

            return response()->json([
                'message' => 'Reparación iniciada correctamente.',
                'orden' => $orden->load(['reporte', 'estado'])
            ]);
        });
    }

    public function actualizarTrabajo(UpdateTrabajoOrdenRequest $request, OrdenReparacion $orden) 
    {
        $datos = $request->validated();

        return DB::transaction(function () use ($request, $orden, $datos) {

            $orden = OrdenReparacion::whereKey($orden->id)
                ->lockForUpdate()
                ->firstOrFail();

            if ($orden->tecnico_id !== $request->user()->id) {
                return response()->json([
                    'message' => 'Esta orden no está asignada a usted.'
                ], 403);
            }

            $enProceso = EstadoOrden::where(
                'nombre', 'En proceso'
            )->firstOrFail();

            if ($orden->estado_orden_id !== $enProceso->id) {
                return response()->json([
                    'message' => 'Solo se puede registrar trabajo en órdenes en proceso.'
                ], 422);
            }

            $orden->update($datos);

            return response()->json([
                'message' => 'Trabajo de reparación registrado correctamente.',
                'orden' => $orden->load(['reporte', 'estado'])
            ]);
        });
    }

    public function finalizar(Request $request, OrdenReparacion $orden)
    {
        return DB::transaction(function () use ($request, $orden) {

            // Bloquear la orden.
            $orden = OrdenReparacion::whereKey($orden->id)
                ->lockForUpdate()
                ->firstOrFail();

            // Verificar asignación.
            if ($orden->tecnico_id !== $request->user()->id) {
                return response()->json([
                    'message' => 'Esta orden no está asignada a usted.'
                ], 403);
            }

            // Verificar que esté en proceso.
            $enProceso = EstadoOrden::where(
                'nombre', 'En proceso'
            )->firstOrFail();

            if ($orden->estado_orden_id !== $enProceso->id) {
                return response()->json([
                    'message' => 'La orden debe estar en proceso para finalizar.'
                ], 422);
            }

            // Verificar que el trabajo esté documentado.
            if (
                blank($orden->diagnostico) ||
                blank($orden->detalle_reparacion)
            ) {
                return response()->json([
                    'message' => 'Debe registrar el diagnóstico y el detalle de reparación antes de finalizar.'
                ], 422);
            }

            // Obtener el reporte relacionado.
            $reporte = ReporteAnomalia::whereKey($orden->reporte_id)
                ->lockForUpdate()
                ->firstOrFail();

            $estadoDerivado = EstadoReporte::where(
                'nombre', 'Derivado a reparación'
            )->firstOrFail();

            if ($reporte->estado_reporte_id !== $estadoDerivado->id) {
                return response()->json([
                    'message' => 'El reporte no se encuentra derivado a reparación.'
                ], 422);
            }

            // Obtener el activo relacionado.
            $activo = Activo::whereKey($reporte->activo_id)
                ->lockForUpdate()
                ->first();

            if (!$activo) {
                return response()->json([
                    'message' => 'El activo ya no está disponible.'
                ], 422);
            }

            $estadoEnReparacion = EstadoActivo::where(
                'nombre', 'En reparación'
            )->firstOrFail();

            if ($activo->estado_id !== $estadoEnReparacion->id) {
                return response()->json([
                    'message' => 'El activo no se encuentra en reparación.'
                ], 422);
            }

            // Obtener los estados finales.
            $finalizada = EstadoOrden::where(
                'nombre', 'Finalizada'
            )->firstOrFail();

            $cerrado = EstadoReporte::where(
                'nombre', 'Cerrado'
            )->firstOrFail();

            $operativo = EstadoActivo::where(
                'nombre', 'Operativo'
            )->firstOrFail();

            // Guardar estado anterior del activo.
            $estadoAnteriorId = $activo->estado_id;

            // Finalizar orden.
            $orden->estado_orden_id = $finalizada->id;
            $orden->fecha_finalizacion = now();
            $orden->save();

            // Cerrar reporte.
            $reporte->estado_reporte_id = $cerrado->id;
            $reporte->save();

            // Devolver activo al estado operativo.
            $activo->estado_id = $operativo->id;
            $activo->save();

            // Registrar el cambio en el historial.
            HistorialActivo::create([
                'activo_id' => $activo->id,
                'usuario_id' => $request->user()->id,
                'tipo_evento' => 'CAMBIO_ESTADO',
                'descripcion' => 'Reparación finalizada mediante la orden #' . $orden->id . '.',
                'datos_anteriores' => [
                    'estado_id' => $estadoAnteriorId
                ],
                'datos_nuevos' => [
                    'estado_id' => $operativo->id,
                    'orden_id' => $orden->id
                ]
            ]);

            // Notificar a los administradores después del commit.
            $ordenId = $orden->id;
            $codigoActivo = $activo->codigo_inventario;

            DB::afterCommit(function () use ($ordenId, $codigoActivo) {

                $administradores = User::whereHas('rol', function ($query) {
                    $query->where('nombre', 'Administrador');
                })->get();

                foreach ($administradores as $administrador) {
                    $administrador->notify(
                        new NotificacionInvenet(
                            'Reparación finalizada',
                            "La orden #{$ordenId} del activo {$codigoActivo} fue finalizada correctamente.",
                            'REPARACION_FINALIZADA',
                            "/ordenes-reparacion/{$ordenId}"
                        )
                    );
                }
            });

            return response()->json([
                'message' => 'Reparación finalizada correctamente.',
                'orden' => $orden->load([
                    'reporte.activo',
                    'reporte.estado',
                    'tecnico',
                    'estado'
                ])
            ]);
        });
    }
}