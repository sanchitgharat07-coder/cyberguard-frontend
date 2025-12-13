import React, { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '../firebaseConfig';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';

// Keep the splash screen visible until we're ready
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoaded, setAuthLoaded] = useState(false);

  useEffect(() => {
    // Listen for the user's login state
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoaded(true); // Mark auth as loaded
    });
    return () => unsubscribe();
  }, []);

  // This component will only render AFTER auth is loaded
  return <RootLayoutNav user={user} authLoaded={authLoaded} />;
}

function RootLayoutNav({ user, authLoaded }: { user: User | null; authLoaded: boolean }) {
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (!authLoaded) return; // Wait for auth to be loaded

    // --- THE FIX (Part 1) ---
    // The segment for this route group IS the folder name
    const inTabsGroup = segments[0] === '(tabs)';

    if (user && !inTabsGroup) {
      // User is logged in, but not in the app. Go to home.
      // @ts-ignore
      router.replace('/(tabs)/home');
    } else if (!user && inTabsGroup) {
      // User is logged out, but in the app. Go to login.
      router.replace('/login');
    }
    
    // Now that all logic is done, hide the splash screen
    SplashScreen.hideAsync();

  }, [authLoaded, user, segments, router]);

  // While we wait for the auth state, show nothing
  if (!authLoaded) {
    return null;
  }
  
  // Render the navigator
  return (
    <>
    <StatusBar style="light" />
    <Stack>
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="signup" options={{ headerShown: false }} />
      
      {/* --- THE FIX (Part 2) ---
          The name MUST match the folder name on the file system.
      */}
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    </Stack>
    </>
  );
}