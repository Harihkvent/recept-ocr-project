import React, { useState, useCallback } from 'react';
import { StyleSheet, ScrollView, ActivityIndicator, RefreshControl, View } from 'react-native';
import { Surface, IconButton } from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { API_URL } from '@/constants/Config';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

type Receipt = {
  id: string;
  date: string;
  total: number;
  merchant: string;
  category: string;
};

type MerchantBreakdown = {
  name: string;
  total: number;
  count: number;
};

type CategoryBreakdown = {
  name: string;
  total: number;
  count: number;
  percentage: number;
};

export default function AnalyticsScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const isDark = colorScheme === 'dark';
  const [loading, setLoading] = useState(true);
  const [receipts, setReceipts] = useState<Receipt[]>([]);

  const fetchReceipts = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/receipts`);
      if (!response.ok) throw new Error('Failed to fetch data');
      const data = await response.json();
      setReceipts(data.map((r: any) => ({
        id: r._id,
        merchant: r.fields.merchant || 'Unknown',
        total: parseFloat(r.fields.total) || 0,
        date: r.fields.date || 'Unknown',
        category: r.fields.category || 'Other',
      })));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchReceipts();
    }, [])
  );

  const totalSpending = receipts.reduce((a, b) => a + b.total, 0);
  const avgPerReceipt = receipts.length > 0 ? totalSpending / receipts.length : 0;
  const maxReceipt = receipts.length > 0 ? Math.max(...receipts.map(r => r.total)) : 0;

  // Merchant breakdown
  const merchantMap: Record<string, { total: number; count: number }> = {};
  receipts.forEach(r => {
    if (!merchantMap[r.merchant]) merchantMap[r.merchant] = { total: 0, count: 0 };
    merchantMap[r.merchant].total += r.total;
    merchantMap[r.merchant].count += 1;
  });
  const topMerchants: MerchantBreakdown[] = Object.entries(merchantMap)
    .map(([name, data]) => ({ name, ...data }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);

  // Category breakdown
  const categoryMap: Record<string, { total: number; count: number }> = {};
  receipts.forEach(r => {
    const cat = r.category || 'Other';
    if (!categoryMap[cat]) categoryMap[cat] = { total: 0, count: 0 };
    categoryMap[cat].total += r.total;
    categoryMap[cat].count += 1;
  });
  const categories: CategoryBreakdown[] = Object.entries(categoryMap)
    .map(([name, data]) => ({
      name,
      ...data,
      percentage: totalSpending > 0 ? (data.total / totalSpending) * 100 : 0,
    }))
    .sort((a, b) => b.total - a.total);

  const getCategoryColor = (name: string) => {
    const colorMap: Record<string, string> = {
      'Groceries': '#22C55E',
      'Dining': '#F59E0B',
      'Shopping': '#8B5CF6',
      'Transport': '#3B82F6',
      'Utilities': '#6366F1',
      'Healthcare': '#EF4444',
      'Entertainment': '#EC4899',
      'Other': '#94A3B8',
    };
    return colorMap[name] || '#94A3B8';
  };

  if (loading && receipts.length === 0) {
    return (
      <ThemedView style={styles.center}>
        <ActivityIndicator size="large" color={colors.tint} />
        <ThemedText style={[styles.loadingText, { color: colors.textSecondary }]}>
          Loading insights...
        </ThemedText>
      </ThemedView>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchReceipts} />}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.headerGradientStart }]}>
        <ThemedText style={styles.headerTitle}>Spending Insights</ThemedText>
        <ThemedText style={styles.headerSubtitle}>
          {receipts.length} receipt{receipts.length !== 1 ? 's' : ''} analyzed
        </ThemedText>
      </View>

      <View style={styles.content}>
        {/* Stat Cards */}
        <View style={styles.statGrid}>
          <Surface style={[styles.statCard, { backgroundColor: isDark ? colors.cardBackground : '#fff' }]} elevation={2}>
            <IconButton icon="wallet" size={24} iconColor={colors.tint} style={styles.statIcon} />
            <ThemedText style={[styles.statLabel, { color: colors.textSecondary }]}>Total Spent</ThemedText>
            <ThemedText style={[styles.statValue, { color: colors.text }]}>
              ₹{totalSpending.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </ThemedText>
          </Surface>
          <Surface style={[styles.statCard, { backgroundColor: isDark ? colors.cardBackground : '#fff' }]} elevation={2}>
            <IconButton icon="calculator" size={24} iconColor={colors.accent} style={styles.statIcon} />
            <ThemedText style={[styles.statLabel, { color: colors.textSecondary }]}>Average</ThemedText>
            <ThemedText style={[styles.statValue, { color: colors.text }]}>
              ₹{avgPerReceipt.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </ThemedText>
          </Surface>
          <Surface style={[styles.statCard, { backgroundColor: isDark ? colors.cardBackground : '#fff' }]} elevation={2}>
            <IconButton icon="arrow-up-bold" size={24} iconColor={colors.warning} style={styles.statIcon} />
            <ThemedText style={[styles.statLabel, { color: colors.textSecondary }]}>Highest</ThemedText>
            <ThemedText style={[styles.statValue, { color: colors.text }]}>
              ₹{maxReceipt.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </ThemedText>
          </Surface>
        </View>

        {/* Category Breakdown */}
        {categories.length > 0 && (
          <View style={styles.section}>
            <ThemedText style={[styles.sectionTitle, { color: colors.text }]}>By Category</ThemedText>
            <Surface style={[styles.breakdownCard, { backgroundColor: isDark ? colors.cardBackground : '#fff' }]} elevation={2}>
              {categories.map((cat, index) => (
                <View key={cat.name}>
                  <View style={styles.breakdownRow}>
                    <View style={styles.breakdownLeft}>
                      <View style={[styles.categoryDot, { backgroundColor: getCategoryColor(cat.name) }]} />
                      <View>
                        <ThemedText style={[styles.breakdownName, { color: colors.text }]}>{cat.name}</ThemedText>
                        <ThemedText style={[styles.breakdownMeta, { color: colors.textSecondary }]}>
                          {cat.count} receipt{cat.count !== 1 ? 's' : ''}
                        </ThemedText>
                      </View>
                    </View>
                    <View style={styles.breakdownRight}>
                      <ThemedText style={[styles.breakdownAmount, { color: colors.text }]}>
                        ₹{cat.total.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                      </ThemedText>
                      <ThemedText style={[styles.breakdownPercent, { color: colors.textSecondary }]}>
                        {cat.percentage.toFixed(1)}%
                      </ThemedText>
                    </View>
                  </View>
                  {/* Progress bar */}
                  <View style={[styles.barBg, { backgroundColor: isDark ? colors.background : '#F1F5F9' }]}>
                    <View
                      style={[
                        styles.barFill,
                        { width: `${cat.percentage}%`, backgroundColor: getCategoryColor(cat.name) },
                      ]}
                    />
                  </View>
                  {index < categories.length - 1 && (
                    <View style={[styles.divider, { backgroundColor: colors.cardBorder }]} />
                  )}
                </View>
              ))}
            </Surface>
          </View>
        )}

        {/* Top Merchants */}
        {topMerchants.length > 0 && (
          <View style={styles.section}>
            <ThemedText style={[styles.sectionTitle, { color: colors.text }]}>Top Merchants</ThemedText>
            {topMerchants.map((merchant, index) => (
              <Surface
                key={merchant.name}
                style={[styles.merchantCard, { backgroundColor: isDark ? colors.cardBackground : '#fff' }]}
                elevation={1}
              >
                <View style={styles.merchantRow}>
                  <View style={[styles.rankBadge, { backgroundColor: index < 3 ? colors.tint + '15' : colors.cardBorder + '40' }]}>
                    <ThemedText style={[styles.rankText, { color: index < 3 ? colors.tint : colors.textSecondary }]}>
                      #{index + 1}
                    </ThemedText>
                  </View>
                  <View style={styles.merchantInfo}>
                    <ThemedText style={[styles.merchantName, { color: colors.text }]}>{merchant.name}</ThemedText>
                    <ThemedText style={[styles.merchantMeta, { color: colors.textSecondary }]}>
                      {merchant.count} visit{merchant.count !== 1 ? 's' : ''}
                    </ThemedText>
                  </View>
                  <ThemedText style={[styles.merchantTotal, { color: colors.text }]}>
                    ₹{merchant.total.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                  </ThemedText>
                </View>
              </Surface>
            ))}
          </View>
        )}

        {/* Empty state */}
        {receipts.length === 0 && (
          <View style={styles.emptyState}>
            <IconButton icon="chart-line" size={56} iconColor={colors.textMuted} />
            <ThemedText style={[styles.emptyTitle, { color: colors.text }]}>No data yet</ThemedText>
            <ThemedText style={[styles.emptySubtext, { color: colors.textSecondary }]}>
              Start scanning receipts to see your spending insights
            </ThemedText>
          </View>
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
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 24,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  content: {
    padding: 20,
  },
  statGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
  },
  statIcon: {
    margin: 0,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '800',
    marginTop: 4,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  breakdownCard: {
    borderRadius: 14,
    padding: 16,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  breakdownLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  categoryDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  breakdownName: {
    fontSize: 14,
    fontWeight: '600',
  },
  breakdownMeta: {
    fontSize: 11,
    marginTop: 1,
  },
  breakdownRight: {
    alignItems: 'flex-end',
  },
  breakdownAmount: {
    fontSize: 14,
    fontWeight: '700',
  },
  breakdownPercent: {
    fontSize: 11,
    marginTop: 1,
  },
  barBg: {
    height: 4,
    borderRadius: 2,
    marginBottom: 4,
  },
  barFill: {
    height: 4,
    borderRadius: 2,
  },
  divider: {
    height: 1,
    marginVertical: 10,
  },
  merchantCard: {
    borderRadius: 12,
    marginBottom: 8,
    overflow: 'hidden',
  },
  merchantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
  },
  rankBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  rankText: {
    fontSize: 13,
    fontWeight: '800',
  },
  merchantInfo: {
    flex: 1,
  },
  merchantName: {
    fontSize: 15,
    fontWeight: '600',
  },
  merchantMeta: {
    fontSize: 12,
    marginTop: 2,
  },
  merchantTotal: {
    fontSize: 16,
    fontWeight: '800',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 8,
  },
  emptySubtext: {
    fontSize: 14,
    marginTop: 4,
    textAlign: 'center',
  },
});
