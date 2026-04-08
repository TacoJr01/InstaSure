import React from 'react';
import { Tabs } from 'expo-router';
import { useTheme } from '../../src/ThemeContext';
import TabIcon from '../../src/components/TabIcon';

export default function TabLayout() {
  const { colors, isDark } = useTheme() as any;

  return (
    <Tabs screenOptions={{
      headerShown: false,
      tabBarStyle: {
        backgroundColor: isDark ? 'rgba(10,10,14,0.97)' : 'rgba(244,243,239,0.97)',
        borderTopColor: colors.border,
        borderTopWidth: 0.5,
        height: 80,
        paddingBottom: 16,
        paddingTop: 6,
      },
      tabBarActiveTintColor: colors.coral,
      tabBarInactiveTintColor: colors.faint,
      tabBarLabelStyle: { fontFamily: 'Courier', fontSize: 9, letterSpacing: 0.3, marginTop: 2 },
    }}>
      <Tabs.Screen name="index"    options={{ title: 'Home',     tabBarIcon: ({ focused }) => <TabIcon name="home"     focused={focused} />, tabBarActiveTintColor: colors.coral  }} />
      <Tabs.Screen name="coverage" options={{ title: 'Cover',    tabBarIcon: ({ focused }) => <TabIcon name="shield"   focused={focused} />, tabBarActiveTintColor: colors.blue   }} />
      <Tabs.Screen name="activity" options={{ title: 'Activity', tabBarIcon: ({ focused }) => <TabIcon name="activity" focused={focused} />, tabBarActiveTintColor: colors.amber  }} />
      <Tabs.Screen name="payouts"  options={{ title: 'Payouts',  tabBarIcon: ({ focused }) => <TabIcon name="wallet"   focused={focused} />, tabBarActiveTintColor: colors.green  }} />
      <Tabs.Screen name="profile"  options={{ title: 'Profile',  tabBarIcon: ({ focused }) => <TabIcon name="person"   focused={focused} />, tabBarActiveTintColor: colors.purple }} />
      <Tabs.Screen name="two"      options={{ href: null }} />
    </Tabs>
  );
}
