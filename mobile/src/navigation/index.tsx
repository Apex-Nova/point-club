import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { NavigationContainer } from '@react-navigation/native';
import { Text } from 'react-native';

import HomeScreen     from '../screens/HomeScreen';
import DrawScreen     from '../screens/DrawScreen';
import GalleryScreen  from '../screens/GalleryScreen';
import ProfileScreen  from '../screens/ProfileScreen';
import NotificationsScreen from '../screens/NotificationsScreen';

const Tab   = createBottomTabNavigator();
const Stack = createStackNavigator();

function TabIcon({ emoji, focused }: { emoji: string; focused: boolean }) {
  return <Text style={{ fontSize: focused ? 22 : 18, opacity: focused ? 1 : 0.5 }}>{emoji}</Text>;
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopColor: '#e8e3f0',
          paddingBottom: 4,
          height: 60,
        },
        tabBarActiveTintColor:   '#7c5cbf',
        tabBarInactiveTintColor: '#a0a0a0',
        tabBarLabelStyle: { fontSize: 10, fontWeight: '600', marginBottom: 2 },
      }}
    >
      <Tab.Screen name="Home"    component={HomeScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="🏠" focused={focused} /> }} />
      <Tab.Screen name="Draw"    component={DrawScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="✏️" focused={focused} /> }} />
      <Tab.Screen name="Gallery" component={GalleryScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="🎨" focused={focused} /> }} />
      <Tab.Screen name="Notifications" component={NotificationsScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="🔔" focused={focused} /> }} />
      <Tab.Screen name="Profile" component={ProfileScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="👤" focused={focused} /> }} />
    </Tab.Navigator>
  );
}

export default function AppNavigation() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Main"  component={MainTabs} />
        <Stack.Screen name="Room"  component={DrawScreen} options={{ presentation: 'modal' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
