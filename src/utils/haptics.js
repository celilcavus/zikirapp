import * as Haptics from 'expo-haptics';

// Haptics Helper Functions (Expo Go uyumluluğu için)
export const safeImpactAsync = (style = 'light') => {
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

export const safeNotificationAsync = (type = 'success') => {
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

