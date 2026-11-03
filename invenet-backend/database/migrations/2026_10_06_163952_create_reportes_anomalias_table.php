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
        Schema::create('reportes_anomalias', function (Blueprint $table) {

            $table->id();

            $table->foreignId('activo_id')
                ->constrained('activos')
                ->restrictOnDelete();

            $table->foreignId('usuario_id')
                ->constrained('users')
                ->restrictOnDelete();

            $table->foreignId('estado_reporte_id')
                ->constrained('estados_reporte')
                ->restrictOnDelete();

            $table->text('descripcion');

            $table->dateTime('fecha_reporte');

            $table->timestamps();

            $table->index('fecha_reporte');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('reportes_anomalias');
    }
};
