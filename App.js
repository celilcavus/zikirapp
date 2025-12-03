import React, { useState, useEffect, createContext, useContext } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  FlatList,
  Alert,
  ActivityIndicator,
  ScrollView,
  Platform,
  InteractionManager,
  Modal,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer, useFocusEffect } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as SQLite from 'expo-sqlite';
import * as Haptics from 'expo-haptics';
import * as NavigationBar from 'expo-navigation-bar';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Linking } from 'react-native';

// Haptics Helper Functions (Expo Go uyumluluğu için)
const safeImpactAsync = (style = 'light') => {
  try {
    if (Haptics.ImpactFeedbackStyle && Haptics.ImpactFeedbackStyle[style]) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle[style]);
    } else {
      Haptics.impactAsync(style);
    }
  } catch (error) {
    // Haptic feedback desteklenmiyorsa sessizce devam et
  }
};

const safeNotificationAsync = (type = 'success') => {
  try {
    if (Haptics.NotificationFeedbackType && Haptics.NotificationFeedbackType[type]) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType[type]);
    } else {
      Haptics.notificationAsync(type);
    }
  } catch (error) {
    // Haptic feedback desteklenmiyorsa sessizce devam et
  }
};

// Database Context
const DatabaseContext = createContext(null);

export const useDatabase = () => {
  return useContext(DatabaseContext);
};

// Dil Çevirileri
const translations = {
  tr: {
    appName: 'Zikir Matik',
    selectZikir: 'Zikir Seçin',
    customZikir: 'Özel Zikirler',
    addCustomZikir: 'Özel Zikir Ekle',
    customZikirName: 'Özel zikir adı',
    arabicText: 'Arapça metin (opsiyonel)',
    cancel: 'İptal',
    add: 'Ekle',
    delete: 'Sil',
    today: 'Bugünkü Zikir',
    target: 'Hedef',
    progress: 'İlerleme',
    reset: 'Sıfırla',
    analytics: 'Analiz',
    settings: 'Ayarlar',
    zikirler: 'Zikirler',
    recommendedZikirs: 'Önerilen Zikirler',
    custom: 'Özel',
    success: 'Başarılı',
    error: 'Hata',
    customZikirAdded: 'Özel zikir eklendi',
    customZikirDeleted: 'Özel zikir silindi',
    deleteCustomZikir: 'Özel Zikiri Sil',
    deleteCustomZikirConfirm: 'zikiri silinecek. Bu işlem geri alınamaz. Emin misiniz?',
    customZikirNotDeleted: 'Özel zikir silinemedi',
    customZikirNotAdded: 'Zikir eklenemedi',
    customZikirExists: 'Bu zikir adı zaten kullanılıyor',
    enterZikirName: 'Lütfen bir zikir adı girin',
    zikir: 'Zikir',
    back: 'Geri',
    setTarget: 'Günlük Hedef Belirle',
    targetPlaceholder: 'Hedef sayı',
    save: 'Kaydet',
    completed: 'Tamamlandı!',
    total: 'Toplam',
    // Analytics Screen
    zikirStatistics: 'Zikir İstatistikleri',
    statistics: 'İstatistikler',
    history: 'Geçmiş',
    daily: 'Günlük',
    weekly: 'Haftalık',
    monthly: 'Aylık',
    today: 'Bugün',
    thisWeek: 'Bu Hafta',
    thisMonth: 'Bu Ay',
    dailyHadith: 'Günün Hadisi',
    generalStatistics: 'Genel İstatistikler',
    avgDaily: 'Ortalama Günlük',
    dailyStreak: 'Günlük Seri',
    targetCompleted: 'Hedef Tamamlandı',
    bestDay: 'En İyi Gün',
    last7DaysTrend: 'Son 7 Gün Trendi',
    achievements: 'Başarı Rozetleri',
    unlocked: 'kazanıldı',
    // Settings Screen
    appSettings: 'Uygulama Ayarları',
    theme: 'Tema',
    defaultTarget: 'Varsayılan Hedef',
    defaultTargetDesc: 'Yeni zikirler için varsayılan günlük hedef (şu an: 100)',
    hapticFeedback: 'Haptic Feedback',
    dailyReminder: 'Günlük Hatırlatıcı',
    on: 'Açık',
    off: 'Kapalı',
    time: 'Saat (HH:MM)',
    dataManagement: 'Veri Yönetimi',
    resetAllDataDesc: 'Tüm verileri sıfırla',
    resetAllData: 'Tüm Verileri Sıfırla',
    about: 'Uygulama Hakkında',
    version: 'Versiyon',
    developer: 'Geliştirici',
    resetConfirm: 'Tüm verileri sıfırlamak istediğinize emin misiniz?',
    resetSuccess: 'Tüm veriler sıfırlandı',
    resetError: 'Veriler sıfırlanamadı',
    targetUpdated: 'Varsayılan hedef kaydedildi',
    reminderUpdated: 'Hatırlatıcı saati güncellendi',
    enterValidNumber: 'Lütfen geçerli bir sayı girin (minimum 1)',
    resetCounterConfirm: 'Sayacı sıfırlamak istediğinize emin misiniz?',
    // Achievements
    achievementsUnlocked: 'kazanıldı',
    achievement_first_100_title: 'İlk 100',
    achievement_first_100_desc: 'Toplam 100 zikir yap',
    achievement_first_1000_title: 'Binlerce Zikir',
    achievement_first_1000_desc: 'Toplam 1000 zikir yap',
    achievement_streak_7_title: '7 Günlük Seri',
    achievement_streak_7_desc: '7 gün üst üste zikir yap',
    achievement_streak_30_title: '30 Günlük Seri',
    achievement_streak_30_desc: '30 gün üst üste zikir yap',
    achievement_perfect_day_title: 'Mükemmel Gün',
    achievement_perfect_day_desc: 'Bir günde 500+ zikir yap',
    achievement_all_targets_title: 'Hedef Ustası',
    achievement_all_targets_desc: 'Bir günde tüm hedefleri tamamla',
    achievement_first_10000_title: 'On Binlerce Zikir',
    achievement_first_10000_desc: 'Toplam 10,000 zikir yap',
    achievement_first_50000_title: 'Efsanevi Sayı',
    achievement_first_50000_desc: 'Toplam 50,000 zikir yap',
    achievement_streak_100_title: '100 Günlük Seri',
    achievement_streak_100_desc: '100 gün üst üste zikir yap',
    achievement_streak_365_title: 'Yıllık Seri',
    achievement_streak_365_desc: '365 gün üst üste zikir yap',
    achievement_marathon_title: 'Maraton',
    achievement_marathon_desc: 'Bir günde 1000+ zikir yap',
    achievement_consistency_king_title: 'Tutarlılık Kralı',
    achievement_consistency_king_desc: '14 gün üst üste zikir yap',
    achievement_dedication_title: 'Adanmışlık',
    achievement_dedication_desc: '50 gün üst üste zikir yap',
    achievement_first_week_title: 'İlk Hafta',
    achievement_first_week_desc: '7 gün zikir yap (seri olmasa bile)',
    achievement_first_month_title: 'İlk Ay',
    achievement_first_month_desc: '30 gün zikir yap (seri olmasa bile)',
    achievement_first_100_days_title: '100 Gün',
    achievement_first_100_days_desc: '100 gün zikir yap (seri olmasa bile)',
    achievement_daily_master_title: 'Günlük Usta',
    achievement_daily_master_desc: 'Ortalama günlük 200+ zikir yap',
    achievement_super_daily_title: 'Süper Günlük',
    achievement_super_daily_desc: 'Ortalama günlük 500+ zikir yap',
    // Themes
    theme_dark_name: 'Koyu Tema',
    theme_dark_description: 'Klasik koyu tema',
    theme_green_name: 'Yeşil Tema',
    theme_green_description: 'İslami yeşil tema',
    theme_gold_name: 'Altın Tema',
    theme_gold_description: 'Lüks altın tema',
    theme_blue_name: 'Mavi Tema',
    theme_blue_description: 'Sakin mavi tema',
    theme_purple_name: 'Mor Tema',
    theme_purple_description: 'Modern mor tema',
  },
  en: {
    appName: 'Dhikr Counter',
    selectZikir: 'Select Dhikr',
    customZikir: 'Custom Dhikrs',
    addCustomZikir: 'Add Custom Dhikr',
    customZikirName: 'Custom dhikr name',
    arabicText: 'Arabic text (optional)',
    cancel: 'Cancel',
    add: 'Add',
    delete: 'Delete',
    today: "Today's Dhikr",
    target: 'Target',
    progress: 'Progress',
    reset: 'Reset',
    analytics: 'Analytics',
    settings: 'Settings',
    zikirler: 'Dhikrs',
    recommendedZikirs: 'Recommended Dhikrs',
    custom: 'Custom',
    success: 'Success',
    error: 'Error',
    customZikirAdded: 'Custom dhikr added',
    customZikirDeleted: 'Custom dhikr deleted',
    deleteCustomZikir: 'Delete Custom Dhikr',
    deleteCustomZikirConfirm: 'dhikr will be deleted. This action cannot be undone. Are you sure?',
    customZikirNotDeleted: 'Custom dhikr could not be deleted',
    customZikirNotAdded: 'Dhikr could not be added',
    customZikirExists: 'This dhikr name is already in use',
    enterZikirName: 'Please enter a dhikr name',
    zikir: 'Dhikr',
    back: 'Back',
    setTarget: 'Set Daily Target',
    targetPlaceholder: 'Target number',
    save: 'Save',
    completed: 'Completed!',
    total: 'Total',
    // Analytics Screen
    zikirStatistics: 'Dhikr Statistics',
    statistics: 'Statistics',
    history: 'History',
    daily: 'Daily',
    weekly: 'Weekly',
    monthly: 'Monthly',
    today: 'Today',
    thisWeek: 'This Week',
    thisMonth: 'This Month',
    dailyHadith: 'Daily Hadith',
    generalStatistics: 'General Statistics',
    avgDaily: 'Average Daily',
    dailyStreak: 'Daily Streak',
    targetCompleted: 'Target Completed',
    bestDay: 'Best Day',
    last7DaysTrend: 'Last 7 Days Trend',
    achievements: 'Achievements',
    unlocked: 'unlocked',
    // Settings Screen
    appSettings: 'App Settings',
    theme: 'Theme',
    defaultTarget: 'Default Target',
    defaultTargetDesc: 'Default daily target for new dhikrs (currently: 100)',
    hapticFeedback: 'Haptic Feedback',
    dailyReminder: 'Daily Reminder',
    on: 'On',
    off: 'Off',
    time: 'Time (HH:MM)',
    dataManagement: 'Data Management',
    resetAllDataDesc: 'Reset all data',
    resetAllData: 'Reset All Data',
    about: 'About',
    version: 'Version',
    developer: 'Developer',
    resetConfirm: 'Are you sure you want to reset all data?',
    resetSuccess: 'All data has been reset',
    resetError: 'Failed to reset data',
    targetUpdated: 'Default target saved',
    reminderUpdated: 'Reminder time updated',
    enterValidNumber: 'Please enter a valid number (minimum 1)',
    resetCounterConfirm: 'Are you sure you want to reset the counter?',
    // Achievements
    achievementsUnlocked: 'unlocked',
    achievement_first_100_title: 'First 100',
    achievement_first_100_desc: 'Complete 100 total dhikrs',
    achievement_first_1000_title: 'Thousands of Dhikrs',
    achievement_first_1000_desc: 'Complete 1000 total dhikrs',
    achievement_streak_7_title: '7 Day Streak',
    achievement_streak_7_desc: 'Do dhikr 7 days in a row',
    achievement_streak_30_title: '30 Day Streak',
    achievement_streak_30_desc: 'Do dhikr 30 days in a row',
    achievement_perfect_day_title: 'Perfect Day',
    achievement_perfect_day_desc: 'Do 500+ dhikrs in one day',
    achievement_all_targets_title: 'Target Master',
    achievement_all_targets_desc: 'Complete all targets in one day',
    achievement_first_10000_title: 'Ten Thousands',
    achievement_first_10000_desc: 'Complete 10,000 total dhikrs',
    achievement_first_50000_title: 'Legendary Number',
    achievement_first_50000_desc: 'Complete 50,000 total dhikrs',
    achievement_streak_100_title: '100 Day Streak',
    achievement_streak_100_desc: 'Do dhikr 100 days in a row',
    achievement_streak_365_title: 'Yearly Streak',
    achievement_streak_365_desc: 'Do dhikr 365 days in a row',
    achievement_marathon_title: 'Marathon',
    achievement_marathon_desc: 'Do 1000+ dhikrs in one day',
    achievement_consistency_king_title: 'Consistency King',
    achievement_consistency_king_desc: 'Do dhikr 14 days in a row',
    achievement_dedication_title: 'Dedication',
    achievement_dedication_desc: 'Do dhikr 50 days in a row',
    achievement_first_week_title: 'First Week',
    achievement_first_week_desc: 'Do dhikr for 7 days (not necessarily consecutive)',
    achievement_first_month_title: 'First Month',
    achievement_first_month_desc: 'Do dhikr for 30 days (not necessarily consecutive)',
    achievement_first_100_days_title: '100 Days',
    achievement_first_100_days_desc: 'Do dhikr for 100 days (not necessarily consecutive)',
    achievement_daily_master_title: 'Daily Master',
    achievement_daily_master_desc: 'Average 200+ dhikrs per day',
    achievement_super_daily_title: 'Super Daily',
    achievement_super_daily_desc: 'Average 500+ dhikrs per day',
    // Themes
    theme_dark_name: 'Dark Theme',
    theme_dark_description: 'Classic dark theme',
    theme_green_name: 'Green Theme',
    theme_green_description: 'Islamic green theme',
    theme_gold_name: 'Gold Theme',
    theme_gold_description: 'Luxury gold theme',
    theme_blue_name: 'Blue Theme',
    theme_blue_description: 'Calm blue theme',
    theme_purple_name: 'Purple Theme',
    theme_purple_description: 'Modern purple theme',
  },
  ar: {
    appName: 'عداد الذكر',
    selectZikir: 'اختر الذكر',
    customZikir: 'أذكار مخصصة',
    addCustomZikir: 'إضافة ذكر مخصص',
    customZikirName: 'اسم الذكر المخصص',
    arabicText: 'النص العربي (اختياري)',
    cancel: 'إلغاء',
    add: 'إضافة',
    delete: 'حذف',
    today: 'ذكر اليوم',
    target: 'الهدف',
    progress: 'التقدم',
    reset: 'إعادة تعيين',
    analytics: 'التحليلات',
    settings: 'الإعدادات',
    zikirler: 'الأذكار',
    recommendedZikirs: 'الأذكار المقترحة',
    custom: 'مخصص',
    success: 'نجح',
    error: 'خطأ',
    customZikirAdded: 'تمت إضافة الذكر المخصص',
    customZikirDeleted: 'تم حذف الذكر المخصص',
    deleteCustomZikir: 'حذف الذكر المخصص',
    deleteCustomZikirConfirm: 'سيتم حذف الذكر. لا يمكن التراجع عن هذا الإجراء. هل أنت متأكد؟',
    customZikirNotDeleted: 'لم يتم حذف الذكر المخصص',
    customZikirNotAdded: 'لم يتم إضافة الذكر',
    customZikirExists: 'اسم الذكر هذا مستخدم بالفعل',
    enterZikirName: 'الرجاء إدخال اسم الذكر',
    zikir: 'الذكر',
    back: 'رجوع',
    setTarget: 'تعيين الهدف اليومي',
    targetPlaceholder: 'عدد الهدف',
    save: 'حفظ',
    completed: 'مكتمل!',
    total: 'المجموع',
    // Analytics Screen
    zikirStatistics: 'إحصائيات الذكر',
    statistics: 'الإحصائيات',
    history: 'السجل',
    daily: 'يومي',
    weekly: 'أسبوعي',
    monthly: 'شهري',
    today: 'اليوم',
    thisWeek: 'هذا الأسبوع',
    thisMonth: 'هذا الشهر',
    dailyHadith: 'حديث اليوم',
    generalStatistics: 'الإحصائيات العامة',
    avgDaily: 'المتوسط اليومي',
    dailyStreak: 'السلسلة اليومية',
    targetCompleted: 'الهدف مكتمل',
    bestDay: 'أفضل يوم',
    last7DaysTrend: 'اتجاه آخر 7 أيام',
    achievements: 'الإنجازات',
    unlocked: 'مفتوح',
    // Settings Screen
    appSettings: 'إعدادات التطبيق',
    theme: 'المظهر',
    defaultTarget: 'الهدف الافتراضي',
    defaultTargetDesc: 'الهدف اليومي الافتراضي للأذكار الجديدة (حالياً: 100)',
    hapticFeedback: 'الرد اللمسي',
    dailyReminder: 'التذكير اليومي',
    on: 'مفتوح',
    off: 'مغلق',
    time: 'الوقت (س:د)',
    dataManagement: 'إدارة البيانات',
    resetAllDataDesc: 'إعادة تعيين جميع البيانات',
    resetAllData: 'إعادة تعيين جميع البيانات',
    about: 'حول التطبيق',
    version: 'الإصدار',
    developer: 'المطور',
    resetConfirm: 'هل أنت متأكد أنك تريد إعادة تعيين جميع البيانات؟',
    resetSuccess: 'تم إعادة تعيين جميع البيانات',
    resetError: 'فشل إعادة تعيين البيانات',
    targetUpdated: 'تم حفظ الهدف الافتراضي',
    reminderUpdated: 'تم تحديث وقت التذكير',
    enterValidNumber: 'الرجاء إدخال رقم صحيح (الحد الأدنى 1)',
    resetCounterConfirm: 'هل أنت متأكد أنك تريد إعادة تعيين العداد؟',
    // Achievements
    achievementsUnlocked: 'مفتوح',
    achievement_first_100_title: 'أول 100',
    achievement_first_100_desc: 'أكمل 100 ذكر إجمالي',
    achievement_first_1000_title: 'آلاف الأذكار',
    achievement_first_1000_desc: 'أكمل 1000 ذكر إجمالي',
    achievement_streak_7_title: 'سلسلة 7 أيام',
    achievement_streak_7_desc: 'أدِ الذكر 7 أيام متتالية',
    achievement_streak_30_title: 'سلسلة 30 يوم',
    achievement_streak_30_desc: 'أدِ الذكر 30 يوم متتالية',
    achievement_perfect_day_title: 'يوم مثالي',
    achievement_perfect_day_desc: 'أدِ 500+ ذكر في يوم واحد',
    achievement_all_targets_title: 'سيد الهدف',
    achievement_all_targets_desc: 'أكمل جميع الأهداف في يوم واحد',
    achievement_first_10000_title: 'عشرة آلاف',
    achievement_first_10000_desc: 'أكمل 10,000 ذكر إجمالي',
    achievement_first_50000_title: 'عدد أسطوري',
    achievement_first_50000_desc: 'أكمل 50,000 ذكر إجمالي',
    achievement_streak_100_title: 'سلسلة 100 يوم',
    achievement_streak_100_desc: 'أدِ الذكر 100 يوم متتالية',
    achievement_streak_365_title: 'سلسلة سنوية',
    achievement_streak_365_desc: 'أدِ الذكر 365 يوم متتالية',
    achievement_marathon_title: 'ماراثون',
    achievement_marathon_desc: 'أدِ 1000+ ذكر في يوم واحد',
    achievement_consistency_king_title: 'ملك الثبات',
    achievement_consistency_king_desc: 'أدِ الذكر 14 يوم متتالية',
    achievement_dedication_title: 'التفاني',
    achievement_dedication_desc: 'أدِ الذكر 50 يوم متتالية',
    achievement_first_week_title: 'الأسبوع الأول',
    achievement_first_week_desc: 'أدِ الذكر لمدة 7 أيام (ليس بالضرورة متتالية)',
    achievement_first_month_title: 'الشهر الأول',
    achievement_first_month_desc: 'أدِ الذكر لمدة 30 يوم (ليس بالضرورة متتالية)',
    achievement_first_100_days_title: '100 يوم',
    achievement_first_100_days_desc: 'أدِ الذكر لمدة 100 يوم (ليس بالضرورة متتالية)',
    achievement_daily_master_title: 'سيد اليومي',
    achievement_daily_master_desc: 'متوسط 200+ ذكر يومياً',
    achievement_super_daily_title: 'يومي فائق',
    achievement_super_daily_desc: 'متوسط 500+ ذكر يومياً',
    // Themes
    theme_dark_name: 'المظهر الداكن',
    theme_dark_description: 'مظهر داكن كلاسيكي',
    theme_green_name: 'المظهر الأخضر',
    theme_green_description: 'مظهر أخضر إسلامي',
    theme_gold_name: 'المظهر الذهبي',
    theme_gold_description: 'مظهر ذهبي فاخر',
    theme_blue_name: 'المظهر الأزرق',
    theme_blue_description: 'مظهر أزرق هادئ',
    theme_purple_name: 'المظهر البنفسجي',
    theme_purple_description: 'مظهر بنفسجي حديث',
  },
};

