import React from 'react';
import { StyleSheet, Image, ScrollView, View } from 'react-native';
import { TextInput, Card, Button, IconButton, Surface, ProgressBar, Chip } from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';
import { API_URL } from '@/constants/Config';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

import { ThemedText } from '@/components/themed-text';

const CATEGORIES = ['Groceries', 'Dining', 'Shopping', 'Transport', 'Utilities', 'Healthcare', 'Entertainment', 'Other'];

export default function UploadScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const isDark = colorScheme === 'dark';
  const [image, setImage] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [result, setResult] = React.useState<any>(null);
  const [editingFields, setEditingFields] = React.useState<any>(null);
  const [saving, setSaving] = React.useState(false);
  const [selectedCategory, setSelectedCategory] = React.useState<string>('Other');

  const processReceipt = async () => {
    if (!image) return;

    try {
      setLoading(true);
      const formData = new FormData();
      
      if (typeof window !== 'undefined' && image.startsWith('blob:')) {
        const response = await fetch(image);
        const blob = await response.blob();
        formData.append('image', blob, 'receipt.jpg');
      } else {
        const imageDetails = {
          uri: image,
          type: 'image/jpeg',
          name: 'receipt.jpg'
        };
        formData.append('image', imageDetails as any);
      }

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
        body: JSON.stringify({ fields: { ...editingFields, category: selectedCategory } }),
      });

      if (!response.ok) {
        throw new Error('Failed to save changes');
      }

      alert('Receipt saved successfully!');
      setResult(null);
      setImage(null);
      setEditingFields(null);
      setSelectedCategory('Other');
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
        allowsEditing: false,
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

  const takePhoto = async () => {
    try {
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
      
      if (!permissionResult.granted) {
        alert('Permission to access camera is required!');
        return;
      }

      const cameraResult = await ImagePicker.launchCameraAsync({
        quality: 1,
        allowsEditing: false,
      });

      if (!cameraResult.canceled && cameraResult.assets && cameraResult.assets.length > 0) {
        setImage(cameraResult.assets[0].uri);
        setResult(null);
        setEditingFields(null);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
    }
  };

  const updateField = (key: string, value: string) => {
    setEditingFields({
      ...editingFields,
      [key]: key === 'total' ? parseFloat(value) || 0 : value
    });
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.contentContainer}
    >
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.headerGradientStart }]}>
        <ThemedText style={styles.headerTitle}>Scan Receipt</ThemedText>
        <ThemedText style={styles.headerSubtitle}>
          Take a photo or choose from gallery
        </ThemedText>
      </View>

      {!result ? (
        <View style={styles.uploadSection}>
          {image ? (
            <Surface style={[styles.imageContainer, { backgroundColor: isDark ? colors.cardBackground : '#fff' }]} elevation={3}>
              <Image source={{ uri: image }} style={styles.image} resizeMode="contain" />
              <View style={styles.imageActions}>
                <Button
                  mode="text"
                  icon="close"
                  onPress={() => setImage(null)}
                  textColor={colors.error}
                  compact
                >
                  Remove
                </Button>
                <Button
                  mode="text"
                  icon="image-edit"
                  onPress={pickImage}
                  textColor={colors.tint}
                  compact
                >
                  Change
                </Button>
              </View>
            </Surface>
          ) : (
            <Surface style={[styles.uploadArea, { backgroundColor: isDark ? colors.cardBackground : '#fff', borderColor: colors.tint + '40' }]} elevation={0}>
              <IconButton icon="cloud-upload-outline" size={48} iconColor={colors.tint} />
              <ThemedText style={[styles.uploadTitle, { color: colors.text }]}>Upload Receipt</ThemedText>
              <ThemedText style={[styles.uploadSubtext, { color: colors.textSecondary }]}>
                Capture or select a receipt image to extract data
              </ThemedText>
              <View style={styles.uploadButtons}>
                <Button
                  mode="contained"
                  icon="camera"
                  onPress={takePhoto}
                  style={[styles.uploadBtn, { backgroundColor: colors.tint }]}
                  contentStyle={styles.uploadBtnContent}
                  labelStyle={styles.uploadBtnLabel}
                >
                  Camera
                </Button>
                <Button
                  mode="outlined"
                  icon="image"
                  onPress={pickImage}
                  style={styles.uploadBtn}
                  contentStyle={styles.uploadBtnContent}
                  labelStyle={styles.uploadBtnLabel}
                  textColor={colors.tint}
                >
                  Gallery
                </Button>
              </View>
            </Surface>
          )}

          {image && (
            <>
              {loading && (
                <View style={styles.progressSection}>
                  <ThemedText style={[styles.progressText, { color: colors.textSecondary }]}>
                    Analyzing receipt...
                  </ThemedText>
                  <ProgressBar indeterminate color={colors.tint} style={styles.progressBar} />
                </View>
              )}
              <Button
                mode="contained"
                onPress={processReceipt}
                style={[styles.analyzeButton, { backgroundColor: colors.success }]}
                contentStyle={styles.analyzeButtonContent}
                icon="text-recognition"
                loading={loading}
                disabled={loading}
                labelStyle={styles.analyzeButtonLabel}
              >
                {loading ? 'Processing...' : 'Analyze Receipt'}
              </Button>
            </>
          )}
        </View>
      ) : (
        <View style={styles.resultSection}>
          <View style={styles.resultHeader}>
            <IconButton icon="check-circle" size={32} iconColor={colors.success} />
            <ThemedText style={[styles.resultTitle, { color: colors.text }]}>Review & Edit</ThemedText>
          </View>

          <Surface style={[styles.editCard, { backgroundColor: isDark ? colors.cardBackground : '#fff' }]} elevation={2}>
            <Card.Content>
              <TextInput
                label="Merchant / Store"
                value={editingFields?.merchant}
                onChangeText={(text) => updateField('merchant', text)}
                style={[styles.input, { backgroundColor: isDark ? colors.background : '#F8FAFC' }]}
                mode="outlined"
                outlineColor={colors.cardBorder}
                activeOutlineColor={colors.tint}
                left={<TextInput.Icon icon="store" />}
              />
              <TextInput
                label="Date"
                value={editingFields?.date}
                onChangeText={(text) => updateField('date', text)}
                style={[styles.input, { backgroundColor: isDark ? colors.background : '#F8FAFC' }]}
                mode="outlined"
                outlineColor={colors.cardBorder}
                activeOutlineColor={colors.tint}
                left={<TextInput.Icon icon="calendar" />}
              />
              <TextInput
                label="Total Amount (₹)"
                value={String(editingFields?.total)}
                onChangeText={(text) => updateField('total', text)}
                keyboardType="numeric"
                style={[styles.input, { backgroundColor: isDark ? colors.background : '#F8FAFC' }]}
                mode="outlined"
                outlineColor={colors.cardBorder}
                activeOutlineColor={colors.tint}
                left={<TextInput.Icon icon="currency-inr" />}
              />
            </Card.Content>
          </Surface>

          {/* Category Selection */}
          <ThemedText style={[styles.categoryTitle, { color: colors.text }]}>Category</ThemedText>
          <View style={styles.categoryGrid}>
            {CATEGORIES.map((cat) => (
              <Chip
                key={cat}
                selected={selectedCategory === cat}
                onPress={() => setSelectedCategory(cat)}
                style={[
                  styles.categoryChip,
                  selectedCategory === cat && { backgroundColor: colors.tint + '20' },
                ]}
                selectedColor={colors.tint}
                textStyle={styles.categoryChipText}
                showSelectedOverlay
              >
                {cat}
              </Chip>
            ))}
          </View>

          <View style={styles.resultActions}>
            <Button
              mode="contained"
              onPress={saveChanges}
              loading={saving}
              disabled={saving}
              style={[styles.saveButton, { backgroundColor: colors.success }]}
              contentStyle={styles.actionButtonContent}
              icon="check"
            >
              Save Receipt
            </Button>
            <Button
              mode="outlined"
              onPress={() => { setResult(null); setImage(null); setEditingFields(null); }}
              style={[styles.discardButton, { borderColor: colors.error }]}
              textColor={colors.error}
              contentStyle={styles.actionButtonContent}
              icon="delete-outline"
            >
              Discard
            </Button>
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 32,
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
  uploadSection: {
    padding: 20,
  },
  uploadArea: {
    borderRadius: 20,
    borderWidth: 2,
    borderStyle: 'dashed',
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  uploadTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 8,
  },
  uploadSubtext: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  uploadButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  uploadBtn: {
    borderRadius: 12,
  },
  uploadBtnContent: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  uploadBtnLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  imageContainer: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    aspectRatio: 3 / 4,
    borderRadius: 16,
  },
  imageActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  progressSection: {
    marginTop: 16,
    alignItems: 'center',
  },
  progressText: {
    fontSize: 14,
    marginBottom: 8,
  },
  progressBar: {
    width: '100%',
    borderRadius: 4,
    height: 4,
  },
  analyzeButton: {
    marginTop: 16,
    borderRadius: 14,
  },
  analyzeButtonContent: {
    paddingVertical: 8,
  },
  analyzeButtonLabel: {
    fontSize: 16,
    fontWeight: '700',
  },
  resultSection: {
    padding: 20,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  resultTitle: {
    fontSize: 22,
    fontWeight: '700',
  },
  editCard: {
    borderRadius: 16,
    paddingVertical: 8,
  },
  input: {
    marginBottom: 12,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 20,
    marginBottom: 12,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 24,
  },
  categoryChip: {
    borderRadius: 20,
  },
  categoryChipText: {
    fontSize: 13,
  },
  resultActions: {
    gap: 12,
  },
  saveButton: {
    borderRadius: 14,
  },
  discardButton: {
    borderRadius: 14,
  },
  actionButtonContent: {
    paddingVertical: 6,
  },
});