<?php

namespace App\Support;

class SeedData
{
    public static function services(): array
    {
        return [
            [
                'icon_key'       => 'web',
                'title_ar'       => 'تطوير تطبيقات الويب',
                'title_en'       => 'Web Development',
                'description_ar' => 'مواقع وتطبيقات ويب سريعة وآمنة بأحدث التقنيات.',
                'description_en' => 'Fast, secure web apps and sites built with modern tech.',
                'features_ar'    => ['أداء وسرعة عالية', 'تصميم متجاوب', 'لوحات تحكم'],
                'features_en'    => ['High performance', 'Responsive design', 'Dashboards'],
            ],
            [
                'icon_key'       => 'mobile',
                'title_ar'       => 'تطبيقات الموبايل',
                'title_en'       => 'Mobile Apps',
                'description_ar' => 'تطبيقات iOS و Android أصلية وهجينة بتجربة سلسة.',
                'description_en' => 'Native and hybrid iOS & Android apps with a seamless UX.',
                'features_ar'    => ['iOS و Android', 'تجربة سلسة', 'إشعارات فورية'],
                'features_en'    => ['iOS & Android', 'Seamless UX', 'Push notifications'],
            ],
            [
                'icon_key'       => 'design',
                'title_ar'       => 'تصميم UI/UX',
                'title_en'       => 'UI/UX Design',
                'description_ar' => 'تصاميم واجهات عصرية تركّز على المستخدم وتزيد التحويلات.',
                'description_en' => 'Modern, user-centered interfaces that boost conversions.',
                'features_ar'    => ['أبحاث المستخدم', 'نماذج تفاعلية', 'أنظمة تصميم'],
                'features_en'    => ['User research', 'Interactive prototypes', 'Design systems'],
            ],
            [
                'icon_key'       => 'erp',
                'title_ar'       => 'أنظمة ERP / CRM',
                'title_en'       => 'ERP / CRM Systems',
                'description_ar' => 'أنظمة إدارة موارد وعلاقات عملاء تؤتمت عملياتك.',
                'description_en' => 'Resource & customer management systems that automate operations.',
                'features_ar'    => ['أتمتة العمليات', 'تقارير ذكية', 'تكامل الأقسام'],
                'features_en'    => ['Process automation', 'Smart reports', 'Department integration'],
            ],
            [
                'icon_key'       => 'cloud',
                'title_ar'       => 'الحلول السحابية',
                'title_en'       => 'Cloud Solutions',
                'description_ar' => 'بنية تحتية سحابية مرنة مع أتمتة النشر والمراقبة.',
                'description_en' => 'Flexible cloud infrastructure with automated deployment & monitoring.',
                'features_ar'    => ['استضافة مرنة', 'أمان عالٍ', 'نسخ احتياطي'],
                'features_en'    => ['Flexible hosting', 'High security', 'Backups'],
            ],
            [
                'icon_key'       => 'ai',
                'title_ar'       => 'الذكاء الاصطناعي والأتمتة',
                'title_en'       => 'AI & Automation',
                'description_ar' => 'حلول ذكاء اصطناعي ونماذج تنبؤية ومساعدات محادثة.',
                'description_en' => 'AI solutions, predictive models and conversational assistants.',
                'features_ar'    => ['نماذج تنبؤية', 'مساعدات محادثة', 'أتمتة المهام'],
                'features_en'    => ['Predictive models', 'Chat assistants', 'Task automation'],
            ],
            [
                'icon_key'       => 'support',
                'title_ar'       => 'الدعم الفني والصيانة',
                'title_en'       => 'Support & Maintenance',
                'description_ar' => 'دعم متواصل وصيانة دورية تضمن استمرارية أنظمتك.',
                'description_en' => 'Ongoing support and regular maintenance keep your systems running.',
                'features_ar'    => ['دعم 24/7', 'تحديثات دورية', 'مراقبة مستمرة'],
                'features_en'    => ['24/7 support', 'Regular updates', 'Continuous monitoring'],
            ],
        ];
    }

