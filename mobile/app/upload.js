import React, { useState } from 'react';
import { View, Text, Button, Image, ActivityIndicator } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Platform } from 'react-native';

export default function Upload() {
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const pickImage = async () => {
    let mediaTypes = Platform.OS === 'web'
      ? ImagePicker.MediaType.IMAGE
      : ImagePicker.MediaTypeOptions.Images;
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes,
      allowsEditing: true,
      quality: 1,
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      setImage(result.assets[0].uri);
    } else if (!result.cancelled && result.uri) {
      setImage(result.uri);
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
      const response = await fetch('http://10.37.251.252:8000/receipts', {
        method: 'POST',
        headers: {
          'Content-Type': 'multipart/form-data',
          // Add Authorization: Bearer <token> if needed
        },
        body: formData,
      });
      let data;
      try {
        data = await response.json();
      } catch (jsonErr) {
        console.log('Failed to parse JSON:', jsonErr);
        alert('Upload failed: Invalid server response');
        setLoading(false);
        return;
      }
      if (!response.ok) {
        console.log('Upload error:', data);
        alert('Upload failed: ' + (data.detail || JSON.stringify(data)));
        setLoading(false);
        return;
      }
      console.log('Upload response:', data);
      if (data && (data.data || data.receipt_id)) {
        setResult(data.data ? data.data : data);
        alert('Upload successful!');
      } else {
        setResult({ message: 'Upload succeeded, but no data returned.' });
        alert('Upload succeeded, but no data returned.');
      }
    } catch (error) {
      console.log('Network error:', error);
      alert('Upload failed: ' + error.message);
    }
    setLoading(false);
  };

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Button title="Pick an image from gallery" onPress={pickImage} />
      {image && <Image source={{ uri: image }} style={{ width: 200, height: 200, margin: 10 }} />}
      <Button title="Upload Receipt" onPress={uploadReceipt} disabled={!image || loading} />
      {loading && <ActivityIndicator size="large" color="#0000ff" />}
      {result && (
        <View style={{ marginTop: 20 }}>
          <Text style={{ fontWeight: 'bold', marginBottom: 5 }}>Backend Response:</Text>
          {Object.entries(result).map(([key, value]) => (
            <Text key={key}>{key}: {typeof value === 'object' ? JSON.stringify(value) : String(value)}</Text>
          ))}
        </View>
      )}
    </View>
  );
}
