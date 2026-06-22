<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class ProjectResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id'             => $this->id,
            'slug'           => $this->slug,
            'category'       => $this->category,
            'client'         => $this->client,
            'year'           => $this->year,
            'status'         => $this->status,
            'name_ar'        => $this->name_ar,
            'name_en'        => $this->name_en,
            'short_ar'       => $this->short_ar,
            'short_en'       => $this->short_en,
            'description_ar' => $this->description_ar,
            'description_en' => $this->description_en,
            'cover_image'    => $this->cover_image ? asset('storage/' . $this->cover_image) : null,
            'gallery'        => collect($this->gallery ?? [])->map(fn ($p) => asset('storage/' . $p)),
            'video_url'      => $this->video_url,
            'featured'       => $this->featured,
            'team'           => $this->teamMembers->map(fn ($m) => [
                'name'     => $m->name,
                'role_ar'  => $m->role_ar,
                'role_en'  => $m->role_en,
                'tasks_ar' => $m->tasks_ar,
                'tasks_en' => $m->tasks_en,
                'avatar'   => $m->avatar ? asset('storage/' . $m->avatar) : null,
            ]),
            'links' => $this->links->map(fn ($l) => [
                'type' => $l->type,
                'url'  => $l->url,
            ]),
        ];
    }
}
