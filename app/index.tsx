import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, Pressable, Linking, Alert } from 'react-native';
import { catalog } from '../src/catalog';
import type { CatalogApp } from '../src/catalog';
import { startMobileLogin } from '../src/auth/native-login';
import { bootstrapMobileSession, getMobileAccessToken, logoutMobileSession } from '../src/auth/mobile-api';

const MASTER = 'https://www.myops.com.my';

const open = async (url: string) => {
  try {
    await Linking.openURL(url);
  } catch {
    Alert.alert('Unable to open MYOPS', 'Please try again.');
  }
};

export default function Home() {
  const [status, setStatus] = useState('Login with MYOPS to check your account.');
  const [busy, setBusy] = useState(false);
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    let active = true;

    void (async () => {
      try {
        const validSession = await bootstrapMobileSession();
        if (!active) return;
        setSignedIn(validSession);
        setStatus(validSession ? 'MYOPS session connected.' : 'Guest browsing.');
      } catch {
        if (!active) return;
        setSignedIn(false);
        setStatus('Guest browsing.');
      }
    })();

    return () => { active = false; };
  }, []);

  const signIn = async () => {
    setBusy(true);
    try {
      await startMobileLogin();
      const token = await getMobileAccessToken();
      const authenticated = Boolean(token);
      setSignedIn(authenticated);
      setStatus(authenticated ? 'MYOPS session connected.' : 'Session not available.');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Login failed');
    } finally {
      setBusy(false);
    }
  };

  const signOut = async () => {
    setBusy(true);
    try {
      await logoutMobileSession();
      setSignedIn(false);
      setStatus('Signed out.');
    } catch {
      setSignedIn(false);
      setStatus('Local session cleared; remote logout could not be confirmed.');
    } finally {
      setBusy(false);
    }
  };

  const renderApp = ({ item }: { item: CatalogApp }) => {
    const available = item.status === 'available';
    return <View style={styles.card}>
      <Text style={styles.emoji}>{item.icon}</Text>
      <Text style={styles.name}>{item.name}</Text>
      <Text style={styles.muted}>{item.description}</Text>
      <Text style={available ? styles.available : styles.muted}>{available ? 'Available' : 'Coming Soon'}</Text>
      {available ? <>
        <Pressable accessibilityRole="button" accessibilityLabel={'Explore trial and plans for ' + item.name} style={styles.smallButton} onPress={() => open(MASTER)}><Text style={styles.buttonText}>Explore Trial / Plans</Text></Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel={'Open ' + item.name} style={styles.secondaryButton} onPress={() => open(item.url!)}><Text style={styles.secondaryText}>Open App</Text></Pressable>
      </> : <Text style={styles.muted}>Subscription not yet available</Text>}
    </View>;
  };

  return <View style={styles.root}>
    <Text style={styles.title}>MYOPS Mobile</Text><Text style={styles.subtitle}>One account. Your operations.</Text>
    <Text style={styles.notice}>{status}</Text>
    <View style={styles.actions}>
      <Pressable disabled={busy} accessibilityRole="button" onPress={signIn} style={styles.button}><Text style={styles.buttonText}>Login with MYOPS</Text></Pressable>
      <Pressable disabled={busy} accessibilityRole="button" onPress={signOut} style={styles.button}><Text style={styles.buttonText}>Logout</Text></Pressable>
    </View>
    <Text style={styles.notice}>{signedIn ? 'Signed in.' : 'Guest browsing.'} Trials and subscriptions are managed securely by MYOPS. App access requires server-side entitlement checks.</Text>
    <FlatList data={catalog} keyExtractor={item => item.slug} numColumns={2} renderItem={renderApp} contentContainerStyle={{ paddingBottom: 30 }} />
  </View>;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F5F7FC', paddingTop: 55, paddingHorizontal: 16 },
  title: { fontSize: 28, fontWeight: '800', color: '#303F94' },
  subtitle: { fontSize: 16, marginTop: 8, color: '#52617C' },
  notice: { marginVertical: 12, color: '#596579' },
  actions: { flexDirection: 'row', gap: 8 },
  button: { backgroundColor: '#303F94', padding: 12, borderRadius: 10, flex: 1, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: '700' },
  emoji: { fontSize: 32 },
  available: { color: '#167647', fontSize: 12, fontWeight: '700' },
  card: { flex: 1, minHeight: 210, backgroundColor: '#fff', borderRadius: 16, margin: 6, padding: 12, gap: 8 },
  name: { fontWeight: '700', fontSize: 17 },
  muted: { color: '#67748C', fontSize: 12 },
  smallButton: { backgroundColor: '#303F94', borderRadius: 8, padding: 8, alignItems: 'center' },
  secondaryButton: { borderWidth: 1, borderColor: '#303F94', borderRadius: 8, padding: 8, alignItems: 'center' },
  secondaryText: { color: '#303F94', fontSize: 12, fontWeight: '700' }
});
