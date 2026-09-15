<?php

namespace App\Filament\Resources\SiteStatResource\Pages;

use App\Filament\Resources\SiteStatResource;
use Filament\Actions;
use Filament\Resources\Pages\EditRecord;

class EditSiteStat extends EditRecord
{
    protected static string $resource = SiteStatResource::class;

    protected function getHeaderActions(): array
    {
        return [
            Actions\DeleteAction::make(),
        ];
    }
}
