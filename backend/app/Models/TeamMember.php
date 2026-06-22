<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class TeamMember extends Model
{
    protected $guarded = [];
    protected $casts = ['tasks_ar' => 'array', 'tasks_en' => 'array'];
    public function project() { return $this->belongsTo(Project::class); }
}
