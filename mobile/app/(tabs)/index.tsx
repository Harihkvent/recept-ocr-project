import React from 'react';
import { StyleSheet, ScrollView, View } from 'react-native';
import { Button, Card, Avatar, IconButton } from 'react-native-paper';
import { useRouter } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function HomeScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  return (
    <ScrollView style={[styles.container, { backgroundColor: isDark ? '#000' : '#fff' }]}>
      <ThemedView style={styles.header}>
        <ThemedView>
          <ThemedText style={styles.welcomeText}>Welcome back,</ThemedText>
          <ThemedText type="title" style={styles.title}>Receipt OCR</ThemedText>
        </ThemedView>
        <Avatar.Icon size={48} icon="account-circle" style={{ backgroundColor: 'transparent' }} />
      </ThemedView>

      <ThemedView style={styles.section}>
        <ThemedText type="subtitle" style={styles.sectionTitle}>Quick Actions</ThemedText>
        <ThemedView style={styles.actionGrid}>
          <Card style={styles.actionCard} onPress={() => router.push('/upload')}>
            <Card.Content style={styles.actionContent}>
              <IconButton icon="camera" size={32} iconColor={Colors[colorScheme ?? 'light'].tint} />
              <ThemedText style={styles.actionLabel}>Upload</ThemedText>
            </Card.Content>
          </Card>
          <Card style={styles.actionCard} onPress={() => router.push('/dashboard')}>
            <Card.Content style={styles.actionContent}>
              <IconButton icon="history" size={32} iconColor={Colors[colorScheme ?? 'light'].tint} />
              <ThemedText style={styles.actionLabel}>Activity</ThemedText>
            </Card.Content>
          </Card>
          <Card style={styles.actionCard} onPress={() => router.push('/analytics')}>
            <Card.Content style={styles.actionContent}>
              <IconButton icon="chart-bar" size={32} iconColor={Colors[colorScheme ?? 'light'].tint} />
              <ThemedText style={styles.actionLabel}>Stats</ThemedText>
            </Card.Content>
          </Card>
          <Card style={styles.actionCard} onPress={() => router.push('/settings')}>
            <Card.Content style={styles.actionContent}>
              <IconButton icon="cog" size={32} iconColor={Colors[colorScheme ?? 'light'].tint} />
              <ThemedText style={styles.actionLabel}>Settings</ThemedText>
            </Card.Content>
          </Card>
        </ThemedView>
      </ThemedView>

      <ThemedView style={styles.section}>
        <ThemedView style={styles.sectionHeader}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>Recent Activity</ThemedText>
          <Button onPress={() => router.push('/dashboard')}>See All</Button>
        </ThemedView>
        <Card style={styles.promoCard}>
          <Card.Content>
            <ThemedText style={styles.promoTitle}>Total Spending This Month</ThemedText>
            <ThemedText type="title" style={styles.promoValue}>₹0.00</ThemedText>
            <ThemedText style={styles.promoSubtext}>Start uploading receipts to see your stats!</ThemedText>
          </Card.Content>
        </Card>
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 24,
    paddingTop: 60,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  welcomeText: {
    fontSize: 16,
    opacity: 0.6,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  section: {
    padding: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionCard: {
    width: '48%',
    borderRadius: 16,
    elevation: 2,
  },
  actionContent: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  actionLabel: {
    marginTop: 4,
    fontWeight: '500',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  promoCard: {
    borderRadius: 20,
    backgroundColor: '#E3F2FD',
    elevation: 0,
  },
  promoTitle: {
    fontSize: 14,
    opacity: 0.7,
  },
  promoValue: {
    fontSize: 32,
    fontWeight: 'bold',
    marginVertical: 8,
    color: '#1976D2',
  },
  promoSubtext: {
    fontSize: 12,
    opacity: 0.6,
  },
});
