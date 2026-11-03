<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        $credenciales = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);

        if (!Auth::attempt($credenciales)) {
            throw ValidationException::withMessages([
                'email' => ['Las credenciales ingresadas son incorrectas.'],
            ]);
        }

        $usuario = $request->user();

        if (!$usuario || $usuario->trashed()) {
            Auth::guard('web')->logout();

            throw ValidationException::withMessages([
                'email' => ['La cuenta no se encuentra habilitada.'],
            ]);
        }

        $request->session()->regenerate();

        return response()->json([
            'message' => 'Inicio de sesión exitoso.',
            'user' => $usuario->load('rol'),
        ]);
    }

    public function user(Request $request)
    {
        $usuario = $request->user()->load([
            'rol.permisos'
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