// Dil Context
const LanguageContext = createContext(null);

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    return { language: 'tr', t: translations.tr, setLanguage: () => {} };
  }
  return context;
};

// Tema Tanımları
const themes = {
  dark: {
    name: 'Koyu Tema',
    description: 'Klasik koyu tema',
    colors: {
      background: '#0f172a',
      surface: '#1e293b',
      surfaceLight: '#334155',
      primary: '#6366f1',
      primaryLight: '#818cf8',
      text: '#ffffff',
      textSecondary: '#e2e8f0',
      textMuted: '#94a3b8',
      border: '#334155',
      accent: '#6366f1',
    },
  },
  green: {
    name: 'Yeşil Tema',
    description: 'İslami yeşil tema',
    colors: {
      background: '#0a1f0a',
      surface: '#1a3a1a',
      surfaceLight: '#2d4d2d',
      primary: '#22c55e',
      primaryLight: '#4ade80',
      text: '#ffffff',
      textSecondary: '#d1fae5',
      textMuted: '#86efac',
      border: '#2d4d2d',
      accent: '#22c55e',
    },
  },
  gold: {
    name: 'Altın Tema',
    description: 'Lüks altın tema',
    colors: {
      background: '#1a1a0a',
      surface: '#2d2d1a',
      surfaceLight: '#3d3d2a',
      primary: '#fbbf24',
      primaryLight: '#fcd34d',
      text: '#ffffff',
      textSecondary: '#fef3c7',
      textMuted: '#fde68a',
      border: '#3d3d2a',
      accent: '#fbbf24',
    },
  },
  blue: {
    name: 'Mavi Tema',
    description: 'Sakin mavi tema',
    colors: {
      background: '#0a1a2a',
      surface: '#1a2a3a',
      surfaceLight: '#2a3a4a',
      primary: '#3b82f6',
      primaryLight: '#60a5fa',
      text: '#ffffff',
      textSecondary: '#dbeafe',
      textMuted: '#93c5fd',
      border: '#2a3a4a',
      accent: '#3b82f6',
    },
  },
  purple: {
    name: 'Mor Tema',
    description: 'Modern mor tema',
    colors: {
      background: '#1a0a2a',
      surface: '#2a1a3a',
      surfaceLight: '#3a2a4a',
      primary: '#a855f7',
      primaryLight: '#c084fc',
      text: '#ffffff',
      textSecondary: '#f3e8ff',
      textMuted: '#d8b4fe',
      border: '#3a2a4a',
      accent: '#a855f7',
    },
  },
};

// Günlük Hadisler (Çok Dilli)
const getDailyHadith = (language = 'tr') => {
  const startDate = new Date('2024-01-01');
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffTime = today - startDate;
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  const dayOfYear = (diffDays % 365) + 1;
  
  const hadiths = {
    tr: [
      { text: "Allah'ın en çok sevdiği amel, az da olsa devamlı olanıdır.", source: "Buhari, Müslim" },
      { text: "İman yetmiş küsur şubedir. En üstünü 'La ilahe illallah' demek, en altı ise yoldan rahatsızlık veren şeyi kaldırmaktır.", source: "Buhari, Müslim" },
      { text: "Mümin, mümine karşı bir binanın tuğlaları gibidir. Birbirini sıkıca tutar.", source: "Buhari" },
      { text: "Sizden biriniz, kendisi için istediğini kardeşi için de istemedikçe gerçek anlamda iman etmiş olmaz.", source: "Buhari, Müslim" },
      { text: "Allah, sizin dış görünüşünüze ve mallarınıza bakmaz. O, kalplerinize ve amellerinize bakar.", source: "Müslim" },
      { text: "İnsanların en hayırlısı, insanlara en çok faydalı olandır.", source: "Taberani" },
      { text: "Kolaylaştırın, zorlaştırmayın. Müjdeleyin, nefret ettirmeyin.", source: "Buhari" },
      { text: "Allah'ın rızası, anne-babanın rızasındadır. Allah'ın gazabı da anne-babanın gazabındadır.", source: "Tirmizi" },
      { text: "Temizlik imanın yarısıdır.", source: "Müslim" },
      { text: "Sabır, imanın yarısıdır.", source: "Tirmizi" },
      { text: "İlim öğrenmek, her Müslüman erkek ve kadına farzdır.", source: "İbn Mace" },
      { text: "İki kişi arasında adaletle hükmetmek sadakadır.", source: "Buhari, Müslim" },
      { text: "Güzel söz sadakadır.", source: "Buhari, Müslim" },
      { text: "Yoldan rahatsızlık veren bir şeyi kaldırmak sadakadır.", source: "Buhari, Müslim" },
      { text: "Mümin, aynı delikten iki kez sokulmaz.", source: "Buhari, Müslim" },
      { text: "Mümin, başkalarıyla iyi geçinen ve kendisiyle iyi geçinilen kimsedir.", source: "Tirmizi" },
      { text: "Allah'ın en çok sevdiği kul, ailesine en çok faydalı olandır.", source: "Tirmizi" },
      { text: "En hayırlınız, Kur'an'ı öğrenen ve öğretendir.", source: "Buhari" },
      { text: "İnsanların en hayırlısı, ömrü uzun, ameli güzel olandır.", source: "Tirmizi" },
      { text: "Allah, sizin bedenlerinize ve suretlerinize bakmaz, kalplerinize ve amellerinize bakar.", source: "Müslim" },
      { text: "Mümin, mümine karşı bir binanın tuğlaları gibidir.", source: "Buhari" },
      { text: "İman yetmiş küsur şubedir. Haya da imanın bir şubesidir.", source: "Buhari, Müslim" },
      { text: "Allah'ın en çok sevdiği amel, az da olsa devamlı olanıdır.", source: "Buhari, Müslim" },
      { text: "Mümin, mümine karşı bir binanın tuğlaları gibidir. Birbirini sıkıca tutar.", source: "Buhari" },
      { text: "Sizden biriniz, kendisi için istediğini kardeşi için de istemedikçe gerçek anlamda iman etmiş olmaz.", source: "Buhari, Müslim" },
      { text: "Allah, sizin dış görünüşünüze ve mallarınıza bakmaz. O, kalplerinize ve amellerinize bakar.", source: "Müslim" },
      { text: "İnsanların en hayırlısı, insanlara en çok faydalı olandır.", source: "Taberani" },
      { text: "Kolaylaştırın, zorlaştırmayın. Müjdeleyin, nefret ettirmeyin.", source: "Buhari" },
      { text: "Allah'ın rızası, anne-babanın rızasındadır. Allah'ın gazabı da anne-babanın gazabındadır.", source: "Tirmizi" },
      { text: "Temizlik imanın yarısıdır.", source: "Müslim" },
    ],
    en: [
      { text: "The most beloved deed to Allah is the one that is consistent, even if it is small.", source: "Bukhari, Muslim" },
      { text: "Faith has over seventy branches. The highest is saying 'La ilaha illallah' and the lowest is removing something harmful from the road.", source: "Bukhari, Muslim" },
      { text: "A believer to another believer is like a building whose different parts enforce each other.", source: "Bukhari" },
      { text: "None of you truly believes until he wishes for his brother what he wishes for himself.", source: "Bukhari, Muslim" },
      { text: "Allah does not look at your appearance or your wealth, but He looks at your hearts and your deeds.", source: "Muslim" },
      { text: "The best of people are those who are most beneficial to others.", source: "Tabarani" },
      { text: "Make things easy, do not make them difficult. Give glad tidings, do not repel people.", source: "Bukhari" },
      { text: "Allah's pleasure is in the pleasure of parents, and Allah's displeasure is in the displeasure of parents.", source: "Tirmidhi" },
      { text: "Cleanliness is half of faith.", source: "Muslim" },
      { text: "Patience is half of faith.", source: "Tirmidhi" },
      { text: "Seeking knowledge is obligatory upon every Muslim, male and female.", source: "Ibn Majah" },
      { text: "Judging justly between two people is charity.", source: "Bukhari, Muslim" },
      { text: "A good word is charity.", source: "Bukhari, Muslim" },
      { text: "Removing something harmful from the road is charity.", source: "Bukhari, Muslim" },
      { text: "A believer is not stung from the same hole twice.", source: "Bukhari, Muslim" },
      { text: "A believer is one who gets along with others and others get along with him.", source: "Tirmidhi" },
      { text: "The most beloved of people to Allah is the one who is most beneficial to his family.", source: "Tirmidhi" },
      { text: "The best among you are those who learn the Quran and teach it.", source: "Bukhari" },
      { text: "The best of people are those whose lives are long and whose deeds are good.", source: "Tirmidhi" },
      { text: "Allah does not look at your bodies or your appearances, but He looks at your hearts and your deeds.", source: "Muslim" },
      { text: "A believer to another believer is like a building whose different parts enforce each other.", source: "Bukhari" },
      { text: "Faith has over seventy branches. Modesty is a branch of faith.", source: "Bukhari, Muslim" },
      { text: "The most beloved deed to Allah is the one that is consistent, even if it is small.", source: "Bukhari, Muslim" },
      { text: "A believer to another believer is like a building whose different parts enforce each other.", source: "Bukhari" },
      { text: "None of you truly believes until he wishes for his brother what he wishes for himself.", source: "Bukhari, Muslim" },
      { text: "Allah does not look at your appearance or your wealth, but He looks at your hearts and your deeds.", source: "Muslim" },
      { text: "The best of people are those who are most beneficial to others.", source: "Tabarani" },
      { text: "Make things easy, do not make them difficult. Give glad tidings, do not repel people.", source: "Bukhari" },
      { text: "Allah's pleasure is in the pleasure of parents, and Allah's displeasure is in the displeasure of parents.", source: "Tirmidhi" },
      { text: "Cleanliness is half of faith.", source: "Muslim" },
    ],
    ar: [
      { text: "أَحَبُّ الأَعْمَالِ إِلَى اللَّهِ أَدْوَمُهَا وَإِنْ قَلَّ", source: "البخاري ومسلم" },
      { text: "الإِيمَانُ بِضْعٌ وَسَبْعُونَ شُعْبَةً، أَعْلاهَا قَوْلُ لا إِلَهَ إِلا اللَّهُ، وَأَدْنَاهَا إِمَاطَةُ الأَذَى عَنِ الطَّرِيقِ", source: "البخاري ومسلم" },
      { text: "الْمُؤْمِنُ لِلْمُؤْمِنِ كَالْبُنْيَانِ يَشُدُّ بَعْضُهُ بَعْضًا", source: "البخاري" },
      { text: "لا يُؤْمِنُ أَحَدُكُمْ حَتَّى يُحِبَّ لأَخِيهِ مَا يُحِبُّ لِنَفْسِهِ", source: "البخاري ومسلم" },
      { text: "إِنَّ اللَّهَ لا يَنْظُرُ إِلَى صُوَرِكُمْ وَأَمْوَالِكُمْ وَلَكِنْ يَنْظُرُ إِلَى قُلُوبِكُمْ وَأَعْمَالِكُمْ", source: "مسلم" },
      { text: "خَيْرُ النَّاسِ أَنْفَعُهُمْ لِلنَّاسِ", source: "الطبراني" },
      { text: "يَسِّرُوا وَلا تُعَسِّرُوا، وَبَشِّرُوا وَلا تُنَفِّرُوا", source: "البخاري" },
      { text: "رِضَا اللَّهِ فِي رِضَا الْوَالِدَيْنِ، وَسَخَطُ اللَّهِ فِي سَخَطِ الْوَالِدَيْنِ", source: "الترمذي" },
      { text: "الطُّهُورُ شَطْرُ الإِيمَانِ", source: "مسلم" },
      { text: "الصَّبْرُ شَطْرُ الإِيمَانِ", source: "الترمذي" },
      { text: "طَلَبُ الْعِلْمِ فَرِيضَةٌ عَلَى كُلِّ مُسْلِمٍ", source: "ابن ماجه" },
      { text: "الْعَدْلُ بَيْنَ اثْنَيْنِ صَدَقَةٌ", source: "البخاري ومسلم" },
      { text: "الْكَلِمَةُ الطَّيِّبَةُ صَدَقَةٌ", source: "البخاري ومسلم" },
      { text: "إِمَاطَةُ الأَذَى عَنِ الطَّرِيقِ صَدَقَةٌ", source: "البخاري ومسلم" },
      { text: "لا يُلْدَغُ الْمُؤْمِنُ مِنْ جُحْرٍ وَاحِدٍ مَرَّتَيْنِ", source: "البخاري ومسلم" },
      { text: "الْمُؤْمِنُ مَنْ أَمِنَهُ النَّاسُ عَلَى أَمْوَالِهِمْ وَأَنْفُسِهِمْ", source: "الترمذي" },
      { text: "أَحَبُّ النَّاسِ إِلَى اللَّهِ أَنْفَعُهُمْ لِأَهْلِهِ", source: "الترمذي" },
      { text: "خَيْرُكُمْ مَنْ تَعَلَّمَ الْقُرْآنَ وَعَلَّمَهُ", source: "البخاري" },
      { text: "خَيْرُ النَّاسِ مَنْ طَالَ عُمُرُهُ وَحَسُنَ عَمَلُهُ", source: "الترمذي" },
      { text: "إِنَّ اللَّهَ لا يَنْظُرُ إِلَى أَجْسَامِكُمْ وَلا إِلَى صُوَرِكُمْ وَلَكِنْ يَنْظُرُ إِلَى قُلُوبِكُمْ وَأَعْمَالِكُمْ", source: "مسلم" },
      { text: "الْمُؤْمِنُ لِلْمُؤْمِنِ كَالْبُنْيَانِ يَشُدُّ بَعْضُهُ بَعْضًا", source: "البخاري" },
      { text: "الإِيمَانُ بِضْعٌ وَسَبْعُونَ شُعْبَةً، وَالْحَيَاءُ شُعْبَةٌ مِنَ الإِيمَانِ", source: "البخاري ومسلم" },
      { text: "أَحَبُّ الأَعْمَالِ إِلَى اللَّهِ أَدْوَمُهَا وَإِنْ قَلَّ", source: "البخاري ومسلم" },
      { text: "الْمُؤْمِنُ لِلْمُؤْمِنِ كَالْبُنْيَانِ يَشُدُّ بَعْضُهُ بَعْضًا", source: "البخاري" },
      { text: "لا يُؤْمِنُ أَحَدُكُمْ حَتَّى يُحِبَّ لأَخِيهِ مَا يُحِبُّ لِنَفْسِهِ", source: "البخاري ومسلم" },
      { text: "إِنَّ اللَّهَ لا يَنْظُرُ إِلَى صُوَرِكُمْ وَأَمْوَالِكُمْ وَلَكِنْ يَنْظُرُ إِلَى قُلُوبِكُمْ وَأَعْمَالِكُمْ", source: "مسلم" },
      { text: "خَيْرُ النَّاسِ أَنْفَعُهُمْ لِلنَّاسِ", source: "الطبراني" },
      { text: "يَسِّرُوا وَلا تُعَسِّرُوا، وَبَشِّرُوا وَلا تُنَفِّرُوا", source: "البخاري" },
      { text: "رِضَا اللَّهِ فِي رِضَا الْوَالِدَيْنِ، وَسَخَطُ اللَّهِ فِي سَخَطِ الْوَالِدَيْنِ", source: "الترمذي" },
      { text: "الطُّهُورُ شَطْرُ الإِيمَانِ", source: "مسلم" },
    ],
  };
  
  const currentHadiths = hadiths[language] || hadiths.tr;
  const hadithIndex = (dayOfYear - 1) % currentHadiths.length;
  return currentHadiths[hadithIndex];
};

