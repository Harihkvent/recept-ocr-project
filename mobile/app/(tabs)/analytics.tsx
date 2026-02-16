import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, ActivityIndicator, RefreshControl } from 'react-native';
import { Card, Title } from 'react-native-paper';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { API_URL } from '@/constants/Config';
import { useColorScheme } from '@/hooks/use-color-scheme';

type Receipt = {
  id: string;
  date: string;
  total: number;
  merchant: string;
};

export default function AnalyticsScreen() {
  const colorScheme = useColorScheme();
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
      })));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReceipts();
  }, []);

  if (loading && receipts.length === 0) {
    return (
      <ThemedView style={styles.center}>
        <ActivityIndicator size="large" />
      </ThemedView>
    );
  }

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: isDark ? '#000' : '#fff' }]}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchReceipts} />}
    >
      <ThemedView style={styles.header}>
        <ThemedText type="title">Spending Stats</ThemedText>
      </ThemedView>

      <ThemedView style={styles.content}>
        <Card style={styles.card}>
          <Card.Content>
            <Title>Summary Statistics</Title>
            <ThemedView style={styles.statsRow}>
              <ThemedView style={{ flex: 1 }}>
                <ThemedText style={styles.miniLabel}>Total Spending</ThemedText>
                <ThemedText style={styles.miniValue}>
                  ₹{receipts.reduce((a, b) => a + b.total, 0).toLocaleString('en-IN')}
                </ThemedText>
              </ThemedView>
              <ThemedView style={{ flex: 1 }}>
                <ThemedText style={styles.miniLabel}>Avg/ Receipt</ThemedText>
                <ThemedText style={styles.miniValue}>
                  ₹{(receipts.reduce((a, b) => a + b.total, 0) / (receipts.length || 1)).toFixed(0)}
                </ThemedText>
              </ThemedView>
            </ThemedView>
          </Card.Content>
        </Card>

        <ThemedView style={styles.section}>
          <ThemedText type="subtitle">Recent Insights</ThemedText>
          <ThemedText style={{ opacity: 0.6, marginTop: 10 }}>
            Visual charts are temporarily disabled to resolve system memory issues.
          </ThemedText>
        </ThemedView>
      </ThemedView>
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
  header: {
    padding: 24,
    paddingTop: 60,
  },
  content: {
    padding: 24,
    gap: 16,
  },
  card: {
    borderRadius: 16,
    elevation: 4,
  },
  statsRow: {
    flexDirection: 'row',
    marginTop: 16,
    gap: 20,
  },
  miniLabel: {
    fontSize: 14,
    opacity: 0.6,
  },
  miniValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 4,
  },
  section: {
    marginTop: 20,
  },
});
