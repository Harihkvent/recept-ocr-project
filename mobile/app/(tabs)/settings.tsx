import React from 'react';
import { StyleSheet, ScrollView, View, Alert, Platform } from 'react-native';
import { List, Divider, Switch, Surface } from 'react-native-paper';
import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { API_URL } from '@/constants/Config';
import * as Sharing from 'expo-sharing';
import { documentDirectory, writeAsStringAsync } from 'expo-file-system/legacy';

export default function SettingsScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const isDark = colorScheme === 'dark';
  const [notifications, setNotifications] = React.useState(true);

  const exportData = async () => {
    try {
      const response = await fetch(`${API_URL}/receipts`);
      if (!response.ok) throw new Error('Failed to fetch');
      const data = await response.json();

      // Build CSV
      const headers = 'Merchant,Date,Total,Category\n';
      const rows = data.map((r: any) =>
        `"${r.fields?.merchant || ''}","${r.fields?.date || ''}","${r.fields?.total || 0}","${r.fields?.category || 'Other'}"`
      ).join('\n');
      const csv = headers + rows;

      if (Platform.OS === 'web') {
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'receipts_export.csv';
        a.click();
        URL.revokeObjectURL(url);
      } else {
        const fileUri = documentDirectory + 'receipts_export.csv';
        await writeAsStringAsync(fileUri, csv);
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(fileUri);
        } else {
          alert('Sharing is not available on this device');
        }
      }
    } catch (err) {
      console.error(err);
      alert('Failed to export data');
    }
  };

  const clearAllData = () => {
    const doDelete = async () => {
      try {
        const response = await fetch(`${API_URL}/receipts`);
        if (!response.ok) throw new Error('Fetch failed');
        const data = await response.json();
        await Promise.all(
          data.map((r: any) =>
            fetch(`${API_URL}/receipts/${r._id}`, { method: 'DELETE' })
          )
        );
        alert('All receipts deleted successfully');
      } catch {
        alert('Failed to delete receipts');
      }
    };

    if (Platform.OS === 'web') {
      if (confirm('Delete ALL receipts? This cannot be undone.')) {
        doDelete();
      }
    } else {
      Alert.alert(
        'Clear All Data',
        'This will permanently delete all your receipts. This action cannot be undone.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Delete All', style: 'destructive', onPress: doDelete },
        ]
      );
    }
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.headerGradientStart }]}>
        <ThemedText style={styles.headerTitle}>Settings</ThemedText>
        <ThemedText style={styles.headerSubtitle}>Manage your preferences</ThemedText>
      </View>

      <View style={styles.content}>
        {/* General */}
        <ThemedText style={[styles.sectionLabel, { color: colors.textSecondary }]}>GENERAL</ThemedText>
        <Surface style={[styles.card, { backgroundColor: isDark ? colors.cardBackground : '#fff' }]} elevation={1}>
          <List.Item
            title="Currency"
            description="Indian Rupee (₹)"
            titleStyle={[styles.itemTitle, { color: colors.text }]}
            descriptionStyle={{ color: colors.textSecondary }}
            left={props => <List.Icon {...props} icon="currency-inr" color={colors.tint} />}
          />
          <Divider style={{ backgroundColor: colors.cardBorder }} />
          <List.Item
            title="Notifications"
            titleStyle={[styles.itemTitle, { color: colors.text }]}
            right={() => <Switch value={notifications} onValueChange={setNotifications} color={colors.tint} />}
            left={props => <List.Icon {...props} icon="bell-outline" color={colors.accent} />}
          />
        </Surface>

        {/* Data */}
        <ThemedText style={[styles.sectionLabel, { color: colors.textSecondary }]}>DATA</ThemedText>
        <Surface style={[styles.card, { backgroundColor: isDark ? colors.cardBackground : '#fff' }]} elevation={1}>
          <List.Item
            title="Export Receipts"
            description="Download as CSV"
            titleStyle={[styles.itemTitle, { color: colors.text }]}
            descriptionStyle={{ color: colors.textSecondary }}
            left={props => <List.Icon {...props} icon="download" color={colors.success} />}
            right={props => <List.Icon {...props} icon="chevron-right" color={colors.textMuted} />}
            onPress={exportData}
          />
          <Divider style={{ backgroundColor: colors.cardBorder }} />
          <List.Item
            title="Clear All Data"
            description="Delete all saved receipts"
            titleStyle={[styles.itemTitle, { color: colors.error }]}
            descriptionStyle={{ color: colors.textSecondary }}
            left={props => <List.Icon {...props} icon="delete-sweep" color={colors.error} />}
            right={props => <List.Icon {...props} icon="chevron-right" color={colors.textMuted} />}
            onPress={clearAllData}
          />
        </Surface>

        {/* Connection */}
        <ThemedText style={[styles.sectionLabel, { color: colors.textSecondary }]}>CONNECTION</ThemedText>
        <Surface style={[styles.card, { backgroundColor: isDark ? colors.cardBackground : '#fff' }]} elevation={1}>
          <List.Item
            title="Server URL"
            description={API_URL}
            titleStyle={[styles.itemTitle, { color: colors.text }]}
            descriptionStyle={{ color: colors.textSecondary, fontSize: 12 }}
            left={props => <List.Icon {...props} icon="server" color={colors.tint} />}
          />
        </Surface>

        {/* About */}
        <ThemedText style={[styles.sectionLabel, { color: colors.textSecondary }]}>ABOUT</ThemedText>
        <Surface style={[styles.card, { backgroundColor: isDark ? colors.cardBackground : '#fff' }]} elevation={1}>
          <List.Item
            title="Version"
            description="1.0.0"
            titleStyle={[styles.itemTitle, { color: colors.text }]}
            descriptionStyle={{ color: colors.textSecondary }}
            left={props => <List.Icon {...props} icon="information-outline" color={colors.textSecondary} />}
          />
          <Divider style={{ backgroundColor: colors.cardBorder }} />
          <List.Item
            title="Receipt Scanner"
            description="OCR-powered receipt management"
            titleStyle={[styles.itemTitle, { color: colors.text }]}
            descriptionStyle={{ color: colors.textSecondary }}
            left={props => <List.Icon {...props} icon="cellphone-screenshot" color={colors.textSecondary} />}
          />
        </Surface>
      </View>

      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 8,
    marginTop: 20,
    marginLeft: 4,
  },
  card: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  itemTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
});
