<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreActivoRequest;
use App\Models\Activo;
use App\Models\EstadoActivo;
use Illuminate\Support\Facades\DB;
use App\Http\Requests\UpdateActivoRequest;
use App\Models\HistorialActivo;
use Illuminate\Http\Request;
use App\Models\ReporteAnomalia;
use App\Models\OrdenReparacion;
use App\Models\EstadoReporte;
use App\Models\EstadoOrden;
use App\Http\Requests\StoreActivosLoteRequest;

class ActivoController extends Controller
{
    public function index(Request $request)
    {
        // 1. Validar los parámetros de búsqueda y filtros.
        $filtros = $request->validate([
            'buscar' => ['nullable', 'string', 'max:100'],

            'categoria_id' => [
                'nullable',
                'integer',
                'exists:categorias,id'
            ],

            'estado_id' => [
                'nullable',
                'integer',
                'exists:estados_activo,id'
            ],

            'ubicacion_id' => [
                'nullable',
                'integer',
                'exists:ubicaciones,id'
            ],

            'por_pagina' => [
                'nullable',
                'integer',
                'min:1',
                'max:100'
            ],

            'page' => [
                'nullable',
                'integer',
                'min:1'
            ]
        ]);

        // 2. Preparar la consulta.
        $query = Activo::with([
            'categoria',
            'estado',
            'ubicacion'
        ]);

        // 3. Búsqueda general.
        if (!empty($filtros['buscar'])) {

            $buscar = $filtros['buscar'];

            $query->where(function ($q) use ($buscar) {
                $q->where(
                    'codigo_inventario',
                    'like',
                    "%{$buscar}%"
                )
                ->orWhere(
                    'marca',
                    'like',
                    "%{$buscar}%"
                )
                ->orWhere(
                    'modelo',
                    'like',
                    "%{$buscar}%"
                )
                ->orWhere(
                    'numero_serie',
                    'like',
                    "%{$buscar}%"
                );
            });
        }

        // 4. Filtrar por categoría.
        if (!empty($filtros['categoria_id'])) {
            $query->where(
                'categoria_id',
                $filtros['categoria_id']
            );
        }

        // 5. Filtrar por estado.
        if (!empty($filtros['estado_id'])) {
            $query->where(
                'estado_id',
                $filtros['estado_id']
            );
        }

        // 6. Filtrar por ubicación.
        if (!empty($filtros['ubicacion_id'])) {
            $query->where(
                'ubicacion_id',
                $filtros['ubicacion_id']
            );
        }

        // 7. Definir cantidad de activos por página.
        $porPagina = $filtros['por_pagina'] ?? 15;

        // 8. Ejecutar la consulta.
        $activos = $query
            ->orderBy('codigo_inventario')
            ->orderBy('id')
            ->paginate($porPagina)
            ->withQueryString();

        return response()->json($activos);
    }

    public function reportables(Request $request)
    {
        $filtros = $request->validate([
            'buscar' => ['nullable', 'string', 'max:100'],
            'page' => ['nullable', 'integer', 'min:1'],
        ]);

        $query = Activo::query()
            ->select([
                'id',
                'codigo_inventario',
                'marca',
                'modelo',
                'estado_id',
            ])
            ->with([
                'estado:id,nombre',
            ])
            ->whereHas('estado', function ($query) {
                $query->whereNotIn('nombre', [
                    'En reparación',
                    'Dado de baja',
                ]);
            });

        if (!empty($filtros['buscar'])) {
            $buscar = trim($filtros['buscar']);

            $query->where(function ($q) use ($buscar) {
                $q->where(
                    'codigo_inventario',
                    'like',
                    "%{$buscar}%"
                )
                ->orWhere(
                    'marca',
                    'like',
                    "%{$buscar}%"
                )
                ->orWhere(
                    'modelo',
                    'like',
                    "%{$buscar}%"
                );
            });
        }

        return response()->json(
            $query
                ->orderBy('codigo_inventario')
                ->orderBy('id')
                ->paginate(15)
                ->withQueryString()
        );
    }

