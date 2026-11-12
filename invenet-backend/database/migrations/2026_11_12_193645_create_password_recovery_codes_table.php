
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('password_recovery_codes', function (Blueprint $table) {
            $table->id();

            $table->string('email')->unique();

            $table->string('code_hash');

            $table->unsignedTinyInteger('attempts')->default(0);

            $table->dateTime('expires_at');

            $table->dateTime('requested_at');

            $table->string('reset_token_hash')->nullable();

            $table->dateTime('verified_at')->nullable();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('password_recovery_codes');
    }
};
