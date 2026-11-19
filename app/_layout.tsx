import { useEffect } from 'react';
import { Linking } from 'react-native';
import { Stack } from 'expo-router';
import { handleMobileCallback } from '../src/auth/native-login';
import { bootstrapMobileSession } from '../src/auth/mobile-api';

export default function RootLayout() {
 useEffect(() => {
  void bootstrapMobileSession().catch(() => undefined);

  // Android may cold-start the app from the authorization callback.
  void Linking.getInitialURL().then(url => { if (url) void handleMobileCallback(url); }).catch(() => undefined);
  const subscription = Linking.addEventListener('url', ({ url }) => { void handleMobileCallback(url); });
  return () => subscription.remove();
 }, []);
 return <Stack screenOptions={{ headerShown: false }} />;
}
