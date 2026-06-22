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
        Schema::create('projects', function (Blueprint $table) {
            $table->id();
            $table->string('slug')->unique();
            $table->enum('category', ['web', 'mobile', 'ai', 'design', 'erp']);
            $table->string('client');
            $table->unsignedSmallInteger('year');
            $table->enum('status', ['completed', 'in_progress'])->default('completed');
            $table->string('name_ar');
            $table->string('name_en');
            $table->string('short_ar');
            $table->string('short_en');
            $table->text('description_ar');
            $table->text('description_en');
            $table->string('cover_image')->nullable();
            $table->json('gallery')->nullable();
            $table->string('video_url')->nullable();
            $table->boolean('featured')->default(false);
            $table->unsignedInteger('order')->default(0);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('projects');
    }
};
