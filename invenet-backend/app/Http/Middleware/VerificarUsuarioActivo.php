<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class VerificarUsuarioActivo
{
    public function handle(Request $request, Closure $next): Response
    {
        $usuario = $request->user();

        if (!$usuario) {
            return response()->json([
                'message' => 'No autenticado.'
            ], 401);
        }

        $activo = $usuario->exists
            && !$usuario->trashed()
            && $usuario->fresh() !== null;

        if (!$activo) {
            Auth::guard('web')->logout();

            $request->session()->invalidate();
            $request->session()->regenerateToken();

            return response()->json([
                'message' => 'Tu cuenta se encuentra desactivada.'
            ], 403);
        }

        return $next($request);
    }
}