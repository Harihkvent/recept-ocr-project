import React from 'react';
import { StyleSheet, ScrollView, ActivityIndicator, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Card, Button, Divider } from 'react-native-paper';
import { API_URL } from '@/constants/Config';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

export default function ReceiptDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const colorScheme = useColorScheme();
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
        <ActivityIndicator size="large" color={Colors[colorScheme ?? 'light'].tint} />
      </ThemedView>
    );
  }

  if (!receipt) {
    return (
      <ThemedView style={styles.center}>
        <ThemedText>Receipt not found</ThemedText>
        <Button onPress={() => router.back()}>Go Back</Button>
      </ThemedView>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: isDark ? '#121212' : '#f5f5f5' }]}>
      <ThemedView style={styles.content}>
        <ThemedText type="title" style={styles.merchant}>{receipt.fields.merchant}</ThemedText>
        <ThemedText type="subtitle" style={styles.total}>
          ₹{typeof receipt.fields.total === 'number' ? receipt.fields.total.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : receipt.fields.total}
        </ThemedText>
        <ThemedText style={styles.date}>{receipt.fields.date}</ThemedText>
        
        <Divider style={styles.divider} />
        
        <Card style={[styles.card, { backgroundColor: isDark ? '#1e1e1e' : '#ffffff' }]} elevation={2}>
          <Card.Title 
            title="Raw OCR Text" 
            titleStyle={{ color: isDark ? '#fff' : '#000' }}
          />
          <Card.Content>
            <ThemedText style={[styles.ocrText, { color: isDark ? '#ccc' : '#444' }]}>
              {receipt.ocr_text}
            </ThemedText>
          </Card.Content>
        </Card>

        <Button 
          mode="contained" 
          buttonColor={isDark ? '#333' : '#6200ee'}
          textColor="#fff"
          onPress={() => router.back()} 
          style={styles.backButton}
        >
          Back to Dashboard
        </Button>
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 24,
    alignItems: 'center',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  merchant: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  total: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 4,
  },
  date: {
    fontSize: 18,
    opacity: 0.6,
    marginBottom: 24,
  },
  divider: {
    width: '100%',
    marginVertical: 24,
    height: 1,
  },
  card: {
    width: '100%',
    marginBottom: 24,
    borderRadius: 12,
  },
  ocrText: {
    fontSize: 15,
    lineHeight: 22,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  backButton: {
    width: '100%',
    marginTop: 16,
    borderRadius: 8,
    paddingVertical: 4,
  },
});
