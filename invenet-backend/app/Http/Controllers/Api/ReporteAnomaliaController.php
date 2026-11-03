<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreReporteAnomaliaRequest;
use App\Models\Activo;
use App\Models\EstadoActivo;
use App\Models\HistorialActivo;
use App\Models\EstadoReporte;
use App\Models\ReporteAnomalia;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Http\Requests\CambiarEstadoReporteRequest;
use App\Models\User;
use App\Notifications\NotificacionInvenet;

class ReporteAnomaliaController extends Controller
{
    // Crear reporte de anomalía.
    public function store(StoreReporteAnomaliaRequest $request)
    {
        $datos = $request->validated();

        return DB::transaction(function () use ($request, $datos) {

            // Bloquear el activo para serializar reportes simultáneos.
            $activo = Activo::whereKey($datos['activo_id'])
                ->lockForUpdate()
                ->first();

            if (!$activo) {
                return response()->json([
                    'message' => 'El activo no está disponible.'
                ], 422);
            }

            // Obtener estados abiertos.
            $estadosAbiertos = EstadoReporte::whereIn(
                'nombre',
                ['Pendiente', 'En revisión', 'Derivado a reparación']
            )->pluck('id');

            // Comprobar si ya existe un reporte abierto.
            $reporteAbierto = ReporteAnomalia::where(
                'activo_id',
                $activo->id
            )
            ->whereIn('estado_reporte_id', $estadosAbiertos)
            ->exists();

            if ($reporteAbierto) {
                return response()->json([
                    'message' => 'El activo ya tiene un reporte de anomalía abierto.'
                ], 422);
            }

            // Evitar reportes sobre activos que siguen en reparación.
            $estadoReparacion = EstadoActivo::where(
                'nombre',
                'En reparación'
            )->firstOrFail();

            if ($activo->estado_id === $estadoReparacion->id) {
                return response()->json([
                    'message' => 'No se puede reportar una anomalía sobre un activo en reparación.'
                ], 422);
            }

            // Estado inicial del reporte.
            $estadoPendiente = EstadoReporte::where(
                'nombre',
                'Pendiente'
            )->firstOrFail();

            // Crear reporte.
            $reporte = ReporteAnomalia::create([
                'activo_id' => $activo->id,
                'usuario_id' => $request->user()->id,
                'estado_reporte_id' => $estadoPendiente->id,
                'descripcion' => $datos['descripcion'],
                'fecha_reporte' => now(),
            ]);

            // Obtener estado "Con anomalía".
            $estadoConAnomalia = EstadoActivo::where(
                'nombre',
                'Con anomalía'
            )->firstOrFail();

            $estadoAnteriorId = $activo->estado_id;

            // Actualizar estado del activo si corresponde.
            if ($activo->estado_id !== $estadoConAnomalia->id) {
                $activo->estado_id = $estadoConAnomalia->id;
                $activo->save();

                HistorialActivo::create([
                    'activo_id' => $activo->id,
                    'usuario_id' => $request->user()->id,
                    'tipo_evento' => 'CAMBIO_ESTADO',
                    'descripcion' => 'Activo marcado con anomalía por el reporte #' . $reporte->id . '.',
                    'datos_anteriores' => [
                        'estado_id' => $estadoAnteriorId
                    ],
                    'datos_nuevos' => [
                        'estado_id' => $estadoConAnomalia->id,
                        'reporte_id' => $reporte->id
                    ]
                ]);
            }

            // Registrar el reporte en el historial.
            HistorialActivo::create([
                'activo_id' => $activo->id,
                'usuario_id' => $request->user()->id,
                'tipo_evento' => 'REPORTE_ANOMALIA',
                'descripcion' => 'Se registró el reporte de anomalía #' . $reporte->id . '.',
                'datos_anteriores' => null,
                'datos_nuevos' => [
                    'reporte_id' => $reporte->id,
                    'descripcion' => $reporte->descripcion
                ]
            ]);

            // Notificar a los administradores después del commit.
            $reporteId = $reporte->id;
            $codigoActivo = $activo->codigo_inventario;

            DB::afterCommit(function () use ($reporteId, $codigoActivo) {

                $administradores = User::whereHas('rol', function ($query) {
                    $query->where('nombre', 'Administrador');
                })->get();

                foreach ($administradores as $administrador) {
                    $administrador->notify(
                        new NotificacionInvenet(
                            'Nuevo reporte de anomalía',
                            "Se registró el reporte #{$reporteId} para el activo {$codigoActivo}.",
                            'REPORTE_CREADO',
                            "/reportes-anomalias/{$reporteId}"
                        )
                    );
                }
            });

            return response()->json([
                'message' => 'Reporte de anomalía registrado correctamente.',
                'reporte' => $reporte->load([
                    'activo',
                    'usuario',
                    'estado'
                ])
            ], 201);
        });
    }

    // Consultar los reportes del usuario autenticado.
    public function propios(Request $request)
    {
        $reportes = ReporteAnomalia::with([
                'activo',
                'estado'
            ])
            ->where('usuario_id', $request->user()->id)
            ->orderByDesc('fecha_reporte')
            ->orderByDesc('id')
            ->paginate(15);

        return response()->json($reportes);
    }

