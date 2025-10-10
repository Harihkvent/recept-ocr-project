import React from 'react';
import { StyleSheet, Image } from 'react-native';
import { Button } from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

export default function UploadScreen() {
  const [image, setImage] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [result, setResult] = React.useState<any>(null);

  const processReceipt = async () => {
    if (!image) return;

    try {
      setLoading(true);
      // Create form data
      const formData = new FormData();
      const imageDetails = {
        uri: image,
        type: 'image/jpeg',
        name: 'receipt.jpg'
      };
      formData.append('image', imageDetails as any);

      // Send to backend
      const response = await fetch('http://10.46.5.252:8000/receipts', {
        method: 'POST',
        body: formData,
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to process receipt');
      }

      const data = await response.json();
      setResult(data);
      alert('Receipt processed successfully!');
    } catch (error) {
      console.error('Error processing receipt:', error);
      alert('Error processing receipt. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const pickImage = async () => {
    try {
      // Request permission first
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (!permissionResult.granted) {
        alert('Permission to access media library is required!');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setImage(result.assets[0].uri);
        // TODO: Implement OCR processing
        console.log('Selected image:', result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      alert('Error selecting image. Please try again.');
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">Upload Receipt</ThemedText>
      {image && (
        <Image
          source={{ uri: image }}
          style={styles.image}
        />
      )}
      <Button 
        mode="contained"
        onPress={pickImage}
        style={styles.button}
      >
        {image ? 'Change Image' : 'Pick an image from camera roll'}
      </Button>
      {image && (
        <Button 
          mode="contained"
          onPress={processReceipt}
          style={[styles.button, styles.processButton]}
          loading={loading}
          disabled={loading}
        >
          {loading ? 'Processing...' : 'Process Receipt'}
        </Button>
      )}
      {result && (
        <ThemedView style={styles.resultContainer}>
          <ThemedText type="subtitle">Results:</ThemedText>
          <ThemedText>OCR Text: {result.ocr_text}</ThemedText>
          {result.fields && Object.entries(result.fields).map(([key, value]) => (
            <ThemedText key={key}>{key}: {String(value)}</ThemedText>
          ))}
        </ThemedView>
      )}
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
  button: {
    marginTop: 20,
    width: '100%',
  },
  image: {
    width: 300,
    height: 400,
    marginVertical: 20,
    borderRadius: 8,
  },
  processButton: {
    backgroundColor: '#4CAF50',
  },
  resultContainer: {
    marginTop: 20,
    padding: 15,
    borderRadius: 8,
    width: '100%',
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
});