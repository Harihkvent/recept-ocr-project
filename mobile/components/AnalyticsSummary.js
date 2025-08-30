import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useColorScheme } from 'react-native';

export default function AnalyticsSummary({ receipts }) {
  // Calculate total spend, count, and by category
  let total = 0;
  let byCategory = {};
  let count = receipts.length;
  receipts.forEach(r => {
    let amount = 0;
    if (r.fields && r.fields.total) {
      amount = parseFloat(r.fields.total) || 0;
    }
    total += amount;
    const cat = r.category || (r.fields && r.fields.category) || 'Uncategorized';
    byCategory[cat] = (byCategory[cat] || 0) + amount;
  });
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  return (
    <View style={[styles.container, {backgroundColor: isDark ? '#222' : '#f5f5f5'}]}>
      <Text style={[styles.title, {color: isDark ? '#fff' : '#222'}]}>Summary</Text>
      <Text style={{color: isDark ? '#fff' : '#222'}}>Total Receipts: {count}</Text>
      <Text style={{color: isDark ? '#fff' : '#222'}}>Total Spend: ${total.toFixed(2)}</Text>
      <Text style={[styles.subtitle, {color: isDark ? '#fff' : '#222'}]}>By Category:</Text>
      {Object.entries(byCategory).map(([cat, amt]) => (
        <Text key={cat} style={{color: isDark ? '#fff' : '#222'}}>{cat}: ${amt.toFixed(2)}</Text>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
    padding: 16,
    borderRadius: 10,
    elevation: 2,
  },
  title: {
    fontWeight: 'bold',
    fontSize: 18,
    marginBottom: 6,
  },
  subtitle: {
    marginTop: 8,
    fontWeight: 'bold',
  },
});
