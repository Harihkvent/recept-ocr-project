import React from 'react';
import { StyleSheet, ScrollView, ActivityIndicator, Platform, View, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Button, Divider, Surface, IconButton, Chip } from 'react-native-paper';
import { API_URL } from '@/constants/Config';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import * as Sharing from 'expo-sharing';
import { documentDirectory, writeAsStringAsync } from 'expo-file-system/legacy';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

export default function ReceiptDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const isDark = colorScheme === 'dark';
  const [receipt, setReceipt] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchReceipt = async () => {
      try {
        const response = await fetch(`${API_URL}/receipts`);
        const data = await response.json();
        const found = data.find((r: any) => r._id === id);
        setReceipt(found);
      } catch (error) {
        console.error('Error fetching receipt detail:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchReceipt();
  }, [id]);

  if (loading) {
    return (
      <ThemedView style={styles.center}>
        <ActivityIndicator size="large" color={colors.tint} />
        <ThemedText style={[styles.loadingText, { color: colors.textSecondary }]}>Loading receipt...</ThemedText>
      </ThemedView>
    );
  }

  if (!receipt) {
    return (
      <ThemedView style={styles.center}>
        <IconButton icon="alert-circle-outline" size={48} iconColor={colors.textMuted} />
        <ThemedText style={[styles.notFoundText, { color: colors.text }]}>Receipt not found</ThemedText>
        <Button mode="contained" onPress={() => router.back()} style={styles.goBackBtn} buttonColor={colors.tint}>
          Go Back
        </Button>
      </ThemedView>
    );
  }

  const handleDelete = async () => {
    const doDelete = async () => {
      try {
        const response = await fetch(`${API_URL}/receipts/${id}`, {
          method: 'DELETE',
        });
        if (!response.ok) throw new Error('Failed to delete');
        alert('Receipt deleted successfully');
        router.replace('/dashboard');
      } catch (err) {
        console.error(err);
        alert('Error deleting receipt');
      }
    };

    if (Platform.OS === 'web') {
      if (confirm('Delete this receipt? This cannot be undone.')) {
        doDelete();
      }
    } else {
      Alert.alert(
        'Delete Receipt',
        'Are you sure you want to delete this receipt?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Delete', style: 'destructive', onPress: doDelete },
        ]
      );
    }
  };

  const handleShare = async () => {
    const text = `Receipt from ${receipt.fields.merchant}\nDate: ${receipt.fields.date}\nTotal: ₹${receipt.fields.total}\nCategory: ${receipt.fields.category || 'Other'}`;
    try {
      if (Platform.OS === 'web') {
        if (navigator.clipboard) {
          await navigator.clipboard.writeText(text);
          alert('Receipt details copied to clipboard!');
        }
      } else {
        const fileUri = documentDirectory + `receipt_${id}.txt`;
        await writeAsStringAsync(fileUri, text);
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(fileUri);
        }
      }
    } catch {
      alert('Unable to share');
    }
  };

  const getCategoryIcon = (category?: string) => {
    const icons: Record<string, string> = {
      'Groceries': 'cart', 'Dining': 'food', 'Shopping': 'shopping',
      'Transport': 'car', 'Utilities': 'flash', 'Healthcare': 'medical-bag',
      'Entertainment': 'movie', 'Other': 'receipt',
    };
    return icons[category || 'Other'] || 'receipt';
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.headerGradientStart }]}>
        <View style={styles.headerRow}>
          <IconButton icon="arrow-left" iconColor="#fff" size={24} onPress={() => router.back()} />
          <View style={styles.headerActions}>
            <IconButton icon="share-variant" iconColor="#fff" size={22} onPress={handleShare} />
            <IconButton icon="delete-outline" iconColor="#fff" size={22} onPress={handleDelete} />
          </View>
        </View>

        <View style={styles.headerContent}>
          <ThemedText style={styles.merchantTitle}>{receipt.fields.merchant}</ThemedText>
          <ThemedText style={styles.totalAmount}>
            ₹{typeof receipt.fields.total === 'number'
              ? receipt.fields.total.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
              : receipt.fields.total}
          </ThemedText>
          <View style={styles.headerChips}>
            <Chip
              icon="calendar"
              textStyle={styles.chipText}
              style={styles.dateChip}
              compact
            >
              {receipt.fields.date}
            </Chip>
            <Chip
              icon={getCategoryIcon(receipt.fields.category)}
              textStyle={styles.chipText}
              style={styles.categoryChipHeader}
              compact
            >
              {receipt.fields.category || 'Other'}
            </Chip>
          </View>
        </View>
      </View>

      {/* Details */}
      <View style={styles.content}>
        {/* Info Cards */}
        <Surface style={[styles.infoCard, { backgroundColor: isDark ? colors.cardBackground : '#fff' }]} elevation={2}>
          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <IconButton icon="store" size={20} iconColor={colors.tint} style={styles.infoIcon} />
              <View>
                <ThemedText style={[styles.infoLabel, { color: colors.textSecondary }]}>Merchant</ThemedText>
                <ThemedText style={[styles.infoValue, { color: colors.text }]}>{receipt.fields.merchant}</ThemedText>
              </View>
            </View>
          </View>
          <Divider style={{ backgroundColor: colors.cardBorder }} />
          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <IconButton icon="calendar" size={20} iconColor={colors.accent} style={styles.infoIcon} />
              <View>
                <ThemedText style={[styles.infoLabel, { color: colors.textSecondary }]}>Date</ThemedText>
                <ThemedText style={[styles.infoValue, { color: colors.text }]}>{receipt.fields.date}</ThemedText>
              </View>
            </View>
          </View>
          <Divider style={{ backgroundColor: colors.cardBorder }} />
          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <IconButton icon="currency-inr" size={20} iconColor={colors.success} style={styles.infoIcon} />
              <View>
                <ThemedText style={[styles.infoLabel, { color: colors.textSecondary }]}>Amount</ThemedText>
                <ThemedText style={[styles.infoValue, { color: colors.text }]}>
                  ₹{typeof receipt.fields.total === 'number'
                    ? receipt.fields.total.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                    : receipt.fields.total}
                </ThemedText>
              </View>
            </View>
          </View>
        </Surface>

        {/* OCR Text */}
        <ThemedText style={[styles.sectionTitle, { color: colors.text }]}>Raw OCR Text</ThemedText>
        <Surface style={[styles.ocrCard, { backgroundColor: isDark ? colors.cardBackground : '#fff' }]} elevation={1}>
          <ThemedText style={[styles.ocrText, { color: isDark ? '#ccc' : '#444' }]}>
            {receipt.ocr_text}
          </ThemedText>
        </Surface>

        {/* Actions */}
        <View style={styles.actions}>
          <Button
            mode="contained"
            icon="share-variant"
            onPress={handleShare}
            style={[styles.actionBtn, { backgroundColor: colors.tint }]}
            contentStyle={styles.actionBtnContent}
          >
            Share
          </Button>
          <Button
            mode="outlined"
            icon="delete-outline"
            onPress={handleDelete}
            style={[styles.actionBtn, { borderColor: colors.error }]}
            contentStyle={styles.actionBtnContent}
            textColor={colors.error}
          >
            Delete
          </Button>
        </View>
      </View>

      <View style={{ height: 32 }} />
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
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },
  notFoundText: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 8,
  },
  goBackBtn: {
    marginTop: 16,
    borderRadius: 12,
  },
  header: {
    paddingTop: 48,
    paddingBottom: 28,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  headerActions: {
    flexDirection: 'row',
  },
  headerContent: {
    alignItems: 'center',
    paddingHorizontal: 24,
    marginTop: 4,
  },
  merchantTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
  },
  totalAmount: {
    fontSize: 40,
    fontWeight: '900',
    color: '#fff',
    marginVertical: 8,
  },
  headerChips: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  dateChip: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  categoryChipHeader: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  chipText: {
    color: '#fff',
    fontSize: 12,
  },
  content: {
    padding: 20,
  },
  infoCard: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  infoRow: {
    paddingVertical: 4,
    paddingHorizontal: 4,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoIcon: {
    margin: 0,
    marginRight: 4,
  },
  infoLabel: {
    fontSize: 11,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoValue: {
    fontSize: 15,
    fontWeight: '700',
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: 24,
    marginBottom: 12,
  },
  ocrCard: {
    borderRadius: 14,
    padding: 16,
  },
  ocrText: {
    fontSize: 13,
    lineHeight: 20,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  actionBtn: {
    flex: 1,
    borderRadius: 14,
  },
  actionBtnContent: {
    paddingVertical: 6,
  },
});
