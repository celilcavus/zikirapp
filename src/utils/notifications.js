import * as Notifications from 'expo-notifications';
import { Platform, Alert, Linking } from 'react-native';

// Bildirim izinlerini kontrol et ve iste
export const requestNotificationPermissions = async (language = 'tr') => {
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      const messages = {
        tr: {
          title: 'Bildirim İzni Gerekli',
          body: 'Hatırlatıcıları almak için bildirim izni vermeniz gerekiyor. Lütfen ayarlardan bildirim iznini açın.',
          button: 'Tamam',
        },
        en: {
          title: 'Notification Permission Required',
          body: 'You need to grant notification permission to receive reminders. Please enable notifications in settings.',
          button: 'OK',
        },
        ar: {
          title: 'إذن الإشعار مطلوب',
          body: 'تحتاج إلى منح إذن الإشعار لتلقي التذكيرات. يرجى تمكين الإشعارات في الإعدادات.',
          button: 'حسناً',
        },
      };
      
      const msg = messages[language] || messages.tr;
      Alert.alert(msg.title, msg.body, [{ text: msg.button }]);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('İzin kontrol hatası:', error);
    return false;
  }
};

// Günlük hatırlatıcı ayarla
export const scheduleDailyReminder = async (time, language = 'tr') => {
  try {
    // İzin kontrolü
    const hasPermission = await requestNotificationPermissions(language);
    if (!hasPermission) {
      return null;
    }
    
    // Önce tüm hatırlatıcıları iptal et
    await Notifications.cancelAllScheduledNotificationsAsync();
    
    const [hours, minutes] = time.split(':').map(Number);
    
    // Test bildirimi gönder (hemen)
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
    } catch (testError) {
      console.error('Test bildirimi hatası:', testError);
    }
    
    // Günlük tekrarlayan bildirim ayarla
    const notificationId = await Notifications.scheduleNotificationAsync({
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
    
    return notificationId;
  } catch (error) {
    console.error('Hatırlatıcı ayarlama hatası:', error);
    const messages = {
      tr: {
        title: 'Hata',
        body: 'Hatırlatıcı ayarlanırken bir hata oluştu. Lütfen tekrar deneyin.',
        button: 'Tamam',
      },
      en: {
        title: 'Error',
        body: 'An error occurred while setting the reminder. Please try again.',
        button: 'OK',
      },
      ar: {
        title: 'خطأ',
        body: 'حدث خطأ أثناء تعيين التذكير. يرجى المحاولة مرة أخرى.',
        button: 'حسناً',
      },
    };
    
    const msg = messages[language] || messages.tr;
    Alert.alert(msg.title, msg.body, [{ text: msg.button }]);
    return null;
  }
};

// Başarım bildirimi gönder
export const sendAchievementNotification = async (achievement, translations) => {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: `🎉 ${achievement.icon} ${achievement.title}`,
        body: achievement.description,
        sound: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
      },
      trigger: null, // Hemen gönder
    });
  } catch (error) {
    console.error('Başarım bildirimi hatası:', error);
  }
};

// Güncelleme bildirimi gönder
export const sendUpdateNotification = async (version, language = 'tr') => {
  try {
    const messages = {
      tr: {
        title: '🔄 Yeni Güncelleme Mevcut!',
        body: `Versiyon ${version} yayınlandı. Güncellemek için mağazayı ziyaret edin.`,
      },
      en: {
        title: '🔄 New Update Available!',
        body: `Version ${version} has been released. Visit the store to update.`,
      },
      ar: {
        title: '🔄 تحديث جديد متاح!',
        body: `تم إصدار الإصدار ${version}. قم بزيارة المتجر للتحديث.`,
      },
    };
    
    const msg = messages[language] || messages.tr;
    
    await Notifications.scheduleNotificationAsync({
      content: {
        title: msg.title,
        body: msg.body,
        sound: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
        data: { type: 'update', version },
      },
      trigger: null, // Hemen gönder
    });
  } catch (error) {
    console.error('Güncelleme bildirimi hatası:', error);
  }
};

// Bildirim handler'ı ayarla
export const setupNotificationHandler = () => {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
};