    public function show(Activo $activo)
    {
        return response()->json(
            $activo->load([
                'categoria',
                'estado',
                'ubicacion',
                'caracteristicas'
            ])
        );
    }

    public function store(StoreActivoRequest $request)
    {
        $datos = $request->validated();

        return DB::transaction(function () use ($datos) {

            // El activo comienza en estado Operativo.
            $estado = EstadoActivo::where(
                'nombre',
                'Operativo'
            )->firstOrFail();

            $caracteristicas = $datos['caracteristicas'] ?? [];

            unset(
                $datos['caracteristicas']
            );

            $datos['estado_id'] = $estado->id;

            $activo = Activo::create($datos);

            // Guardar características dinámicas.
            $valores = [];

            foreach ($caracteristicas as $item) {
                $valores[$item['caracteristica_id']] = [
                    'valor' => $item['valor']
                ];
            }

            $activo->caracteristicas()->sync($valores);

            HistorialActivo::create([
                'activo_id' => $activo->id,
                'usuario_id' => auth()->id(),
                'tipo_evento' => 'ALTA',
                'descripcion' => 'Registro inicial del activo.',
                'datos_anteriores' => null,
                'datos_nuevos' => [
                    'activo' => $activo->toArray(),
                    'caracteristicas' => $valores
                ]
            ]);

            return response()->json([
                'message' => 'Activo registrado correctamente.',
                'activo' => $activo->load([
                    'categoria',
                    'estado',
                    'ubicacion',
                    'caracteristicas'
                ])
            ], 201);
        });
    }
    
    public function storeLote(StoreActivosLoteRequest $request)
    {
        $datos = $request->validated();

        return DB::transaction(function () use ($datos) {

            $estado = EstadoActivo::where(
                'nombre',
                'Operativo'
            )->firstOrFail();

            $activosRegistrados = [];

            foreach ($datos['activos'] as $datosActivo) {

                $caracteristicas = $datosActivo['caracteristicas'] ?? [];

                unset($datosActivo['caracteristicas']);

                // El servidor asigna siempre el estado inicial.
                $datosActivo['estado_id'] = $estado->id;

                $activo = Activo::create($datosActivo);

                // Guardar las características técnicas.
                $valores = [];

                foreach ($caracteristicas as $item) {
                    $valores[$item['caracteristica_id']] = [
                        'valor' => $item['valor'],
                    ];
                }

                $activo->caracteristicas()->sync($valores);

                // Registrar el alta individual en el historial.
                HistorialActivo::create([
                    'activo_id' => $activo->id,
                    'usuario_id' => auth()->id(),
                    'tipo_evento' => 'ALTA',
                    'descripcion' => 'Registro del activo mediante carga múltiple.',
                    'datos_anteriores' => null,
                    'datos_nuevos' => [
                        'activo' => $activo->toArray(),
                        'caracteristicas' => $valores,
                    ],
                ]);

                $activosRegistrados[] = [
                    'id' => $activo->id,
                    'codigo_inventario' => $activo->codigo_inventario,
                ];
            }

            return response()->json([
                'message' => 'Activos registrados correctamente.',
                'total_registrados' => count($activosRegistrados),
                'activos' => $activosRegistrados,
            ], 201);
        });
    }

