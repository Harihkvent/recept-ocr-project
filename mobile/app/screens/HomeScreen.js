import React from 'react';
import { View } from 'react-native';
import { Button, Text } from 'react-native-paper';

export default function HomeScreen({ navigation }) {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text variant="headlineMedium">Receipt OCR</Text>
      <Button mode="contained" onPress={() => navigation.navigate('Upload')} style={{ margin: 10 }}>
        Upload Receipt
      </Button>
      <Button mode="outlined" onPress={() => navigation.navigate('Dashboard')}>
        Dashboard
      </Button>
    </View>
  );
}