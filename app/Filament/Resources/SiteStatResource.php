<?php

namespace App\Filament\Resources;

use App\Filament\Resources\SiteStatResource\Pages;
use App\Models\SiteStat;
use Filament\Forms;
use Filament\Forms\Form;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;

class SiteStatResource extends Resource
{
    protected static ?string $model = SiteStat::class;

    protected static ?string $navigationIcon = 'heroicon-o-chart-bar';

    protected static ?string $navigationLabel = 'Statistics';

    protected static ?string $modelLabel = 'Statistic';

    public static function form(Form $form): Form
    {
        return $form->schema([
            Forms\Components\TextInput::make('value')
                ->required()
                ->maxLength(50)
                ->helperText('e.g. 240+, 90+, 12'),
            Forms\Components\TextInput::make('label_ar')
                ->label('Label (Arabic)')
                ->required()
                ->maxLength(255),
            Forms\Components\TextInput::make('label_en')
                ->label('Label (English)')
                ->required()
                ->maxLength(255),
            Forms\Components\TextInput::make('order')
                ->numeric()
                ->default(0),
        ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->defaultSort('order')
            ->reorderable('order')
            ->columns([
                Tables\Columns\TextColumn::make('value')->sortable(),
                Tables\Columns\TextColumn::make('label_ar')->label('Label (Arabic)'),
                Tables\Columns\TextColumn::make('label_en')->label('Label (English)'),
                Tables\Columns\TextColumn::make('order')->sortable(),
            ])
            ->actions([
                Tables\Actions\EditAction::make(),
            ])
            ->bulkActions([
                Tables\Actions\BulkActionGroup::make([
                    Tables\Actions\DeleteBulkAction::make(),
                ]),
            ]);
    }

    public static function getPages(): array
    {
        return [
            'index'  => Pages\ListSiteStats::route('/'),
            'create' => Pages\CreateSiteStat::route('/create'),
            'edit'   => Pages\EditSiteStat::route('/{record}/edit'),
        ];
    }
}
