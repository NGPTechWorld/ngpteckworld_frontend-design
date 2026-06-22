<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Project extends Model
{
    protected $guarded = [];
    protected $casts = ['gallery' => 'array', 'featured' => 'boolean'];

    public function getRouteKeyName(): string { return 'slug'; }

    public function teamMembers(): HasMany { return $this->hasMany(TeamMember::class)->orderBy('order'); }
    public function links(): HasMany { return $this->hasMany(ProjectLink::class)->orderBy('order'); }
}