    public function update(UpdateActivoRequest $request, Activo $activo) 
    {
        $datos = $request->validated();

        return DB::transaction(function () use ($request, $activo, $datos) {

            // Bloquear el activo durante la actualización.
            $activo = Activo::whereKey($activo->id)
                ->lockForUpdate()
                ->firstOrFail();

            $activo->load('caracteristicas');

            // Capturar datos anteriores.
            $datosAnteriores = $activo->getAttributes();

            $caracteristicasAnteriores = $activo->caracteristicas
                ->mapWithKeys(fn ($c) => [
                    $c->id => $c->pivot->valor
                ])
                ->all();

            // Obtener características recibidas.
            $caracteristicas = $datos['caracteristicas'] ?? null;

            unset($datos['caracteristicas']);

            // Actualizar los datos generales.
            $activo->update($datos);

            // Actualizar características si fueron enviadas.
            if ($request->exists('caracteristicas')) {

                $valores = [];

                foreach ($caracteristicas as $item) {
                    $valores[$item['caracteristica_id']] = [
                        'valor' => $item['valor']
                    ];
                }

                $activo->caracteristicas()->sync($valores);
            }

            // Recargar información actualizada.
            $activo->refresh()->load('caracteristicas');

            $datosNuevos = $activo->getAttributes();

            $caracteristicasNuevas = $activo->caracteristicas
                ->mapWithKeys(fn ($c) => [
                    $c->id => $c->pivot->valor
                ])
                ->all();

            // Identificar los campos generales modificados.
            $cambiosAnteriores = [];
            $cambiosNuevos = [];

            foreach ($datosAnteriores as $campo => $valorAnterior) {

                // No registrar timestamps técnicos.
                if (in_array($campo, ['created_at', 'updated_at'])) {
                    continue;
                }

                $valorNuevo = $datosNuevos[$campo] ?? null;

                if ($valorAnterior != $valorNuevo) {
                    $cambiosAnteriores[$campo] = $valorAnterior;
                    $cambiosNuevos[$campo] = $valorNuevo;
                }
            }

            // Detectar cambios en características.
            if ($caracteristicasAnteriores != $caracteristicasNuevas) {
                $cambiosAnteriores['caracteristicas'] =
                    $caracteristicasAnteriores;

                $cambiosNuevos['caracteristicas'] =
                    $caracteristicasNuevas;
            }

            // Registrar cambio de ubicación por separado.
            if (array_key_exists('ubicacion_id', $cambiosNuevos)) {

                HistorialActivo::create([
                    'activo_id' => $activo->id,
                    'usuario_id' => $request->user()->id,
                    'tipo_evento' => 'CAMBIO_UBICACION',
                    'descripcion' => 'Cambio de ubicación del activo.',
                    'datos_anteriores' => [
                        'ubicacion_id' => $cambiosAnteriores['ubicacion_id']
                    ],
                    'datos_nuevos' => [
                        'ubicacion_id' => $cambiosNuevos['ubicacion_id']
                    ]
                ]);

                // Eliminar la ubicación del conjunto de cambios generales.
                unset(
                    $cambiosAnteriores['ubicacion_id'],
                    $cambiosNuevos['ubicacion_id']
                );
            }

            // Registrar modificaciones generales.
            if (!empty($cambiosNuevos)) {

                HistorialActivo::create([
                    'activo_id' => $activo->id,
                    'usuario_id' => $request->user()->id,
                    'tipo_evento' => 'MODIFICACION',
                    'descripcion' => 'Modificación de datos del activo.',
                    'datos_anteriores' => $cambiosAnteriores,
                    'datos_nuevos' => $cambiosNuevos
                ]);
            }

            return response()->json([
                'message' => 'Activo actualizado correctamente.',
                'activo' => $activo->load([
                    'categoria',
                    'estado',
                    'ubicacion',
                    'caracteristicas'
                ])
            ]);
        });
    }

