<?php

namespace Database\Seeders;

use App\Models\Project;
use Illuminate\Database\Seeder;

class ProjectSeeder extends Seeder
{
    public function run(): void
    {
        Project::query()->delete();
        foreach (\App\Support\SeedData::projects() as $i => $p) {
            $team = $p['team'];
            $links = $p['links'];
            $featured = $p['featured'] ?? false;
            unset($p['team'], $p['links'], $p['featured']);
            $project = Project::create($p + ['order' => $i, 'featured' => $featured]);
            foreach ($team as $j => $m) {
                $project->teamMembers()->create($m + ['order' => $j]);
            }
            foreach ($links as $j => $l) {
                $project->links()->create($l + ['order' => $j]);
            }
        }
    }
}
