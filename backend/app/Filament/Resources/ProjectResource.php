<?php

namespace App\Filament\Resources;

use App\Filament\Resources\ProjectResource\Pages;
use App\Filament\Resources\ProjectResource\RelationManagers;
use App\Models\Project;
use Filament\Forms;
use Filament\Forms\Form;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\SoftDeletingScope;

class ProjectResource extends Resource
{
    protected static ?string $model = Project::class;

    protected static ?string $navigationIcon = 'heroicon-o-folder-open';

    public static function form(Form $form): Form
    {
        return $form
            ->schema([
                Forms\Components\TextInput::make('slug')
                    ->required()
                    ->unique(ignoreRecord: true),
                Forms\Components\Select::make('category')
                    ->required()
                    ->options([
                        'web' => 'Web',
                        'mobile' => 'Mobile',
                        'ai' => 'AI',
                        'design' => 'Design',
                        'erp' => 'ERP',
                    ]),
                Forms\Components\TextInput::make('client')
                    ->required(),
                Forms\Components\TextInput::make('year')
                    ->numeric()
                    ->required(),
                Forms\Components\Select::make('status')
                    ->options([
                        'completed' => 'Completed',
                        'in_progress' => 'In progress',
                    ])
                    ->default('completed'),
                Forms\Components\Toggle::make('featured'),
                Forms\Components\TextInput::make('name_ar')
                    ->required(),
                Forms\Components\TextInput::make('name_en')
                    ->required(),
                Forms\Components\TextInput::make('short_ar')
                    ->required(),
                Forms\Components\TextInput::make('short_en')
                    ->required(),
                Forms\Components\Textarea::make('description_ar')
                    ->required(),
                Forms\Components\Textarea::make('description_en')
                    ->required(),
                Forms\Components\FileUpload::make('cover_image')
                    ->image()
                    ->directory('projects'),
                Forms\Components\FileUpload::make('gallery')
                    ->image()
                    ->multiple()
                    ->directory('projects/gallery'),
                Forms\Components\TextInput::make('video_url')
                    ->url(),
                Forms\Components\TextInput::make('order')
                    ->numeric()
                    ->default(0),
            ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                Tables\Columns\TextColumn::make('slug')
                    ->searchable(),
                Tables\Columns\TextColumn::make('category'),
                Tables\Columns\TextColumn::make('client')
                    ->searchable(),
                Tables\Columns\TextColumn::make('year')
                    ->numeric()
                    ->sortable(),
                Tables\Columns\TextColumn::make('status'),
                Tables\Columns\TextColumn::make('name_ar')
                    ->searchable(),
                Tables\Columns\TextColumn::make('name_en')
                    ->searchable(),
                Tables\Columns\ImageColumn::make('cover_image'),
                Tables\Columns\IconColumn::make('featured')
                    ->boolean(),
                Tables\Columns\TextColumn::make('order')
                    ->numeric()
                    ->sortable(),
                Tables\Columns\TextColumn::make('created_at')
                    ->dateTime()
                    ->sortable()
                    ->toggleable(isToggledHiddenByDefault: true),
                Tables\Columns\TextColumn::make('updated_at')
                    ->dateTime()
                    ->sortable()
                    ->toggleable(isToggledHiddenByDefault: true),
            ])
            ->filters([
                //
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

    public static function getRelations(): array
    {
        return [
            RelationManagers\TeamMembersRelationManager::class,
            RelationManagers\LinksRelationManager::class,
        ];
    }

    public static function getPages(): array
    {
        return [
            'index' => Pages\ListProjects::route('/'),
            'create' => Pages\CreateProject::route('/create'),
            'edit' => Pages\EditProject::route('/{record}/edit'),
        ];
    }
}
