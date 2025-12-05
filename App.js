import React, { useState, useEffect } from 'react';
import { ActivityIndicator, View, Text, Platform, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import * as NavigationBar from 'expo-navigation-bar';
import * as SplashScreen from 'expo-splash-screen';

// Contexts
import { DatabaseContext } from './src/contexts/DatabaseContext';
import { LanguageContext } from './src/contexts/LanguageContext';
import { ThemeContext } from './src/contexts/ThemeContext';

// Constants
import { translations } from './src/constants/translations';
import { themes } from './src/constants/themes';

// Utils
import { openDatabase, initDatabase, loadSetting, saveSetting } from './src/utils/database';
import { setupNotificationHandler } from './src/utils/notifications';

// Navigation
import RootNavigator from './src/navigation/StackNavigator';

function App() {
  const [loading, setLoading] = useState(true);
  const [db, setDb] = useState(null);
  const [theme, setTheme] = useState('gold');
  const [language, setLanguage] = useState('tr');

  useEffect(() => {
    // Splash screen'i açık tut (uygulama hazır olana kadar)
    SplashScreen.preventAutoHideAsync();

    // Bildirim handler'ı ayarla
    setupNotificationHandler();

    // Bildirim izinlerini kontrol et
    const checkNotificationPermissions = async () => {
      try {
        const Notifications = require('expo-notifications');
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
          await NavigationBar.setButtonStyleAsync('light');
        } catch (error) {
          console.error('Navigation bar ayarlanamadı:', error);
        }
      }
    };

    setupNavigationBar();

    // Veritabanını başlat
    const initializeDb = async () => {
      try {
        const database = await openDatabase();
        setDb(database);
        
        if (database) {
          await initDatabase(database);
          await loadSavedTheme(database);
          await loadSavedLanguage(database);
        }
        
        setLoading(false);
        
        // Uygulama hazır olduğunda splash screen'i gizle
        await SplashScreen.hideAsync();
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
          const isDarkTheme = ['dark', 'green', 'gold', 'blue', 'purple'].includes(theme);
          await NavigationBar.setButtonStyleAsync(isDarkTheme ? 'light' : 'dark');
        } catch (error) {
          console.error('Navigation bar stil güncellenemedi:', error);
        }
      }
    };

    updateNavigationBarStyle();
  }, [theme]);

  const loadSavedTheme = async (database) => {
    try {
      const savedTheme = await loadSetting(database, 'theme', null);
      if (savedTheme && themes[savedTheme]) {
        setTheme(savedTheme);
      } else {
        // İlk kurulumda varsayılan olarak gold temasını kaydet
        setTheme('gold');
        await saveSetting(database, 'theme', 'gold');
      }
    } catch (error) {
      console.error('Tema yüklenirken hata:', error);
      // Hata durumunda da gold tema kullan
      setTheme('gold');
    }
  };

  const loadSavedLanguage = async (database) => {
    try {
      const savedLanguage = await loadSetting(database, 'language', 'tr');
      if (savedLanguage && translations[savedLanguage]) {
        setLanguage(savedLanguage);
      }
    } catch (error) {
      console.error('Dil yüklenirken hata:', error);
    }
  };

  const handleLanguageChange = async (lang) => {
    setLanguage(lang);
    if (db) {
      await saveSetting(db, 'language', lang);
    }
  };

  const handleThemeChange = async (newTheme) => {
    setTheme(newTheme);
    if (db) {
      await saveSetting(db, 'theme', newTheme);
    }
  };

  const t = translations[language] || translations.tr;

  // Navigation state değiştiğinde navigation bar buton stilini güncelle
  const handleNavigationStateChange = async () => {
    if (Platform.OS === 'android' && theme) {
      try {
        const isDarkTheme = ['dark', 'green', 'gold', 'blue', 'purple'].includes(theme);
        await NavigationBar.setButtonStyleAsync(isDarkTheme ? 'light' : 'dark');
      } catch (error) {
        console.error('Navigation bar stil güncellenemedi:', error);
      }
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

  return (
    <DatabaseContext.Provider value={db}>
      <LanguageContext.Provider value={{ language, setLanguage: handleLanguageChange, t }}>
        <ThemeContext.Provider value={{ theme, setTheme: handleThemeChange, themes }}>
          <View style={{ flex: 1, backgroundColor: themes[theme]?.colors?.background || themes.gold.colors.background }}>
            <StatusBar style="light" />
            <NavigationContainer onStateChange={handleNavigationStateChange}>
              <RootNavigator />
            </NavigationContainer>
          </View>
        </ThemeContext.Provider>
      </LanguageContext.Provider>
    </DatabaseContext.Provider>
  );
}

const styles = StyleSheet.create({
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
});

export default App;

