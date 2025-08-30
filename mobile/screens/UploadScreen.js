import React, { useState } from 'react';
import { View, Text, Button, Image, ActivityIndicator } from 'react-native';
import * as ImagePicker from 'expo-image-picker';

export default function UploadScreen() {
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, quality: 1 });
    if (!result.cancelled) setImage(result.uri);
  };

  const uploadReceipt = async () => {
    setLoading(true);
    // TODO: Upload image to backend
    setTimeout(() => {
      setResult({ merchant: 'Sample Store', date: '2025-08-30', total: 42.5, category: 'Food' });
      setLoading(false);
    }, 2000);
  };

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Button title="Pick an image from gallery" onPress={pickImage} />
      {image && <Image source={{ uri: image }} style={{ width: 200, height: 200, margin: 10 }} />}
      <Button title="Upload Receipt" onPress={uploadReceipt} disabled={!image || loading} />
      {loading && <ActivityIndicator size="large" color="#0000ff" />}
      {result && (
        <View style={{ marginTop: 20 }}>
          <Text>Merchant: {result.merchant}</Text>
          <Text>Date: {result.date}</Text>
          <Text>Total: {result.total}</Text>
          <Text>Category: {result.category}</Text>
        </View>
      )}
    </View>
  );
}
