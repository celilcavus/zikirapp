import React from 'react';
import { View } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTheme } from '../contexts/ThemeContext';
import MainTabs from './TabNavigator';
import CounterScreen from '../screens/CounterScreen';

const Stack = createNativeStackNavigator();

function RootNavigator() {
  const { theme, themes } = useTheme();
  const themeColors = themes[theme]?.colors || themes.dark.colors;

  return (
    <View style={{ flex: 1, backgroundColor: themeColors.background }}>
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
  );
}

export default RootNavigator;

