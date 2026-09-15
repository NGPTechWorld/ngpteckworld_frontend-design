<?php

namespace Database\Seeders;

use App\Models\SiteStat;
use Illuminate\Database\Seeder;

class SiteStatSeeder extends Seeder
{
    public function run(): void
    {
        $stats = [
            ['value' => '240+', 'label_ar' => 'مشروع منجز', 'label_en' => 'Projects delivered'],
            ['value' => '90+',  'label_ar' => 'عميل سعيد',   'label_en' => 'Happy clients'],
            ['value' => '8+',   'label_ar' => 'سنوات خبرة',  'label_en' => 'Years experience'],
            ['value' => '12',   'label_ar' => 'دولة',        'label_en' => 'Countries'],
        ];

        foreach ($stats as $i => $stat) {
            SiteStat::updateOrCreate(
                ['value' => $stat['value'], 'label_en' => $stat['label_en']],
                $stat + ['order' => $i],
            );
        }
    }
}
