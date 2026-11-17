<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        $credenciales = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);

        // Identificar los intentos por correo e IP.
        $clave = Str::lower(
            trim($credenciales['email'])
        ) . '|' . $request->ip();

        // Máximo 5 intentos fallidos en 60 segundos.
        if (RateLimiter::tooManyAttempts($clave, 5)) {
            $segundos = RateLimiter::availableIn($clave);

            return response()->json([
                'message' => 'Demasiados intentos de inicio de sesión.',
                'errors' => [
                    'email' => [
                        "Intentá nuevamente en {$segundos} segundos."
                    ],
                ],
            ], 429);
        }

        // Verificar las credenciales.
        if (!Auth::attempt($credenciales)) {
            RateLimiter::hit($clave, 60);

            throw ValidationException::withMessages([
                'email' => [
                    'Las credenciales ingresadas son incorrectas.'
                ],
            ]);
        }

        $usuario = $request->user();

        // Impedir el acceso de cuentas desactivadas.
        if (!$usuario || $usuario->trashed()) {
            Auth::guard('web')->logout();

            RateLimiter::hit($clave, 60);

            throw ValidationException::withMessages([
                'email' => [
                    'Las credenciales ingresadas son incorrectas.'
                ],
            ]);
        }

        // Inicio exitoso: limpiar intentos fallidos.
        RateLimiter::clear($clave);

        // Prevenir fijación de sesión.
        $request->session()->regenerate();

        return response()->json([
            'message' => 'Inicio de sesión exitoso.',
            'user' => $usuario->load('rol'),
        ]);
    }

    public function user(Request $request)
    {
        $usuario = $request->user()->load([
            'rol.permisos',
        ]);

        return response()->json($usuario);
    }

    public function logout(Request $request)
    {
        Auth::guard('web')->logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return response()->json([
            'message' => 'Sesión cerrada correctamente.',
        ]);
    }
}
