import React from 'react';
import { StyleSheet, ScrollView } from 'react-native';
import { List, Divider, Switch } from 'react-native-paper';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function SettingsScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [notifications, setNotifications] = React.useState(true);

  return (
    <ScrollView style={[styles.container, { backgroundColor: isDark ? '#000' : '#fff' }]}>
      <ThemedView style={styles.header}>
        <ThemedText type="title">Settings</ThemedText>
      </ThemedView>

      <ThemedView style={styles.content}>
        <List.Section>
          <List.Subheader>Preferences</List.Subheader>
          <List.Item
            title="Currency"
            description="Indian Rupee (₹)"
            left={props => <List.Icon {...props} icon="currency-inr" />}
          />
          <Divider />
          <List.Item
            title="Notifications"
            right={() => <Switch value={notifications} onValueChange={setNotifications} />}
            left={props => <List.Icon {...props} icon="bell" />}
          />
        </List.Section>

        <List.Section>
          <List.Subheader>App Info</List.Subheader>
          <List.Item
            title="Version"
            description="1.0.0"
            left={props => <List.Icon {...props} icon="information" />}
          />
          <List.Item
            title="About Receipt OCR"
            left={props => <List.Icon {...props} icon="help-circle" />}
          />
        </List.Section>
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingTop: 60,
  },
  content: {
    flex: 1,
  },
});
