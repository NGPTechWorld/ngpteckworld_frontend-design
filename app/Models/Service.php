<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class Service extends Model
{
    protected $guarded = [];
    protected $casts = ['features_ar' => 'array', 'features_en' => 'array'];
}
