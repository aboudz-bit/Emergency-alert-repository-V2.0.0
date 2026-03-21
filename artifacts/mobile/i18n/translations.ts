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

  // Alert types (data-driven)
  typeBlackout: string;
  typeShelterIn: string;
  typeSecurityAlert: string;
  typeDrill: string;
  typeAllClear: string;
  typeRestrictedMovement: string;

  // Alert titles (data-driven)
  titleBlackoutActivated: string;
  titleSecurityIncident: string;
  titleShelterInPlace: string;
  titleEmergencyEvacDrill: string;
  titleAllClear: string;

  // Alert messages (data-driven)
  msgBlackout: string;
  msgSecurity: string;
  msgShelterIn: string;
  msgDrill: string;
  msgAllClear: string;
  msgAllClearResolved: string;

  // Shelter names (data-driven)
  shelterAMainGate: string;
  shelterBControlRoom: string;
  shelterCSouthWing: string;
  shelterDEmergencyBay: string;

  // Zone names (data-driven)
  allZones: string;

  // Role labels
  roleUser: string;
  roleContractor: string;

  // Priority labels
  priorityHigh: string;
  priorityMedium: string;
  priorityLow: string;

  // Wind picker
  windDirection: string;
  clearWind: string;

  // Zone breakdown short labels
  help: string;
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

  typeBlackout: 'Blackout',
  typeShelterIn: 'Shelter-in',
  typeSecurityAlert: 'Security Alert',
  typeDrill: 'Drill',
  typeAllClear: 'All Clear',
  typeRestrictedMovement: 'Restricted Movement',

  titleBlackoutActivated: 'BLACKOUT ACTIVATED',
  titleSecurityIncident: 'SECURITY INCIDENT',
  titleShelterInPlace: 'SHELTER IN PLACE',
  titleEmergencyEvacDrill: 'EMERGENCY EVACUATION DRILL',
  titleAllClear: 'ALL CLEAR',

  msgBlackout: 'A blackout condition has been detected in the CPF zone. All personnel must immediately proceed to their designated muster points and await further instructions from the emergency coordinator.',
  msgSecurity: 'Please remain indoors and lock all doors until further notice.',
  msgShelterIn: 'Toxic gas alarm triggered. Shelter in place immediately.',
  msgDrill: 'This is a drill. Proceed to muster points.',
  msgAllClear: 'The previous emergency condition has been resolved. Return to normal operations.',
  msgAllClearResolved: 'The emergency condition has been fully resolved. All personnel may return to normal operations.',

  shelterAMainGate: 'Shelter A - Main Gate',
  shelterBControlRoom: 'Shelter B - Control Room',
  shelterCSouthWing: 'Shelter C - South Wing',
  shelterDEmergencyBay: 'Shelter D - Emergency Bay',

  allZones: 'All Zones',

  roleUser: 'User',
  roleContractor: 'Contractor',

  priorityHigh: 'High',
  priorityMedium: 'Medium',
  priorityLow: 'Low',

  windDirection: 'Wind Direction',
  clearWind: 'Clear Wind',

  help: 'Help',
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

  typeBlackout: 'انقطاع الكهرباء',
  typeShelterIn: 'احتمِ بالمكان',
  typeSecurityAlert: 'تنبيه أمني',
  typeDrill: 'تمرين',
  typeAllClear: 'انتهاء الطوارئ',
  typeRestrictedMovement: 'تقييد الحركة',

  titleBlackoutActivated: 'تم تفعيل انقطاع الكهرباء',
  titleSecurityIncident: 'حادث أمني',
  titleShelterInPlace: 'احتمِ في مكانك',
  titleEmergencyEvacDrill: 'تمرين إخلاء طوارئ',
  titleAllClear: 'انتهاء الطوارئ',

  msgBlackout: 'تم اكتشاف حالة انقطاع كهرباء في منطقة CPF. يجب على جميع الأفراد التوجه فوراً إلى نقاط التجمع المخصصة وانتظار تعليمات منسق الطوارئ.',
  msgSecurity: 'يرجى البقاء في الداخل وقفل جميع الأبواب حتى إشعار آخر.',
  msgShelterIn: 'تم تفعيل إنذار الغاز السام. احتمِ في مكانك فوراً.',
  msgDrill: 'هذا تمرين. توجه إلى نقاط التجمع.',
  msgAllClear: 'تم حل حالة الطوارئ السابقة. عُد إلى العمليات العادية.',
  msgAllClearResolved: 'تم حل حالة الطوارئ بالكامل. يمكن لجميع الأفراد العودة إلى العمليات العادية.',

  shelterAMainGate: 'ملجأ أ - البوابة الرئيسية',
  shelterBControlRoom: 'ملجأ ب - غرفة التحكم',
  shelterCSouthWing: 'ملجأ ج - الجناح الجنوبي',
  shelterDEmergencyBay: 'ملجأ د - خليج الطوارئ',

  allZones: 'جميع المناطق',

  roleUser: 'مستخدم',
  roleContractor: 'مقاول',

  priorityHigh: 'عالية',
  priorityMedium: 'متوسطة',
  priorityLow: 'منخفضة',

  windDirection: 'اتجاه الرياح',
  clearWind: 'مسح الرياح',

  help: 'مساعدة',
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

  typeBlackout: 'بلیک آؤٹ',
  typeShelterIn: 'پناہ لیں',
  typeSecurityAlert: 'سیکیورٹی الرٹ',
  typeDrill: 'مشق',
  typeAllClear: 'سب ٹھیک',
  typeRestrictedMovement: 'نقل و حرکت پر پابندی',

  titleBlackoutActivated: 'بلیک آؤٹ فعال',
  titleSecurityIncident: 'سیکیورٹی واقعہ',
  titleShelterInPlace: 'اپنی جگہ پناہ لیں',
  titleEmergencyEvacDrill: 'ایمرجنسی انخلا مشق',
  titleAllClear: 'سب ٹھیک ہے',

  msgBlackout: 'CPF زون میں بلیک آؤٹ کا پتا چلا ہے۔ تمام اہلکاروں کو فوری طور پر اپنے مقررہ جمع مقامات پر جانا چاہیے اور ایمرجنسی کوآرڈینیٹر کی مزید ہدایات کا انتظار کرنا چاہیے۔',
  msgSecurity: 'براہ کرم اندر رہیں اور اگلے نوٹس تک تمام دروازے بند رکھیں۔',
  msgShelterIn: 'زہریلی گیس کا الارم بجا۔ فوری طور پر اپنی جگہ پناہ لیں۔',
  msgDrill: 'یہ ایک مشق ہے۔ جمع مقامات پر جائیں۔',
  msgAllClear: 'پچھلی ایمرجنسی حل ہو گئی ہے۔ معمول کی کارروائیوں پر واپس آئیں۔',
  msgAllClearResolved: 'ایمرجنسی مکمل طور پر حل ہو گئی ہے۔ تمام اہلکار معمول کی کارروائیوں پر واپس آ سکتے ہیں۔',

  shelterAMainGate: 'پناہ گاہ الف - مرکزی دروازہ',
  shelterBControlRoom: 'پناہ گاہ ب - کنٹرول روم',
  shelterCSouthWing: 'پناہ گاہ ج - جنوبی حصہ',
  shelterDEmergencyBay: 'پناہ گاہ د - ایمرجنسی بے',

  allZones: 'تمام زونز',

  roleUser: 'صارف',
  roleContractor: 'ٹھیکیدار',

  priorityHigh: 'اعلی',
  priorityMedium: 'درمیانہ',
  priorityLow: 'کم',

  windDirection: 'ہوا کی سمت',
  clearWind: 'ہوا صاف کریں',

  help: 'مدد',
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

