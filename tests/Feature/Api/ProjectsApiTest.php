<?php

use Illuminate\Foundation\Testing\RefreshDatabase;
use function Pest\Laravel\getJson;

uses(RefreshDatabase::class);

beforeEach(fn () => $this->seed(\Database\Seeders\ProjectSeeder::class));

it('lists all projects', function () {
    getJson('/api/projects')->assertOk()->assertJsonCount(6, 'data');
});

it('filters projects by category', function () {
    getJson('/api/projects?category=web')->assertOk()->assertJsonCount(2, 'data');
});

it('shows a project with team and links by slug', function () {
    getJson('/api/projects/e-learning-platform')
        ->assertOk()
        ->assertJsonPath('data.slug', 'e-learning-platform')
        ->assertJsonStructure(['data' => ['description_ar', 'gallery', 'video_url', 'team' => [['name', 'role_ar', 'tasks_ar']], 'links' => [['type', 'url']]]]);
});
