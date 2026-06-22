<?php

namespace Database\Seeders;

use App\Models\Service;
use Illuminate\Database\Seeder;

class ServiceSeeder extends Seeder
{
    public function run(): void
    {
        Service::query()->delete();
        foreach (\App\Support\SeedData::services() as $i => $s) {
            Service::create($s + ['order' => $i]);
        }
    }
}
