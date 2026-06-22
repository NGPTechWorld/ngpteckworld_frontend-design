<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class ProjectListResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id'          => $this->id,
            'slug'        => $this->slug,
            'category'    => $this->category,
            'client'      => $this->client,
            'year'        => $this->year,
            'status'      => $this->status,
            'name_ar'     => $this->name_ar,
            'name_en'     => $this->name_en,
            'short_ar'    => $this->short_ar,
            'short_en'    => $this->short_en,
            'cover_image' => $this->cover_image ? asset('storage/' . $this->cover_image) : null,
            'featured'    => $this->featured,
        ];
    }
}
