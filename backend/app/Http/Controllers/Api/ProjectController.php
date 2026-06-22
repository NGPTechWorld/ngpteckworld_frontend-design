<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\ProjectListResource;
use App\Http\Resources\ProjectResource;
use App\Models\Project;
use Illuminate\Http\Request;

class ProjectController extends Controller
{
    public function index(Request $request)
    {
        $query = Project::orderBy('order');

        if ($request->filled('category') && $request->category !== 'all') {
            $query->where('category', $request->category);
        }

        return ProjectListResource::collection($query->get());
    }

    public function show(Project $project)
    {
        $project->load(['teamMembers', 'links']);

        return new ProjectResource($project);
    }
}
