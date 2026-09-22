// Feature strings: { ar: {…}, en: {…} }. Save / Cancel / validation messages come from `useCommon()`.
export default {
  ar: {
    title: 'إعدادات الموقع',
    description: 'بيانات التواصل وروابط الشبكات الاجتماعية التي تظهر للزوار في الموقع.',

    contactTitle: 'بيانات التواصل',
    contactDescription: 'تظهر في تذييل الموقع وفي صفحة «اتصل بنا».',
    email: 'البريد الإلكتروني',
    emailHint: 'اتركه فارغًا لإخفائه من الموقع.',
    phone: 'رقم الهاتف',
    phoneHint: 'اكتبه بالصيغة الدولية كما تريد أن يظهر. اتركه فارغًا لإخفائه من الموقع.',

    socialTitle: 'روابط الشبكات الاجتماعية',
    socialDescription: 'تظهر أزرار هذه الشبكات في صفحة «اتصل بنا».',
    socialInfo: 'الرابط الفارغ يُخفي زر تلك الشبكة من الموقع. أدخل الرابط كاملًا بدءًا من',
    networks: {
      facebook: { label: 'فيسبوك', hint: 'رابط صفحتك على فيسبوك، مثل' },
      instagram: { label: 'إنستغرام', hint: 'رابط حسابك على إنستغرام، مثل' },
      linkedin: { label: 'لينكد إن', hint: 'رابط صفحة الشركة على لينكد إن، مثل' },
      x: { label: 'إكس (تويتر)', hint: 'رابط حسابك على منصة إكس، مثل' },
      whatsapp: { label: 'واتساب', hint: 'رابط المحادثة المباشرة: رمز الدولة ثم الرقم دون + أو مسافات، مثل' },
    },

    discard: 'تجاهل التغييرات',
    loadFailedTitle: 'تعذّر تحميل الإعدادات',
  },
  en: {
    title: 'Site settings',
    description: 'The contact details and social links that visitors see on the website.',

    contactTitle: 'Contact details',
    contactDescription: 'Shown in the website footer and on the Contact page.',
    email: 'Email',
    emailHint: 'Leave empty to hide it from the website.',
    phone: 'Phone number',
    phoneHint: 'Write it in international format, exactly as it should appear. Leave empty to hide it from the website.',

    socialTitle: 'Social links',
    socialDescription: 'The buttons of these networks appear on the Contact page.',
    socialInfo: 'An empty link hides that network’s button on the website. Enter the full link, starting with',
    networks: {
      facebook: { label: 'Facebook', hint: 'Link to your Facebook page, e.g.' },
      instagram: { label: 'Instagram', hint: 'Link to your Instagram account, e.g.' },
      linkedin: { label: 'LinkedIn', hint: 'Link to the company page on LinkedIn, e.g.' },
      x: { label: 'X (Twitter)', hint: 'Link to your X account, e.g.' },
      whatsapp: { label: 'WhatsApp', hint: 'Direct chat link: the country code and number, no + or spaces, e.g.' },
    },

    discard: 'Discard changes',
    loadFailedTitle: 'Could not load the settings',
  },
}
