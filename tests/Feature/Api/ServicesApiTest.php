<?php

use App\Models\Service;
use Illuminate\Foundation\Testing\RefreshDatabase;
use function Pest\Laravel\getJson;

uses(RefreshDatabase::class);

it('returns seeded services ordered', function () {
    $this->seed(\Database\Seeders\ServiceSeeder::class);
    getJson('/api/services')
        ->assertOk()
        ->assertJsonCount(7, 'data')
        ->assertJsonStructure(['data' => [['id', 'icon_key', 'title_ar', 'title_en', 'description_ar', 'description_en', 'features_ar', 'features_en']]]);
});
