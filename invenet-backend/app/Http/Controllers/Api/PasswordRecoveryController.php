<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class PasswordRecoveryController extends Controller
{
    private const MENSAJE_SOLICITUD =
        'Si el correo corresponde a una cuenta activa, recibirás un código de recuperación.';

    public function solicitarCodigo(Request $request)
    {
        $datos = $request->validate([
            'email' => ['required', 'email', 'max:255'],
        ]);

        $email = Str::lower(trim($datos['email']));

        $usuario = User::where('email', $email)->first();

        // No revelar si existe la cuenta o si está desactivada.
        if (!$usuario) {
            return response()->json([
                'message' => self::MENSAJE_SOLICITUD,
            ]);
        }

        $registro = DB::table('password_recovery_codes')
            ->where('email', $email)
            ->first();

        if (
            $registro &&
            now()->diffInSeconds(
                \Carbon\Carbon::parse($registro->requested_at),
                false
            ) > -60
        ) {
            return response()->json([
                'message' => self::MENSAJE_SOLICITUD,
            ]);
        }

        $codigo = (string) random_int(100000, 999999);

        DB::table('password_recovery_codes')->updateOrInsert(
            ['email' => $email],
            [
                'code_hash' => Hash::make($codigo),
                'attempts' => 0,
                'expires_at' => now()->addMinutes(10),
                'requested_at' => now(),
                'reset_token_hash' => null,
                'verified_at' => null,
                'updated_at' => now(),
            ]
        );

        try {
            Mail::raw(
                "Hola {$usuario->nombre}.\n\n" .
                "Recibimos una solicitud para recuperar tu contraseña de Invenet.\n\n" .
                "Tu código de verificación es: {$codigo}\n\n" .
                "Este código vence en 10 minutos.\n\n" .
                "Si no solicitaste el cambio, ignorá este mensaje.\n\n" .
                "Invenet - ESCOM Nº44",
                function ($mensaje) use ($email) {
                    $mensaje->to($email)
                        ->subject('Código de recuperación - Invenet');
                }
            );
        } catch (\Throwable $e) {
            report($e);

            // Evitar dejar activo un código que no se pudo enviar.
            DB::table('password_recovery_codes')
                ->where('email', $email)
                ->delete();

            return response()->json([
                'message' => 'No se pudo procesar la solicitud. Intentá nuevamente más tarde.',
            ], 503);
        }

        return response()->json([
            'message' => self::MENSAJE_SOLICITUD,
        ]);
    }

    public function verificarCodigo(Request $request)
    {
        $datos = $request->validate([
            'email' => ['required', 'email'],
            'codigo' => ['required', 'digits:6'],
        ]);

        $email = Str::lower(trim($datos['email']));

        $token = DB::transaction(function () use ($email, $datos) {
            $registro = DB::table('password_recovery_codes')
                ->where('email', $email)
                ->lockForUpdate()
                ->first();

            if (
                !$registro ||
                $registro->attempts >= 5 ||
                now()->greaterThanOrEqualTo($registro->expires_at) ||
                $registro->verified_at !== null ||
                !User::where('email', $email)->exists()
            ) {
                return null;
            }

            if (!Hash::check($datos['codigo'], $registro->code_hash)) {
                DB::table('password_recovery_codes')
                    ->where('email', $email)
                    ->increment('attempts');

                return null;
            }

            $token = Str::random(64);

            DB::table('password_recovery_codes')
                ->where('email', $email)
                ->update([
                    'reset_token_hash' => hash('sha256', $token),
                    'verified_at' => now(),
                    'updated_at' => now(),
                ]);

            return $token;
        });

        if (!$token) {
            throw ValidationException::withMessages([
                'codigo' => [
                    'El código es incorrecto, expiró o superaste los intentos permitidos.',
                ],
            ]);
        }

        return response()->json([
            'message' => 'Código verificado correctamente.',
            'reset_token' => $token,
        ]);
    }

    public function restablecer(Request $request)
    {
        $datos = $request->validate([
            'email' => ['required', 'email'],
            'reset_token' => ['required', 'string'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ]);

        $email = Str::lower(trim($datos['email']));

        $actualizado = DB::transaction(function () use ($email, $datos) {
            $registro = DB::table('password_recovery_codes')
                ->where('email', $email)
                ->lockForUpdate()
                ->first();

            if (
                !$registro ||
                !$registro->verified_at ||
                !$registro->reset_token_hash ||
                now()->greaterThanOrEqualTo($registro->expires_at)
            ) {
                return false;
            }

            $hashRecibido = hash('sha256', $datos['reset_token']);

            if (!hash_equals($registro->reset_token_hash, $hashRecibido)) {
                return false;
            }

            $usuario = User::where('email', $email)->first();

            if (!$usuario) {
                return false;
            }

            $usuario->password = $datos['password'];
            $usuario->save();

            // Invalidar tokens personales de Sanctum.
            $usuario->tokens()->delete();

            // Invalidar sesiones anteriores si se usa SESSION_DRIVER=database.
            if (config('session.driver') === 'database') {
                DB::table(config('session.table', 'sessions'))
                    ->where('user_id', $usuario->id)
                    ->delete();
            }

            DB::table('password_recovery_codes')
                ->where('email', $email)
                ->delete();

            return true;
        });

        if (!$actualizado) {
            throw ValidationException::withMessages([
                'reset_token' => [
                    'La autorización expiró o no es válida. Solicitá otro código.',
                ],
            ]);
        }

        return response()->json([
            'message' => 'Contraseña actualizada correctamente. Ya podés iniciar sesión.',
        ]);
    }
}
