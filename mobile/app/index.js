import { View, Text, Button } from 'react-native';
import { useRouter } from 'expo-router';

export default function Home() {
  const router = useRouter();
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>Welcome to Receipt OCR!</Text>
      <Button title="Upload Receipt" onPress={() => router.push('/upload')} />
      <Button title="Dashboard" onPress={() => router.push('/dashboard')} />
    </View>
  );
}
