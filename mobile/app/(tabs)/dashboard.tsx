import React from 'react';
import { StyleSheet, FlatList, ActivityIndicator, RefreshControl, View, Alert, Platform } from 'react-native';
import { Card, Button, Searchbar, Menu, IconButton, Surface, Chip } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { API_URL } from '@/constants/Config';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

type Receipt = {
  id: string;
  date: string;
  total: number | string;
  merchant: string;
  ocr_text: string;
  category?: string;
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
  const colors = Colors[colorScheme ?? 'light'];
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
        ocr_text: r.ocr_text,
        category: r.fields.category || 'Other',
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

  useFocusEffect(
    React.useCallback(() => {
      fetchReceipts();
    }, [])
  );

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

  const confirmDelete = (id: string, merchant: string) => {
    if (Platform.OS === 'web') {
      if (confirm(`Delete receipt from "${merchant}"?`)) {
        handleDelete(id);
      }
    } else {
      Alert.alert(
        'Delete Receipt',
        `Are you sure you want to delete the receipt from "${merchant}"?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Delete', style: 'destructive', onPress: () => handleDelete(id) },
        ]
      );
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`${API_URL}/receipts/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete receipt');
      
      setReceipts(prev => prev.filter(r => r.id !== id));
      setFilteredReceipts(prev => prev.filter(r => r.id !== id));
    } catch (err) {
      console.error('Delete error:', err);
      alert('Failed to delete receipt');
    }
  };

  const totalSpending = receipts.reduce((acc, curr) => acc + (typeof curr.total === 'number' ? curr.total : 0), 0);

  const getCategoryIcon = (category?: string) => {
    const icons: Record<string, string> = {
      'Groceries': 'cart',
      'Dining': 'food',
      'Shopping': 'shopping',
      'Transport': 'car',
      'Utilities': 'flash',
      'Healthcare': 'medical-bag',
      'Entertainment': 'movie',
      'Other': 'receipt',
    };
    return icons[category || 'Other'] || 'receipt';
  };

  const renderReceiptCard = ({ item }: { item: Receipt }) => (
    <Surface
      style={[styles.card, { backgroundColor: isDark ? colors.cardBackground : '#fff' }]}
      elevation={2}
    >
      <Card
        mode="contained"
        style={{ backgroundColor: 'transparent' }}
        onPress={() => router.push({ pathname: '/receipt/[id]', params: { id: item.id } })}
      >
        <Card.Content style={styles.cardContent}>
          <View style={styles.cardLeft}>
            <View style={[styles.categoryIcon, { backgroundColor: colors.tint + '15' }]}>
              <IconButton icon={getCategoryIcon(item.category)} size={22} iconColor={colors.tint} style={{ margin: 0 }} />
            </View>
          </View>
          <View style={styles.cardCenter}>
            <ThemedText style={[styles.merchantText, { color: colors.text }]}>{item.merchant}</ThemedText>
            <View style={styles.cardMeta}>
              <ThemedText style={[styles.dateText, { color: colors.textSecondary }]}>{item.date}</ThemedText>
              {item.category && item.category !== 'Other' && (
                <Chip
                  compact
                  textStyle={styles.chipText}
                  style={[styles.categoryChip, { backgroundColor: colors.accent + '15' }]}
                >
                  {item.category}
                </Chip>
              )}
            </View>
          </View>
          <View style={styles.cardRight}>
            <ThemedText style={[styles.totalText, { color: colors.text }]}>
              ₹{typeof item.total === 'number' ? item.total.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : item.total}
            </ThemedText>
            <IconButton
              icon="delete-outline"
              iconColor={colors.error}
              size={18}
              onPress={() => confirmDelete(item.id, item.merchant)}
              style={styles.deleteBtn}
            />
          </View>
        </Card.Content>
      </Card>
    </Surface>
  );

  return (
    <ThemedView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.headerGradientStart }]}>
        <View style={styles.headerRow}>
          <ThemedText style={styles.headerTitle}>My Receipts</ThemedText>
          <Menu
            visible={sortVisible}
            onDismiss={() => setSortVisible(false)}
            anchor={
              <IconButton
                icon="sort"
                onPress={() => setSortVisible(true)}
                iconColor="#fff"
              />
            }
          >
            <Menu.Item onPress={() => handleSort('date')} title="Sort by Date" leadingIcon="calendar" />
            <Menu.Item onPress={() => handleSort('total')} title="Sort by Amount" leadingIcon="currency-inr" />
            <Menu.Item onPress={() => handleSort('merchant')} title="Sort by Merchant" leadingIcon="store" />
          </Menu>
        </View>

        {/* Summary Strip */}
        <Surface style={[styles.summaryStrip, { backgroundColor: isDark ? colors.cardBackground : '#fff' }]} elevation={4}>
          <View style={styles.summaryItem}>
            <ThemedText style={[styles.summaryLabel, { color: colors.textSecondary }]}>Total</ThemedText>
            <ThemedText style={[styles.summaryValue, { color: colors.text }]}>
              ₹{totalSpending.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </ThemedText>
          </View>
          <View style={[styles.summaryDivider, { backgroundColor: colors.cardBorder }]} />
          <View style={styles.summaryItem}>
            <ThemedText style={[styles.summaryLabel, { color: colors.textSecondary }]}>Count</ThemedText>
            <ThemedText style={[styles.summaryValue, { color: colors.text }]}>{receipts.length}</ThemedText>
          </View>
          <View style={[styles.summaryDivider, { backgroundColor: colors.cardBorder }]} />
          <View style={styles.summaryItem}>
            <ThemedText style={[styles.summaryLabel, { color: colors.textSecondary }]}>Average</ThemedText>
            <ThemedText style={[styles.summaryValue, { color: colors.text }]}>
              ₹{receipts.length > 0 ? (totalSpending / receipts.length).toFixed(0) : '0'}
            </ThemedText>
          </View>
        </Surface>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <Searchbar
          placeholder="Search by merchant or text..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={[styles.searchBar, { backgroundColor: isDark ? colors.cardBackground : '#fff' }]}
          inputStyle={styles.searchInput}
          iconColor={colors.textMuted}
          elevation={1}
        />
      </View>

      {/* Content */}
      {loading ? (
        <ThemedView style={styles.centerContent}>
          <ActivityIndicator size="large" color={colors.tint} />
          <ThemedText style={[styles.loadingText, { color: colors.textSecondary }]}>Loading receipts...</ThemedText>
        </ThemedView>
      ) : error ? (
        <ThemedView style={styles.centerContent}>
          <IconButton icon="alert-circle-outline" size={48} iconColor={colors.error} />
          <ThemedText style={[styles.errorText, { color: colors.error }]}>{error}</ThemedText>
          <Button
            mode="contained"
            onPress={fetchReceipts}
            style={styles.retryButton}
            buttonColor={colors.tint}
          >
            Try Again
          </Button>
        </ThemedView>
      ) : filteredReceipts.length > 0 ? (
        <FlatList
          data={filteredReceipts}
          renderItem={renderReceiptCard}
          keyExtractor={(item) => item.id}
          style={styles.list}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={loading} onRefresh={fetchReceipts} />
          }
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <ThemedView style={styles.centerContent}>
          <IconButton icon="receipt" size={56} iconColor={colors.textMuted} />
          <ThemedText style={[styles.emptyTitle, { color: colors.text }]}>
            {searchQuery ? 'No matches found' : 'No receipts yet'}
          </ThemedText>
          <ThemedText style={[styles.emptySubtext, { color: colors.textSecondary }]}>
            {searchQuery ? 'Try a different search term' : 'Scan your first receipt to get started'}
          </ThemedText>
          {!searchQuery && (
            <Button
              mode="contained"
              icon="camera"
              onPress={() => router.push('/upload')}
              style={styles.scanButton}
              buttonColor={colors.tint}
            >
              Scan Receipt
            </Button>
          )}
        </ThemedView>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 40,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#fff',
  },
  summaryStrip: {
    flexDirection: 'row',
    marginHorizontal: 20,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 8,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryDivider: {
    width: 1,
    alignSelf: 'stretch',
  },
  summaryLabel: {
    fontSize: 11,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: '800',
  },
  searchContainer: {
    paddingHorizontal: 20,
    marginTop: -8,
    marginBottom: 8,
  },
  searchBar: {
    borderRadius: 14,
    elevation: 0,
  },
  searchInput: {
    fontSize: 14,
  },
  card: {
    marginBottom: 10,
    borderRadius: 14,
    overflow: 'hidden',
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  cardLeft: {
    marginRight: 12,
  },
  categoryIcon: {
    borderRadius: 12,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardCenter: {
    flex: 1,
  },
  cardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  categoryChip: {
    height: 22,
  },
  chipText: {
    fontSize: 10,
    marginVertical: 0,
  },
  cardRight: {
    alignItems: 'flex-end',
  },
  merchantText: {
    fontSize: 15,
    fontWeight: '700',
  },
  totalText: {
    fontSize: 16,
    fontWeight: '800',
  },
  dateText: {
    fontSize: 12,
  },
  deleteBtn: {
    margin: 0,
    marginTop: 4,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },
  errorText: {
    marginTop: 8,
    marginBottom: 16,
    textAlign: 'center',
    fontSize: 15,
  },
  retryButton: {
    borderRadius: 12,
    paddingHorizontal: 24,
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
  scanButton: {
    marginTop: 20,
    borderRadius: 12,
  },
});