    public function index(Request $request)
    {
        $filtros = $request->validate([
            'estado_reporte_id' => [
                'nullable',
                'integer',
                'exists:estados_reporte,id'
            ],
            'activo_id' => [
                'nullable',
                'integer',
                'exists:activos,id'
            ],
            'page' => [
                'nullable',
                'integer',
                'min:1'
            ]
        ]);

        $query = ReporteAnomalia::with([
            'activo',
            'usuario',
            'estado'
        ]);

        if (isset($filtros['estado_reporte_id'])) {
            $query->where(
                'estado_reporte_id',
                $filtros['estado_reporte_id']
            );
        }

        if (isset($filtros['activo_id'])) {
            $query->where(
                'activo_id',
                $filtros['activo_id']
            );
        }

        $reportes = $query
            ->orderByDesc('fecha_reporte')
            ->orderByDesc('id')
            ->paginate(15)
            ->withQueryString();

        return response()->json($reportes);
    }

    public function show(Request $request, ReporteAnomalia $reporte)
    {
        $usuario = $request->user();

        // Verificar permisos del usuario.
        $puedeVerTodos = $usuario->tienePermiso('reportes.todos');
        $puedeVerPropios = $usuario->tienePermiso('reportes.propios');

        // Debe tener al menos uno de los permisos.
        if (!$puedeVerTodos && !$puedeVerPropios) {
            return response()->json([
                'message' => 'No tiene permiso para consultar reportes.'
            ], 403);
        }

        // Si no puede ver todos, solo puede consultar los propios.
        if (
            !$puedeVerTodos &&
            $reporte->usuario_id !== $usuario->id
        ) {
            return response()->json([
                'message' => 'No tiene permiso para consultar este reporte.'
            ], 403);
        }

        return response()->json(
            $reporte->load([
                'activo.categoria',
                'activo.ubicacion',
                'activo.estado',
                'usuario',
                'estado'
            ])
        );
    }

    public function cambiarEstado(CambiarEstadoReporteRequest $request, ReporteAnomalia $reporte) 
    {
        $datos = $request->validated();

        return DB::transaction(function () use ($request, $reporte, $datos) {

            // Bloquear primero el activo para mantener un orden
            // consistente de bloqueos con la creación de reportes.
            $activoId = $reporte->activo_id;

            $activo = Activo::whereKey($activoId)
                ->lockForUpdate()
                ->first();

            if (!$activo) {
                return response()->json([
                    'message' => 'El activo no está disponible.'
                ], 422);
            }

            // Bloquear el reporte.
            $reporte = ReporteAnomalia::whereKey($reporte->id)
                ->lockForUpdate()
                ->firstOrFail();

            $estadoActual = EstadoReporte::findOrFail(
                $reporte->estado_reporte_id
            );

            $estadoNuevo = EstadoReporte::findOrFail(
                $datos['estado_reporte_id']
            );

            $transiciones = [
                'Pendiente' => ['En revisión', 'Cerrado'],
                'En revisión' => ['Cerrado'],
                'Derivado a reparación' => [],
                'Cerrado' => []
            ];

            $permitidos = $transiciones[$estadoActual->nombre] ?? [];

            if (!in_array($estadoNuevo->nombre, $permitidos, true)) {
                return response()->json([
                    'message' => 'La transición de estado solicitada no está permitida.'
                ], 422);
            }

            // Cambiar estado del reporte.
            $reporte->estado_reporte_id = $estadoNuevo->id;
            $reporte->save();

            // Si se cierra sin reparación, devolver el activo a Operativo.
            if ($estadoNuevo->nombre === 'Cerrado') {

                $operativo = EstadoActivo::where(
                    'nombre',
                    'Operativo'
                )->firstOrFail();

                $estadoAnteriorId = $activo->estado_id;

                if ($estadoAnteriorId !== $operativo->id) {

                    $activo->estado_id = $operativo->id;
                    $activo->save();

                    HistorialActivo::create([
                        'activo_id' => $activo->id,
                        'usuario_id' => $request->user()->id,
                        'tipo_evento' => 'CAMBIO_ESTADO',
                        'descripcion' => 'Activo marcado como operativo tras el cierre del reporte #' . $reporte->id . '.',
                        'datos_anteriores' => [
                            'estado_id' => $estadoAnteriorId
                        ],
                        'datos_nuevos' => [
                            'estado_id' => $operativo->id,
                            'reporte_id' => $reporte->id
                        ]
                    ]);
                }
            }

            // Notificar al usuario que creó el reporte.
            if ($estadoNuevo->nombre === 'Cerrado') {

                $reporteId = $reporte->id;
                $usuarioId = $reporte->usuario_id;

                DB::afterCommit(function () use ($reporteId, $usuarioId) {

                    $usuario = User::find($usuarioId);

                    if ($usuario) {
                        $usuario->notify(
                            new NotificacionInvenet(
                                'Reporte de anomalía cerrado',
                                "El reporte #{$reporteId} fue cerrado por el administrador.",
                                'REPORTE_CERRADO',
                                "/reportes-anomalias/{$reporteId}"
                            )
                        );
                    }
                });
            }

            return response()->json([
                'message' => 'Estado del reporte actualizado correctamente.',
                'reporte' => $reporte->load([
                    'activo',
                    'usuario',
                    'estado'
                ])
            ]);
        });
    }
}