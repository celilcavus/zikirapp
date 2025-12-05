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
import * as Notifications from 'expo-notifications';

// Contexts
import { useDatabase } from '../contexts/DatabaseContext';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';

// Utils
import { safeImpactAsync, safeNotificationAsync } from '../utils/haptics';

// Styles
import { globalStyles as styles } from '../styles/globalStyles';

function CounterScreen({ route, navigation }) {
  const { zikir } = route.params || {};
  const db = useDatabase();
  const { theme, themes } = useTheme();
  const themeColors = themes[theme]?.colors || themes.dark.colors;
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
              
              safeNotificationAsync('success');
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
      safeImpactAsync('light');
      
      // Hedefe ulaşıldığında bildirim gönder ve animasyon göster (sadece bir kez)
      if (newCount === target) {
        // Kutlama animasyonunu göster
        setShowCelebration(true);
        setTimeout(() => {
          setShowCelebration(false);
        }, 3000);
        
        try {
          // Local notification gönder
          await Notifications.scheduleNotificationAsync({
            content: {
              title: '🎉 Hedef Tamamlandı!',
              body: `${zikir.name} zikiri için günlük hedefinize ulaştınız! (${newCount}/${target})`,
              sound: true,
              priority: Notifications.AndroidNotificationPriority.HIGH,
            },
            trigger: null, // Hemen gönder
          });
          safeNotificationAsync('success');
        } catch (error) {
          safeNotificationAsync('success');
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
              safeNotificationAsync('success');
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
      safeNotificationAsync('success');
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
            safeImpactAsync('light');
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

export default CounterScreen;