    public static function projects(): array
    {
        return [
            // P1
            [
                'slug'           => 'e-learning-platform',
                'category'       => 'web',
                'client'         => 'أكاديمية المعرفة',
                'year'           => 2024,
                'status'         => 'completed',
                'featured'       => true,
                'name_ar'        => 'منصة تعليم إلكتروني',
                'name_en'        => 'E-Learning Platform',
                'short_ar'       => 'منصة متكاملة للدورات والاختبارات أونلاين.',
                'short_en'       => 'A full platform for online courses & exams.',
                'description_ar' => 'منصة تعليمية متكاملة تتيح إنشاء الدورات وإدارة الطلاب والاختبارات والشهادات، مع لوحة تحكم للمدرّبين ونظام دفع إلكتروني. واجهنا تحدّيات في توسّع البث المباشر وحلّيناها ببنية سحابية مرنة.',
                'description_en' => 'A complete learning platform for creating courses, managing students, exams and certificates, with an instructor dashboard and online payments. We solved live-streaming scaling challenges with a flexible cloud architecture.',
                'team'           => [
                    [
                        'name'     => 'كريم سالم',
                        'role_ar'  => 'قائد الهندسة',
                        'role_en'  => 'Head of Engineering',
                        'tasks_ar' => ['بناء الواجهة الخلفية والـ API', 'تكامل بوابة الدفع'],
                        'tasks_en' => ['Built the backend & API', 'Payment gateway integration'],
                    ],
                    [
                        'name'     => 'لين حداد',
                        'role_ar'  => 'مصممة UI/UX',
                        'role_en'  => 'UI/UX Designer',
                        'tasks_ar' => ['تصميم تجربة المستخدم', 'نظام التصميم'],
                        'tasks_en' => ['User experience design', 'Design system'],
                    ],
                ],
                'links'          => [
                    ['type' => 'website', 'url' => '#'],
                    ['type' => 'github',  'url' => '#'],
                ],
            ],
            // P2
            [
                'slug'           => 'food-delivery-app',
                'category'       => 'mobile',
                'client'         => 'سريع للتوصيل',
                'year'           => 2023,
                'status'         => 'completed',
                'featured'       => true,
                'name_ar'        => 'تطبيق توصيل طلبات',
                'name_en'        => 'Food Delivery App',
                'short_ar'       => 'تطبيق توصيل مع تتبّع لحظي للطلبات.',
                'short_en'       => 'A delivery app with real-time order tracking.',
                'description_ar' => 'تطبيق موبايل لطلب وتوصيل الطعام مع تتبّع لحظي للسائق، إشعارات فورية، ودفع إلكتروني. صُمّم لتجربة سريعة وسلسة على iOS و Android.',
                'description_en' => 'A mobile app for ordering and delivering food with real-time driver tracking, push notifications and online payment. Designed for a fast, smooth experience on iOS & Android.',
                'team'           => [
                    [
                        'name'     => 'ياسر فهد',
                        'role_ar'  => 'مطوّر موبايل',
                        'role_en'  => 'Mobile Developer',
                        'tasks_ar' => ['تطوير تطبيق Flutter', 'تكامل الخرائط والتتبّع'],
                        'tasks_en' => ['Built the Flutter app', 'Maps & tracking integration'],
                    ],
                    [
                        'name'     => 'نور الغانم',
                        'role_ar'  => 'مديرة المنتج',
                        'role_en'  => 'Product Manager',
                        'tasks_ar' => ['تحديد المتطلبات', 'اختبار التجربة'],
                        'tasks_en' => ['Defined requirements', 'UX testing'],
                    ],
                ],
                'links'          => [
                    ['type' => 'website',   'url' => '#'],
                    ['type' => 'instagram', 'url' => '#'],
                ],
            ],
            // P3
            [
                'slug'           => 'warehouse-management-system',
                'category'       => 'erp',
                'client'         => 'مجموعة الإمداد',
                'year'           => 2024,
                'status'         => 'completed',
                'featured'       => true,
                'name_ar'        => 'نظام إدارة مستودعات',
                'name_en'        => 'Warehouse Management System',
                'short_ar'       => 'نظام ERP لإدارة المخزون والشحن.',
                'short_en'       => 'An ERP for inventory & shipping.',
                'description_ar' => 'نظام إداري متكامل لإدارة المستودعات والمخزون والشحنات مع تقارير لحظية وربط بالباركود. وفّر على العميل ساعات عمل يومية عبر الأتمتة.',
                'description_en' => 'A complete system for managing warehouses, inventory and shipments with real-time reports and barcode integration. Saved the client hours of daily work through automation.',
                'team'           => [
                    [
                        'name'     => 'كريم سالم',
                        'role_ar'  => 'مهندس أنظمة',
                        'role_en'  => 'Systems Engineer',
                        'tasks_ar' => ['تصميم قاعدة البيانات', 'وحدات المخزون والتقارير'],
                        'tasks_en' => ['Database design', 'Inventory & reporting modules'],
                    ],
                    [
                        'name'     => 'سامر درويش',
                        'role_ar'  => 'محلل أعمال',
                        'role_en'  => 'Business Analyst',
                        'tasks_ar' => ['تحليل العمليات', 'اختبار القبول'],
                        'tasks_en' => ['Process analysis', 'Acceptance testing'],
                    ],
                ],
                'links'          => [
                    ['type' => 'website', 'url' => '#'],
                ],
            ],
            // P4
            [
                'slug'           => 'smart-chat-assistant',
                'category'       => 'ai',
                'client'         => 'بنك المستقبل',
                'year'           => 2025,
                'status'         => 'in_progress',
                'featured'       => false,
                'name_ar'        => 'مساعد دردشة ذكي',
                'name_en'        => 'Smart Chat Assistant',
                'short_ar'       => 'روبوت محادثة ذكي لخدمة العملاء.',
                'short_en'       => 'An intelligent chatbot for customer service.',
                'description_ar' => 'مساعد محادثة مبني على نماذج لغوية يجيب عن استفسارات العملاء ويؤتمت المهام المتكررة، مدمج مع أنظمة البنك الداخلية. المشروع في مرحلة التطوير النشط.',
                'description_en' => 'A conversational assistant built on language models that answers customer queries and automates repetitive tasks, integrated with the bank\'s internal systems. The project is in active development.',
                'team'           => [
                    [
                        'name'     => 'ياسر فهد',
                        'role_ar'  => 'خبير ذكاء اصطناعي',
                        'role_en'  => 'AI Specialist',
                        'tasks_ar' => ['تدريب النماذج', 'هندسة الأوامر'],
                        'tasks_en' => ['Model training', 'Prompt engineering'],
                    ],
                    [
                        'name'     => 'لين حداد',
                        'role_ar'  => 'مصممة محادثة',
                        'role_en'  => 'Conversation Designer',
                        'tasks_ar' => ['تصميم تدفّق المحادثة'],
                        'tasks_en' => ['Conversation flow design'],
                    ],
                ],
                'links'          => [
                    ['type' => 'website', 'url' => '#'],
                    ['type' => 'github',  'url' => '#'],
                ],
            ],
            // P5
            [
                'slug'           => 'fashion-ecommerce-store',
                'category'       => 'web',
                'client'         => 'دار الأناقة',
                'year'           => 2023,
                'status'         => 'completed',
                'featured'       => false,
                'name_ar'        => 'متجر أزياء إلكتروني',
                'name_en'        => 'Fashion E-Commerce Store',
                'short_ar'       => 'متجر إلكتروني متكامل مع بوابات دفع.',
                'short_en'       => 'A complete online store with payment gateways.',
                'description_ar' => 'متجر إلكتروني للأزياء مع إدارة منتجات ومخزون وبوابات دفع وتحليلات مبيعات. تصميم أنيق متجاوب يركّز على تجربة الشراء.',
                'description_en' => 'A fashion e-commerce store with product & inventory management, payment gateways and sales analytics. An elegant, responsive design focused on the shopping experience.',
                'team'           => [
                    [
                        'name'     => 'لين حداد',
                        'role_ar'  => 'مصممة',
                        'role_en'  => 'Designer',
                        'tasks_ar' => ['الهوية والواجهات'],
                        'tasks_en' => ['Brand & interfaces'],
                    ],
                    [
                        'name'     => 'كريم سالم',
                        'role_ar'  => 'مطوّر',
                        'role_en'  => 'Developer',
                        'tasks_ar' => ['تطوير المتجر', 'تكامل الدفع'],
                        'tasks_en' => ['Store development', 'Payment integration'],
                    ],
                ],
                'links'          => [
                    ['type' => 'website',  'url' => '#'],
                    ['type' => 'instagram','url' => '#'],
                    ['type' => 'facebook', 'url' => '#'],
                ],
            ],
            // P6
            [
                'slug'           => 'fintech-brand-dashboard',
                'category'       => 'design',
                'client'         => 'فينتك بلس',
                'year'           => 2024,
                'status'         => 'completed',
                'featured'       => false,
                'name_ar'        => 'هوية ولوحة تحكم مالية',
                'name_en'        => 'Fintech Brand & Dashboard',
                'short_ar'       => 'هوية بصرية ولوحة تحكم لتطبيق مالي.',
                'short_en'       => 'Brand identity & dashboard for a fintech app.',
                'description_ar' => 'تصميم الهوية البصرية الكاملة ولوحة تحكم تفاعلية لتطبيق تقني مالي، مع نظام تصميم قابل للتوسّع ومخططات بيانات واضحة.',
                'description_en' => 'A complete brand identity and an interactive dashboard for a fintech application, with a scalable design system and clear data charts.',
                'team'           => [
                    [
                        'name'     => 'لين حداد',
                        'role_ar'  => 'قائدة التصميم',
                        'role_en'  => 'Design Lead',
                        'tasks_ar' => ['الهوية البصرية', 'نظام التصميم'],
                        'tasks_en' => ['Brand identity', 'Design system'],
                    ],
                    [
                        'name'     => 'نور الغانم',
                        'role_ar'  => 'مديرة المشروع',
                        'role_en'  => 'Project Manager',
                        'tasks_ar' => ['إدارة المشروع', 'مراجعة الجودة'],
                        'tasks_en' => ['Project management', 'QA review'],
                    ],
                ],
                'links'          => [
                    ['type' => 'website', 'url' => '#'],
                    ['type' => 'behance', 'url' => '#'],
                ],
            ],
        ];
    }
}
