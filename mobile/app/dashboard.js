import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator, Button, Alert, RefreshControl, useColorScheme, StyleSheet, TextInput } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import AnalyticsSummary from '../components/AnalyticsSummary';
import { exportReceiptsToCSV, shareCSV } from '../utils/csvExport';
  // Export and share CSV
  const handleExportShare = async () => {
    try {
      const fileUri = await exportReceiptsToCSV(filteredReceipts);
      if (fileUri) {
        await shareCSV(fileUri);
      } else {
        alert('No receipts to export.');
      }
    } catch (e) {
      alert('Export failed: ' + e.message);
    }
  };

const Dashboard = () => {
  const [receipts, setReceipts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [date, setDate] = useState('');
  const colorScheme = useColorScheme();

  const isDark = colorScheme === 'dark';
  const styles = StyleSheet.create({
    container: {
      padding: 20,
      backgroundColor: isDark ? '#121212' : '#fff',
      minHeight: '100%',
    },
    title: {
      fontWeight: 'bold',
      fontSize: 20,
      marginBottom: 10,
      color: isDark ? '#fff' : '#222',
    },
    card: {
      marginBottom: 20,
      padding: 10,
      borderWidth: 1,
      borderColor: isDark ? '#444' : '#ccc',
      borderRadius: 8,
      backgroundColor: isDark ? '#222' : '#fafafa',
    },
    label: {
      fontWeight: 'bold',
      color: isDark ? '#fff' : '#222',
    },
    text: {
      color: isDark ? '#eee' : '#222',
    },
    error: {
      color: '#ff5555',
      marginBottom: 10,
    },
    searchBar: {
      backgroundColor: isDark ? '#222' : '#eee',
      color: isDark ? '#fff' : '#222',
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 8,
      marginBottom: 10,
    },
    filterRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 10,
      gap: 10,
    },
    picker: {
      flex: 1,
      color: isDark ? '#fff' : '#222',
      backgroundColor: isDark ? '#222' : '#eee',
      borderRadius: 8,
    },
    dateInput: {
      flex: 1,
      backgroundColor: isDark ? '#222' : '#eee',
      color: isDark ? '#fff' : '#222',
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 8,
    },
  });

  const fetchReceipts = async () => {
    try {
      const response = await fetch('http://10.37.251.252:8000/receipts');
      const data = await response.json();
      if (data && (data.data || Array.isArray(data))) {
        setReceipts(data.data ? data.data : data);
      } else {
        setReceipts([]);
      }
    } catch (err) {
      setError('Failed to fetch receipts');
    }
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => {
    fetchReceipts();
  }, []);

  const handleDelete = async (receiptId) => {
    Alert.alert(
      'Delete Receipt',
      'Are you sure you want to delete this receipt?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await fetch(`http://10.37.251.252:8000/receipts/${receiptId}`, {
                method: 'DELETE',
              });
              if (response.ok) {
                fetchReceipts();
              } else {
                Alert.alert('Error', 'Failed to delete receipt.');
              }
            } catch (err) {
              Alert.alert('Error', 'Failed to delete receipt.');
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>{error}</Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: styles.container.backgroundColor }}>
        <ActivityIndicator size="large" color={styles.text.color} />
      </View>
    );
  }

  // Filter receipts
  let filteredReceipts = receipts.filter(r => {
    const merchant = (r.merchant_name || (r.fields && r.fields.merchant) || '').toLowerCase();
    const cat = r.category || (r.fields && r.fields.category) || '';
    const dateVal = r.purchase_date || (r.fields && r.fields.date) || '';
    let match = true;
    if (search && !merchant.includes(search.toLowerCase())) match = false;
    if (category && cat !== category) match = false;
    if (date && dateVal !== date) match = false;
    return match;
  });

  // Get unique categories for filter
  const categories = Array.from(new Set(receipts.map(r => r.category || (r.fields && r.fields.category) || 'Uncategorized')));

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchReceipts(); }} />
      }
    >
  <Text style={styles.title}>All Receipts</Text>
  <Button title="Export & Share CSV" onPress={handleExportShare} />
      <AnalyticsSummary receipts={filteredReceipts} />
      {/* Search and Filter UI */}
      <TextInput
        style={styles.searchBar}
        placeholder="Search by merchant..."
        placeholderTextColor={isDark ? '#aaa' : '#888'}
        value={search}
        onChangeText={setSearch}
      />
      <View style={styles.filterRow}>
        {/* Category Picker */}
        <Picker
          selectedValue={category}
          style={styles.picker}
          onValueChange={setCategory}
        >
          <Picker.Item label="All Categories" value="" />
          {categories.map(cat => (
            <Picker.Item key={cat} label={cat} value={cat} />
          ))}
        </Picker>
        {/* Date filter (YYYY-MM-DD) */}
        <TextInput
          style={styles.dateInput}
          placeholder="Date (YYYY-MM-DD)"
          placeholderTextColor={isDark ? '#aaa' : '#888'}
          value={date}
          onChangeText={setDate}
        />
      </View>
      {error && <Text style={styles.error}>{error}</Text>}
      {filteredReceipts.length === 0 ? (
        <Text style={styles.text}>No receipts found.</Text>
      ) : (
        filteredReceipts.map((receipt, idx) => (
          <View key={receipt._id || receipt.receipt_id || idx} style={styles.card}>
            <Text style={styles.label}>Merchant: <Text style={styles.text}>{receipt.merchant_name || (receipt.fields && receipt.fields.merchant) || 'N/A'}</Text></Text>
            <Text style={styles.label}>Date: <Text style={styles.text}>{receipt.purchase_date || (receipt.fields && receipt.fields.date) || 'N/A'}</Text></Text>
            <Text style={styles.label}>Total: <Text style={styles.text}>{(receipt.fields && receipt.fields.total) || 'N/A'}</Text></Text>
            <Text style={styles.label}>OCR Text: <Text style={styles.text}>{receipt.ocr_text || 'N/A'}</Text></Text>
            <Text style={styles.label}>Receipt ID: <Text style={styles.text}>{receipt._id || receipt.receipt_id}</Text></Text>
            <Button title="Delete" color="#d9534f" onPress={() => handleDelete(receipt._id || receipt.receipt_id)} />
          </View>
        ))
      )}
    </ScrollView>
  );
}

export default Dashboard;
