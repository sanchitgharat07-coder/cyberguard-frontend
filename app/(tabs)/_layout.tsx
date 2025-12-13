import React from 'react';
import { Tabs } from 'expo-router';
import { FontAwesome, MaterialIcons } from '@expo/vector-icons';
import { View } from 'react-native';

const COLORS = {
  bg: '#121212',
  card: '#1e1e1e',
  accent: '#00ff9d',
  inactive: '#666666',
  text: '#ffffff'
};

export default function TabLayout() {
  return (
    <Tabs screenOptions={{
      // GLOBAL HEADER STYLES (Applies to all tabs)
      headerStyle: {
        backgroundColor: COLORS.bg,
        borderBottomColor: '#333',
        borderBottomWidth: 1,
        elevation: 0,
        shadowOpacity: 0,
      },
      headerTintColor: COLORS.text, // Default white text
      headerTitleStyle: {
        fontWeight: 'bold',
        fontSize: 18,
        letterSpacing: 1,
      },
      // GLOBAL TAB BAR STYLES
      tabBarStyle: {
        backgroundColor: COLORS.card,
        borderTopColor: '#333',
        height: 60,
        paddingBottom: 8,
        paddingTop: 8,
      },
      tabBarActiveTintColor: COLORS.accent,
      tabBarInactiveTintColor: COLORS.inactive,
    }}>
      <Tabs.Screen
        name="news"
        options={{
          // This hides the button from the bottom bar!
          href: null, 
          headerShown: false,
        }}
      />
      
      {/* 1. HOME TAB (Header Restored!) */}
      <Tabs.Screen
        name="home"
        options={{
          title: 'CYBER GUARD', // The text in the top bar
          headerTitleStyle: { 
            color: COLORS.accent, // Neon Green Title
            fontWeight: '900',
            fontSize: 20
          },
          tabBarIcon: ({ color }) => <MaterialIcons size={28} name="dashboard" color={color} />,
        }}
      />

      {/* 2. SCANNER TAB (Header still hidden for camera) */}
      <Tabs.Screen
        name="scanner"
        options={{
          title: 'Scanner',
          headerShown: false, 
          tabStyle: { display: 'none' }, // Optional: Hide tab bar while scanning
          tabBarIcon: ({ color }) => (
            <View style={{
              backgroundColor: color === COLORS.accent ? 'rgba(0, 255, 157, 0.2)' : 'transparent',
              padding: 8,
              borderRadius: 20,
            }}>
              <MaterialIcons size={28} name="qr-code-scanner" color={color} />
            </View>
          ),
        }}
      />

      {/* 3. HISTORY TAB */}
      <Tabs.Screen
        name="history"
        options={{
          title: 'SCAN LOGS',
          tabBarIcon: ({ color }) => <FontAwesome size={24} name="history" color={color} />,
        }}
      />
      <Tabs.Screen
        name="about"
        options={{
          href: null,         // <--- This removes the icon from the bottom bar
          headerShown: false, // <--- This hides the default header
        }}
      />

      {/* 6. PRIVACY (HIDDEN) */}
      <Tabs.Screen
        name="privacy"
        options={{
          href: null,
          headerShown: false,
        }}
      />

      {/* 4. PROFILE TAB */}
      <Tabs.Screen
        name="profile"
        options={{
          title: 'USER PROFILE',
          tabBarIcon: ({ color }) => <FontAwesome size={24} name="user-secret" color={color} />,
        }}
      />
      
    </Tabs>
  );
}