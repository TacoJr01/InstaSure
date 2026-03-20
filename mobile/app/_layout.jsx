import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Tabs } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { colors } from '../src/theme';
import TabIcon from '../src/components/TabIcon';

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <Tabs
          screenOptions={{
            headerShown: false,
            tabBarStyle: styles.tabBar,
            tabBarActiveTintColor: colors.coral,
            tabBarInactiveTintColor: colors.faint,
            tabBarLabelStyle: styles.tabLabel,
          }}
        >
          <Tabs.Screen
            name="index"
            options={{
              title: 'Home',
              tabBarIcon: ({ focused }) => <TabIcon name="home" focused={focused} />,
              tabBarActiveTintColor: colors.coral,
            }}
          />
          <Tabs.Screen
            name="coverage"
            options={{
              title: 'Cover',
              tabBarIcon: ({ focused }) => <TabIcon name="shield" focused={focused} />,
              tabBarActiveTintColor: colors.blue,
            }}
          />
          <Tabs.Screen
            name="activity"
            options={{
              title: 'Activity',
              tabBarIcon: ({ focused }) => <TabIcon name="activity" focused={focused} />,
              tabBarActiveTintColor: colors.amber,
            }}
          />
          <Tabs.Screen
            name="payouts"
            options={{
              title: 'Payouts',
              tabBarIcon: ({ focused }) => <TabIcon name="wallet" focused={focused} />,
              tabBarActiveTintColor: colors.green,
            }}
          />
          <Tabs.Screen
            name="profile"
            options={{
              title: 'Profile',
              tabBarIcon: ({ focused }) => <TabIcon name="person" focused={focused} />,
              tabBarActiveTintColor: colors.purple,
            }}
          />
        </Tabs>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: 'rgba(10,10,14,0.97)',
    borderTopColor: '#1E1E28',
    borderTopWidth: 0.5,
    height: 80,
    paddingBottom: 16,
    paddingTop: 6,
  },
  tabLabel: {
    fontFamily: 'Courier',
    fontSize: 9,
    letterSpacing: 0.3,
    marginTop: 2,
  },
});