// Başarımlar Tanımları
const ACHIEVEMENTS = {
  first_100: {
    key: 'first_100',
    title: 'İlk 100',
    description: 'Toplam 100 zikir yap',
    icon: '🎯',
    condition: (stats) => stats.total >= 100,
  },
  first_1000: {
    key: 'first_1000',
    title: 'Binlerce Zikir',
    description: 'Toplam 1000 zikir yap',
    icon: '🌟',
    condition: (stats) => stats.total >= 1000,
  },
  streak_7: {
    key: 'streak_7',
    title: '7 Günlük Seri',
    description: '7 gün üst üste zikir yap',
    icon: '🔥',
    condition: (stats) => stats.streak >= 7,
  },
  streak_30: {
    key: 'streak_30',
    title: '30 Günlük Seri',
    description: '30 gün üst üste zikir yap',
    icon: '💪',
    condition: (stats) => stats.streak >= 30,
  },
  perfect_day: {
    key: 'perfect_day',
    title: 'Mükemmel Gün',
    description: 'Bir günde 500+ zikir yap',
    icon: '⭐',
    condition: (stats) => stats.bestDay && stats.bestDay.total >= 500,
  },
  all_targets: {
    key: 'all_targets',
    title: 'Hedef Ustası',
    description: 'Bir günde tüm hedefleri tamamla',
    icon: '🏆',
    condition: (stats) => stats.completedTargets >= 5,
  },
  first_10000: {
    key: 'first_10000',
    title: 'On Binlerce Zikir',
    description: 'Toplam 10,000 zikir yap',
    icon: '💎',
    condition: (stats) => stats.total >= 10000,
  },
  first_50000: {
    key: 'first_50000',
    title: 'Efsanevi Sayı',
    description: 'Toplam 50,000 zikir yap',
    icon: '👑',
    condition: (stats) => stats.total >= 50000,
  },
  streak_100: {
    key: 'streak_100',
    title: '100 Günlük Seri',
    description: '100 gün üst üste zikir yap',
    icon: '⚡',
    condition: (stats) => stats.streak >= 100,
  },
  streak_365: {
    key: 'streak_365',
    title: 'Yıllık Seri',
    description: '365 gün üst üste zikir yap',
    icon: '🌙',
    condition: (stats) => stats.streak >= 365,
  },
  marathon: {
    key: 'marathon',
    title: 'Maraton',
    description: 'Bir günde 1000+ zikir yap',
    icon: '🏃',
    condition: (stats) => stats.bestDay && stats.bestDay.total >= 1000,
  },
  consistency_king: {
    key: 'consistency_king',
    title: 'Tutarlılık Kralı',
    description: '14 gün üst üste zikir yap',
    icon: '👑',
    condition: (stats) => stats.streak >= 14,
  },
  dedication: {
    key: 'dedication',
    title: 'Adanmışlık',
    description: '50 gün üst üste zikir yap',
    icon: '💫',
    condition: (stats) => stats.streak >= 50,
  },
  first_week: {
    key: 'first_week',
    title: 'İlk Hafta',
    description: '7 gün zikir yap (seri olmasa bile)',
    icon: '📅',
    condition: (stats) => stats.days >= 7,
  },
  first_month: {
    key: 'first_month',
    title: 'İlk Ay',
    description: '30 gün zikir yap (seri olmasa bile)',
    icon: '📆',
    condition: (stats) => stats.days >= 30,
  },
  first_100_days: {
    key: 'first_100_days',
    title: '100 Gün',
    description: '100 gün zikir yap (seri olmasa bile)',
    icon: '🎊',
    condition: (stats) => stats.days >= 100,
  },
  daily_master: {
    key: 'daily_master',
    title: 'Günlük Usta',
    description: 'Ortalama günlük 200+ zikir yap',
    icon: '📊',
    condition: (stats) => stats.avgDaily >= 200,
  },
  super_daily: {
    key: 'super_daily',
    title: 'Süper Günlük',
    description: 'Ortalama günlük 500+ zikir yap',
    icon: '🚀',
    condition: (stats) => stats.avgDaily >= 500,
  },
};

// Theme Context
const ThemeContext = createContext(null);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  // Default tema değerleri - Context henüz sağlanmamışsa veya null ise
  const defaultTheme = {
    theme: 'dark',
    setTheme: () => {},
    themes: themes,
  };
  
  // Context yoksa veya geçersizse default döndür
  if (!context) {
    return defaultTheme;
  }
  
  // Context var ama theme property'si yoksa default döndür
  if (typeof context.theme === 'undefined' || context.theme === null) {
    return defaultTheme;
  }
  
  // Context geçerli ama themes yoksa ekle
  if (!context.themes) {
    return {
      ...context,
      themes: themes,
    };
  }
  
  return context;
};

// 10 Zikir Önerisi
const ZIKIR_LIST = [
  { id: 1, name: 'Subhanallah', arabic: 'سُبْحَانَ اللَّهِ' },
  { id: 2, name: 'Elhamdülillah', arabic: 'الْحَمْدُ لِلَّهِ' },
  { id: 3, name: 'Allahu Ekber', arabic: 'اللَّهُ أَكْبَرُ' },
  { id: 4, name: 'La ilahe illallah', arabic: 'لَا إِلَٰهَ إِلَّا اللَّهُ' },
  { id: 5, name: 'Subhanallahi ve bihamdihi', arabic: 'سُبْحَانَ اللَّهِ وَبِحَمْدِهِ' },
  { id: 6, name: 'Subhanallahi\'l-azim', arabic: 'سُبْحَانَ اللَّهِ الْعَظِيمِ' },
  { id: 7, name: 'La havle ve la kuvvete illa billah', arabic: 'لَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ' },
  { id: 8, name: 'Hasbunallahu ve ni\'mel vekil', arabic: 'حَسْبُنَا اللَّهُ وَنِعْمَ الْوَكِيلُ' },
  { id: 9, name: 'Astagfirullah', arabic: 'أَسْتَغْفِرُ اللَّهَ' },
  { id: 10, name: 'La ilahe illa ente subhaneke', arabic: 'لَا إِلَٰهَ إِلَّا أَنْتَ سُبْحَانَكَ' },
  { id: 11, name: 'Subhanallahi ve bihamdihi subhanallahi\'l-azim', arabic: 'سُبْحَانَ اللَّهِ وَبِحَمْدِهِ سُبْحَانَ اللَّهِ الْعَظِيمِ' },
  { id: 12, name: 'Rabbena atina fid-dunya haseneten', arabic: 'رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً' },
  { id: 13, name: 'Rabbenağfirli', arabic: 'رَبَّنَا اغْفِرْ لِي' },
  { id: 14, name: 'Allahumme salli ala Muhammed', arabic: 'اللَّهُمَّ صَلِّ عَلَى مُحَمَّدٍ' },
  { id: 15, name: 'Allahumme barik ala Muhammed', arabic: 'اللَّهُمَّ بَارِكْ عَلَى مُحَمَّدٍ' },
  { id: 16, name: 'Subhanallahi ve bihamdihi adede halkihi', arabic: 'سُبْحَانَ اللَّهِ وَبِحَمْدِهِ عَدَدَ خَلْقِهِ' },
  { id: 17, name: 'La ilahe illallahu vahdehu la şerike leh', arabic: 'لَا إِلَٰهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ' },
  { id: 18, name: 'Allahumme inni es\'eluke\'l-afiyete', arabic: 'اللَّهُمَّ إِنِّي أَسْأَلُكَ الْعَافِيَةَ' },
  { id: 19, name: 'Hasbiyallahu la ilahe illa hu', arabic: 'حَسْبِيَ اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ' },
  { id: 20, name: 'Subhanallahi ve bihamdihi subhanallahi\'l-azim', arabic: 'سُبْحَانَ اللَّهِ وَبِحَمْدِهِ سُبْحَانَ اللَّهِ الْعَظِيمِ' },
  { id: 21, name: 'Allahumme inni e\'uzu bike min şerri nefsi', arabic: 'اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنْ شَرِّ نَفْسِي' },
  { id: 22, name: 'Rabbena la tuziğ kulubena', arabic: 'رَبَّنَا لَا تُزِغْ قُلُوبَنَا' },
  { id: 23, name: 'Subhanallahi\'l-aliyyi\'l-azim', arabic: 'سُبْحَانَ اللَّهِ الْعَلِيِّ الْعَظِيمِ' },
  { id: 24, name: 'Allahumme inni es\'eluke\'l-cennete', arabic: 'اللَّهُمَّ إِنِّي أَسْأَلُكَ الْجَنَّةَ' },
  { id: 25, name: 'La ilahe illallahu Muhammedun resulullah', arabic: 'لَا إِلَٰهَ إِلَّا اللَّهُ مُحَمَّدٌ رَسُولُ اللَّهِ' },
  { id: 26, name: 'Subhanallahi ve bihamdihi subhanallahi\'l-azim ve bihamdihi', arabic: 'سُبْحَانَ اللَّهِ وَبِحَمْدِهِ سُبْحَانَ اللَّهِ الْعَظِيمِ وَبِحَمْدِهِ' },
  { id: 27, name: 'Allahumme inni es\'eluke\'l-huda', arabic: 'اللَّهُمَّ إِنِّي أَسْأَلُكَ الْهُدَى' },
  { id: 28, name: 'Rabbena hablana min ezvacina', arabic: 'رَبَّنَا هَبْ لَنَا مِنْ أَزْوَاجِنَا' },
  { id: 29, name: 'Subhanallahi ve bihamdihi subhanallahi\'l-azim', arabic: 'سُبْحَانَ اللَّهِ وَبِحَمْدِهِ سُبْحَانَ اللَّهِ الْعَظِيمِ' },
  { id: 30, name: 'Allahumme inni es\'eluke\'r-rizka\'t-tayyib', arabic: 'اللَّهُمَّ إِنِّي أَسْأَلُكَ الرِّزْقَ الطَّيِّبَ' },
];


// Stack Navigator
const Stack = createNativeStackNavigator();
// Tab Navigator
const Tab = createBottomTabNavigator();

