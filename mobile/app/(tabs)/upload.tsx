import React from 'react';
import { StyleSheet, Image } from 'react-native';
import { TextInput, Card, Button } from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';
import { API_URL } from '@/constants/Config';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

export default function UploadScreen() {
  const [image, setImage] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [result, setResult] = React.useState<any>(null);
  const [editingFields, setEditingFields] = React.useState<any>(null);
  const [saving, setSaving] = React.useState(false);

  const processReceipt = async () => {
    if (!image) return;

    try {
      setLoading(true);
      // Create form data
      const formData = new FormData();
      
      if (typeof window !== 'undefined' && image.startsWith('blob:')) {
        // For Web: fetch the blob and append it
        const response = await fetch(image);
        const blob = await response.blob();
        formData.append('image', blob, 'receipt.jpg');
      } else {
        // For Native
        const imageDetails = {
          uri: image,
          type: 'image/jpeg',
          name: 'receipt.jpg'
        };
        formData.append('image', imageDetails as any);
      }

      // Send to backend
      const response = await fetch(`${API_URL}/receipts`, {
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
      setEditingFields(data.fields);
      alert('Receipt processed! Please review the details.');
    } catch (error) {
      console.error('Error processing receipt:', error);
      alert('Error processing receipt. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const saveChanges = async () => {
    if (!result || !editingFields) return;

    try {
      setSaving(true);
      const response = await fetch(`${API_URL}/receipts/${result.receipt_id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ fields: editingFields }),
      });

      if (!response.ok) {
        throw new Error('Failed to save changes');
      }

      alert('Changes saved successfully!');
      setResult(null);
      setImage(null);
      setEditingFields(null);
    } catch (error) {
      console.error('Error saving changes:', error);
      alert('Error saving changes. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const pickImage = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (!permissionResult.granted) {
        alert('Permission to access media library is required!');
        return;
      }

      const pickerResult = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false, // Changed from true to allow full image analysis
        quality: 1,
      });

      if (!pickerResult.canceled && pickerResult.assets && pickerResult.assets.length > 0) {
        setImage(pickerResult.assets[0].uri);
        setResult(null);
        setEditingFields(null);
      }
    } catch (error) {
      console.error('Error picking image:', error);
    }
  };

  const updateField = (key: string, value: string) => {
    setEditingFields({
      ...editingFields,
      [key]: key === 'total' ? parseFloat(value) || 0 : value
    });
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">Upload Receipt</ThemedText>
      
      {!result ? (
        <>
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
            {image ? 'Change Image' : 'Pick a receipt from camera roll'}
          </Button>
          {image && (
            <Button 
              mode="contained"
              onPress={processReceipt}
              style={[styles.button, styles.processButton]}
              loading={loading}
              disabled={loading}
            >
              {loading ? 'Processing...' : 'Analyze Receipt'}
            </Button>
          )}
        </>
      ) : (
        <ThemedView style={styles.resultContainer}>
          <ThemedText type="subtitle" style={styles.resultTitle}>Review Extracted Details</ThemedText>
          <Card style={styles.editCard}>
            <Card.Content>
              <TextInput
                label="Merchant"
                value={editingFields?.merchant}
                onChangeText={(text) => updateField('merchant', text)}
                style={styles.input}
              />
              <TextInput
                label="Date"
                value={editingFields?.date}
                onChangeText={(text) => updateField('date', text)}
                style={styles.input}
              />
              <TextInput
                label="Total Amount (₹)"
                value={String(editingFields?.total)}
                onChangeText={(text) => updateField('total', text)}
                keyboardType="numeric"
                style={styles.input}
              />
            </Card.Content>
          </Card>
          <Button 
            mode="contained" 
            onPress={saveChanges}
            loading={saving}
            disabled={saving}
            style={styles.saveButton}
          >
            Confirm & Save
          </Button>
          <Button 
            mode="outlined" 
            onPress={() => setResult(null)}
            style={styles.cancelButton}
          >
            Cancel
          </Button>
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
    marginTop: 10,
    width: '100%',
  },
  resultTitle: {
    marginBottom: 15,
    textAlign: 'center',
  },
  editCard: {
    width: '100%',
    marginBottom: 20,
    elevation: 4,
  },
  input: {
    marginBottom: 12,
    backgroundColor: 'transparent',
  },
  saveButton: {
    marginBottom: 10,
    backgroundColor: '#4CAF50',
  },
  cancelButton: {
    borderColor: '#f44336',
  },
});