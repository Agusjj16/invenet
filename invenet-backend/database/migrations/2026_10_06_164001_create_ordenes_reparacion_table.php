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
        Schema::create('ordenes_reparacion', function (Blueprint $table) {

            $table->id();

            $table->foreignId('reporte_id')
                ->unique()
                ->constrained('reportes_anomalias')
                ->restrictOnDelete();

            $table->foreignId('tecnico_id')
                ->constrained('users')
                ->restrictOnDelete();

            $table->foreignId('estado_orden_id')
                ->constrained('estados_orden')
                ->restrictOnDelete();

            $table->dateTime('fecha_asignacion');

            $table->dateTime('fecha_recepcion')->nullable();

            $table->dateTime('fecha_inicio')->nullable();

            $table->dateTime('fecha_finalizacion')->nullable();

            $table->text('diagnostico')->nullable();

            $table->text('detalle_reparacion')->nullable();

            $table->text('observaciones')->nullable();

            $table->timestamps();

            $table->index('fecha_asignacion');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('ordenes_reparacion');
    }
};