    public function destroy(Request $request, Activo $activo)
    {
        return DB::transaction(function () use ($request, $activo) {

            // 1. Bloquear el activo para evitar operaciones simultáneas.
            $activo = Activo::whereKey($activo->id)
                ->lockForUpdate()
                ->firstOrFail();

            // 2. Verificar si tiene reportes de anomalías abiertos.
            $estadosReporteAbiertos = EstadoReporte::whereIn('nombre', [
                'Pendiente',
                'En revisión',
                'Derivado a reparación'
            ])->pluck('id');

            $tieneReportesAbiertos = ReporteAnomalia::where(
                'activo_id',
                $activo->id
            )
            ->whereIn('estado_reporte_id', $estadosReporteAbiertos)
            ->exists();

            if ($tieneReportesAbiertos) {
                return response()->json([
                    'message' => 'No se puede dar de baja el activo porque tiene reportes de anomalías abiertos.'
                ], 422);
            }

            // 3. Verificar si tiene órdenes de reparación sin finalizar.
            $estadosOrdenAbiertos = EstadoOrden::whereIn('nombre', [
                'Pendiente',
                'En proceso'
            ])->pluck('id');

            $tieneOrdenesAbiertas = OrdenReparacion::whereHas(
                'reporte',
                function ($query) use ($activo) {
                    $query->where('activo_id', $activo->id);
                }
            )
            ->whereIn('estado_orden_id', $estadosOrdenAbiertos)
            ->exists();

            if ($tieneOrdenesAbiertas) {
                return response()->json([
                    'message' => 'No se puede dar de baja el activo porque tiene órdenes de reparación sin finalizar.'
                ], 422);
            }

            // 4. Obtener el estado de baja.
            $estadoBaja = EstadoActivo::where(
                'nombre',
                'Dado de baja'
            )->firstOrFail();

            // 5. Guardar los datos anteriores del activo.
            $anteriores = [
                'estado_id' => $activo->estado_id,
                'deleted_at' => $activo->deleted_at
            ];

            // 6. Actualizar el estado del activo.
            $activo->estado_id = $estadoBaja->id;
            $activo->save();

            // 7. Aplicar la baja lógica.
            $activo->delete();

            // 8. Registrar la baja en el historial.
            HistorialActivo::create([
                'activo_id' => $activo->id,
                'usuario_id' => $request->user()->id,
                'tipo_evento' => 'BAJA',
                'descripcion' => 'El activo fue dado de baja del inventario.',
                'datos_anteriores' => $anteriores,
                'datos_nuevos' => [
                    'estado_id' => $activo->estado_id,
                    'deleted_at' => $activo->deleted_at
                        ? $activo->deleted_at->toDateTimeString()
                        : null
                ]
            ]);

            // 9. Devolver respuesta exitosa.
            return response()->json([
                'message' => 'Activo dado de baja correctamente.'
            ]);
        });
    }

    public function dadosDeBaja()
    {
        $activos = Activo::onlyTrashed()
            ->with([
                'categoria',
                'estado',
                'ubicacion'
            ])
            ->orderByDesc('deleted_at')
            ->paginate(15);

        return response()->json($activos);
    }

    public function historial(int $id)
    {
        $activo = Activo::withTrashed()->findOrFail($id);

        $historial = $activo->historial()
            ->with('usuario:id,nombre,apellido')
            ->orderByDesc('created_at')
            ->orderByDesc('id')
            ->get();

        return response()->json($historial);
    }

    public function showDadoDeBaja(int $id)
    {
        $activo = Activo::onlyTrashed()
            ->with([
                'categoria',
                'estado',
                'ubicacion',
                'caracteristicas'
            ])
            ->findOrFail($id);

        return response()->json($activo);
    }

    // =====================================
    // HISTORIAL GENERAL DE ACTIVOS
    // =====================================

    public function historialGeneral(Request $request)
    {
        $request->validate([
            'buscar' => ['nullable', 'string', 'max:100'],
            'tipo_evento' => ['nullable', 'string', 'max:50'],
            'page' => ['nullable', 'integer', 'min:1'],
        ]);

        $query = HistorialActivo::query()
            ->with([
                'usuario:id,nombre,apellido',
                'activo' => function ($query) {
                    $query->withTrashed()
                        ->select('id', 'codigo_inventario', 'categoria_id');
                },
            ]);

        // Buscar por código de inventario
        if ($request->filled('buscar')) {
            $buscar = trim($request->buscar);

            $query->whereHas('activo', function ($query) use ($buscar) {
                $query->withTrashed()
                    ->where('codigo_inventario', 'like', "%{$buscar}%");
            });
        }

        // Filtrar por tipo de evento
        if ($request->filled('tipo_evento')) {
            $query->where('tipo_evento', $request->tipo_evento);
        }

        return response()->json(
            $query
                ->orderByDesc('created_at')
                ->orderByDesc('id')
                ->paginate(15)
                ->withQueryString()
        );
    }


}