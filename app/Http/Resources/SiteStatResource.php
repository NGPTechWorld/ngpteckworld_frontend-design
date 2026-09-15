<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class SiteStatResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id'       => $this->id,
            'value'    => $this->value,
            'label_ar' => $this->label_ar,
            'label_en' => $this->label_en,
        ];
    }
}
