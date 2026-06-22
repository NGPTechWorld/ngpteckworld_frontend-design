<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class ServiceResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id'             => $this->id,
            'icon_key'       => $this->icon_key,
            'title_ar'       => $this->title_ar,
            'title_en'       => $this->title_en,
            'description_ar' => $this->description_ar,
            'description_en' => $this->description_en,
            'features_ar'    => $this->features_ar,
            'features_en'    => $this->features_en,
        ];
    }
}
