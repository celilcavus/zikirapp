import React from 'react';
import { View, Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';

// Screens (ileride ayrı dosyalara taşınacak)
import HomeScreen from '../screens/HomeScreen';
import AnalyticsScreen from '../screens/AnalyticsScreen';
import SettingsScreen from '../screens/SettingsScreen';

const Tab = createBottomTabNavigator();

function MainTabs() {
  const { theme, themes } = useTheme();
  const themeColors = themes[theme]?.colors || themes.dark.colors;
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

export default MainTabs;

