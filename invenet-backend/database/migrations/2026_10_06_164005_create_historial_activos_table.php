<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('historial_activos', function (Blueprint $table) {

            $table->id();

            $table->foreignId('activo_id')
                ->constrained('activos')
                ->restrictOnDelete();

            $table->foreignId('usuario_id')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            $table->string('tipo_evento', 50);

            $table->text('descripcion');

            $table->json('datos_anteriores')->nullable();

            $table->json('datos_nuevos')->nullable();

            $table->timestamps();

            $table->index('tipo_evento');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('historial_activos');
    }
};
