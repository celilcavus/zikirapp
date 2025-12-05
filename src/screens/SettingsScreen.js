import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useFocusEffect } from '@react-navigation/native';
import * as Notifications from 'expo-notifications';

// Contexts
import { useDatabase } from '../contexts/DatabaseContext';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';

// Constants
import { ZIKIR_LIST } from '../constants/zikirs';

// Utils
import { safeImpactAsync, safeNotificationAsync } from '../utils/haptics';

// Styles
import { globalStyles as styles } from '../styles/globalStyles';

function SettingsScreen() {
  const db = useDatabase();
  const { theme, setTheme, themes } = useTheme();
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
        if (themes[savedTheme]) {
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
        safeNotificationAsync('success');
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
        safeNotificationAsync('success');
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
      safeNotificationAsync('success');
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
        safeNotificationAsync('success');
      }
    } else {
      // Tüm hatırlatıcıları iptal et
      await Notifications.cancelAllScheduledNotificationsAsync();
      if (hapticEnabled) {
        safeNotificationAsync('success');
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
      safeNotificationAsync('success');
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
      
      // Önce test bildirimi gönder
      try {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: language === 'tr' ? '✅ Test Bildirimi' : language === 'en' ? '✅ Test Notification' : '✅ إشعار تجريبي',
            body: language === 'tr' ? 'Bildirimler çalışıyor!' : language === 'en' ? 'Notifications are working!' : 'الإشعارات تعمل!',
            sound: true,
            priority: Notifications.AndroidNotificationPriority.HIGH,
            data: { type: 'test' },
          },
          trigger: null,
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
        throw scheduleError;
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
                safeNotificationAsync('success');
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

  const themeColors = themes[currentTheme]?.colors || themes.gold.colors;

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
          
          {Object.keys(themes).map((themeKey) => {
            const themeData = themes[themeKey];
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
                        safeImpactAsync('light');
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
                        safeImpactAsync('light');
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
                        safeImpactAsync('light');
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
                        safeImpactAsync('light');
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

export default SettingsScreen;
