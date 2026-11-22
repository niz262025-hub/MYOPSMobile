import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { catalog } from '../../src/catalog';

export default function ModuleScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const module = catalog.find(item => item.slug === slug && item.phase === 1);

  return <View style={styles.root}>
    <Pressable accessibilityRole="button" onPress={() => router.replace('/')}><Text style={styles.back}>‹ MYOPS</Text></Pressable>
    <Text style={styles.title}>{module?.name ?? 'Module unavailable'}</Text>
    <Text style={styles.body}>{module ? `${module.description}. Native functionality is still in development and is not yet connected to your data.` : 'This module is not available.'}</Text>
    <Text style={styles.body}>Access, roles and subscriptions must be verified by MYOPS before any records can be displayed or changed.</Text>
  </View>;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F5F7FC', paddingTop: 64, paddingHorizontal: 24 },
  back: { color: '#303F94', fontSize: 17, fontWeight: '700', marginBottom: 28 },
  title: { color: '#303F94', fontSize: 28, fontWeight: '800' },
  body: { color: '#52617C', fontSize: 16, lineHeight: 24, marginTop: 18 },
});
