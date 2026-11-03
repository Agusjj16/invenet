<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class NotificacionController extends Controller
{
    // Consultar notificaciones del usuario autenticado.
    // Consultar notificaciones del usuario autenticado.
    public function index(Request $request)
    {
        $datos = $request->validate([
            'filtro' => ['sometimes', 'in:todas,no_leidas,leidas'],
            'page' => ['sometimes', 'integer', 'min:1'],
        ]);

        $consulta = $request->user()
            ->notifications();

        $filtro = $datos['filtro'] ?? 'todas';

        if ($filtro === 'no_leidas') {
            $consulta->whereNull('read_at');
        }

        if ($filtro === 'leidas') {
            $consulta->whereNotNull('read_at');
        }

        $notificaciones = $consulta
            ->orderByDesc('created_at')
            ->paginate(15);

        return response()->json($notificaciones);
    }

    // Consultar cantidad de notificaciones sin leer.
    public function noLeidas(Request $request)
    {
        $cantidad = $request->user()
            ->unreadNotifications()
            ->count();

        return response()->json([
            'cantidad' => $cantidad
        ]);
    }

    // Marcar una notificación como leída.
    public function marcarLeida(Request $request, string $id)
    {
        $notificacion = $request->user()
            ->notifications()
            ->findOrFail($id);

        if ($notificacion->read_at === null) {
            $notificacion->markAsRead();
        }

        return response()->json([
            'message' => 'Notificación marcada como leída.',
            'notificacion' => $notificacion->fresh()
        ]);
    }

    // Marcar todas las notificaciones como leídas.
    public function marcarTodasLeidas(Request $request)
    {
        $cantidad = $request->user()
            ->unreadNotifications()
            ->count();

        $request->user()
            ->unreadNotifications()
            ->update([
                'read_at' => now()
            ]);

        return response()->json([
            'message' => 'Todas las notificaciones fueron marcadas como leídas.',
            'cantidad_actualizada' => $cantidad
        ]);
    }
}