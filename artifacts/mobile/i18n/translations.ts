import { I18nManager } from 'react-native';
import type { Language } from '@/types';

/**
 * Apply RTL layout flags based on language.
 * The root _layout.tsx useEffect + GestureHandlerRootView direction style
 * handle the actual visual update — no app reload needed.
 */
export function applyRTL(lang: Language): void {
  const shouldBeRTL = lang === 'ar' || lang === 'ur';

  if (I18nManager.isRTL !== shouldBeRTL) {
    I18nManager.allowRTL(shouldBeRTL);
    I18nManager.forceRTL(shouldBeRTL);
  }
}

export interface TranslationStrings {
  // Tab names
  dashboard: string;
  map: string;
  alerts: string;
  profile: string;

  // Response buttons
  iAmSafe: string;
  needHelp: string;

  // Emergency types / modes
  shelterIn: string;
  blackout: string;

  // Actions
  goToShelter: string;

  // Labels
  alert: string;
  safe: string;
  wind: string;

  // Profile screen
  contractorProfile: string;
  language: string;
  information: string;
  system: string;
  zone: string;
  location: string;
  accountStatus: string;
  gpsStatus: string;
  notificationStatus: string;
  appVersion: string;
  logOut: string;

  // Dashboard
  hello: string;
  activeEmergency: string;
  noActiveAlerts: string;
  allSystemsOperational: string;
  responseConfirmed: string;
  helpRequested: string;
  markedAsSafe: string;
  helpOnTheWay: string;
  gpsActive: string;
  currentLocation: string;
  nearbyShelters: string;
  available: string;
  nearestShelter: string;

  // Alert history
  alertHistory: string;
  pastAlerts: string;
  noAlertHistory: string;
  pastAlertsWillAppear: string;
  pending: string;

  // Alert detail
  noActiveAlert: string;
  noEmergencyAlerts: string;
  backToHome: string;
  alertMessage: string;
  issued: string;
  sentBy: string;
  liveResponseStatus: string;
  confirmYouAreSafe: string;
  requestAssistance: string;
  noFurtherAction: string;
  assistanceOnTheWay: string;

  // Status labels (StatusBadge)
  statusSafe: string;
  statusPending: string;
  statusNeedHelp: string;
  statusActive: string;
  statusClosed: string;
  statusDraft: string;
  statusDisabled: string;
  statusMissing: string;
  statusNoReply: string;
  statusEnabled: string;
  statusOnline: string;

  // Emergency mode banner
  shelterInActivated: string;
  blackoutActivated: string;

  // Map screen
  nearest: string;
  gpsUnavailable: string;
  sheltersAvailable: string;
  active: string;
  unknown: string;

  // Time ago
  justNow: string;
  minutesAgo: string;
  hoursAgo: string;
  daysAgo: string;
}

const en: TranslationStrings = {
  dashboard: 'Home',
  map: 'Map',
  alerts: 'Alerts',
  profile: 'Profile',

  iAmSafe: 'I AM SAFE',
  needHelp: 'NEED HELP',

  shelterIn: 'Shelter-in',
  blackout: 'Blackout',

  goToShelter: 'Go to shelter',

  alert: 'Alert',
  safe: 'Safe',
  wind: 'Wind',

  contractorProfile: 'Contractor',
  language: 'Language',
  information: 'Information',
  system: 'System',
  zone: 'Zone',
  location: 'Location',
  accountStatus: 'Account Status',
  gpsStatus: 'GPS Status',
  notificationStatus: 'Notification Status',
  appVersion: 'App Version',
  logOut: 'Log Out',

  hello: 'Hello,',
  activeEmergency: 'ACTIVE EMERGENCY',
  noActiveAlerts: 'No Active Alerts',
  allSystemsOperational: 'All systems operational. You will be notified immediately if an emergency alert is issued.',
  responseConfirmed: 'Response Confirmed',
  helpRequested: 'Help Requested',
  markedAsSafe: 'You have been marked as safe',
  helpOnTheWay: 'Help is on the way',
  gpsActive: 'GPS Active',
  currentLocation: 'Current Location',
  nearbyShelters: 'Nearby Shelters',
  available: 'available',
  nearestShelter: 'Nearest Shelter',

  alertHistory: 'Alert History',
  pastAlerts: 'past alerts',
  noAlertHistory: 'No Alert History',
  pastAlertsWillAppear: 'Past emergency alerts will appear here once they have been closed.',
  pending: 'Pending',

  noActiveAlert: 'No Active Alert',
  noEmergencyAlerts: 'There are no emergency alerts at this time. You will be notified immediately if one is issued.',
  backToHome: 'Back to Home',
  alertMessage: 'Alert Message',
  issued: 'Issued',
  sentBy: 'Sent By',
  liveResponseStatus: 'Live Response Status',
  confirmYouAreSafe: 'Confirm you are safe',
  requestAssistance: 'Request assistance',
  noFurtherAction: 'You have been marked as safe. No further action required.',
  assistanceOnTheWay: 'Your request for help has been received. Assistance is on the way.',

  statusSafe: 'Safe',
  statusPending: 'Pending',
  statusNeedHelp: 'Need Help',
  statusActive: 'Active',
  statusClosed: 'Closed',
  statusDraft: 'Draft',
  statusDisabled: 'Disabled',
  statusMissing: 'Missing',
  statusNoReply: 'No Reply',
  statusEnabled: 'Active',
  statusOnline: 'Online',

  shelterInActivated: 'Shelter In Activated – Please go to shelter',
  blackoutActivated: 'Blackout Activated',

  nearest: 'Nearest',
  gpsUnavailable: 'GPS unavailable',
  sheltersAvailable: 'shelters available',
  active: 'active',
  unknown: 'Unknown',

  justNow: 'Just now',
  minutesAgo: 'm ago',
  hoursAgo: 'h ago',
  daysAgo: 'd ago',
};

