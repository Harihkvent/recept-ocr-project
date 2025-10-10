import React, { useState } from 'react';
import { View, Image } from 'react-native';
import { Button, Text, ActivityIndicator } from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';

export default function UploadScreen() {
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      setImage(result.assets[0].uri);
    }
  };

  const uploadReceipt = async () => {
    if (!image) return;
    setLoading(true);
    const formData = new FormData();
    formData.append('image', {
      uri: image,
      name: 'receipt.jpg',
      type: 'image/jpeg',
    });
    try {
      const response = await fetch('http://localhost:8000/receipts', {
        method: 'POST',
        headers: { 'Content-Type': 'multipart/form-data' },
        body: formData,
      });
      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({ error: error.message });
    }
    setLoading(false);
  };

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Button mode="contained" onPress={pickImage}>Pick an image</Button>
      {image && <Image source={{ uri: image }} style={{ width: 200, height: 200, margin: 10 }} />}
      <Button mode="contained" onPress={uploadReceipt} disabled={!image || loading}>Upload Receipt</Button>
      {loading && <ActivityIndicator animating={true} />}
      {result && (
        <View style={{ marginTop: 20 }}>
          <Text variant="titleMedium">Backend Response:</Text>
          <Text>{JSON.stringify(result, null, 2)}</Text>
        </View>
      )}
    </View>
  );
}