// Ana Sayfa Ekranı
function HomeScreen({ navigation }) {
  const [customZikirs, setCustomZikirs] = useState([]);
  const [newZikirName, setNewZikirName] = useState('');
  const [newZikirArabic, setNewZikirArabic] = useState('');
  const [showAddZikir, setShowAddZikir] = useState(false);
  const db = useDatabase();
  const themeContext = useTheme();
  const theme = themeContext?.theme || 'dark';
  const themeThemes = themeContext?.themes || themes;
  const themeColors = themeThemes[theme]?.colors || themeThemes.dark?.colors || themes.dark.colors;
  const { language, t, setLanguage } = useLanguage();

  useEffect(() => {
    if (db) {
      loadCustomZikirs(db);
    }
  }, [db]);

  // Tab'a her gidildiğinde verileri yeniden yükle
  useFocusEffect(
    React.useCallback(() => {
      if (db) {
        loadCustomZikirs(db);
      }
    }, [db])
  );

  const loadCustomZikirs = async (database) => {
    try {
      const result = await database.getAllAsync('SELECT * FROM custom_zikirs ORDER BY created_at DESC;');
      setCustomZikirs(result);
    } catch (error) {
      console.error('Özel zikirler yüklenirken hata:', error);
    }
  };

  const createCustomZikir = async () => {
    if (!newZikirName.trim() || !db) {
      Alert.alert(t.error, t.enterZikirName);
      return;
    }

    try {
      // Önce tabloda arabic kolonu var mı kontrol et, yoksa ekle
      try {
        await db.execAsync('ALTER TABLE custom_zikirs ADD COLUMN arabic TEXT;');
      } catch (error) {
        // Kolon zaten varsa hata vermez, devam et
        if (!error.message || !error.message.includes('duplicate column')) {
          console.log('Arabic kolonu eklenirken hata (muhtemelen zaten var):', error);
        }
      }

      const result = await db.runAsync(
        'INSERT INTO custom_zikirs (name, arabic) VALUES (?, ?);',
        [newZikirName.trim(), newZikirArabic.trim() || null]
      );
      const newZikir = {
        id: result.lastInsertRowId,
        name: newZikirName.trim(),
        arabic: newZikirArabic.trim() || null,
        type: 'custom',
        created_at: new Date().toISOString(),
      };
      setCustomZikirs([newZikir, ...customZikirs]);
      setNewZikirName('');
      setNewZikirArabic('');
      setShowAddZikir(false);
      Alert.alert(t.success, t.customZikirAdded);
    } catch (error) {
      if (error.message && error.message.includes('UNIQUE constraint')) {
        Alert.alert(t.error, t.customZikirExists);
      } else {
        Alert.alert(t.error, t.customZikirNotAdded);
      }
    }
  };

  const selectZikir = (zikir) => {
    navigation.navigate('Counter', { zikir });
  };

  const deleteCustomZikir = async (zikirId, zikirName) => {
    Alert.alert(
      t.deleteCustomZikir,
      `"${zikirName}" ${t.deleteCustomZikirConfirm}`,
      [
        { text: t.cancel, style: 'cancel' },
        {
          text: t.delete,
          style: 'destructive',
          onPress: async () => {
            if (!db) return;
            try {
              // Özel zikiri sil
              await db.runAsync('DELETE FROM custom_zikirs WHERE id = ?;', [zikirId]);
              
              // İlgili zikir kayıtlarını sil
              await db.runAsync(
                'DELETE FROM zikir_records WHERE zikir_id = ? AND zikir_type = ?;',
                [zikirId, 'custom']
              );
              
              // İlgili zikir hedeflerini sil
              await db.runAsync(
                'DELETE FROM zikir_targets WHERE zikir_id = ? AND zikir_type = ?;',
                [zikirId, 'custom']
              );
              
              // Listeyi güncelle
              await loadCustomZikirs(db);
              
              safeNotificationAsync('Success');
              Alert.alert(t.success, t.customZikirDeleted);
            } catch (error) {
              console.error('Özel zikir silme hatası:', error);
              Alert.alert(t.error, t.customZikirNotDeleted);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      <StatusBar style="light" />
      <View style={[styles.header, { backgroundColor: themeColors.surface, borderBottomColor: themeColors.border }]}>
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <View style={[styles.headerAccent, { backgroundColor: themeColors.primary }]} />
            <Text style={[styles.headerTitle, { color: themeColors.text }]}>{t.appName}</Text>
          </View>
          <TouchableOpacity
            style={[styles.languageSelector, { borderColor: themeColors.primary }]}
            onPress={() => {
              const languages = ['tr', 'en', 'ar'];
              const currentIndex = languages.indexOf(language);
              const nextIndex = (currentIndex + 1) % languages.length;
              setLanguage(languages[nextIndex]);
            }}
            activeOpacity={0.7}
          >
            <Text style={[styles.languageText, { color: themeColors.primary }]}>
              {language === 'tr' ? 'TR' : language === 'en' ? 'EN' : 'AR'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Özel Zikir Ekleme */}
        {showAddZikir ? (
          <View style={[styles.addZikirContainer, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
            <TextInput
              style={[styles.input, { backgroundColor: themeColors.background, color: themeColors.text, borderColor: themeColors.border }]}
              placeholder={t.customZikirName}
              placeholderTextColor={themeColors.textMuted}
              value={newZikirName}
              onChangeText={setNewZikirName}
              onSubmitEditing={() => {
                // İkinci input'a odaklan
              }}
              autoFocus
            />
            <TextInput
              style={[styles.input, styles.arabicInput, { backgroundColor: themeColors.background, color: themeColors.text, borderColor: themeColors.border }]}
              placeholder={t.arabicText}
              placeholderTextColor={themeColors.textMuted}
              value={newZikirArabic}
              onChangeText={setNewZikirArabic}
              onSubmitEditing={createCustomZikir}
              textAlign="right"
              textDirection="rtl"
              textContentType="none"
            />
            <View style={styles.addZikirButtons}>
              <TouchableOpacity 
                style={[styles.cancelButton, { backgroundColor: themeColors.surfaceLight }]} 
                onPress={() => {
                  setShowAddZikir(false);
                  setNewZikirName('');
                  setNewZikirArabic('');
                }}
              >
                <Text style={[styles.cancelButtonText, { color: themeColors.text }]}>{t.cancel}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.addButton, { backgroundColor: themeColors.primary }]} onPress={createCustomZikir}>
                <Text style={styles.addButtonText}>{t.add}</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <TouchableOpacity
            style={[styles.addZikirButton, { borderColor: themeColors.primary }]}
            onPress={() => setShowAddZikir(true)}
          >
            <Text style={[styles.addZikirButtonText, { color: themeColors.primary }]}>+ {t.addCustomZikir}</Text>
          </TouchableOpacity>
        )}

        {/* Önerilen Zikirler */}
        <View style={styles.sectionContainer}>
          <Text style={[styles.sectionTitle, { color: themeColors.text }]}>{t.recommendedZikirs}</Text>
          <View style={styles.zikirGrid}>
            {ZIKIR_LIST.map((zikir) => (
              <TouchableOpacity
                key={zikir.id}
                style={[styles.zikirCard, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}
                onPress={() => selectZikir({ ...zikir, type: 'default' })}
                activeOpacity={0.7}
              >
                <Text style={[styles.zikirArabic, { color: themeColors.primary }]}>{zikir.arabic}</Text>
                <Text style={[styles.zikirName, { color: themeColors.textSecondary }]}>{zikir.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Özel Zikirler */}
        {customZikirs.length > 0 && (
          <View style={styles.sectionContainer}>
            <Text style={[styles.sectionTitle, { color: themeColors.text }]}>{t.customZikir}</Text>
            <View style={styles.zikirGrid}>
              {customZikirs.map((zikir) => (
                <TouchableOpacity
                  key={zikir.id}
                  style={[styles.zikirCard, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}
                  onPress={() => selectZikir({ ...zikir, type: 'custom' })}
                  activeOpacity={0.7}
                >
                  {zikir.arabic ? (
                    <Text style={[styles.zikirArabic, { color: themeColors.primary }]}>{zikir.arabic}</Text>
                  ) : null}
                  <Text style={[styles.zikirName, { color: themeColors.textSecondary }]}>{zikir.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}



// Analiz Ekranı
function AnalyticsScreen() {
  const [analytics, setAnalytics] = useState({ daily: [], weekly: [], monthly: [] });
  const [selectedPeriod, setSelectedPeriod] = useState('daily');
  const [generalStats, setGeneralStats] = useState(null);
  const [dailyTrend, setDailyTrend] = useState([]);
  const [achievements, setAchievements] = useState([]);
  const [unlockedAchievements, setUnlockedAchievements] = useState(new Set());
  const [historyData, setHistoryData] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const db = useDatabase();
  const themeContext = useTheme();
  const theme = themeContext?.theme || 'dark';
  const themeThemes = themeContext?.themes || themes;
  const themeColors = themeThemes[theme]?.colors || themeThemes.dark?.colors || themes.dark.colors;
  const { t, language } = useLanguage();

  useEffect(() => {
    if (db) {
      loadAnalytics(db, 'daily');
      loadGeneralStats(db);
      loadDailyTrend(db);
      loadAchievements(db);
    }
  }, [db, language]);

  // Ekrana her gidildiğinde verileri yeniden yükle
  useFocusEffect(
    React.useCallback(() => {
      if (db) {
        loadAnalytics(db, selectedPeriod);
        loadGeneralStats(db);
        loadDailyTrend(db);
        loadAchievements(db);
      }
    }, [db, selectedPeriod, language])
  );

  const loadAnalytics = async (database, period) => {
    try {
      // Default zikirleri ekle
      const allZikirs = [...ZIKIR_LIST.map(z => ({ ...z, type: 'default' }))];
      
      // Custom zikirleri ekle
      try {
        const customZikirs = await database.getAllAsync('SELECT * FROM custom_zikirs ORDER BY created_at DESC;');
        for (const customZikir of customZikirs) {
          allZikirs.push({
            ...customZikir,
            type: 'custom',
          });
        }
      } catch (error) {
        // Custom zikirler yüklenemezse devam et
      }
      
      const analyticsData = [];

      for (const zikir of allZikirs) {
        let query = '';
        if (period === 'daily') {
          query = `SELECT SUM(count) as total FROM zikir_records 
                   WHERE zikir_id = ? AND zikir_type = ? AND date = DATE('now');`;
        } else if (period === 'weekly') {
          query = `SELECT SUM(count) as total FROM zikir_records 
                   WHERE zikir_id = ? AND zikir_type = ? 
                   AND date >= DATE('now', '-7 days');`;
        } else if (period === 'monthly') {
          query = `SELECT SUM(count) as total FROM zikir_records 
                   WHERE zikir_id = ? AND zikir_type = ? 
                   AND date >= DATE('now', 'start of month');`;
        }

        const result = await database.getAllAsync(query, [zikir.id, zikir.type]);
        const total = result[0]?.total || 0;

        // Hedefi al
        const targetResult = await database.getAllAsync(
          `SELECT target FROM zikir_targets 
           WHERE zikir_id = ? AND zikir_type = ?;`,
          [zikir.id, zikir.type]
        );
        const target = targetResult[0]?.target || 100;

        analyticsData.push({
          ...zikir,
          total,
          target,
          percentage: target > 0 ? Math.round((total / target) * 100) : 0,
        });
      }

      setAnalytics(prev => ({
        ...prev,
        [period]: analyticsData.sort((a, b) => b.total - a.total),
      }));
    } catch (error) {
      console.error('Analiz yüklenirken hata:', error);
    }
  };

  const loadGeneralStats = async (database) => {
    try {
      // Toplam zikir sayısı
      const totalResult = await database.getAllAsync(
        'SELECT SUM(count) as total FROM zikir_records;'
      );
      const total = totalResult[0]?.total || 0;

      // Toplam gün sayısı
      const daysResult = await database.getAllAsync(
        'SELECT COUNT(DISTINCT date) as days FROM zikir_records;'
      );
      const days = daysResult[0]?.days || 0;

      // Ortalama günlük zikir
      const avgDaily = days > 0 ? Math.round(total / days) : 0;

      // En iyi gün (en çok zikir yapılan gün)
      const bestDayResult = await database.getAllAsync(
        `SELECT date, SUM(count) as total FROM zikir_records 
         GROUP BY date ORDER BY total DESC LIMIT 1;`
      );
      const bestDay = bestDayResult.length > 0 ? bestDayResult[0] : null;

      // Streak (arka arkaya günler) - basit hesaplama
      const streakResult = await database.getAllAsync(
        `SELECT DISTINCT date FROM zikir_records 
         WHERE date >= DATE('now', '-30 days')
         ORDER BY date DESC;`
      );
      let streak = 0;
      let currentDate = new Date();
      currentDate.setHours(0, 0, 0, 0);
      
      for (let i = 0; i < streakResult.length; i++) {
        const recordDate = new Date(streakResult[i].date + 'T00:00:00');
        const diffDays = Math.floor((currentDate - recordDate) / (1000 * 60 * 60 * 24));
        if (diffDays === i) {
          streak++;
        } else {
          break;
        }
      }

      // Hedef tamamlama sayısı
      const completedTargetsResult = await database.getAllAsync(
        `SELECT COUNT(*) as count FROM (
          SELECT zr.zikir_id, zr.zikir_type, SUM(zr.count) as total, zt.target
          FROM zikir_records zr
          LEFT JOIN zikir_targets zt ON zr.zikir_id = zt.zikir_id AND zr.zikir_type = zt.zikir_type
          WHERE zr.date = DATE('now')
          GROUP BY zr.zikir_id, zr.zikir_type
          HAVING total >= COALESCE(zt.target, 100)
        );`
      );
      const completedTargets = completedTargetsResult[0]?.count || 0;

      const stats = {
        total,
        days,
        avgDaily,
        bestDay,
        streak,
        completedTargets,
      };

      setGeneralStats(stats);

      // Başarımları kontrol et
      checkAchievements(database, stats, language);
    } catch (error) {
      console.error('Genel istatistikler yüklenirken hata:', error);
    }
  };

  const loadAchievements = async (database) => {
    try {
      const result = await database.getAllAsync('SELECT achievement_key FROM achievements;');
      const unlocked = new Set(result.map(r => r.achievement_key));
      setUnlockedAchievements(unlocked);
      
      // Tüm başarımları listele (dil desteği ile)
      const allAchievements = Object.values(ACHIEVEMENTS).map(achievement => ({
        ...achievement,
        title: t[`achievement_${achievement.key}_title`] || achievement.title,
        description: t[`achievement_${achievement.key}_desc`] || achievement.description,
        unlocked: unlocked.has(achievement.key),
      }));
      setAchievements(allAchievements);
    } catch (error) {
      console.error('Başarımlar yüklenirken hata:', error);
    }
  };

  const checkAchievements = async (database, stats, currentLanguage) => {
    try {
      const currentTranslations = translations[currentLanguage] || translations.tr;
      for (const achievement of Object.values(ACHIEVEMENTS)) {
        if (achievement.condition(stats)) {
          // Başarım kazanıldı mı kontrol et
          const existing = await database.getAllAsync(
            'SELECT id FROM achievements WHERE achievement_key = ?;',
            [achievement.key]
          );
          
          if (existing.length === 0) {
            // Yeni başarım kazanıldı
            await database.runAsync(
              'INSERT INTO achievements (achievement_key) VALUES (?);',
              [achievement.key]
            );
            
            // Bildirim gönder (dil desteği ile)
            try {
              const achievementTitle = currentTranslations[`achievement_${achievement.key}_title`] || achievement.title;
              const achievementDesc = currentTranslations[`achievement_${achievement.key}_desc`] || achievement.description;
              await Notifications.scheduleNotificationAsync({
                content: {
                  title: `🎉 ${achievement.icon} ${achievementTitle}`,
                  body: achievementDesc,
                  sound: true,
                  priority: Notifications.AndroidNotificationPriority.HIGH,
                },
                trigger: null,
              });
            } catch (error) {
              // Bildirim hatası sessizce yok sayılır
            }
            
            // Başarımları yeniden yükle
            loadAchievements(database);
          }
        }
      }
    } catch (error) {
      console.error('Başarım kontrolü hatası:', error);
    }
  };

  const loadDailyTrend = async (database) => {
    try {
      const trendResult = await database.getAllAsync(
        `SELECT date, SUM(count) as total FROM zikir_records 
         WHERE date >= DATE('now', '-7 days')
         GROUP BY date ORDER BY date ASC;`
      );
      
      // Son 7 gün için veri hazırla
      const trendData = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        const record = trendResult.find(r => r.date === dateStr);
        trendData.push({
          date: dateStr,
          day: date.toLocaleDateString(language === 'tr' ? 'tr-TR' : language === 'en' ? 'en-US' : 'ar-SA', { weekday: 'short' }),
          total: record ? record.total : 0,
        });
      }
      
      setDailyTrend(trendData);
    } catch (error) {
      console.error('Günlük trend yüklenirken hata:', error);
    }
  };

  const handlePeriodChange = (period) => {
    setSelectedPeriod(period);
    if (db) {
      loadAnalytics(db, period);
    }
  };

  const loadHistory = async (database) => {
    try {
      const result = await database.getAllAsync(
        `SELECT date, SUM(count) as total, COUNT(DISTINCT zikir_id || zikir_type) as zikir_count
         FROM zikir_records 
         WHERE date < DATE('now')
         GROUP BY date 
         ORDER BY date DESC 
         LIMIT 30;`
      );
      setHistoryData(result);
    } catch (error) {
      console.error('Geçmiş veriler yüklenirken hata:', error);
    }
  };

  const toggleHistory = () => {
    setShowHistory(!showHistory);
    if (!showHistory && db) {
      loadHistory(db);
    }
  };

  const currentData = analytics[selectedPeriod] || [];
  const maxTrendValue = dailyTrend.length > 0 ? Math.max(...dailyTrend.map(d => d.total), 1) : 1;

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      <StatusBar style="light" />
      <View style={[styles.header, { backgroundColor: themeColors.surface, borderBottomColor: themeColors.border }]}>
        <Text style={[styles.headerTitle, { color: themeColors.text }]}>{t.analytics}</Text>
        <View style={styles.headerRight}>
          <Text style={[styles.headerSubtitle, { color: themeColors.textMuted }]}>{t.zikirStatistics}</Text>
          <TouchableOpacity
            style={[styles.historyButton, { backgroundColor: showHistory ? themeColors.primary : themeColors.background, borderColor: themeColors.border }]}
            onPress={toggleHistory}
          >
            <Text style={[styles.historyButtonText, { color: showHistory ? '#ffffff' : themeColors.text }]}>
              {showHistory ? `📊 ${t.statistics}` : `📅 ${t.history}`}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Period Selector */}
      <View style={[styles.periodSelector, { backgroundColor: themeColors.surface, borderBottomColor: themeColors.border }]}>
        <TouchableOpacity
          style={[
            styles.periodButton,
            { backgroundColor: selectedPeriod === 'daily' ? themeColors.primary : themeColors.background, borderColor: themeColors.border }
          ]}
          onPress={() => handlePeriodChange('daily')}
        >
          <Text style={[styles.periodButtonText, { color: selectedPeriod === 'daily' ? '#ffffff' : themeColors.textMuted }]}>
            {t.daily}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.periodButton,
            { backgroundColor: selectedPeriod === 'weekly' ? themeColors.primary : themeColors.background, borderColor: themeColors.border }
          ]}
          onPress={() => handlePeriodChange('weekly')}
        >
          <Text style={[styles.periodButtonText, { color: selectedPeriod === 'weekly' ? '#ffffff' : themeColors.textMuted }]}>
            {t.weekly}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.periodButton,
            { backgroundColor: selectedPeriod === 'monthly' ? themeColors.primary : themeColors.background, borderColor: themeColors.border }
          ]}
          onPress={() => handlePeriodChange('monthly')}
        >
          <Text style={[styles.periodButtonText, { color: selectedPeriod === 'monthly' ? '#ffffff' : themeColors.textMuted }]}>
            {t.monthly}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Zikir Geçmişi */}
        {showHistory ? (
          <View style={[styles.historyCard, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
            <Text style={[styles.historyTitle, { color: themeColors.text }]}>{language === 'tr' ? 'Son 30 Gün Geçmişi' : language === 'en' ? 'Last 30 Days History' : 'سجل آخر 30 يوم'}</Text>
            {historyData.length > 0 ? (
              historyData.map((day, index) => (
                <View key={index} style={[styles.historyItem, { backgroundColor: themeColors.background, borderColor: themeColors.border }]}>
                  <View style={styles.historyItemLeft}>
                    <Text style={[styles.historyDate, { color: themeColors.text }]}>
                      {new Date(day.date + 'T00:00:00').toLocaleDateString(language === 'tr' ? 'tr-TR' : language === 'en' ? 'en-US' : 'ar-SA', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </Text>
                    <Text style={[styles.historyZikirCount, { color: themeColors.textMuted }]}>
                      {day.zikir_count} {language === 'tr' ? 'zikir türü' : language === 'en' ? 'dhikr types' : 'أنواع الذكر'}
                    </Text>
                  </View>
                  <Text style={[styles.historyTotal, { color: themeColors.primary }]}>
                    {day.total} {t.zikir}
                  </Text>
                </View>
              ))
            ) : (
              <Text style={[styles.historyEmpty, { color: themeColors.textMuted }]}>
                {language === 'tr' ? 'Henüz geçmiş veri yok' : language === 'en' ? 'No history data yet' : 'لا توجد بيانات سابقة بعد'}
              </Text>
            )}
          </View>
        ) : (
          <>
            {/* Günlük Hadis */}
        {generalStats && generalStats.streak > 0 && (
          <View style={[styles.hadithCard, { backgroundColor: themeColors.surface, borderColor: themeColors.primary }]}>
            <View style={styles.hadithHeader}>
              <Text style={styles.hadithIcon}>📖</Text>
              <Text style={[styles.hadithTitle, { color: themeColors.primary }]}>{t.dailyHadith}</Text>
            </View>
            <Text style={[styles.hadithText, { color: themeColors.text }]}>
              "{getDailyHadith(language).text}"
            </Text>
            <Text style={[styles.hadithSource, { color: themeColors.textMuted }]}>
              — {getDailyHadith(language).source}
            </Text>
            <Text style={[styles.hadithDay, { color: themeColors.textMuted }]}>
              {generalStats.streak} {language === 'tr' ? 'günlük seri devam ediyor' : language === 'en' ? 'day streak continues' : 'يوم متتالي مستمر'} 🔥
            </Text>
          </View>
        )}

        {/* Genel İstatistikler */}
            {generalStats && (
          <View style={[styles.statsOverviewCard, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
            <Text style={[styles.statsOverviewTitle, { color: themeColors.text }]}>{t.generalStatistics}</Text>
            <View style={styles.statsOverviewGrid}>
              <View style={styles.statsOverviewItem}>
                <Text style={[styles.statsOverviewValue, { color: themeColors.primary }]}>
                  {generalStats.total.toLocaleString()}
                </Text>
                <Text style={[styles.statsOverviewLabel, { color: themeColors.textMuted }]}>{t.total} {t.zikir}</Text>
              </View>
              <View style={styles.statsOverviewItem}>
                <Text style={[styles.statsOverviewValue, { color: themeColors.primary }]}>
                  {generalStats.avgDaily}
                </Text>
                <Text style={[styles.statsOverviewLabel, { color: themeColors.textMuted }]}>{t.avgDaily}</Text>
              </View>
              <View style={styles.statsOverviewItem}>
                <View style={styles.streakContainer}>
                  <Text style={styles.streakIcon}>🔥</Text>
                  <Text style={[styles.statsOverviewValue, { color: themeColors.primary }]}>
                    {generalStats.streak}
                  </Text>
                </View>
                <Text style={[styles.statsOverviewLabel, { color: themeColors.textMuted }]}>{t.dailyStreak}</Text>
                {generalStats.streak > 0 && (
                  <Text style={[styles.streakMessage, { color: themeColors.primary }]}>
                    {generalStats.streak >= 30 ? '💪 Efsane!' : generalStats.streak >= 7 ? '🔥 Harika!' : '✨ Devam!'}
                  </Text>
                )}
              </View>
              <View style={styles.statsOverviewItem}>
                <Text style={[styles.statsOverviewValue, { color: themeColors.primary }]}>
                  {generalStats.completedTargets}
                </Text>
                <Text style={[styles.statsOverviewLabel, { color: themeColors.textMuted }]}>{t.targetCompleted}</Text>
              </View>
            </View>
            {generalStats.bestDay && (
              <View style={styles.bestDayContainer}>
                <Text style={[styles.bestDayLabel, { color: themeColors.textMuted }]}>{t.bestDay}</Text>
                <Text style={[styles.bestDayValue, { color: themeColors.text }]}>
                  {new Date(generalStats.bestDay.date + 'T00:00:00').toLocaleDateString(language === 'tr' ? 'tr-TR' : language === 'en' ? 'en-US' : 'ar-SA', { day: 'numeric', month: 'long' })} - {generalStats.bestDay.total} {t.zikir}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Günlük Trend Grafiği */}
        {dailyTrend.length > 0 && selectedPeriod === 'daily' && (
          <View style={[styles.trendCard, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
            <Text style={[styles.trendCardTitle, { color: themeColors.text }]}>{t.last7DaysTrend}</Text>
            <View style={styles.trendChart}>
              {dailyTrend.map((day, index) => (
                <View key={index} style={styles.trendBarContainer}>
                  <View style={styles.trendBarWrapper}>
                    <View 
                      style={[
                        styles.trendBar,
                        { 
                          height: `${(day.total / maxTrendValue) * 100}%`,
                          backgroundColor: themeColors.primary,
                          minHeight: day.total > 0 ? 4 : 0,
                        }
                      ]} 
                    />
                  </View>
                  <Text style={[styles.trendBarLabel, { color: themeColors.textMuted }]} numberOfLines={1}>
                    {day.day}
                  </Text>
                  <Text style={[styles.trendBarValue, { color: themeColors.text }]}>
                    {day.total}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Başarı Rozetleri */}
        {achievements.length > 0 && (
          <View style={[styles.achievementsCard, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
            <Text style={[styles.achievementsTitle, { color: themeColors.text }]}>{t.achievements}</Text>
            <Text style={[styles.achievementsSubtitle, { color: themeColors.textMuted }]}>
              {achievements.filter(a => a.unlocked).length} / {achievements.length} {t.achievementsUnlocked}
            </Text>
            <View style={styles.achievementsGrid}>
              {achievements.map((achievement) => (
                <View
                  key={achievement.key}
                  style={[
                    styles.achievementItem,
                    {
                      backgroundColor: achievement.unlocked ? themeColors.primary : themeColors.background,
                      borderColor: achievement.unlocked ? themeColors.primaryLight : themeColors.border,
                      opacity: achievement.unlocked ? 1 : 0.5,
                    }
                  ]}
                >
                  <Text style={styles.achievementIcon}>{achievement.icon}</Text>
                  <Text style={[styles.achievementTitle, { color: achievement.unlocked ? '#ffffff' : themeColors.text }]}>
                    {achievement.title}
                  </Text>
                  <Text style={[styles.achievementDescription, { color: achievement.unlocked ? '#ffffff' : themeColors.textMuted }]}>
                    {achievement.description}
                  </Text>
                  {achievement.unlocked && (
                    <View style={styles.achievementBadge}>
                      <Text style={styles.achievementBadgeText}>✓</Text>
                    </View>
                  )}
                </View>
              ))}
            </View>
          </View>
        )}
          </>
        )}

        {/* Zikir Listesi */}
        {currentData.length > 0 && (
          <>
            <View style={styles.analyticsListHeader}>
              <Text style={[styles.analyticsListTitle, { color: themeColors.text }]}>
                {selectedPeriod === 'daily' ? t.today : selectedPeriod === 'weekly' ? t.thisWeek : t.thisMonth}
              </Text>
            </View>
            {currentData.map((item) => (
              <View key={`${item.id}-${item.type}`} style={[styles.analyticsCard, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
                <View style={styles.analyticsHeader}>
                  <Text style={[styles.analyticsName, { color: themeColors.text }]}>{item.name}</Text>
                  <Text style={[styles.analyticsTotal, { color: themeColors.primary }]}>{item.total}</Text>
                </View>
                <View style={styles.analyticsProgress}>
                  <View style={[styles.analyticsProgressBar, { backgroundColor: themeColors.background }]}>
                    <View 
                      style={[
                        styles.analyticsProgressFill,
                        { 
                          width: `${Math.min(item.percentage, 100)}%`, 
                          backgroundColor: item.percentage >= 100 ? themeColors.primaryLight : themeColors.primary
                        }
                      ]} 
                    />
                  </View>
                  <Text style={[styles.analyticsProgressText, { 
                    color: item.percentage >= 100 ? themeColors.primary : themeColors.textMuted,
                    fontWeight: item.percentage >= 100 ? '700' : '500'
                  }]}>
                    {item.total} / {item.target} {item.percentage >= 100 ? '(100% ✓)' : `(${item.percentage}%)`}
                  </Text>
                </View>
              </View>
            ))}
          </>
        )}
      </ScrollView>
    </View>
  );
}

// Counter Ekranı
function CounterScreen({ route, navigation }) {
  const { zikir } = route.params || {};
  const db = useDatabase();
  const themeContext = useTheme();
  const theme = themeContext?.theme || 'dark';
  const themeThemes = themeContext?.themes || themes;
  const themeColors = themeThemes[theme]?.colors || themeThemes.dark?.colors || themes.dark.colors;
  const { language, t } = useLanguage();
  const [zikirCount, setZikirCount] = useState(0);
  const [zikirTarget, setZikirTarget] = useState(0);
  const [showSetTarget, setShowSetTarget] = useState(false);
  const [newTarget, setNewTarget] = useState('');
  const [showCelebration, setShowCelebration] = useState(false);

  const deleteCustomZikir = async () => {
    if (!zikir || zikir.type !== 'custom' || !db) return;
    
    Alert.alert(
      'Özel Zikiri Sil',
      `"${zikir.name}" zikiri silinecek. Bu işlem geri alınamaz. Emin misiniz?`,
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: async () => {
            try {
              const zikirId = zikir.id;
              
              // Özel zikiri sil
              await db.runAsync('DELETE FROM custom_zikirs WHERE id = ?;', [zikirId]);
              
              // İlgili zikir kayıtlarını sil
              await db.runAsync(
                'DELETE FROM zikir_records WHERE zikir_id = ? AND zikir_type = ?;',
                [zikirId, 'custom']
              );
              
              // İlgili zikir hedeflerini sil
              await db.runAsync(
                'DELETE FROM zikir_targets WHERE zikir_id = ? AND zikir_type = ?;',
                [zikirId, 'custom']
              );
              
              safeNotificationAsync('Success');
              Alert.alert('Başarılı', 'Özel zikir silindi', [
                {
                  text: 'Tamam',
                  onPress: () => navigation.goBack(),
                },
              ]);
            } catch (error) {
              console.error('Özel zikir silme hatası:', error);
              Alert.alert('Hata', 'Özel zikir silinemedi');
            }
          },
        },
      ]
    );
  };

  useEffect(() => {
    if (zikir && db) {
      loadZikirCount();
    }
    
    // Bildirim izinlerini kontrol et
    const requestNotificationPermission = async () => {
      try {
        const { status } = await Notifications.requestPermissionsAsync();
        if (status !== 'granted') {
          console.log('Bildirim izni verilmedi');
        }
      } catch (error) {
        // Expo Go'da bazı bildirim özellikleri sınırlı olabilir
        console.log('Bildirim izni kontrol edilemedi:', error);
      }
    };
    requestNotificationPermission();
  }, [zikir, db]);

  const loadZikirCount = async () => {
    if (!zikir || !db) return;

    try {
      const zikirType = zikir.type || 'default';
      const zikirId = zikir.id;
      
      const result = await db.getAllAsync(
        `SELECT count FROM zikir_records 
         WHERE zikir_id = ? AND zikir_type = ? AND date = DATE('now')
         LIMIT 1;`,
        [zikirId, zikirType]
      );
      
      if (result.length > 0) {
        setZikirCount(result[0].count);
      } else {
        setZikirCount(0);
      }
      
      const targetResult = await db.getAllAsync(
        `SELECT target FROM zikir_targets 
         WHERE zikir_id = ? AND zikir_type = ?
         LIMIT 1;`,
        [zikirId, zikirType]
      );
      
      // Önce settings'ten varsayılan hedefi oku
      let defaultTargetValue = 100;
      try {
        const defaultTargetResult = await db.getAllAsync(
          'SELECT value FROM settings WHERE key = ?;',
          ['defaultTarget']
        );
        if (defaultTargetResult.length > 0) {
          defaultTargetValue = parseInt(defaultTargetResult[0].value) || 100;
        }
      } catch (error) {
        console.error('Varsayılan hedef okuma hatası:', error);
      }
      
      // Eğer zikir için hedef varsa onu kullan, yoksa varsayılan hedefi kullan
      let target = defaultTargetValue;
      if (targetResult.length > 0) {
        const dbTarget = targetResult[0].target;
        // Veritabanından gelen değeri kullan, eğer null veya 0 ise varsayılan hedefi kullan
        target = (dbTarget != null && dbTarget !== 0) ? Number(dbTarget) : defaultTargetValue;
      } else {
        // İlk kez açılıyorsa varsayılan hedefi kaydet
        try {
          await db.runAsync(
            'INSERT INTO zikir_targets (zikir_id, zikir_type, target) VALUES (?, ?, ?);',
            [zikirId, zikirType, defaultTargetValue]
          );
          target = defaultTargetValue;
        } catch (error) {
          console.error('Default hedef kaydetme hatası:', error);
        }
      }
      setZikirTarget(target);
    } catch (error) {
      console.error('Zikir sayısı yüklenirken hata:', error);
    }
  };

  const incrementZikir = async () => {
    if (!zikir || !db) return;

    const newCount = zikirCount + 1;
    const zikirType = zikir.type || 'default';
    const zikirId = zikir.id;
    const target = zikirTarget || 100;

    try {
      const existing = await db.getAllAsync(
        `SELECT id, count FROM zikir_records 
         WHERE zikir_id = ? AND zikir_type = ? AND date = DATE('now')
         LIMIT 1;`,
        [zikirId, zikirType]
      );

      if (existing.length > 0) {
        await db.runAsync(
          'UPDATE zikir_records SET count = ? WHERE id = ?;',
          [newCount, existing[0].id]
        );
      } else {
        await db.runAsync(
          'INSERT INTO zikir_records (zikir_id, zikir_type, count, date) VALUES (?, ?, ?, DATE("now"));',
          [zikirId, zikirType, newCount]
        );
      }
      
      setZikirCount(newCount);
      safeImpactAsync('Light');
      
      // Hedefe ulaşıldığında bildirim gönder ve animasyon göster (sadece bir kez)
      if (newCount === target) {
        // Kutlama animasyonunu göster
        setShowCelebration(true);
        setTimeout(() => {
          setShowCelebration(false);
        }, 3000);
        
        try {
          // Local notification gönder (Expo Go'da çalışır)
          await Notifications.scheduleNotificationAsync({
            content: {
              title: '🎉 Hedef Tamamlandı!',
              body: `${zikir.name} zikiri için günlük hedefinize ulaştınız! (${newCount}/${target})`,
              sound: true,
              priority: Notifications.AndroidNotificationPriority.HIGH,
            },
            trigger: null, // Hemen gönder (local notification)
          });
          safeNotificationAsync('Success');
        } catch (error) {
          // Expo Go'da bazı bildirim özellikleri sınırlı olabilir
          // Hata olsa bile haptic feedback gönder
          safeNotificationAsync('Success');
        }
      }
    } catch (error) {
      console.error('Zikir sayma hatası:', error);
    }
  };

  const resetZikir = () => {
    if (!zikir || !db) return;

    Alert.alert(
      t.reset,
      language === 'tr' ? 'Sayacı sıfırlamak istediğinize emin misiniz?' : language === 'en' ? 'Are you sure you want to reset the counter?' : 'هل أنت متأكد أنك تريد إعادة تعيين العداد؟',
      [
        { text: t.cancel, style: 'cancel' },
        {
          text: t.reset,
          style: 'destructive',
          onPress: async () => {
            try {
              const zikirType = zikir.type || 'default';
              const zikirId = zikir.id;
              await db.runAsync(
                `UPDATE zikir_records SET count = 0 
                 WHERE zikir_id = ? AND zikir_type = ? AND date = DATE('now');`,
                [zikirId, zikirType]
              );
              setZikirCount(0);
              safeNotificationAsync('Success');
            } catch (error) {
              console.error('Sıfırlama hatası:', error);
            }
          },
        },
      ]
    );
  };

  const setTarget = async () => {
    if (!zikir || !db) return;
    
    const targetValue = parseInt(newTarget);
    if (isNaN(targetValue) || targetValue < 0) {
      Alert.alert(t.error, language === 'tr' ? 'Lütfen geçerli bir sayı girin' : language === 'en' ? 'Please enter a valid number' : 'الرجاء إدخال رقم صحيح');
      return;
    }

    try {
      const zikirType = zikir.type || 'default';
      const zikirId = zikir.id;
      
      const existing = await db.getAllAsync(
        `SELECT id FROM zikir_targets 
         WHERE zikir_id = ? AND zikir_type = ?
         LIMIT 1;`,
        [zikirId, zikirType]
      );

      if (existing.length > 0) {
        await db.runAsync(
          'UPDATE zikir_targets SET target = ? WHERE id = ?;',
          [targetValue, existing[0].id]
        );
      } else {
        await db.runAsync(
          'INSERT INTO zikir_targets (zikir_id, zikir_type, target) VALUES (?, ?, ?);',
          [zikirId, zikirType, targetValue]
        );
      }
      
      setZikirTarget(targetValue);
      setNewTarget('');
      setShowSetTarget(false);
      safeNotificationAsync('Success');
    } catch (error) {
      console.error('Hedef kaydetme hatası:', error);
      Alert.alert('Hata', 'Hedef kaydedilemedi');
    }
  };

  if (!zikir) {
    return (
      <View style={[styles.container, { backgroundColor: themeColors.background }]}>
        <Text style={[styles.loadingText, { color: themeColors.text }]}>Zikir bulunamadı</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      <StatusBar style="light" />
      
      <View style={[styles.counterHeader, { backgroundColor: themeColors.surface, borderBottomColor: themeColors.border }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            safeImpactAsync('Light');
            navigation.goBack();
          }}
          activeOpacity={0.7}
        >
          <Text style={[styles.backButtonText, { color: themeColors.primary }]}>‹ {t.back}</Text>
        </TouchableOpacity>
        <Text style={[styles.counterUserName, { color: themeColors.text }]} numberOfLines={1}>
          {zikir.name}
        </Text>
        {zikir.type === 'custom' ? (
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={deleteCustomZikir}
            activeOpacity={0.7}
          >
            <Text style={[styles.deleteButtonText, { color: '#ef4444' }]}>🗑️</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.placeholder} />
        )}
      </View>

      <ScrollView
        style={styles.counterScrollView}
        contentContainerStyle={styles.counterScrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.counterContainer}>
          <View style={[styles.zikirDetailsCard, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
            {zikir.arabic ? (
              <View style={styles.arabicContainer}>
                <Text style={[styles.zikirArabicLarge, { color: themeColors.primary }]}>{zikir.arabic}</Text>
              </View>
            ) : null}
            <View style={styles.nameContainer}>
              <Text style={[styles.zikirNameLabel, { color: themeColors.textMuted }]}>{t.zikir}</Text>
              <Text style={[styles.zikirNameLarge, { color: themeColors.text }]}>{zikir.name}</Text>
            </View>
          </View>

          <View style={[styles.countCard, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
            <View style={styles.countHeader}>
              <Text style={[styles.counterLabel, { color: themeColors.textMuted }]}>{t.today}</Text>
              <Text style={[styles.dateText, { color: themeColors.textMuted }]}>{new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' })}</Text>
            </View>
            <Text style={[styles.counterNumber, { color: themeColors.primary }]}>{zikirCount}</Text>
          </View>

          <View style={[styles.statsCard, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
            <View style={styles.statItem}>
              <Text style={[styles.statLabel, { color: themeColors.textMuted }]}>{t.total}</Text>
              <Text style={[styles.statValue, { color: themeColors.text }]}>{zikirCount}</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: themeColors.border }]} />
            <TouchableOpacity 
              style={styles.statItem}
              onPress={() => {
                setNewTarget(zikirTarget.toString());
                setShowSetTarget(true);
              }}
            >
              <Text style={[styles.statLabel, { color: themeColors.textMuted }]}>{t.target}</Text>
              <Text style={[styles.statValue, { color: themeColors.text }]}>
                {zikirTarget || 100}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={[styles.progressCard, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
            <View style={styles.progressHeader}>
              <Text style={[styles.progressLabel, { color: themeColors.textMuted }]}>{t.progress}</Text>
              <Text style={[styles.progressText, { color: themeColors.text }]}>
                {zikirCount} / {zikirTarget || 100}
              </Text>
            </View>
            <View style={[styles.progressBarContainer, { backgroundColor: themeColors.background }]}>
              <View 
                style={[
                  styles.progressBar,
                  { 
                    width: `${Math.min((zikirCount / (zikirTarget || 100)) * 100, 100)}%`,
                    backgroundColor: zikirCount >= (zikirTarget || 100) ? themeColors.primaryLight : themeColors.primary
                  }
                ]} 
              />
            </View>
            <Text style={[styles.progressPercent, { 
              color: zikirCount >= (zikirTarget || 100) ? themeColors.primary : themeColors.textMuted,
              fontWeight: zikirCount >= (zikirTarget || 100) ? '700' : '500'
            }]}>
              {(() => {
                const progressPercentage = Math.round((zikirCount / (zikirTarget || 100)) * 100);
                const isTargetReached = zikirCount >= (zikirTarget || 100);
                return isTargetReached ? `100% ✓ ${t.completed}` : `${progressPercentage}%`;
              })()}
            </Text>
            {/* Motivasyon Mesajları */}
            {(() => {
              const progressPercentage = Math.round((zikirCount / (zikirTarget || 100)) * 100);
              const isTargetReached = zikirCount >= (zikirTarget || 100);
              let motivationMessage = '';
              
              const motivationMessages = {
                tr: {
                  completed: '🎉 Harika! Hedefinize ulaştınız!',
                  almost: '💪 Neredeyse tamamlandı! Son bir hamle!',
                  great: '✨ Çok iyi gidiyorsunuz! Devam edin!',
                  halfway: '🌟 Yarı yoldasınız! Güzel ilerliyorsunuz!',
                  good: '🌱 Başlangıç güzel! Devam edin!',
                  started: '🌿 İyi başlangıç! Her adım önemli!',
                  begin: '🕌 Haydi başlayalım! Her zikir değerlidir!',
                },
                en: {
                  completed: '🎉 Amazing! You reached your goal!',
                  almost: '💪 Almost done! One more push!',
                  great: '✨ You\'re doing great! Keep going!',
                  halfway: '🌟 You\'re halfway there! Great progress!',
                  good: '🌱 Good start! Keep it up!',
                  started: '🌿 Good beginning! Every step matters!',
                  begin: '🕌 Let\'s begin! Every dhikr is valuable!',
                },
                ar: {
                  completed: '🎉 رائع! لقد حققت هدفك!',
                  almost: '💪 يكاد ينتهي! دفعة واحدة أخرى!',
                  great: '✨ أنت تبلي بلاءً حسناً! استمر!',
                  halfway: '🌟 أنت في منتصف الطريق! تقدم رائع!',
                  good: '🌱 بداية جيدة! استمر!',
                  started: '🌿 بداية جيدة! كل خطوة مهمة!',
                  begin: '🕌 هيا نبدأ! كل ذكر ثمين!',
                },
              };
              
              const messages = motivationMessages[language] || motivationMessages.tr;
              
              if (isTargetReached) {
                motivationMessage = messages.completed;
              } else if (progressPercentage >= 90) {
                motivationMessage = messages.almost;
              } else if (progressPercentage >= 75) {
                motivationMessage = messages.great;
              } else if (progressPercentage >= 50) {
                motivationMessage = messages.halfway;
              } else if (progressPercentage >= 25) {
                motivationMessage = messages.good;
              } else if (zikirCount > 0) {
                motivationMessage = messages.started;
              } else {
                motivationMessage = messages.begin;
              }
              
              return motivationMessage ? (
                <Text style={[styles.motivationMessage, { color: themeColors.primary }]}>
                  {motivationMessage}
                </Text>
              ) : null;
            })()}
          </View>

          {showSetTarget && (
            <View style={[styles.targetInputCard, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
              <Text style={[styles.targetInputLabel, { color: themeColors.text }]}>{t.setTarget}</Text>
              <TextInput
                style={[styles.targetInput, { backgroundColor: themeColors.background, color: themeColors.text, borderColor: themeColors.border }]}
                placeholder={t.targetPlaceholder}
                placeholderTextColor={themeColors.textMuted}
                value={newTarget}
                onChangeText={setNewTarget}
                keyboardType="numeric"
                autoFocus
              />
              <View style={styles.targetButtons}>
                <TouchableOpacity
                  style={[styles.cancelButton, { backgroundColor: themeColors.surfaceLight }]}
                  onPress={() => {
                    setShowSetTarget(false);
                    setNewTarget('');
                  }}
                >
                  <Text style={[styles.cancelButtonText, { color: themeColors.text }]}>{t.cancel}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.addButton, { backgroundColor: themeColors.primary }]}
                  onPress={setTarget}
                >
                  <Text style={styles.addButtonText}>{t.save}</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </ScrollView>

        {/* Kutlama Animasyonu */}
        {showCelebration && (
          <View style={styles.celebrationOverlay}>
            <View style={[styles.celebrationCard, { backgroundColor: themeColors.surface, borderColor: themeColors.primary }]}>
              <Text style={styles.celebrationEmoji}>🎉</Text>
              <Text style={[styles.celebrationTitle, { color: themeColors.primary }]}>
                {language === 'tr' ? 'Hedef Tamamlandı!' : language === 'en' ? 'Goal Completed!' : 'تم إكمال الهدف!'}
              </Text>
              <Text style={[styles.celebrationMessage, { color: themeColors.text }]}>
                {language === 'tr' 
                  ? `${zikir.name} zikiri için günlük hedefinize ulaştınız!`
                  : language === 'en'
                  ? `You reached your daily goal for ${zikir.name} dhikr!`
                  : `لقد حققت هدفك اليومي لذكر ${zikir.name}!`}
              </Text>
              <Text style={[styles.celebrationCount, { color: themeColors.textMuted }]}>
                {zikirCount} / {zikirTarget || 100}
              </Text>
            </View>
          </View>
        )}

      <View style={[styles.buttonContainer, { backgroundColor: themeColors.surface, borderTopColor: themeColors.border }]}>
        <TouchableOpacity
          style={[styles.incrementButton, { backgroundColor: themeColors.primary }]}
          onPress={incrementZikir}
          activeOpacity={0.8}
        >
          <Text style={styles.incrementButtonText}>+1</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.resetButton, { backgroundColor: themeColors.surfaceLight }]}
          onPress={resetZikir}
          activeOpacity={0.8}
        >
          <Text style={[styles.resetButtonText, { color: themeColors.text }]}>{t.reset}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// Ayarlar Ekranı
function SettingsScreen() {
  const db = useDatabase();
  const themeContext = useTheme();
  const theme = themeContext?.theme || 'dark';
  const setTheme = themeContext?.setTheme || (() => {});
  const themeThemes = themeContext?.themes || themes;
  const { language, t } = useLanguage();
  const [currentTheme, setCurrentTheme] = useState(theme);
  const [defaultTarget, setDefaultTarget] = useState('100');
  const [hapticEnabled, setHapticEnabled] = useState(true);
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [reminderTime, setReminderTime] = useState('09:00');
  const [tempHours, setTempHours] = useState(9);
  const [tempMinutes, setTempMinutes] = useState(0);

  useEffect(() => {
    if (db) {
      loadTheme();
      loadSettings();
    }
  }, [db]);

  // Tab'a her gidildiğinde ayarları yeniden yükle
  useFocusEffect(
    React.useCallback(() => {
      if (db) {
        loadTheme();
        loadSettings();
      }
    }, [db, language])
  );

  const loadTheme = async () => {
    if (!db) return;
    try {
      const result = await db.getAllAsync(
        'SELECT value FROM settings WHERE key = ?;',
        ['theme']
      );
      if (result.length > 0) {
        const savedTheme = result[0].value;
        if (themeThemes[savedTheme]) {
          setCurrentTheme(savedTheme);
          setTheme(savedTheme);
        }
      }
    } catch (error) {
      console.error('Tema yüklenirken hata:', error);
    }
  };

  const loadSettings = async () => {
    if (!db) return;
    try {
      // Varsayılan hedef
      const targetResult = await db.getAllAsync(
        'SELECT value FROM settings WHERE key = ?;',
        ['defaultTarget']
      );
      if (targetResult.length > 0) {
        setDefaultTarget(targetResult[0].value);
      }

      // Haptic feedback
      const hapticResult = await db.getAllAsync(
        'SELECT value FROM settings WHERE key = ?;',
        ['hapticEnabled']
      );
      if (hapticResult.length > 0) {
        setHapticEnabled(hapticResult[0].value === 'true');
      }

      // Hatırlatıcı ayarları
      const reminderResult = await db.getAllAsync(
        'SELECT value FROM settings WHERE key = ?;',
        ['reminderEnabled']
      );
      if (reminderResult.length > 0) {
        setReminderEnabled(reminderResult[0].value === 'true');
      }

      const reminderTimeResult = await db.getAllAsync(
        'SELECT value FROM settings WHERE key = ?;',
        ['reminderTime']
      );
      if (reminderTimeResult.length > 0) {
        const time = reminderTimeResult[0].value;
        setReminderTime(time);
        // tempHours ve tempMinutes'i güncelle
        const timeParts = time.split(':');
        const hours = parseInt(timeParts[0]) || 9;
        const minutes = parseInt(timeParts[1]) || 0;
        setTempHours(hours);
        setTempMinutes(minutes);
      }
    } catch (error) {
      console.error('Ayarlar yüklenirken hata:', error);
    }
  };

  const saveSetting = async (key, value) => {
    if (!db) return;
    try {
      const existing = await db.getAllAsync(
        'SELECT id FROM settings WHERE key = ?;',
        [key]
      );
      
      if (existing.length > 0) {
        await db.runAsync(
          'UPDATE settings SET value = ? WHERE id = ?;',
          [value.toString(), existing[0].id]
        );
      } else {
        await db.runAsync(
          'INSERT INTO settings (key, value) VALUES (?, ?);',
          [key, value.toString()]
        );
      }
    } catch (error) {
      console.error('Ayar kaydetme hatası:', error);
    }
  };

  const handleThemeChange = async (themeKey) => {
    if (!db) return;
    try {
      await saveSetting('theme', themeKey);
      setCurrentTheme(themeKey);
      setTheme(themeKey);
      if (hapticEnabled) {
        safeNotificationAsync('Success');
      }
    } catch (error) {
      console.error('Tema kaydetme hatası:', error);
    }
  };

  const handleDefaultTargetChange = async (value) => {
    if (!db) return;
    
    const numValue = parseInt(value);
    if (isNaN(numValue) || numValue < 1) {
      Alert.alert(t.error, t.enterValidNumber);
      return;
    }
    
    try {
      // ÖNCE eski varsayılan hedefi oku (yeni değer kaydedilmeden önce)
      let oldDefaultTarget = 100;
      const oldTargetResult = await db.getAllAsync(
        'SELECT value FROM settings WHERE key = ?;',
        ['defaultTarget']
      );
      if (oldTargetResult.length > 0) {
        oldDefaultTarget = parseInt(oldTargetResult[0].value) || 100;
      }
      
      
      // Yeni varsayılan hedefi kaydet
      await saveSetting('defaultTarget', numValue);
      setDefaultTarget(value);
      
      let updatedCount = 0;
      
      // Tüm default zikirler için hedefleri güncelle
      for (const zikir of ZIKIR_LIST) {
        const existing = await db.getAllAsync(
          `SELECT id, target FROM zikir_targets 
           WHERE zikir_id = ? AND zikir_type = ?
           LIMIT 1;`,
          [zikir.id, 'default']
        );
        
        if (existing.length > 0) {
          // Kullanıcı "tüm hepsinin güncellenmesini istiyorum" dedi
          // Bu yüzden TÜM hedefleri güncelle
          await db.runAsync(
            'UPDATE zikir_targets SET target = ? WHERE id = ?;',
            [numValue, existing[0].id]
          );
          updatedCount++;
        } else {
          // Hedef yoksa yeni varsayılan hedefi ekle
          try {
            await db.runAsync(
              'INSERT INTO zikir_targets (zikir_id, zikir_type, target) VALUES (?, ?, ?);',
              [zikir.id, 'default', numValue]
            );
            updatedCount++;
          } catch (error) {
            // Eğer UNIQUE constraint hatası varsa, UPDATE yap
            if (error.message && error.message.includes('UNIQUE')) {
              const existingForUpdate = await db.getAllAsync(
                `SELECT id FROM zikir_targets 
                 WHERE zikir_id = ? AND zikir_type = ?
                 LIMIT 1;`,
                [zikir.id, 'default']
              );
              if (existingForUpdate.length > 0) {
                await db.runAsync(
                  'UPDATE zikir_targets SET target = ? WHERE id = ?;',
                  [numValue, existingForUpdate[0].id]
                );
                updatedCount++;
              }
            } else {
              console.error(`Zikir ${zikir.id} eklenirken hata:`, error);
            }
          }
        }
      }
      
      // Tüm custom zikirler için hedefleri güncelle
      const customZikirs = await db.getAllAsync('SELECT id FROM custom_zikirs;');
      for (const zikir of customZikirs) {
        const existing = await db.getAllAsync(
          `SELECT id, target FROM zikir_targets 
           WHERE zikir_id = ? AND zikir_type = ?
           LIMIT 1;`,
          [zikir.id, 'custom']
        );
        
        if (existing.length > 0) {
          const currentTarget = existing[0].target;
          const targetValue = currentTarget != null ? Number(currentTarget) : null;
          
          // Kullanıcı "tüm hepsinin güncellenmesini istiyorum" dedi
          // Bu yüzden TÜM custom zikir hedeflerini de güncelle
          await db.runAsync(
            'UPDATE zikir_targets SET target = ? WHERE id = ?;',
            [numValue, existing[0].id]
          );
          updatedCount++;
        } else {
          // Hedef yoksa yeni varsayılan hedefi ekle
          try {
            await db.runAsync(
              'INSERT INTO zikir_targets (zikir_id, zikir_type, target) VALUES (?, ?, ?);',
              [zikir.id, 'custom', numValue]
            );
            updatedCount++;
          } catch (error) {
            // Eğer UNIQUE constraint hatası varsa, UPDATE yap
            if (error.message && error.message.includes('UNIQUE')) {
              const existingForUpdate = await db.getAllAsync(
                `SELECT id FROM zikir_targets 
                 WHERE zikir_id = ? AND zikir_type = ?
                 LIMIT 1;`,
                [zikir.id, 'custom']
              );
              if (existingForUpdate.length > 0) {
                await db.runAsync(
                  'UPDATE zikir_targets SET target = ? WHERE id = ?;',
                  [numValue, existingForUpdate[0].id]
                );
                updatedCount++;
              }
            } else {
              console.error(`Custom Zikir ${zikir.id} eklenirken hata:`, error);
            }
          }
        }
      }
      
      
      if (hapticEnabled) {
        safeNotificationAsync('Success');
      }
      Alert.alert(t.success, language === 'tr' ? `Varsayılan hedef kaydedildi ve ${updatedCount} zikir hedefi güncellendi` : language === 'en' ? `Default target saved and ${updatedCount} dhikr targets updated` : `تم حفظ الهدف الافتراضي وتحديث ${updatedCount} هدف ذكر`);
    } catch (error) {
      console.error('Varsayılan hedef güncelleme hatası:', error);
      Alert.alert(t.error, language === 'tr' ? 'Varsayılan hedef güncellenirken bir hata oluştu' : language === 'en' ? 'An error occurred while updating default target' : 'حدث خطأ أثناء تحديث الهدف الافتراضي');
    }
  };

  const handleHapticToggle = async () => {
    const newValue = !hapticEnabled;
    await saveSetting('hapticEnabled', newValue);
    setHapticEnabled(newValue);
    if (newValue) {
      safeNotificationAsync('Success');
    }
  };

  const handleReminderToggle = async () => {
    const newValue = !reminderEnabled;
    await saveSetting('reminderEnabled', newValue);
    setReminderEnabled(newValue);
    
    if (newValue) {
      // Hatırlatıcıyı etkinleştir
      await scheduleDailyReminder(reminderTime);
      if (hapticEnabled) {
        safeNotificationAsync('Success');
      }
    } else {
      // Tüm hatırlatıcıları iptal et
      await Notifications.cancelAllScheduledNotificationsAsync();
      if (hapticEnabled) {
        safeNotificationAsync('Success');
      }
    }
  };


  const handleTimePickerConfirm = async () => {
    const newTime = `${String(tempHours).padStart(2, '0')}:${String(tempMinutes).padStart(2, '0')}`;
    setReminderTime(newTime);
    
    await saveSetting('reminderTime', newTime);
    
    if (reminderEnabled) {
      const notificationId = await scheduleDailyReminder(newTime);
      
      // Hatırlatıcının başarıyla ayarlandığını kontrol et
      setTimeout(async () => {
        const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();
        console.log('Ayarlandı:', scheduledNotifications.length, 'bildirim');
        
        if (scheduledNotifications.length === 0 && notificationId) {
          // Bildirim ayarlanmamış ama ID var - muhtemelen Expo Go sınırlaması
          console.warn('Bildirim ID var ama listede yok - Expo Go sınırlaması olabilir');
        }
      }, 500);
    }
    
    if (hapticEnabled) {
      safeNotificationAsync('Success');
    }
    
    Alert.alert(
      t.success, 
      language === 'tr' 
        ? `Hatırlatıcı ${newTime} saatine ayarlandı. Her gün bu saatte bildirim alacaksınız.` 
        : language === 'en' 
        ? `Reminder set to ${newTime}. You will receive a notification at this time every day.`
        : `تم تعيين التذكير على ${newTime}. ستتلقى إشعارًا في هذا الوقت كل يوم.`
    );
  };

  const scheduleDailyReminder = async (time) => {
    try {
      // Bildirim izinlerini kontrol et ve iste
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      if (finalStatus !== 'granted') {
        Alert.alert(
          language === 'tr' ? 'Bildirim İzni Gerekli' : language === 'en' ? 'Notification Permission Required' : 'إذن الإشعار مطلوب',
          language === 'tr' 
            ? 'Hatırlatıcıları almak için bildirim izni vermeniz gerekiyor. Lütfen ayarlardan bildirim iznini açın.' 
            : language === 'en' 
            ? 'You need to grant notification permission to receive reminders. Please enable notifications in settings.'
            : 'تحتاج إلى منح إذن الإشعار لتلقي التذكيرات. يرجى تمكين الإشعارات في الإعدادات.',
          [{ text: language === 'tr' ? 'Tamam' : language === 'en' ? 'OK' : 'حسناً' }]
        );
        return;
      }
      
      // Önce tüm hatırlatıcıları iptal et
      await Notifications.cancelAllScheduledNotificationsAsync();
      
      const [hours, minutes] = time.split(':').map(Number);
      
      // Günlük hatırlatıcı ayarla
      console.log('Bildirim ayarlanıyor...', `Saat: ${hours}:${minutes}`);
      
      // Önce test bildirimi gönder (hemen gönderilen bildirim çalışıyor mu kontrol et)
      try {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: language === 'tr' ? '✅ Test Bildirimi' : language === 'en' ? '✅ Test Notification' : '✅ إشعار تجريبي',
            body: language === 'tr' ? 'Bildirimler çalışıyor!' : language === 'en' ? 'Notifications are working!' : 'الإشعارات تعمل!',
            sound: true,
            priority: Notifications.AndroidNotificationPriority.HIGH,
            data: { type: 'test' },
          },
          trigger: null, // Hemen gönder
        });
        console.log('Test bildirimi gönderildi');
      } catch (testError) {
        console.error('Test bildirimi hatası:', testError);
      }
      
      // Günlük tekrarlayan bildirim ayarla
      let notificationId;
      try {
        notificationId = await Notifications.scheduleNotificationAsync({
          content: {
            title: language === 'tr' ? '🕌 Zikir Zamanı!' : language === 'en' ? '🕌 Dhikr Time!' : '🕌 وقت الذكر!',
            body: language === 'tr' ? 'Günlük zikir hedefinize ulaşmak için başlayın.' : language === 'en' ? 'Start to reach your daily dhikr target.' : 'ابدأ للوصول إلى هدف الذكر اليومي.',
            sound: true,
            priority: Notifications.AndroidNotificationPriority.HIGH,
            data: { type: 'reminder' },
          },
          trigger: {
            hour: hours,
            minute: minutes,
            repeats: true,
          },
        });
        
        console.log('Bildirim ID:', notificationId);
      } catch (scheduleError) {
        console.error('Bildirim ayarlama hatası:', scheduleError);
        throw scheduleError; // Hatayı yukarı fırlat
      }
      
      // Ayarlanan bildirimleri kontrol et
      const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();
      console.log('Toplam ayarlanan bildirim sayısı:', scheduledNotifications.length);
      if (scheduledNotifications.length > 0) {
        console.log('İlk bildirim detayları:', JSON.stringify(scheduledNotifications[0], null, 2));
      } else {
        console.warn('⚠️ Hiç bildirim ayarlanmamış! Expo Go sınırlaması olabilir.');
      }
      
      // Test için: Eğer seçilen saat geçmişse, bir sonraki gün için ayarlandığını kontrol et
      const now = new Date();
      const selectedTime = new Date();
      selectedTime.setHours(hours, minutes, 0, 0);
      
      if (selectedTime < now) {
        console.log('Seçilen saat bugün geçti, yarın için ayarlandı');
      } else {
        console.log('Bildirim bugün', selectedTime.toLocaleTimeString(), 'saatinde gönderilecek');
      }
      
      return notificationId;
    } catch (error) {
      console.error('Hatırlatıcı ayarlama hatası:', error);
      Alert.alert(
        language === 'tr' ? 'Hata' : language === 'en' ? 'Error' : 'خطأ',
        language === 'tr' 
          ? 'Hatırlatıcı ayarlanırken bir hata oluştu. Lütfen tekrar deneyin.' 
          : language === 'en' 
          ? 'An error occurred while setting the reminder. Please try again.'
          : 'حدث خطأ أثناء تعيين التذكير. يرجى المحاولة مرة أخرى.',
        [{ text: language === 'tr' ? 'Tamam' : language === 'en' ? 'OK' : 'حسناً' }]
      );
    }
  };

  const handleResetAllData = () => {
    Alert.alert(
      t.resetAllData,
      language === 'tr' ? 'Bu işlem tüm zikir kayıtlarını, hedefleri ve özel zikirleri siler. Bu işlem geri alınamaz. Emin misiniz?' : language === 'en' ? 'This will delete all dhikr records, targets, and custom dhikrs. This action cannot be undone. Are you sure?' : 'سيؤدي هذا إلى حذف جميع سجلات الذكر والأهداف والأذكار المخصصة. لا يمكن التراجع عن هذا الإجراء. هل أنت متأكد؟',
      [
        { text: t.cancel, style: 'cancel' },
        {
          text: t.reset,
          style: 'destructive',
          onPress: async () => {
            if (!db) return;
            try {
              await db.execAsync('DELETE FROM zikir_records;');
              await db.execAsync('DELETE FROM zikir_targets;');
              await db.execAsync('DELETE FROM custom_zikirs;');
              if (hapticEnabled) {
                safeNotificationAsync('Success');
              }
              Alert.alert(t.success, t.resetSuccess);
            } catch (error) {
              console.error('Veri sıfırlama hatası:', error);
              Alert.alert(t.error, t.resetError);
            }
          },
        },
      ]
    );
  };

  const themeColors = themeThemes[currentTheme]?.colors || themeThemes.dark?.colors || themes.dark.colors;

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      <StatusBar style="light" />
      <View style={[styles.header, { backgroundColor: themeColors.surface, borderBottomColor: themeColors.border }]}>
        <Text style={[styles.headerTitle, { color: themeColors.text }]}>{t.settings}</Text>
        <Text style={[styles.headerSubtitle, { color: themeColors.textMuted }]}>{t.appSettings}</Text>
      </View>

      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.scrollContent}
      >
        <View style={[styles.settingsSection, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
          <Text style={[styles.settingsSectionTitle, { color: themeColors.text }]}>{t.theme}</Text>
          <Text style={[styles.settingsSectionDescription, { color: themeColors.textMuted }]}>
            {language === 'tr' ? 'Uygulama temasını seçin' : language === 'en' ? 'Select app theme' : 'اختر مظهر التطبيق'}
          </Text>
          
          {Object.keys(themeThemes).map((themeKey) => {
            const themeData = themeThemes[themeKey];
            const isSelected = currentTheme === themeKey;
            const themeName = t[`theme_${themeKey}_name`] || themeData.name;
            const themeDescription = t[`theme_${themeKey}_description`] || themeData.description;
            return (
              <TouchableOpacity
                key={themeKey}
                style={[
                  styles.themeOption,
                  { 
                    backgroundColor: isSelected ? themeData.colors.surface : themeColors.surface,
                    borderColor: isSelected ? themeData.colors.primary : themeColors.border,
                    borderWidth: isSelected ? 2 : 1,
                  }
                ]}
                onPress={() => handleThemeChange(themeKey)}
                activeOpacity={0.7}
              >
                <View style={styles.themeOptionContent}>
                  <View style={styles.themePreview}>
                    <View style={[styles.themePreviewColor, { backgroundColor: themeData.colors.primary }]} />
                    <View style={[styles.themePreviewColor, { backgroundColor: themeData.colors.surface }]} />
                    <View style={[styles.themePreviewColor, { backgroundColor: themeData.colors.background }]} />
                  </View>
                  <View style={styles.themeInfo}>
                    <Text style={[styles.themeName, { color: themeColors.text }]}>
                      {themeName}
                    </Text>
                    <Text style={[styles.themeDescription, { color: themeColors.textMuted }]}>
                      {themeDescription}
                    </Text>
                  </View>
                  {isSelected && (
                    <View style={[styles.themeCheck, { backgroundColor: themeData.colors.primary }]}>
                      <Text style={styles.themeCheckText}>✓</Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Varsayılan Hedef */}
        <View style={[styles.settingsSection, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
          <Text style={[styles.settingsSectionTitle, { color: themeColors.text }]}>{t.defaultTarget}</Text>
          <Text style={[styles.settingsSectionDescription, { color: themeColors.textMuted }]}>
            {t.defaultTargetDesc}
          </Text>
          <View style={styles.settingRow}>
            <TextInput
              style={[styles.settingInput, { backgroundColor: themeColors.background, color: themeColors.text, borderColor: themeColors.border }]}
              placeholder="100"
              placeholderTextColor={themeColors.textMuted}
              keyboardType="numeric"
              value={defaultTarget}
              onChangeText={setDefaultTarget}
              onSubmitEditing={(e) => handleDefaultTargetChange(e.nativeEvent.text)}
            />
              <TouchableOpacity
                style={[styles.settingButton, { backgroundColor: themeColors.primary }]}
                onPress={() => handleDefaultTargetChange(defaultTarget)}
              >
                <Text style={styles.settingButtonText}>{t.save}</Text>
              </TouchableOpacity>
          </View>
        </View>

        {/* Haptic Feedback */}
        <View style={[styles.settingsSection, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
          <Text style={[styles.settingsSectionTitle, { color: themeColors.text }]}>{t.hapticFeedback}</Text>
          <Text style={[styles.settingsSectionDescription, { color: themeColors.textMuted }]}>
            {language === 'tr' ? 'Dokunma geri bildirimini aç/kapat' : language === 'en' ? 'Enable/disable touch feedback' : 'تفعيل/تعطيل رد اللمس'}
          </Text>
          <TouchableOpacity
            style={[styles.settingToggle, { backgroundColor: hapticEnabled ? themeColors.primary : themeColors.surfaceLight, borderColor: themeColors.border }]}
            onPress={handleHapticToggle}
          >
            <Text style={[styles.settingToggleText, { color: hapticEnabled ? '#ffffff' : themeColors.text }]}>
              {hapticEnabled ? t.on : t.off}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Günlük Hatırlatıcı */}
        <View style={[styles.settingsSection, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
          <Text style={[styles.settingsSectionTitle, { color: themeColors.text }]}>{t.dailyReminder}</Text>
          <Text style={[styles.settingsSectionDescription, { color: themeColors.textMuted }]}>
            {language === 'tr' ? 'Her gün belirlediğiniz saatte zikir yapmanız için hatırlatıcı alın' : language === 'en' ? 'Get a reminder at your set time each day to do dhikr' : 'احصل على تذكير في الوقت المحدد كل يوم لأداء الذكر'}
          </Text>
          <TouchableOpacity
            style={[styles.settingToggle, { backgroundColor: reminderEnabled ? themeColors.primary : themeColors.surfaceLight, borderColor: themeColors.border }]}
            onPress={handleReminderToggle}
          >
            <Text style={[styles.settingToggleText, { color: reminderEnabled ? '#ffffff' : themeColors.text }]}>
              {reminderEnabled ? t.on : t.off}
            </Text>
          </TouchableOpacity>
          {reminderEnabled && (
            <View style={styles.timePickerContainer}>
              <View style={styles.timePickerRow}>
                {/* Saat Seçici */}
                <View style={styles.timePickerGroup}>
                  <Text style={[styles.timePickerLabel, { color: themeColors.textMuted }]}>
                    {language === 'tr' ? 'Saat' : language === 'en' ? 'Hour' : 'ساعة'}
                  </Text>
                  <View style={[styles.timePickerControls, { backgroundColor: themeColors.background, borderColor: themeColors.border }]}>
                    <TouchableOpacity
                      style={[styles.timePickerButton, { backgroundColor: themeColors.surfaceLight }]}
                      onPress={() => {
                        const newHours = tempHours <= 0 ? 23 : tempHours - 1;
                        setTempHours(newHours);
                        safeImpactAsync('Light');
                      }}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.timePickerButtonText, { color: themeColors.text }]}>−</Text>
                    </TouchableOpacity>
                    <Text style={[styles.timePickerValue, { color: themeColors.text }]}>
                      {String(tempHours).padStart(2, '0')}
                    </Text>
                    <TouchableOpacity
                      style={[styles.timePickerButton, { backgroundColor: themeColors.surfaceLight }]}
                      onPress={() => {
                        const newHours = tempHours >= 23 ? 0 : tempHours + 1;
                        setTempHours(newHours);
                        safeImpactAsync('Light');
                      }}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.timePickerButtonText, { color: themeColors.text }]}>+</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <Text style={[styles.timePickerSeparator, { color: themeColors.text }]}>:</Text>

                {/* Dakika Seçici */}
                <View style={styles.timePickerGroup}>
                  <Text style={[styles.timePickerLabel, { color: themeColors.textMuted }]}>
                    {language === 'tr' ? 'Dakika' : language === 'en' ? 'Minute' : 'دقيقة'}
                  </Text>
                  <View style={[styles.timePickerControls, { backgroundColor: themeColors.background, borderColor: themeColors.border }]}>
                    <TouchableOpacity
                      style={[styles.timePickerButton, { backgroundColor: themeColors.surfaceLight }]}
                      onPress={() => {
                        const newMinutes = tempMinutes <= 0 ? 59 : tempMinutes - 1;
                        setTempMinutes(newMinutes);
                        safeImpactAsync('Light');
                      }}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.timePickerButtonText, { color: themeColors.text }]}>−</Text>
                    </TouchableOpacity>
                    <Text style={[styles.timePickerValue, { color: themeColors.text }]}>
                      {String(tempMinutes).padStart(2, '0')}
                    </Text>
                    <TouchableOpacity
                      style={[styles.timePickerButton, { backgroundColor: themeColors.surfaceLight }]}
                      onPress={() => {
                        const newMinutes = tempMinutes >= 59 ? 0 : tempMinutes + 1;
                        setTempMinutes(newMinutes);
                        safeImpactAsync('Light');
                      }}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.timePickerButtonText, { color: themeColors.text }]}>+</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              <View style={styles.timePickerActionButtons}>
                <TouchableOpacity
                  style={[styles.timePickerActionButton, { backgroundColor: themeColors.surfaceLight, borderColor: themeColors.border }]}
                  onPress={() => {
                    const timeParts = reminderTime.split(':');
                    setTempHours(parseInt(timeParts[0]) || 9);
                    setTempMinutes(parseInt(timeParts[1]) || 0);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.timePickerActionButtonText, { color: themeColors.text }]}>
                    {t.cancel}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.timePickerActionButton, { backgroundColor: themeColors.primary }]}
                  onPress={handleTimePickerConfirm}
                  activeOpacity={0.7}
                >
                  <Text style={styles.timePickerActionButtonText}>
                    {t.save}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        {/* Veri Yönetimi */}
        <View style={[styles.settingsSection, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
          <Text style={[styles.settingsSectionTitle, { color: themeColors.text }]}>{t.dataManagement}</Text>
          <Text style={[styles.settingsSectionDescription, { color: themeColors.textMuted }]}>
            {t.resetAllDataDesc}
          </Text>
          <TouchableOpacity
            style={[styles.settingDangerButton, { backgroundColor: themeColors.surfaceLight, borderColor: '#ef4444' }]}
            onPress={handleResetAllData}
          >
            <Text style={[styles.settingDangerButtonText, { color: '#ef4444' }]}>
              {t.resetAllData}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Uygulama Hakkında */}
        <View style={[styles.settingsSection, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
          <Text style={[styles.settingsSectionTitle, { color: themeColors.text }]}>{t.about}</Text>
          <View style={styles.aboutRow}>
            <Text style={[styles.aboutLabel, { color: themeColors.textMuted }]}>{t.version}</Text>
            <Text style={[styles.aboutValue, { color: themeColors.text }]}>1.0.0</Text>
          </View>
          <View style={styles.aboutRow}>
            <Text style={[styles.aboutLabel, { color: themeColors.textMuted }]}>{t.developer}</Text>
            <Text style={[styles.aboutValue, { color: themeColors.text }]}>{t.appName}</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

// Ana Tab Navigator
function MainTabs() {
  const themeContext = useTheme();
  const theme = themeContext?.theme || 'dark';
  const themeThemes = themeContext?.themes || themes;
  const themeColors = themeThemes[theme]?.colors || themeThemes.dark?.colors || themes.dark.colors;
  const { t } = useLanguage();

  return (
    <View style={{ flex: 1, backgroundColor: themeColors.background }}>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: themeColors.surface,
            borderTopColor: themeColors.border,
            borderTopWidth: 1,
            height: 60,
            paddingBottom: 8,
            paddingTop: 8,
          },
          tabBarActiveTintColor: themeColors.primary,
          tabBarInactiveTintColor: themeColors.textMuted,
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: '600',
          },
          animationEnabled: true,
          tabBarHideOnKeyboard: true,
        }}
      >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen}
        options={{
          tabBarLabel: t.zikirler,
          tabBarIcon: ({ color }) => (
            <Text style={{ color, fontSize: 20 }}>📿</Text>
          ),
        }}
      />
      <Tab.Screen 
        name="Analytics" 
        component={AnalyticsScreen}
        options={{
          tabBarLabel: t.analytics,
          tabBarIcon: ({ color }) => (
            <Text style={{ color, fontSize: 20 }}>📈</Text>
          ),
        }}
      />
      <Tab.Screen 
        name="Settings" 
        component={SettingsScreen}
        options={{
          tabBarLabel: t.settings,
          tabBarIcon: ({ color }) => (
            <Text style={{ color, fontSize: 20 }}>⚙️</Text>
          ),
        }}
      />
    </Tab.Navigator>
    </View>
  );
}

// Güncelleme Kontrolü
const CURRENT_APP_VERSION = '1.0.0'; // app.json'daki version ile aynı olmalı
const UPDATE_CHECK_URL = 'https://raw.githubusercontent.com/yourusername/zikirsayac/main/version.json'; // Bu URL'yi kendi repo'nuzla değiştirin

const checkForUpdates = async (language = 'tr', database = null) => {
  try {
    // Güncelleme kontrolü yap (isteğe bağlı - URL yoksa atla)
    if (!UPDATE_CHECK_URL || UPDATE_CHECK_URL.includes('yourusername')) {
      return; // URL ayarlanmamışsa kontrol yapma
    }

    // Daha önce bu versiyon için bildirim gösterilmiş mi kontrol et
    if (database) {
      try {
        const notifiedResult = await database.getAllAsync(
          'SELECT value FROM settings WHERE key = ?;',
          ['updateNotifiedVersion']
        );
        if (notifiedResult.length > 0 && notifiedResult[0].value) {
          // Bu versiyon için zaten bildirim gösterilmiş, tekrar gösterme
          return;
        }
      } catch (error) {
        // Veritabanı hatası - devam et
      }
    }

    const response = await fetch(UPDATE_CHECK_URL, {
      method: 'GET',
      headers: {
        'Cache-Control': 'no-cache',
      },
    });
    
    if (!response.ok) {
      return; // Hata durumunda sessizce devam et
    }

    const data = await response.json();
    const latestVersion = data.version || data.latestVersion;
    
    if (latestVersion && latestVersion !== CURRENT_APP_VERSION) {
      // Yeni versiyon var - bildirim gönder
      const updateMessages = {
        tr: {
          title: '🔄 Yeni Güncelleme Mevcut!',
          body: `Versiyon ${latestVersion} yayınlandı. Güncellemek için mağazayı ziyaret edin.`,
          button: 'Güncelle',
        },
        en: {
          title: '🔄 New Update Available!',
          body: `Version ${latestVersion} has been released. Visit the store to update.`,
          button: 'Update',
        },
        ar: {
          title: '🔄 تحديث جديد متاح!',
          body: `تم إصدار الإصدار ${latestVersion}. قم بزيارة المتجر للتحديث.`,
          button: 'تحديث',
        },
      };

      const messages = updateMessages[language] || updateMessages.tr;
      
      // Bildirim gönder
      try {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: messages.title,
            body: messages.body,
            sound: true,
            priority: Notifications.AndroidNotificationPriority.HIGH,
            data: { type: 'update', version: latestVersion },
          },
          trigger: null, // Hemen gönder
        });
      } catch (error) {
        // Bildirim hatası - devam et
      }

      // Alert göster
      Alert.alert(
        messages.title,
        messages.body,
        [
          {
            text: language === 'tr' ? 'Daha Sonra' : language === 'en' ? 'Later' : 'لاحقاً',
            style: 'cancel',
            onPress: async () => {
              // Bildirimi kaydet (tekrar gösterme)
              if (database) {
                try {
                  await database.runAsync(
                    'INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?);',
                    ['updateNotifiedVersion', latestVersion]
                  );
                } catch (error) {
                  // Hata sessizce yok sayılır
                }
              }
            },
          },
          {
            text: messages.button,
            onPress: async () => {
              // Bildirimi kaydet
              if (database) {
                try {
                  await database.runAsync(
                    'INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?);',
                    ['updateNotifiedVersion', latestVersion]
                  );
                } catch (error) {
                  // Hata sessizce yok sayılır
                }
              }
              // Play Store veya App Store'a yönlendir
              const storeUrl = Platform.OS === 'android'
                ? 'https://play.google.com/store/apps/details?id=com.zikirsayac.app'
                : 'https://apps.apple.com/app/zikirsayac';
              Linking.openURL(storeUrl).catch(() => {});
            },
          },
        ]
      );
    }
  } catch (error) {
    // Hata durumunda sessizce devam et
    console.log('Güncelleme kontrolü hatası:', error);
  }
};

// Ana App Component
function AppContent() {
  const [loading, setLoading] = useState(true);
  const [db, setDb] = useState(null);
  const [theme, setTheme] = useState('dark');
  const [language, setLanguage] = useState('tr');

  useEffect(() => {
    // Bildirim ayarlarını yapılandır
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });

    // Uygulama açıldığında bildirim izinlerini kontrol et
    const checkNotificationPermissions = async () => {
      try {
        const { status } = await Notifications.getPermissionsAsync();
        if (status !== 'granted') {
          console.log('Bildirim izni henüz verilmemiş');
        }
      } catch (error) {
        console.log('Bildirim izni kontrol edilemedi:', error);
      }
    };
    
    checkNotificationPermissions();

    // Android sistem navigation bar'ı görünür yap ve tema rengine göre ayarla
    const setupNavigationBar = async () => {
      if (Platform.OS === 'android') {
        try {
          await NavigationBar.setVisibilityAsync('visible');
          // Edge-to-edge modunda setBackgroundColorAsync desteklenmediği için sadece buton stilini ayarla
          await NavigationBar.setButtonStyleAsync('light');
        } catch (error) {
          // Hata sessizce yok sayılır
        }
      }
    };

    setupNavigationBar();

    const initializeDb = async () => {
      try {
        const database = await SQLite.openDatabaseAsync('zikirsayac.db');
        setDb(database);
        await initDatabase(database);
        await loadSavedTheme(database);
        await loadSavedLanguage(database);
        setLoading(false);
        
        // Uygulama yüklendikten sonra güncelleme kontrolü yap
        setTimeout(() => {
          checkForUpdates(language, database);
        }, 2000); // 2 saniye bekle (kullanıcı deneyimini bozmamak için)
      } catch (error) {
        console.error('Veritabanı başlatma hatası:', error);
        setLoading(false);
      }
    };
    initializeDb();
  }, []);

  // Tema değiştiğinde navigation bar buton stilini güncelle
  useEffect(() => {
    const updateNavigationBarStyle = async () => {
      if (Platform.OS === 'android' && theme) {
        try {
          // Edge-to-edge modunda setBackgroundColorAsync desteklenmediği için sadece buton stilini ayarla
          // Koyu temalar için açık butonlar, açık temalar için koyu butonlar
          const isDarkTheme = theme === 'dark' || theme === 'green' || theme === 'gold' || theme === 'blue' || theme === 'purple';
          await NavigationBar.setButtonStyleAsync(
            isDarkTheme ? 'light' : 'dark'
          );
        } catch (error) {
          // Hata sessizce yok sayılır
        }
      }
    };

    updateNavigationBarStyle();
  }, [theme]);

  const loadSavedTheme = async (database) => {
    try {
      const result = await database.getAllAsync(
        'SELECT value FROM settings WHERE key = ?;',
        ['theme']
      );
      if (result.length > 0 && themes[result[0].value]) {
        setTheme(result[0].value);
      }
    } catch (error) {
      console.error('Tema yüklenirken hata:', error);
    }
  };

  const loadSavedLanguage = async (database) => {
    try {
      const result = await database.getAllAsync(
        'SELECT value FROM settings WHERE key = ?;',
        ['language']
      );
      if (result.length > 0 && translations[result[0].value]) {
        setLanguage(result[0].value);
      }
    } catch (error) {
      console.error('Dil yüklenirken hata:', error);
    }
  };

  const saveLanguage = async (database, lang) => {
    try {
      const existing = await database.getAllAsync(
        'SELECT id FROM settings WHERE key = ?;',
        ['language']
      );
      if (existing.length > 0) {
        await database.runAsync(
          'UPDATE settings SET value = ? WHERE key = ?;',
          [lang, 'language']
        );
      } else {
        await database.runAsync(
          'INSERT INTO settings (key, value) VALUES (?, ?);',
          ['language', lang]
        );
      }
    } catch (error) {
      console.error('Dil kaydetme hatası:', error);
    }
  };

  const handleLanguageChange = async (lang) => {
    setLanguage(lang);
    if (db) {
      await saveLanguage(db, lang);
    }
  };

  const t = translations[language] || translations.tr;

  const initDatabase = async (database) => {
    try {
      // Özel zikirler tablosu
      await database.execAsync(`
        CREATE TABLE IF NOT EXISTS custom_zikirs (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL UNIQUE,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
      `);
      
      // Zikir kayıtları tablosu - mevcut verileri koru
      await database.execAsync(`
        CREATE TABLE IF NOT EXISTS zikir_records (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          zikir_id INTEGER NOT NULL,
          zikir_type TEXT NOT NULL,
          count INTEGER DEFAULT 0,
          date DATE DEFAULT CURRENT_DATE,
          UNIQUE(zikir_id, zikir_type, date)
        );
      `);
      
      // Zikir hedefleri tablosu - mevcut verileri koru
      await database.execAsync(`
        CREATE TABLE IF NOT EXISTS zikir_targets (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          zikir_id INTEGER NOT NULL,
          zikir_type TEXT NOT NULL,
          target INTEGER DEFAULT 0,
          UNIQUE(zikir_id, zikir_type)
        );
      `);

      // Ayarlar tablosu
      await database.execAsync(`
        CREATE TABLE IF NOT EXISTS settings (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          key TEXT NOT NULL UNIQUE,
          value TEXT NOT NULL
        );
      `);

      // Başarımlar tablosu
      await database.execAsync(`
        CREATE TABLE IF NOT EXISTS achievements (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          achievement_key TEXT NOT NULL UNIQUE,
          unlocked_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
      `);
    } catch (error) {
      console.error('Veritabanı başlatma hatası:', error);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366f1" />
        <Text style={styles.loadingText}>Yükleniyor...</Text>
      </View>
    );
  }

  // Navigation state değiştiğinde navigation bar buton stilini güncelle
  const handleNavigationStateChange = async () => {
    if (Platform.OS === 'android' && theme) {
      try {
        // Edge-to-edge modunda setBackgroundColorAsync desteklenmediği için sadece buton stilini ayarla
        const isDarkTheme = theme === 'dark' || theme === 'green' || theme === 'gold' || theme === 'blue' || theme === 'purple';
        await NavigationBar.setButtonStyleAsync(
          isDarkTheme ? 'light' : 'dark'
        );
      } catch (error) {
        // Hata sessizce yok sayılır
      }
    }
  };

  return (
    <DatabaseContext.Provider value={db}>
      <LanguageContext.Provider value={{ language, setLanguage: handleLanguageChange, t }}>
        <ThemeContext.Provider value={{ theme, setTheme, themes }}>
          <NavigationContainer 
          onStateChange={handleNavigationStateChange}
        >
          <View style={{ flex: 1, backgroundColor: themes[theme]?.colors?.background || themes.dark.colors.background }}>
            <Stack.Navigator
              screenOptions={{
                headerShown: false,
                animation: 'slide_from_right',
                animationDuration: 300,
                gestureEnabled: true,
                fullScreenGestureEnabled: true,
              }}
            >
              <Stack.Screen 
                name="MainTabs" 
                component={MainTabs}
              />
              <Stack.Screen 
                name="Counter" 
                component={CounterScreen}
                options={{
                  animation: 'slide_from_right',
                  animationDuration: 300,
                  gestureEnabled: true,
                  fullScreenGestureEnabled: true,
                }}
              />
            </Stack.Navigator>
          </View>
        </NavigationContainer>
      </ThemeContext.Provider>
      </LanguageContext.Provider>
    </DatabaseContext.Provider>
  );
}

export default AppContent;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#0f172a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#e2e8f0',
    marginTop: 16,
    fontSize: 16,
  },
  header: {
    paddingTop: 50,
    paddingBottom: 10,
    paddingHorizontal: 16,
    backgroundColor: '#1e293b',
    borderBottomWidth: 0.5,
    borderBottomColor: '#334155',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerAccent: {
    width: 4,
    height: 24,
    borderRadius: 2,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: 0.3,
  },
  headerRightAccent: {
    width: 40,
    height: 4,
    borderRadius: 2,
  },
  languageSelector: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: 'transparent',
    borderWidth: 1.5,
  },
  languageText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#94a3b8',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  historyButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  historyButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  historyCard: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#334155',
  },
  historyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
  },
  historyItemLeft: {
    flex: 1,
  },
  historyDate: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  historyZikirCount: {
    fontSize: 11,
  },
  historyTotal: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  historyEmpty: {
    textAlign: 'center',
    padding: 20,
    fontSize: 14,
  },
  hadithCard: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#6366f1',
  },
  hadithHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  hadithIcon: {
    fontSize: 24,
  },
  hadithTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  hadithText: {
    fontSize: 15,
    lineHeight: 24,
    marginBottom: 12,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  hadithSource: {
    fontSize: 12,
    textAlign: 'right',
    marginBottom: 8,
  },
  hadithDay: {
    fontSize: 11,
    textAlign: 'center',
    marginTop: 8,
    fontStyle: 'italic',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 24,
  },
  addZikirButton: {
    backgroundColor: '#1e293b',
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: '#6366f1',
    borderStyle: 'dashed',
    alignItems: 'center',
  },
  addZikirButtonText: {
    color: '#6366f1',
    fontSize: 13,
    fontWeight: '600',
  },
  addZikirContainer: {
    backgroundColor: '#1e293b',
    padding: 16,
    borderRadius: 10,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  addZikirButtons: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#334155',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#e2e8f0',
    fontSize: 13,
    fontWeight: '600',
  },
  sectionContainer: {
    marginBottom: 16,
  },
  sectionTitle: {
    color: '#94a3b8',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 10,
    paddingHorizontal: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  selectedUserContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1e293b',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#6366f1',
  },
  selectedUserContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  selectedUserName: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
  clearUserButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#334155',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  clearUserButtonText: {
    color: '#e2e8f0',
    fontSize: 18,
    fontWeight: 'bold',
  },
  input: {
    flex: 1,
    backgroundColor: '#0f172a',
    color: '#ffffff',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    fontSize: 14,
    borderWidth: 1,
    marginBottom: 10,
    borderColor: '#334155',
  },
  arabicInput: {
    textAlign: 'right',
    fontSize: 18,
    fontFamily: Platform.OS === 'ios' ? 'Arial' : 'sans-serif',
  },
  addButton: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    justifyContent: 'center',
  },
  addButtonText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
  },
  listContainer: {
    padding: 20,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1e293b',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  userItemSelected: {
    borderColor: '#6366f1',
    borderWidth: 2,
    backgroundColor: '#1e293b',
  },
  checkmark: {
    color: '#6366f1',
    fontSize: 20,
    fontWeight: 'bold',
  },
  userItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  userAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#6366f1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  userAvatarText: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  userName: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '500',
  },
  arrow: {
    color: '#94a3b8',
    fontSize: 24,
    marginLeft: 12,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: '#64748b',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  counterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingBottom: 12,
    paddingHorizontal: 16,
    backgroundColor: '#1e293b',
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  backButton: {
    padding: 6,
  },
  backButtonText: {
    color: '#6366f1',
    fontSize: 16,
    fontWeight: '600',
  },
  counterUserName: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },
  placeholder: {
    width: 60,
  },
  deleteButton: {
    padding: 6,
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButtonText: {
    fontSize: 20,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  totalContainer: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  totalLabel: {
    color: '#94a3b8',
    fontSize: 16,
    marginBottom: 8,
    fontWeight: '500',
  },
  totalNumber: {
    color: '#6366f1',
    fontSize: 48,
    fontWeight: 'bold',
  },
  zikirGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  zikirCard: {
    width: '47%',
    backgroundColor: '#1e293b',
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
    minHeight: 90,
    justifyContent: 'center',
  },
  zikirCardDisabled: {
    opacity: 0.5,
  },
  zikirArabic: {
    color: '#6366f1',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 6,
  },
  zikirName: {
    color: '#e2e8f0',
    fontSize: 10,
    textAlign: 'center',
    fontWeight: '500',
  },
  counterScrollView: {
    flex: 1,
  },
  counterScrollContent: {
    padding: 16,
    paddingTop: 12,
    paddingBottom: 12,
  },
  counterContainer: {
    flex: 1,
    gap: 12,
  },
  zikirDetailsCard: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  arabicContainer: {
    backgroundColor: '#0f172a',
    borderRadius: 10,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 80,
  },
  zikirArabicLarge: {
    color: '#6366f1',
    fontSize: 28,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 40,
  },
  nameContainer: {
    alignItems: 'center',
  },
  zikirNameLabel: {
    color: '#94a3b8',
    fontSize: 11,
    marginBottom: 4,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  zikirNameLarge: {
    color: '#ffffff',
    fontSize: 16,
    textAlign: 'center',
    fontWeight: '600',
  },
  countCard: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#334155',
  },
  countHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  counterLabel: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  dateText: {
    color: '#64748b',
    fontSize: 11,
    fontWeight: '400',
  },
  counterNumber: {
    color: '#6366f1',
    fontSize: 48,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  statsCard: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#334155',
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statLabel: {
    color: '#94a3b8',
    fontSize: 11,
    marginBottom: 6,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statValue: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '600',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#334155',
    marginHorizontal: 16,
  },
  progressCard: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressLabel: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  progressText: {
    color: '#6366f1',
    fontSize: 13,
    fontWeight: '600',
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: '#0f172a',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#6366f1',
    borderRadius: 4,
  },
  progressPercent: {
    color: '#94a3b8',
    fontSize: 11,
    textAlign: 'center',
    fontWeight: '500',
  },
  motivationMessage: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(148, 163, 184, 0.2)',
  },
  targetInputCard: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  targetInputLabel: {
    color: '#94a3b8',
    fontSize: 12,
    marginBottom: 10,
    fontWeight: '500',
  },
  targetInput: {
    backgroundColor: '#0f172a',
    color: '#ffffff',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 12,
  },
  targetButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  buttonContainer: {
    padding: 16,
    gap: 12,
    paddingBottom: 24,
    backgroundColor: '#0f172a',
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  incrementButton: {
    backgroundColor: '#6366f1',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  incrementButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  resetButton: {
    backgroundColor: '#334155',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#475569',
  },
  resetButtonText: {
    color: '#e2e8f0',
    fontSize: 14,
    fontWeight: '600',
  },
  celebrationOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  celebrationCard: {
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    borderWidth: 2,
    minWidth: 280,
  },
  celebrationEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  celebrationTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  celebrationMessage: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 12,
  },
  celebrationCount: {
    fontSize: 18,
    fontWeight: '600',
  },
  statRow: {
    backgroundColor: '#1e293b',
    borderRadius: 10,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#334155',
  },
  statRowContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statRowName: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
  },
  statRowTotal: {
    color: '#6366f1',
    fontSize: 18,
    fontWeight: 'bold',
  },
  targetRow: {
    backgroundColor: '#1e293b',
    borderRadius: 10,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#334155',
  },
  targetRowContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  targetRowName: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  periodSelector: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#1e293b',
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
    gap: 8,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#334155',
    alignItems: 'center',
  },
  periodButtonActive: {
    backgroundColor: '#6366f1',
    borderColor: '#6366f1',
  },
  periodButtonText: {
    color: '#94a3b8',
    fontSize: 13,
    fontWeight: '600',
  },
  periodButtonTextActive: {
    color: '#ffffff',
  },
  analyticsCard: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  analyticsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  analyticsName: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
  },
  analyticsTotal: {
    color: '#6366f1',
    fontSize: 18,
    fontWeight: 'bold',
  },
  analyticsProgress: {
    marginTop: 8,
  },
  analyticsProgressBar: {
    height: 8,
    backgroundColor: '#0f172a',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  analyticsProgressFill: {
    height: '100%',
    backgroundColor: '#6366f1',
    borderRadius: 4,
  },
  analyticsProgressText: {
    color: '#94a3b8',
    fontSize: 11,
    textAlign: 'right',
  },
  settingsSection: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
  },
  settingsSectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  settingsSectionDescription: {
    fontSize: 13,
    marginBottom: 16,
  },
  themeOption: {
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
  },
  themeOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  themePreview: {
    flexDirection: 'row',
    marginRight: 12,
    gap: 4,
  },
  themePreviewColor: {
    width: 24,
    height: 24,
    borderRadius: 4,
  },
  themeInfo: {
    flex: 1,
  },
  themeName: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  themeDescription: {
    fontSize: 12,
  },
  themeCheck: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  themeCheckText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  settingRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  settingInput: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    fontSize: 14,
  },
  settingButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    justifyContent: 'center',
  },
  settingButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  settingToggle: {
    marginTop: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  reminderTimeContainer: {
    marginTop: 12,
    flexDirection: 'row',
    gap: 8,
  },
  timePickerContainer: {
    marginTop: 12,
  },
  timePickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 16,
  },
  timePickerGroup: {
    flex: 1,
    alignItems: 'center',
  },
  timePickerLabel: {
    fontSize: 12,
    marginBottom: 8,
    fontWeight: '600',
  },
  timePickerControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    borderWidth: 1,
    padding: 4,
    gap: 8,
  },
  timePickerButton: {
    width: 44,
    height: 44,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timePickerButtonText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  timePickerValue: {
    fontSize: 28,
    fontWeight: 'bold',
    minWidth: 50,
    textAlign: 'center',
  },
  timePickerSeparator: {
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 20,
  },
  timePickerActionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  timePickerActionButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  timePickerActionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  settingToggleText: {
    fontSize: 14,
    fontWeight: '600',
  },
  settingDangerButton: {
    marginTop: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  settingDangerButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  aboutRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(148, 163, 184, 0.1)',
  },
  aboutLabel: {
    fontSize: 14,
  },
  aboutValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  statsOverviewCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
  },
  statsOverviewTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  statsOverviewGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statsOverviewItem: {
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  streakContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  streakIcon: {
    fontSize: 20,
  },
  streakMessage: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
  },
  statsOverviewValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statsOverviewLabel: {
    fontSize: 11,
    textAlign: 'center',
  },
  bestDayContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(148, 163, 184, 0.2)',
  },
  bestDayLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  bestDayValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  trendCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
  },
  trendCardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  trendChart: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: 120,
    paddingBottom: 8,
  },
  trendBarContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  trendBarWrapper: {
    width: '80%',
    height: 80,
    justifyContent: 'flex-end',
    marginBottom: 4,
  },
  trendBar: {
    width: '100%',
    borderRadius: 4,
    minHeight: 2,
  },
  trendBarLabel: {
    fontSize: 10,
    marginTop: 4,
    textAlign: 'center',
  },
  trendBarValue: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
    textAlign: 'center',
  },
  analyticsListHeader: {
    marginBottom: 12,
  },
  analyticsListTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  achievementsCard: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#334155',
  },
  achievementsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  achievementsSubtitle: {
    fontSize: 12,
    marginBottom: 16,
  },
  achievementsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  achievementItem: {
    width: '48%',
    backgroundColor: '#0f172a',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#334155',
    alignItems: 'center',
    position: 'relative',
  },
  achievementIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  achievementTitle: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 4,
    textAlign: 'center',
  },
  achievementDescription: {
    fontSize: 10,
    textAlign: 'center',
  },
  achievementBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#22c55e',
    justifyContent: 'center',
    alignItems: 'center',
  },
  achievementBadgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
});
