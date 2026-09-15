<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\SiteStatResource;
use App\Models\SiteStat;

class SiteStatController extends Controller
{
    public function index()
    {
        return SiteStatResource::collection(SiteStat::orderBy('order')->get());
    }
}
