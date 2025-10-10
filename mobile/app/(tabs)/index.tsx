import React from 'react';
import { StyleSheet } from 'react-native';
import { Button } from 'react-native-paper';
import { useRouter } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function HomeScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  
  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title" style={styles.title}>
        Receipt OCR
      </ThemedText>
      <ThemedView style={styles.buttonContainer}>
        <Button 
          mode="contained" 
          onPress={() => router.push('/upload')}
          style={styles.button}
        >
          Upload Receipt
        </Button>
        <Button 
          mode="outlined" 
          onPress={() => router.push('/dashboard')}
          style={styles.button}
        >
          View Receipts
        </Button>
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    marginBottom: 30,
  },
  buttonContainer: {
    width: '100%',
    gap: 16,
  },
  button: {
    width: '100%',
  },
});
