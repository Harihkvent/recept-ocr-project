import React, { useState, useCallback } from 'react';
import { StyleSheet, ScrollView, View, Dimensions, RefreshControl } from 'react-native';
import { Button, Card, IconButton, Surface } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';

import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { API_URL } from '@/constants/Config';

const { width } = Dimensions.get('window');

type ReceiptSummary = {
  totalSpending: number;
  receiptCount: number;
  topMerchant: string;
  recentReceipts: { merchant: string; total: number; date: string }[];
};

export default function HomeScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const isDark = colorScheme === 'dark';
  const [summary, setSummary] = useState<ReceiptSummary>({
    totalSpending: 0,
    receiptCount: 0,
    topMerchant: '—',
    recentReceipts: [],
  });
  const [refreshing, setRefreshing] = useState(false);

  const fetchSummary = async () => {
    try {
      const response = await fetch(`${API_URL}/receipts`);
      if (!response.ok) return;
      const data = await response.json();
      const receipts = data.map((r: any) => ({
        merchant: r.fields?.merchant || 'Unknown',
        total: parseFloat(r.fields?.total) || 0,
        date: r.fields?.date || 'Unknown',
      }));
      const totalSpending = receipts.reduce((a: number, b: { total: number }) => a + b.total, 0);
      const merchantCounts: Record<string, number> = {};
      receipts.forEach((r: { merchant: string }) => {
        merchantCounts[r.merchant] = (merchantCounts[r.merchant] || 0) + 1;
      });
      const topMerchant = Object.entries(merchantCounts)
        .sort(([, a], [, b]) => b - a)[0]?.[0] || '—';

      setSummary({
        totalSpending,
        receiptCount: receipts.length,
        topMerchant,
        recentReceipts: receipts.slice(0, 3),
      });
    } catch {
      // Silently fail - home screen still works without data
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchSummary();
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchSummary();
    setRefreshing(false);
  };

  const quickActions = [
    { icon: 'camera', label: 'Scan Receipt', route: '/upload', color: colors.tint },
    { icon: 'format-list-bulleted', label: 'My Receipts', route: '/dashboard', color: colors.success },
    { icon: 'chart-line', label: 'Insights', route: '/analytics', color: colors.accent },
    { icon: 'cog-outline', label: 'Settings', route: '/settings', color: colors.warning },
  ];

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.headerGradientStart }]}>
        <View style={styles.headerContent}>
          <View>
            <ThemedText style={styles.greeting}>Welcome back 👋</ThemedText>
            <ThemedText style={styles.appTitle}>Receipt Scanner</ThemedText>
          </View>
          <Surface style={[styles.avatarContainer, { backgroundColor: 'rgba(255,255,255,0.2)' }]} elevation={0}>
            <IconButton icon="account" size={28} iconColor="#fff" onPress={() => router.push('/settings')} />
          </Surface>
        </View>

        {/* Spending Summary Card */}
        <Surface style={[styles.summaryCard, { backgroundColor: isDark ? colors.cardBackground : '#fff' }]} elevation={4}>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <ThemedText style={[styles.summaryLabel, { color: colors.textSecondary }]}>Total Spent</ThemedText>
              <ThemedText style={[styles.summaryAmount, { color: colors.text }]}>
                ₹{summary.totalSpending.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </ThemedText>
            </View>
            <View style={[styles.summaryDivider, { backgroundColor: colors.cardBorder }]} />
            <View style={styles.summaryItem}>
              <ThemedText style={[styles.summaryLabel, { color: colors.textSecondary }]}>Receipts</ThemedText>
              <ThemedText style={[styles.summaryAmount, { color: colors.text }]}>
                {summary.receiptCount}
              </ThemedText>
            </View>
          </View>
          <View style={[styles.topMerchantRow, { backgroundColor: isDark ? colors.background : '#F1F5F9' }]}>
            <IconButton icon="store" size={16} iconColor={colors.tint} style={styles.topMerchantIcon} />
            <ThemedText style={[styles.topMerchantText, { color: colors.textSecondary }]}>
              Top merchant: <ThemedText style={{ fontWeight: '700', color: colors.text }}>{summary.topMerchant}</ThemedText>
            </ThemedText>
          </View>
        </Surface>
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <ThemedText style={[styles.sectionTitle, { color: colors.text }]}>Quick Actions</ThemedText>
        <View style={styles.actionGrid}>
          {quickActions.map((action, index) => (
            <Surface
              key={index}
              style={[styles.actionCard, { backgroundColor: isDark ? colors.cardBackground : '#fff' }]}
              elevation={2}
            >
              <Card onPress={() => router.push(action.route as any)} style={styles.actionCardInner}>
                <Card.Content style={styles.actionContent}>
                  <View style={[styles.actionIconBg, { backgroundColor: action.color + '15' }]}>
                    <IconButton icon={action.icon} size={24} iconColor={action.color} />
                  </View>
                  <ThemedText style={[styles.actionLabel, { color: colors.text }]}>{action.label}</ThemedText>
                </Card.Content>
              </Card>
            </Surface>
          ))}
        </View>
      </View>

      {/* Recent Receipts */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <ThemedText style={[styles.sectionTitle, { color: colors.text }]}>Recent Receipts</ThemedText>
          <Button
            mode="text"
            compact
            onPress={() => router.push('/dashboard')}
            textColor={colors.tint}
          >
            View All
          </Button>
        </View>
        {summary.recentReceipts.length > 0 ? (
          summary.recentReceipts.map((receipt, index) => (
            <Surface
              key={index}
              style={[styles.recentCard, { backgroundColor: isDark ? colors.cardBackground : '#fff' }]}
              elevation={1}
            >
              <View style={styles.recentCardContent}>
                <View style={[styles.recentIcon, { backgroundColor: colors.tint + '15' }]}>
                  <IconButton icon="receipt" size={20} iconColor={colors.tint} />
                </View>
                <View style={styles.recentInfo}>
                  <ThemedText style={[styles.recentMerchant, { color: colors.text }]}>{receipt.merchant}</ThemedText>
                  <ThemedText style={[styles.recentDate, { color: colors.textSecondary }]}>{receipt.date}</ThemedText>
                </View>
                <ThemedText style={[styles.recentTotal, { color: colors.text }]}>
                  ₹{receipt.total.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </ThemedText>
              </View>
            </Surface>
          ))
        ) : (
          <Surface style={[styles.emptyCard, { backgroundColor: isDark ? colors.cardBackground : '#fff' }]} elevation={1}>
            <IconButton icon="receipt" size={40} iconColor={colors.textMuted} />
            <ThemedText style={[styles.emptyText, { color: colors.textSecondary }]}>
              No receipts yet
            </ThemedText>
            <ThemedText style={[styles.emptySubtext, { color: colors.textMuted }]}>
              Tap &quot;Scan Receipt&quot; to get started
            </ThemedText>
          </Surface>
        )}
      </View>

      <View style={{ height: 24 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 60,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  greeting: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 4,
  },
  appTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#fff',
  },
  avatarContainer: {
    borderRadius: 24,
    overflow: 'hidden',
  },
  summaryCard: {
    marginHorizontal: 20,
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: 4,
  },
  summaryRow: {
    flexDirection: 'row',
    padding: 20,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryDivider: {
    width: 1,
    alignSelf: 'stretch',
    marginVertical: 4,
  },
  summaryLabel: {
    fontSize: 13,
    marginBottom: 6,
  },
  summaryAmount: {
    fontSize: 24,
    fontWeight: '800',
  },
  topMerchantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  topMerchantIcon: {
    margin: 0,
    marginRight: 4,
  },
  topMerchantText: {
    fontSize: 13,
  },
  section: {
    paddingHorizontal: 20,
    marginTop: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionCard: {
    width: (width - 52) / 2,
    borderRadius: 16,
    overflow: 'hidden',
  },
  actionCardInner: {
    backgroundColor: 'transparent',
    elevation: 0,
  },
  actionContent: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  actionIconBg: {
    borderRadius: 16,
    marginBottom: 4,
  },
  actionLabel: {
    marginTop: 4,
    fontWeight: '600',
    fontSize: 13,
  },
  recentCard: {
    borderRadius: 14,
    marginBottom: 10,
    overflow: 'hidden',
  },
  recentCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
  },
  recentIcon: {
    borderRadius: 12,
    marginRight: 4,
  },
  recentInfo: {
    flex: 1,
    marginLeft: 4,
  },
  recentMerchant: {
    fontSize: 15,
    fontWeight: '600',
  },
  recentDate: {
    fontSize: 12,
    marginTop: 2,
  },
  recentTotal: {
    fontSize: 16,
    fontWeight: '700',
  },
  emptyCard: {
    borderRadius: 16,
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 8,
  },
  emptySubtext: {
    fontSize: 13,
    marginTop: 4,
  },
});
