<?php

namespace App\Services;

use App\Models\Categoria;
use App\Models\Ubicacion;
use App\Models\EstadoActivo;
use App\Models\Caracteristica;
use App\Models\HistorialActivo;
use Illuminate\Support\Collection;

class HistorialActivoFormatter
{
    private array $etiquetas = [
        'codigo_inventario' => 'Código de inventario',
        'categoria_id' => 'Categoría',
        'ubicacion_id' => 'Ubicación',
        'estado_id' => 'Estado',
        'fecha_ingreso' => 'Fecha de ingreso',
        'marca' => 'Marca',
        'modelo' => 'Modelo',
        'numero_serie' => 'Número de serie',
        'observaciones' => 'Observaciones',
        'deleted_at' => 'Fecha de baja',
    ];

    public function formatearColeccion(Collection $eventos): Collection
    {
        $categorias = Categoria::pluck('nombre', 'id');
        $ubicaciones = Ubicacion::pluck('nombre', 'id');
        $estados = EstadoActivo::pluck('nombre', 'id');

        $caracteristicas = Caracteristica::query()
            ->select('id', 'nombre', 'tipo_dato', 'unidad')
            ->get()
            ->keyBy('id');

        return $eventos->map(function ($evento) use (
            $categorias,
            $ubicaciones,
            $estados,
            $caracteristicas
        ) {
            $anteriores = $this->normalizar(
                $evento->datos_anteriores ?? []
            );

            $nuevos = $this->normalizar(
                $evento->datos_nuevos ?? []
            );

            $claves = array_unique(array_merge(
                array_keys($anteriores),
                array_keys($nuevos)
            ));

            $cambios = [];

            foreach ($claves as $clave) {
                $anterior = $anteriores[$clave] ?? null;
                $nuevo = $nuevos[$clave] ?? null;

                if ($anterior === $nuevo) {
                    continue;
                }

                $cambios[] = [
                    'clave' => $clave,
                    'campo' => $this->nombreCampo(
                        $clave,
                        $caracteristicas
                    ),
                    'anterior' => $this->resolverValor(
                        $clave,
                        $anterior,
                        $categorias,
                        $ubicaciones,
                        $estados,
                        $caracteristicas
                    ),
                    'nuevo' => $this->resolverValor(
                        $clave,
                        $nuevo,
                        $categorias,
                        $ubicaciones,
                        $estados,
                        $caracteristicas
                    ),
                ];
            }

            $evento->setAttribute('cambios_legibles', $cambios);

            return $evento;
        });
    }

    private function normalizar(array $datos): array
    {
        $activo = isset($datos['activo'])
            && is_array($datos['activo'])
                ? $datos['activo']
                : $datos;

        $resultado = [];

        foreach ($activo as $clave => $valor) {
            if (in_array($clave, [
                'id',
                'created_at',
                'updated_at',
                'caracteristicas',
            ], true)) {
                continue;
            }

            $resultado[$clave] = $valor;
        }

        $caracteristicas = $datos['caracteristicas']
            ?? $activo['caracteristicas']
            ?? [];

        if (is_array($caracteristicas)) {
            foreach ($caracteristicas as $id => $valor) {
                if (is_array($valor)) {
                    $valor = $valor['valor']
                        ?? $valor['pivot']['valor']
                        ?? null;
                }

                $resultado["caracteristica_{$id}"] = $valor;
            }
        }

        return $resultado;
    }

    private function nombreCampo(
        string $clave,
        Collection $caracteristicas
    ): string {
        if (str_starts_with($clave, 'caracteristica_')) {
            $id = substr($clave, strlen('caracteristica_'));

            $caracteristica = $caracteristicas->get($id);

            return $caracteristica?->nombre
                ?? "Característica #{$id}";
        }

        return $this->etiquetas[$clave] ?? $clave;
    }

    private function resolverValor(
        string $clave,
        mixed $valor,
        Collection $categorias,
        Collection $ubicaciones,
        Collection $estados,
        Collection $caracteristicas
    ): string {
        if ($valor === null || $valor === '') {
            return 'Sin valor';
        }

        $catalogos = [
            'categoria_id' => $categorias,
            'ubicacion_id' => $ubicaciones,
            'estado_id' => $estados,
        ];

        if (isset($catalogos[$clave])) {
            return $catalogos[$clave]->get($valor)
                ?? "ID #{$valor} (no disponible)";
        }

        if (str_starts_with($clave, 'caracteristica_')) {
            $id = substr($clave, strlen('caracteristica_'));

            $caracteristica = $caracteristicas->get($id);

            // No suponemos que los números de un select
            // son IDs de opciones: podrían ser sus valores.
            $texto = $this->texto($valor);

            $unidad = trim((string) (
                $caracteristica?->unidad ?? ''
            ));

            if ($unidad !== '' && $texto !== 'Sin valor') {
                return "{$texto} {$unidad}";
            }

            return $texto;
        }

        if ($clave === 'fecha_ingreso' && is_string($valor)) {
            try {
                return \Carbon\Carbon::parse($valor)
                    ->format('d/m/Y');
            } catch (\Throwable $e) {
                return $valor;
            }
        }

        if ($clave === 'deleted_at' && is_string($valor)) {
            try {
                return \Carbon\Carbon::parse($valor)
                    ->format('d/m/Y H:i');
            } catch (\Throwable $e) {
                return $valor;
            }
        }

        return $this->texto($valor);
    }

    private function texto(mixed $valor): string
    {
        if ($valor === null || $valor === '') {
            return 'Sin valor';
        }

        if (is_bool($valor)) {
            return $valor ? 'Sí' : 'No';
        }

        if (is_array($valor)) {
            return json_encode(
                $valor,
                JSON_UNESCAPED_UNICODE
                | JSON_UNESCAPED_SLASHES
            ) ?: 'Sin valor';
        }

        return (string) $valor;
    }
}
