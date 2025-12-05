import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
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
import { ACHIEVEMENTS } from '../constants/achievements';
import { getDailyHadith } from '../constants/hadiths';
import { translations } from '../constants/translations';

// Styles
import { globalStyles as styles } from '../styles/globalStyles';

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
  const { theme, themes } = useTheme();
  const themeColors = themes[theme]?.colors || themes.dark.colors;
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

export default AnalyticsScreen;
