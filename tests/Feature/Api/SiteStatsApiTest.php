<?php

use Illuminate\Foundation\Testing\RefreshDatabase;
use function Pest\Laravel\getJson;

uses(RefreshDatabase::class);

it('returns seeded stats ordered', function () {
    $this->seed(\Database\Seeders\SiteStatSeeder::class);
    getJson('/api/stats')
        ->assertOk()
        ->assertJsonCount(4, 'data')
        ->assertJsonStructure(['data' => [['id', 'value', 'label_ar', 'label_en']]]);
});