const ar: TranslationStrings = {
  dashboard: 'الرئيسية',
  map: 'الخريطة',
  alerts: 'التنبيهات',
  profile: 'الملف الشخصي',

  iAmSafe: 'أنا بأمان',
  needHelp: 'أحتاج مساعدة',

  shelterIn: 'احتمِ بالمكان',
  blackout: 'انقطاع الكهرباء',

  goToShelter: 'اذهب إلى الملجأ',

  alert: 'تنبيه',
  safe: 'آمن',
  wind: 'الرياح',

  contractorProfile: 'مقاول',
  language: 'اللغة',
  information: 'المعلومات',
  system: 'النظام',
  zone: 'المنطقة',
  location: 'الموقع',
  accountStatus: 'حالة الحساب',
  gpsStatus: 'حالة GPS',
  notificationStatus: 'حالة الإشعارات',
  appVersion: 'إصدار التطبيق',
  logOut: 'تسجيل الخروج',

  hello: 'مرحباً،',
  activeEmergency: 'حالة طوارئ نشطة',
  noActiveAlerts: 'لا توجد تنبيهات نشطة',
  allSystemsOperational: 'جميع الأنظمة تعمل بشكل طبيعي. سيتم إخطارك فوراً في حال صدور تنبيه طوارئ.',
  responseConfirmed: 'تم تأكيد الاستجابة',
  helpRequested: 'تم طلب المساعدة',
  markedAsSafe: 'تم تسجيلك كآمن',
  helpOnTheWay: 'المساعدة في الطريق',
  gpsActive: 'GPS نشط',
  currentLocation: 'الموقع الحالي',
  nearbyShelters: 'الملاجئ القريبة',
  available: 'متاحة',
  nearestShelter: 'أقرب ملجأ',

  alertHistory: 'سجل التنبيهات',
  pastAlerts: 'تنبيهات سابقة',
  noAlertHistory: 'لا يوجد سجل تنبيهات',
  pastAlertsWillAppear: 'ستظهر تنبيهات الطوارئ السابقة هنا بعد إغلاقها.',
  pending: 'قيد الانتظار',

  noActiveAlert: 'لا يوجد تنبيه نشط',
  noEmergencyAlerts: 'لا توجد تنبيهات طوارئ في الوقت الحالي. سيتم إخطارك فوراً عند صدور تنبيه.',
  backToHome: 'العودة للرئيسية',
  alertMessage: 'رسالة التنبيه',
  issued: 'صدر',
  sentBy: 'أرسل بواسطة',
  liveResponseStatus: 'حالة الاستجابة المباشرة',
  confirmYouAreSafe: 'أكد أنك بأمان',
  requestAssistance: 'اطلب المساعدة',
  noFurtherAction: 'تم تسجيلك كآمن. لا يلزم اتخاذ إجراء إضافي.',
  assistanceOnTheWay: 'تم استلام طلب المساعدة. المساعدة في الطريق.',

  statusSafe: 'آمن',
  statusPending: 'قيد الانتظار',
  statusNeedHelp: 'يحتاج مساعدة',
  statusActive: 'نشط',
  statusClosed: 'مغلق',
  statusDraft: 'مسودة',
  statusDisabled: 'معطّل',
  statusMissing: 'مفقود',
  statusNoReply: 'لا رد',
  statusEnabled: 'نشط',
  statusOnline: 'متصل',

  shelterInActivated: 'تم تفعيل الاحتماء – اذهب إلى الملجأ',
  blackoutActivated: 'تم تفعيل انقطاع الكهرباء',

  nearest: 'الأقرب',
  gpsUnavailable: 'GPS غير متاح',
  sheltersAvailable: 'ملاجئ متاحة',
  active: 'نشط',
  unknown: 'غير معروف',

  justNow: 'الآن',
  minutesAgo: 'د مضت',
  hoursAgo: 'س مضت',
  daysAgo: 'ي مضت',
};

