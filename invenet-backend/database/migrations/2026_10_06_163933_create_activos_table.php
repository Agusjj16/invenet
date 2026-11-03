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
        Schema::create('activos', function (Blueprint $table) {

            $table->id();

            $table->string('codigo_inventario', 50)->unique();

            $table->foreignId('categoria_id')
                ->constrained('categorias')
                ->restrictOnDelete();

            $table->foreignId('estado_id')
                ->constrained('estados_activo')
                ->restrictOnDelete();

            $table->foreignId('ubicacion_id')
                ->constrained('ubicaciones')
                ->restrictOnDelete();

            $table->date('fecha_ingreso');

            $table->string('marca', 100)->nullable();

            $table->string('modelo', 100)->nullable();

            $table->string('numero_serie', 150)
                ->nullable()
                ->unique();

            $table->text('observaciones')->nullable();

            $table->timestamps();

            $table->softDeletes();

            $table->index('marca');
            $table->index('modelo');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('activos');
    }
};
