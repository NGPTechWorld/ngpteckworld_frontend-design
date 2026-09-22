// Feature strings: { ar: {…}, en: {…} } read with `const t = useStrings(strings)`.
const arRequests = (n) => (n === 0 ? 'لا طلبات' : n === 1 ? 'طلب واحد' : n === 2 ? 'طلبان' : n <= 10 ? `${n} طلبات` : `${n} طلبًا`)
const enRequests = (n) => `${n} ${n === 1 ? 'request' : 'requests'}`

export default {
  ar: {
    title: 'لوحة التحكم',
    greeting: (name) => `مرحبًا بعودتك، ${name}`,
    description: 'ملخص سريع لمحتوى الموقع والطلبات الواردة من الزوار.',
    refresh: 'تحديث',

    requestsSection: 'الطلبات',
    contentSection: 'المحتوى',
    cards: {
      requests_new: 'طلبات جديدة',
      requests_in_progress: 'قيد المعالجة',
      requests_done: 'تمت معالجتها',
      requests_total: 'إجمالي الطلبات',
      projects: 'المشاريع',
      services: 'الخدمات',
      testimonials: 'آراء العملاء',
      partners: 'الشركاء',
      faqs: 'الأسئلة الشائعة',
    },
    newHint: 'تحتاج إلى متابعة',
    newHintNone: 'لا شيء بانتظار المتابعة',

    chartTitle: 'الطلبات خلال آخر 30 يومًا',
    chartTotal: 'إجمالي الفترة',
    chartBusiest: 'أكثر الأيام طلبات',
    chartNone: 'لم يصل أي طلب خلال هذه الفترة.',
    chartAria: (total, from, to, peakCount, peakDate) => `عدد الطلبات اليومية من ${from} إلى ${to}: المجموع ${total}، وأكثر الأيام طلبات ${peakDate} بعدد ${peakCount}.`,
    chartAriaNone: (from, to) => `لا توجد طلبات بين ${from} و${to}.`,
    requestsCount: arRequests,
    viewTable: 'عرض كجدول',
    viewChart: 'عرض كرسم',
    tableDate: 'التاريخ',
    tableCount: 'عدد الطلبات',

    recentTitle: 'أحدث الطلبات',
    recentAll: 'عرض كل الطلبات',
    recentEmptyTitle: 'لا توجد طلبات بعد',
    recentEmptyHint: 'ستظهر هنا الرسائل التي يرسلها الزوار من نموذج التواصل في الموقع.',

    quickTitle: 'إجراءات سريعة',
    quick: {
      project: 'مشروع جديد',
      service: 'خدمة جديدة',
      testimonial: 'رأي عميل جديد',
      partner: 'شريك جديد',
      faq: 'سؤال جديد',
      content: 'محتوى الصفحات',
    },
  },
  en: {
    title: 'Dashboard',
    greeting: (name) => `Welcome back, ${name}`,
    description: 'A quick overview of the website content and the requests from visitors.',
    refresh: 'Refresh',

    requestsSection: 'Requests',
    contentSection: 'Content',
    cards: {
      requests_new: 'New requests',
      requests_in_progress: 'In progress',
      requests_done: 'Done',
      requests_total: 'Total requests',
      projects: 'Projects',
      services: 'Services',
      testimonials: 'Testimonials',
      partners: 'Partners',
      faqs: 'FAQ',
    },
    newHint: 'Need your attention',
    newHintNone: 'Nothing waiting',

    chartTitle: 'Requests in the last 30 days',
    chartTotal: 'Total for the period',
    chartBusiest: 'Busiest day',
    chartNone: 'No requests arrived in this period.',
    chartAria: (total, from, to, peakCount, peakDate) => `Requests per day from ${from} to ${to}: ${total} in total, busiest day ${peakDate} with ${peakCount}.`,
    chartAriaNone: (from, to) => `No requests between ${from} and ${to}.`,
    requestsCount: enRequests,
    viewTable: 'View as table',
    viewChart: 'View as chart',
    tableDate: 'Date',
    tableCount: 'Requests',

    recentTitle: 'Latest requests',
    recentAll: 'View all requests',
    recentEmptyTitle: 'No requests yet',
    recentEmptyHint: 'Messages sent by visitors through the website contact form will show up here.',

    quickTitle: 'Quick actions',
    quick: {
      project: 'New project',
      service: 'New service',
      testimonial: 'New testimonial',
      partner: 'New partner',
      faq: 'New question',
      content: 'Page content',
    },
  },
}
