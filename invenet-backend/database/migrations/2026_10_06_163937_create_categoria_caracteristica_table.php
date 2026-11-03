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
        Schema::create('categoria_caracteristica', function (Blueprint $table) {

            $table->foreignId('categoria_id')
                ->constrained('categorias')
                ->cascadeOnDelete();

            $table->foreignId('caracteristica_id')
                ->constrained('caracteristicas')
                ->cascadeOnDelete();

            $table->boolean('obligatorio')->default(false);

            $table->primary([
                'categoria_id',
                'caracteristica_id'
            ]);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('categoria_caracteristica');
    }
};
