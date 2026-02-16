import React from 'react';
import { StyleSheet, FlatList, ActivityIndicator, RefreshControl } from 'react-native';
import { Card, Button, Searchbar, Menu, IconButton } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { API_URL } from '@/constants/Config';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

// TODO: Replace with actual receipt data type
type Receipt = {
  id: string;
  date: string;
  total: number | string;
  merchant: string;
  ocr_text: string;
};

export default function DashboardScreen() {
  const router = useRouter();
  const [receipts, setReceipts] = React.useState<Receipt[]>([]);
  const [filteredReceipts, setFilteredReceipts] = React.useState<Receipt[]>([]);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [sortVisible, setSortVisible] = React.useState(false);
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const fetchReceipts = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`${API_URL}/receipts`);
      if (!response.ok) {
        throw new Error('Failed to fetch receipts');
      }
      const data = await response.json();
      const formattedReceipts = data.map((r: any) => ({
        id: r._id,
        merchant: r.fields.merchant || 'Unknown Merchant',
        total: r.fields.total || 0,
        date: r.fields.date || 'Unknown Date',
        ocr_text: r.ocr_text
      }));
      setReceipts(formattedReceipts);
      setFilteredReceipts(formattedReceipts);
    } catch (err) {
      console.error('Error fetching receipts:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch receipts');
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchReceipts();
  }, []);

  React.useEffect(() => {
    const filtered = receipts.filter(r => 
      r.merchant.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.ocr_text.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredReceipts(filtered);
  }, [searchQuery, receipts]);

  const handleSort = (type: 'date' | 'total' | 'merchant') => {
    const sorted = [...filteredReceipts].sort((a, b) => {
      if (type === 'total') return Number(b.total) - Number(a.total);
      if (type === 'date') return new Date(b.date).getTime() - new Date(a.date).getTime();
      return a.merchant.localeCompare(b.merchant);
    });
    setFilteredReceipts(sorted);
    setSortVisible(false);
  };

  const renderReceiptCard = ({ item }: { item: Receipt }) => (
    <Card 
      style={[
        styles.card, 
        { backgroundColor: isDark ? Colors.dark.cardBackground : Colors.light.cardBackground }
      ]}
      mode="elevated"
      onPress={() => router.push({ pathname: '/receipt/[id]', params: { id: item.id } })}
    >
      <Card.Content style={styles.cardContent}>
        <ThemedText type="subtitle" style={styles.merchantText}>{item.merchant}</ThemedText>
        <ThemedText type="title" style={styles.totalText}>
          ${typeof item.total === 'number' ? item.total.toFixed(2) : item.total}
        </ThemedText>
        <ThemedText style={styles.dateText}>{item.date}</ThemedText>
        <ThemedText 
          style={[
            styles.ocrText,
            { color: isDark ? Colors.dark.textSecondary : Colors.light.textSecondary }
          ]} 
          numberOfLines={2}
        >
          {item.ocr_text}
        </ThemedText>
      </Card.Content>
    </Card>
  );

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.header}>
        <ThemedText type="title" style={styles.title}>Dashboard</ThemedText>
        <Menu
          visible={sortVisible}
          onDismiss={() => setSortVisible(false)}
          anchor={
            <IconButton 
              icon="sort" 
              onPress={() => setSortVisible(true)}
              iconColor={Colors[colorScheme ?? 'light'].tint}
            />
          }
        >
          <Menu.Item onPress={() => handleSort('date')} title="Sort by Date" />
          <Menu.Item onPress={() => handleSort('total')} title="Sort by Amount" />
          <Menu.Item onPress={() => handleSort('merchant')} title="Sort by Merchant" />
        </Menu>
      </ThemedView>

      <Searchbar
        placeholder="Search receipts..."
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={styles.searchBar}
      />

      {loading ? (
        <ThemedView style={styles.centerContent}>
          <ActivityIndicator 
            size="large" 
            color={Colors[colorScheme ?? 'light'].tint}
          />
        </ThemedView>
      ) : error ? (
        <ThemedView style={styles.centerContent}>
          <ThemedText 
            style={[
              styles.errorText,
              { color: Colors[colorScheme ?? 'light'].error }
            ]}
          >
            {error}
          </ThemedText>
          <Button 
            mode="contained" 
            onPress={fetchReceipts} 
            style={styles.retryButton}
            buttonColor={Colors[colorScheme ?? 'light'].tint}
          >
            Retry
          </Button>
        </ThemedView>
      ) : filteredReceipts.length > 0 ? (
        <FlatList
          data={filteredReceipts}
          renderItem={renderReceiptCard}
          keyExtractor={(item) => item.id}
          style={styles.list}
          refreshControl={
            <RefreshControl refreshing={loading} onRefresh={fetchReceipts} />
          }
        />
      ) : (
        <ThemedView style={styles.centerContent}>
          <ThemedText>No receipts found</ThemedText>
        </ThemedView>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  searchBar: {
    marginBottom: 16,
    elevation: 2,
    backgroundColor: 'rgba(0,0,0,0.02)',
  },
  card: {
    marginBottom: 12,
    borderRadius: 12,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardContent: {
    padding: 16,
  },
  list: {
    flex: 1,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    marginBottom: 20,
    textAlign: 'center',
    fontSize: 16,
  },
  retryButton: {
    marginTop: 12,
    paddingHorizontal: 24,
  },
  merchantText: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  totalText: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  dateText: {
    fontSize: 14,
    marginBottom: 8,
  },
  ocrText: {
    fontSize: 13,
    marginTop: 8,
    lineHeight: 18,
  },
});