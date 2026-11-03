<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\UsuarioController;
use App\Http\Controllers\Api\CategoriaController;
use App\Http\Controllers\Api\EstadoActivoController;
use App\Http\Controllers\Api\UbicacionController;
use App\Http\Controllers\Api\ActivoController;
use App\Http\Controllers\Api\CaracteristicaController;
use App\Http\Controllers\Api\ReporteAnomaliaController;
use App\Http\Controllers\Api\OrdenReparacionController;
use App\Http\Controllers\Api\NotificacionController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\CategoriaCaracteristicaController;
use App\Http\Controllers\Api\OpcionCaracteristicaController;

Route::post('/login', [AuthController::class, 'login']);

Route::middleware([
    'auth:sanctum',
    'usuario.activo'
])->group(function () {

    // AUTENTICACION Y USUARIOS

    Route::get('/user', [AuthController::class, 'user']);
    
    Route::post('/logout', [AuthController::class, 'logout']);

    // Consultar usuarios
    Route::get('/usuarios', [UsuarioController::class, 'index'])
        ->middleware('permiso:usuarios.ver');

    // Consultar usuarios desactivados
    Route::get('/usuarios/desactivados', [UsuarioController::class, 'desactivados'])    
        ->middleware('permiso:usuarios.ver');

    Route::get('/usuarios/{usuario}', [UsuarioController::class, 'show'])
        ->middleware('permiso:usuarios.ver');

    // Crear usuario
    Route::post('/usuarios', [UsuarioController::class, 'store'])
        ->middleware('permiso:usuarios.crear');

    // Modificar usuario
    Route::put('/usuarios/{usuario}', [UsuarioController::class, 'update'])
        ->middleware('permiso:usuarios.editar');

    // Desactivar usuario
    Route::delete('/usuarios/{usuario}', [UsuarioController::class, 'destroy'])
        ->middleware('permiso:usuarios.desactivar');

    // Restaurar usuario
    Route::patch('/usuarios/{id}/restaurar', [UsuarioController::class, 'restaurar'])
        ->middleware('permiso:usuarios.desactivar');

    // Cambiar rol    
    Route::patch('/usuarios/{usuario}/rol', [UsuarioController::class, 'cambiarRol'])
        ->middleware('permiso:usuarios.roles');

    // CATEGORÍAS

    Route::get('/categorias', [CategoriaController::class, 'index'])
        ->middleware('permiso:activos.ver');
    
    Route::get('/categorias/todas', [CategoriaController::class, 'todas'])
        ->middleware('permiso:catalogos.gestionar');

    Route::get('/categorias/{categoria}', [CategoriaController::class, 'show'])
        ->middleware('permiso:activos.ver');

    Route::post('/categorias', [CategoriaController::class, 'store'])
        ->middleware('permiso:catalogos.gestionar');

    Route::put('/categorias/{categoria}', [CategoriaController::class, 'update'])
        ->middleware('permiso:catalogos.gestionar');

    Route::delete('/categorias/{categoria}', [CategoriaController::class, 'destroy'])
        ->middleware('permiso:catalogos.gestionar');

    Route::patch('/categorias/{categoria}/reactivar', [CategoriaController::class, 'reactivar'])
        ->middleware('permiso:catalogos.gestionar');

    // ESTADOS DE ACTIVOS

    Route::get('/estados-activo', [EstadoActivoController::class, 'index'])
        ->middleware('permiso:activos.ver');

    Route::get('/estados-activo/{estadoActivo}', [EstadoActivoController::class, 'show'])
        ->middleware('permiso:activos.ver');


    // UBICACIONES

    Route::get('/ubicaciones', [UbicacionController::class, 'index'])
        ->middleware('permiso:activos.ver');

    Route::get('/ubicaciones/todas', [UbicacionController::class, 'todas'])
    ->middleware('permiso:catalogos.gestionar');

    Route::get('/ubicaciones/{ubicacion}', [UbicacionController::class, 'show'])
        ->middleware('permiso:activos.ver');

    Route::post('/ubicaciones', [UbicacionController::class, 'store'])
        ->middleware('permiso:catalogos.gestionar');

    Route::put('/ubicaciones/{ubicacion}', [UbicacionController::class, 'update'])
        ->middleware('permiso:catalogos.gestionar');

    Route::delete('/ubicaciones/{ubicacion}', [UbicacionController::class, 'destroy'])
        ->middleware('permiso:catalogos.gestionar');

    Route::patch('/ubicaciones/{ubicacion}/reactivar', [UbicacionController::class, 'reactivar'])
        ->middleware('permiso:catalogos.gestionar');

    // =========================================
    // GESTIÓN DE CARACTERÍSTICAS TÉCNICAS
    // =========================================

    // Listar características
    Route::get('/caracteristicas', [CaracteristicaController::class,'index'])
        ->middleware('permiso:catalogos.gestionar');

    // Características técnicas por categoría
    Route::get('/categorias/{categoria}/caracteristicas', [CaracteristicaController::class, 'porCategoria'])
        ->middleware('permiso:activos.ver');

    // Consultar una característica
    Route::get('/caracteristicas/{caracteristica}', [CaracteristicaController::class,'show'])
        ->middleware('permiso:catalogos.gestionar');

    // Crear característica
    Route::post('/caracteristicas', [CaracteristicaController::class,'store'])  
        ->middleware('permiso:catalogos.gestionar');

    // Editar característica
    Route::put('/caracteristicas/{caracteristica}', [CaracteristicaController::class,'update'])
        ->middleware('permiso:catalogos.gestionar');

    // =========================================
    // ASOCIACIONES CATEGORÍA - CARACTERÍSTICA
    // =========================================

    // Asociar característica a categoría
    Route::post('/categorias/{categoria}/caracteristicas',[CategoriaCaracteristicaController::class, 'store'])
        ->middleware('permiso:catalogos.gestionar');

    // Modificar obligatoriedad
    Route::patch('/categorias/{categoria}/caracteristicas/{caracteristica}',[CategoriaCaracteristicaController::class, 'update'])
        ->middleware('permiso:catalogos.gestionar');

    // Desvincular característica
    Route::delete('/categorias/{categoria}/caracteristicas/{caracteristica}',[CategoriaCaracteristicaController::class, 'destroy'])
        ->middleware('permiso:catalogos.gestionar');

    // =========================================
    // OPCIONES SELECT DE CARACTERÍSTICAS TÉCNICAS
    // =========================================

    // Consultar opciones de una característica
    Route::get('/caracteristicas/{caracteristica}/opciones',[OpcionCaracteristicaController::class, 'index'])
        ->middleware('permiso:activos.ver');

    // Crear una opción
    Route::post('/caracteristicas/{caracteristica}/opciones',[OpcionCaracteristicaController::class, 'store'])
        ->middleware('permiso:catalogos.gestionar');

    // Editar una opción
    Route::put('/caracteristicas/{caracteristica}/opciones/{opcion}',[OpcionCaracteristicaController::class, 'update'])
        ->middleware('permiso:catalogos.gestionar');

    // Eliminar una opción
    Route::delete('/caracteristicas/{caracteristica}/opciones/{opcion}',[OpcionCaracteristicaController::class, 'destroy'])
        ->middleware('permiso:catalogos.gestionar');

    // ACTIVOS INFORMÁTICOS

    // Listar activos
    Route::get('/activos', [ActivoController::class, 'index'])
        ->middleware('permiso:activos.ver');

    // Consultar activos dados de baja
    Route::get('/activos/dados-de-baja', [ActivoController::class, 'dadosDeBaja'])
        ->middleware('permiso:activos.desactivar');

    // Consultar detalle de un activo dado de baja
    Route::get('/activos/dados-de-baja/{id}', [ActivoController::class, 'showDadoDeBaja'])
        ->middleware('permiso:activos.desactivar');

    // Consultar historial general de activos
    Route::get('/historial-activos', [ActivoController::class, 'historialGeneral'])
        ->middleware('permiso:historial.ver');

    // Consultar historial
    Route::get('/activos/{activo}/historial', [ActivoController::class, 'historial'])
        ->middleware('permiso:historial.ver');

    // Resgistrar lote de activos
    Route::post('/activos/lote', [ActivoController::class, 'storeLote'])
    ->middleware('permiso:activos.crear');

    // Consultar activo
    Route::get('/activos/{activo}', [ActivoController::class, 'show'])
        ->middleware('permiso:activos.ver');

    // Registrar activo
    Route::post('/activos', [ActivoController::class, 'store'])
        ->middleware('permiso:activos.crear');

    // Actualizar activo
    Route::put('/activos/{activo}', [ActivoController::class, 'update'])
        ->middleware('permiso:activos.editar');

    // Dar de baja activo
    Route::delete('/activos/{activo}', [ActivoController::class, 'destroy'])
        ->middleware('permiso:activos.desactivar');

    // REPORTES DE ANOMALÍAS

    // Crear reporte
    Route::post('/reportes-anomalias', [ReporteAnomaliaController::class, 'store'])
        ->middleware('permiso:reportes.crear');

    // Consultar reportes propios
    Route::get('/reportes-anomalias/propios', [ReporteAnomaliaController::class, 'propios'])
        ->middleware('permiso:reportes.propios');

    // Consultar todos los reportes
    Route::get('/reportes-anomalias', [ReporteAnomaliaController::class, 'index'])
        ->middleware('permiso:reportes.todos');

    // Consultar detalle
    Route::get('/reportes-anomalias/{reporte}', [ReporteAnomaliaController::class, 'show']);

    // Cambiar estado
    Route::patch('/reportes-anomalias/{reporte}/estado', [ReporteAnomaliaController::class, 'cambiarEstado'])
        ->middleware('permiso:reportes.estado');

    // ÓRDENES DE REPARACIÓN

    // Crear una orden de reparación.
    Route::post('/ordenes-reparacion', [OrdenReparacionController::class, 'store'])
        ->middleware('permiso:ordenes.crear');

    // Consultar órdenes asignadas al técnico.
    Route::get('/ordenes-reparacion/asignadas', [OrdenReparacionController::class, 'asignadas'])
        ->middleware('permiso:ordenes.ver_asignadas');

    // Consultar todas las órdenes.
    Route::get('/ordenes-reparacion', [OrdenReparacionController::class, 'index'])
        ->middleware('permiso:ordenes.ver_todas');

    // Consultar detalle de una orden.
    Route::get('/ordenes-reparacion/{orden}', [OrdenReparacionController::class, 'show']);

    // FLUJO DE TRABAJO DEL TÉCNICO

    // Confirmar recepción.
    Route::patch('/ordenes-reparacion/{orden}/recepcion', [OrdenReparacionController::class, 'recibir'])
        ->middleware('permiso:ordenes.reparar');

    // Iniciar reparación.
    Route::patch('/ordenes-reparacion/{orden}/iniciar', [OrdenReparacionController::class, 'iniciar'])
        ->middleware('permiso:ordenes.reparar');

    // Registrar diagnóstico y trabajo.
    Route::put('/ordenes-reparacion/{orden}/trabajo', [OrdenReparacionController::class, 'actualizarTrabajo'])
        ->middleware('permiso:ordenes.reparar');

    // Finalizar reparación.
    Route::patch('/ordenes-reparacion/{orden}/finalizar', [OrdenReparacionController::class, 'finalizar'])
        ->middleware('permiso:ordenes.finalizar');

    // NOTIFICACIONES

    // Consultar todas las notificaciones.
    Route::get('/notificaciones', [NotificacionController::class, 'index'])
        ->middleware('permiso:notificaciones.ver');

    // Consultar cantidad sin leer.
    Route::get('/notificaciones/no-leidas', [NotificacionController::class, 'noLeidas'])
        ->middleware('permiso:notificaciones.ver');

    // Marcar una notificación como leída.
    Route::patch('/notificaciones/{id}/leer', [NotificacionController::class, 'marcarLeida'])
        ->middleware('permiso:notificaciones.ver');

    // Marcar todas como leídas.
    Route::patch('/notificaciones/leer-todas', [NotificacionController::class, 'marcarTodasLeidas'])
        ->middleware('permiso:notificaciones.ver');

    // DASHBOARD
    Route::get('/dashboard', [DashboardController::class, 'index']);
});