const ur: TranslationStrings = {
  dashboard: 'ہوم',
  map: 'نقشہ',
  alerts: 'الرٹس',
  profile: 'پروفائل',

  iAmSafe: 'میں محفوظ ہوں',
  needHelp: 'مدد چاہیے',

  shelterIn: 'پناہ لیں',
  blackout: 'بلیک آؤٹ',

  goToShelter: 'پناہ گاہ جائیں',

  alert: 'الرٹ',
  safe: 'محفوظ',
  wind: 'ہوا',

  contractorProfile: 'ٹھیکیدار',
  language: 'زبان',
  information: 'معلومات',
  system: 'سسٹم',
  zone: 'زون',
  location: 'مقام',
  accountStatus: 'اکاؤنٹ کی حالت',
  gpsStatus: 'GPS کی حالت',
  notificationStatus: 'اطلاع کی حالت',
  appVersion: 'ایپ ورژن',
  logOut: 'لاگ آؤٹ',

  hello: 'ہیلو،',
  activeEmergency: 'فعال ایمرجنسی',
  noActiveAlerts: 'کوئی فعال الرٹ نہیں',
  allSystemsOperational: 'تمام سسٹم فعال ہیں۔ ایمرجنسی الرٹ جاری ہونے پر آپ کو فوری مطلع کیا جائے گا۔',
  responseConfirmed: 'جواب کی تصدیق ہو گئی',
  helpRequested: 'مدد کی درخواست',
  markedAsSafe: 'آپ کو محفوظ نشان زد کیا گیا ہے',
  helpOnTheWay: 'مدد آ رہی ہے',
  gpsActive: 'GPS فعال',
  currentLocation: 'موجودہ مقام',
  nearbyShelters: 'قریبی پناہ گاہیں',
  available: 'دستیاب',
  nearestShelter: 'قریب ترین پناہ گاہ',

  alertHistory: 'الرٹ ہسٹری',
  pastAlerts: 'پچھلے الرٹس',
  noAlertHistory: 'کوئی الرٹ ہسٹری نہیں',
  pastAlertsWillAppear: 'پچھلے ایمرجنسی الرٹس بند ہونے کے بعد یہاں دکھائی دیں گے۔',
  pending: 'زیر التوا',

  noActiveAlert: 'کوئی فعال الرٹ نہیں',
  noEmergencyAlerts: 'اس وقت کوئی ایمرجنسی الرٹ نہیں ہے۔ الرٹ جاری ہونے پر آپ کو فوری مطلع کیا جائے گا۔',
  backToHome: 'ہوم پر واپس',
  alertMessage: 'الرٹ پیغام',
  issued: 'جاری',
  sentBy: 'بھیجنے والا',
  liveResponseStatus: 'لائیو جوابی حالت',
  confirmYouAreSafe: 'تصدیق کریں کہ آپ محفوظ ہیں',
  requestAssistance: 'مدد کی درخواست کریں',
  noFurtherAction: 'آپ کو محفوظ نشان زد کیا گیا ہے۔ مزید کارروائی کی ضرورت نہیں۔',
  assistanceOnTheWay: 'آپ کی مدد کی درخواست موصول ہو گئی ہے۔ مدد آ رہی ہے۔',

  statusSafe: 'محفوظ',
  statusPending: 'زیر التوا',
  statusNeedHelp: 'مدد چاہیے',
  statusActive: 'فعال',
  statusClosed: 'بند',
  statusDraft: 'مسودہ',
  statusDisabled: 'غیر فعال',
  statusMissing: 'غائب',
  statusNoReply: 'کوئی جواب نہیں',
  statusEnabled: 'فعال',
  statusOnline: 'آن لائن',

  shelterInActivated: 'پناہ فعال – پناہ گاہ جائیں',
  blackoutActivated: 'بلیک آؤٹ فعال',

  nearest: 'قریب ترین',
  gpsUnavailable: 'GPS دستیاب نہیں',
  sheltersAvailable: 'پناہ گاہیں دستیاب',
  active: 'فعال',
  unknown: 'نامعلوم',

  justNow: 'ابھی',
  minutesAgo: 'منٹ پہلے',
  hoursAgo: 'گھنٹے پہلے',
  daysAgo: 'دن پہلے',
};

export const translations: Record<Language, TranslationStrings> = { en, ar, ur };

export const LANGUAGE_OPTIONS: { value: Language; label: string; nativeLabel: string }[] = [
  { value: 'en', label: 'English', nativeLabel: 'English' },
  { value: 'ar', label: 'Arabic', nativeLabel: 'العربية' },
  { value: 'ur', label: 'Urdu', nativeLabel: 'اردو' },
];

export function isRTL(lang: Language): boolean {
  return lang === 'ar' || lang === 'ur';
}
