<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class SoloAdministrador
{
    public function handle(
        Request $request,
        Closure $next
    ): Response {
        if (
            $request->user()?->rol?->nombre !== 'Administrador'
        ) {
            return response()->json([
                'message' =>
                    'No tiene permiso para consultar el dashboard.'
            ], 403);
        }

        return $next($request);
    }
}
