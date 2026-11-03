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
        Schema::create('opciones_caracteristica', function (Blueprint $table) {
            $table->id();

            $table->foreignId('caracteristica_id')
                ->constrained('caracteristicas')
                ->cascadeOnDelete();

            $table->string('valor', 100);

            $table->timestamps();

            $table->unique(['caracteristica_id', 'valor']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('opciones_caracteristica');
    }
};
