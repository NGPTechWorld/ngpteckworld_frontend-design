// Feature strings: { ar: {…}, en: {…} }. The status names (New / In progress / Done) come from the common strings
// (`c.statusLabels`), generic words from `useCommon()`.
const arCount = (n) => (n === 1 ? 'طلب واحد' : n === 2 ? 'طلبين' : n <= 10 ? `${n} طلبات` : `${n} طلبًا`)
const enCount = (n) => `${n} ${n === 1 ? 'request' : 'requests'}`

export default {
  ar: {
    title: 'الطلبات',
    description: 'الرسائل الواردة من نموذج التواصل في الموقع. تابع حالة كل طلب وأضف ملاحظاتك الداخلية.',
    searchPlaceholder: 'ابحث في الطلبات…',
    statusTabs: 'تصفية الطلبات حسب الحالة',
    from: 'من تاريخ',
    to: 'إلى تاريخ',

    service: 'الخدمة المطلوبة',
    name: 'الاسم',
    email: 'البريد الإلكتروني',
    phone: 'الهاتف',
    receivedAt: 'تاريخ الاستلام',
    view: 'عرض الطلب',
    statusOf: (name) => `حالة طلب ${name}`,

    export: 'تصدير CSV',
    exporting: 'جارٍ التصدير…',
    exportDone: 'تم تنزيل ملف الطلبات',

    bulkActions: 'إجراءات على الطلبات المحددة',
    markAs: { new: 'تعيين كجديد', in_progress: 'تعيين كقيد المعالجة', done: 'تعيين كتمت' },
    clearSelection: 'إلغاء التحديد',
    deleteTitle: 'حذف الطلب',
    deleteMessage: (name) => `هل تريد حذف طلب «${name}»؟ لا يمكن التراجع عن ذلك.`,
    bulkDeleteTitle: 'حذف الطلبات المحددة',
    bulkDeleteMessage: (n) => `سيتم حذف ${arCount(n)} نهائيًا. لا يمكن التراجع عن ذلك.`,

    emptyTitle: 'لا توجد طلبات بعد',
    emptyHint: 'ستظهر هنا الرسائل التي يرسلها الزوار من نموذج التواصل في الموقع.',
    notFoundTitle: 'الطلب غير موجود',

    messageTitle: 'الرسالة',
    detailsTitle: 'بيانات الطلب',
    statusHint: 'يُحفظ تغيير الحالة فورًا.',
    notesTitle: 'ملاحظات داخلية',
    notesHint: 'لا يراها الزائر، وهي للفريق فقط.',
    notesPlaceholder: 'مثال: تم الاتصال بالعميل وننتظر المواصفات…',
    saveNotes: 'حفظ الملاحظات',
    reply: 'الرد بالبريد',
    notProvided: 'غير مذكور',
  },
  en: {
    title: 'Requests',
    description: 'Messages received through the website contact form. Track the status of each request and add your internal notes.',
    searchPlaceholder: 'Search requests…',
    statusTabs: 'Filter requests by status',
    from: 'From',
    to: 'To',

    service: 'Requested service',
    name: 'Name',
    email: 'Email',
    phone: 'Phone',
    receivedAt: 'Received',
    view: 'View request',
    statusOf: (name) => `Status of ${name}`,

    export: 'Export CSV',
    exporting: 'Exporting…',
    exportDone: 'The requests file was downloaded',

    bulkActions: 'Actions for the selected requests',
    markAs: { new: 'Mark as new', in_progress: 'Mark as in progress', done: 'Mark as done' },
    clearSelection: 'Clear selection',
    deleteTitle: 'Delete request',
    deleteMessage: (name) => `Delete the request from “${name}”? This cannot be undone.`,
    bulkDeleteTitle: 'Delete selected requests',
    bulkDeleteMessage: (n) => `${enCount(n)} will be permanently deleted. This cannot be undone.`,

    emptyTitle: 'No requests yet',
    emptyHint: 'Messages sent by visitors through the website contact form will show up here.',
    notFoundTitle: 'Request not found',

    messageTitle: 'Message',
    detailsTitle: 'Request details',
    statusHint: 'A status change is saved immediately.',
    notesTitle: 'Internal notes',
    notesHint: 'Visitors never see these. They are for the team only.',
    notesPlaceholder: 'e.g. Called the client, waiting for the requirements…',
    saveNotes: 'Save notes',
    reply: 'Reply by email',
    notProvided: 'Not provided',
  },
}
