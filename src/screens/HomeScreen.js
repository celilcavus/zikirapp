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

// Contexts
import { useDatabase } from '../contexts/DatabaseContext';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';

// Constants
import { ZIKIR_LIST } from '../constants/zikirs';

// Utils
import { safeNotificationAsync } from '../utils/haptics';

// Styles
import { globalStyles as styles } from '../styles/globalStyles';

function HomeScreen({ navigation }) {
  const [customZikirs, setCustomZikirs] = useState([]);
  const [newZikirName, setNewZikirName] = useState('');
  const [newZikirArabic, setNewZikirArabic] = useState('');
  const [showAddZikir, setShowAddZikir] = useState(false);
  const db = useDatabase();
  const { theme, themes } = useTheme();
  const themeColors = themes[theme]?.colors || themes.dark.colors;
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
              
              safeNotificationAsync('success');
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

export default HomeScreen;
