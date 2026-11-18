import { useEffect } from 'react';
import { Linking } from 'react-native';
import { Stack } from 'expo-router';
import { handleMobileCallback } from '../src/auth/native-login';

export default function RootLayout() {
 useEffect(() => {
  // Android may cold-start the app from the authorization callback.
  void Linking.getInitialURL().then(url => {if(url) void handleMobileCallback(url);}).catch(() => {});
  const subscription = Linking.addEventListener('url', ({url}) => {void handleMobileCallback(url);});
  return () => subscription.remove();
 }, []);
 return <Stack screenOptions={{headerShown:false}} />;
}
