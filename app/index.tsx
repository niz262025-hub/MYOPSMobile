import React, { useCallback, useRef, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { catalog } from '../src/catalog';
import { startMobileLogin } from '../src/auth/native-login';
import { logoutMobileSession, verifyMobileSession } from '../src/auth/mobile-api';

export default function Home() {
 const [status, setStatus] = useState('Checking MYOPS session…');
 const [busy, setBusy] = useState(false);
 const [signedIn, setSignedIn] = useState(false);
 const operationActive = useRef(false);

 const run = useCallback(async (action: () => Promise<void>) => {
  if (operationActive.current) return;
  operationActive.current = true;
  setBusy(true);
  try {
   await action();
  } catch (error) {
   setSignedIn(false);
   setStatus(error instanceof Error ? error.message : 'MYOPS session check failed.');
  } finally {
   operationActive.current = false;
   setBusy(false);
  }
 }, []);

 const verify = useCallback(async () => {
  const active = await verifyMobileSession();
  setSignedIn(active);
  setStatus(active ? 'MYOPS session verified.' : 'Login with MYOPS to check your account.');
 }, []);

 useFocusEffect(useCallback(() => {
  void run(verify);
 }, [run, verify]));

 const signIn = () => run(async () => {
  await startMobileLogin();
  await verify();
 });

 const signOut = () => run(async () => {
  setSignedIn(false);
  await logoutMobileSession();
  setStatus('Signed out of MYOPS Mobile.');
 });

 return (
  <View style={styles.root}>
   <Text style={styles.title}>MYOPS Mobile</Text>
   <Text style={styles.notice} accessibilityLiveRegion="polite">{status}</Text>
   <Pressable
    disabled={busy}
    accessibilityRole="button"
    accessibilityState={{ disabled: busy }}
    onPress={signedIn ? signOut : signIn}
    style={[styles.button, busy && styles.buttonDisabled]}
   >
    <Text style={styles.buttonText}>{signedIn ? 'Logout from MYOPS Mobile' : 'Login with MYOPS'}</Text>
   </Pressable>
   <FlatList
    data={catalog}
    keyExtractor={item => item.slug}
    numColumns={2}
    renderItem={({ item }) => (
     <View style={styles.card}>
      <Text style={styles.emoji}>{item.icon}</Text>
      <Text style={styles.name}>{item.name}</Text>
      <Text style={styles.muted}>{item.description}</Text>
      <Text style={styles.muted}>Coming to mobile</Text>
     </View>
    )}
   />
  </View>
 );
}

const styles = StyleSheet.create({
 root: { flex: 1, backgroundColor: '#F5F7FC', paddingTop: 55, paddingHorizontal: 16 },
 title: { fontSize: 28, fontWeight: '800', color: '#303F94' },
 notice: { marginVertical: 12, color: '#596579' },
 button: { backgroundColor: '#303F94', padding: 12, borderRadius: 10, alignItems: 'center' },
 buttonDisabled: { opacity: 0.6 },
 buttonText: { color: '#fff', fontWeight: '700' },
 emoji: { fontSize: 32 },
 card: { flex: 1, backgroundColor: '#fff', borderRadius: 16, margin: 6, padding: 12, gap: 8 },
 name: { fontWeight: '700', fontSize: 17 },
 muted: { color: '#67748C', fontSize: 12 },
});