/**
 * Translate dynamic data values (alert types, titles, messages, shelter names, etc.)
 * so that data coming from the store/mock-data is displayed in the user's language.
 */
const alertTypeMap: Record<string, keyof TranslationStrings> = {
  'Blackout': 'typeBlackout',
  'Shelter-in': 'typeShelterIn',
  'Security Alert': 'typeSecurityAlert',
  'Drill': 'typeDrill',
  'All Clear': 'typeAllClear',
  'Restricted Movement': 'typeRestrictedMovement',
};

const alertTitleMap: Record<string, keyof TranslationStrings> = {
  'BLACKOUT ACTIVATED': 'titleBlackoutActivated',
  'SECURITY INCIDENT': 'titleSecurityIncident',
  'SHELTER IN PLACE': 'titleShelterInPlace',
  'EMERGENCY EVACUATION DRILL': 'titleEmergencyEvacDrill',
  'ALL CLEAR': 'titleAllClear',
};

const alertMessageMap: Record<string, keyof TranslationStrings> = {
  'A blackout condition has been detected in the CPF zone. All personnel must immediately proceed to their designated muster points and await further instructions from the emergency coordinator.': 'msgBlackout',
  'Please remain indoors and lock all doors until further notice.': 'msgSecurity',
  'Toxic gas alarm triggered. Shelter in place immediately.': 'msgShelterIn',
  'This is a drill. Proceed to muster points.': 'msgDrill',
  'The previous emergency condition has been resolved. Return to normal operations.': 'msgAllClear',
  'The emergency condition has been fully resolved. All personnel may return to normal operations.': 'msgAllClearResolved',
};

const shelterNameMap: Record<string, keyof TranslationStrings> = {
  'Shelter A - Main Gate': 'shelterAMainGate',
  'Shelter B - Control Room': 'shelterBControlRoom',
  'Shelter C - South Wing': 'shelterCSouthWing',
  'Shelter D - Emergency Bay': 'shelterDEmergencyBay',
};

const zoneNameMap: Record<string, keyof TranslationStrings> = {
  'All Zones': 'allZones',
};

const roleMap: Record<string, keyof TranslationStrings> = {
  'User': 'roleUser',
  'Contractor': 'roleContractor',
};

const priorityMap: Record<string, keyof TranslationStrings> = {
  'High': 'priorityHigh',
  'Medium': 'priorityMedium',
  'Low': 'priorityLow',
};

export function translateAlertType(value: string, t: TranslationStrings): string {
  const key = alertTypeMap[value];
  return key ? t[key] : value;
}

export function translateAlertTitle(value: string, t: TranslationStrings): string {
  const key = alertTitleMap[value];
  return key ? t[key] : value;
}

export function translateAlertMessage(value: string, t: TranslationStrings): string {
  const key = alertMessageMap[value];
  return key ? t[key] : value;
}

export function translateShelterName(value: string, t: TranslationStrings): string {
  const key = shelterNameMap[value];
  return key ? t[key] : value;
}

export function translateZone(value: string, t: TranslationStrings): string {
  const key = zoneNameMap[value];
  return key ? t[key] : value;
}

export function translateRole(value: string, t: TranslationStrings): string {
  const key = roleMap[value];
  return key ? t[key] : value;
}

export function translatePriority(value: string, t: TranslationStrings): string {
  const key = priorityMap[value];
  return key ? t[key] : value;
}
