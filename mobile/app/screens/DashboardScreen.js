import React, { useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Card, Button, Text, ActivityIndicator } from 'react-native-paper';

export default function DashboardScreen() {
  const [receipts, setReceipts] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchReceipts = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:8000/receipts');
      const data = await response.json();
      setReceipts(data);
    } catch (e) {
      setReceipts([]);
    }
    setLoading(false);
  };

  useEffect(() => { fetchReceipts(); }, []);

  const handleDelete = async (id) => {
    await fetch(`http://localhost:8000/receipts/${id}`, { method: 'DELETE' });
    fetchReceipts();
  };

  if (loading) return <ActivityIndicator animating={true} style={{ marginTop: 40 }} />;

  return (
    <ScrollView contentContainerStyle={{ padding: 16 }}>
      <Text variant="headlineSmall" style={{ marginBottom: 10 }}>Receipts</Text>
      {receipts.length === 0 ? (
        <Text>No receipts found.</Text>
      ) : (
        receipts.map(r => (
          <Card key={r._id} style={{ marginBottom: 12 }}>
            <Card.Title title={r.fields?.merchant || 'Unknown'} subtitle={r.fields?.date || ''} />
            <Card.Content>
              <Text>Total: {r.fields?.total || 'Unknown'}</Text>
              <Text>OCR: {r.ocr_text?.slice(0, 100) + '...'}</Text>
            </Card.Content>
            <Card.Actions>
              <Button onPress={() => handleDelete(r._id)} mode="contained" buttonColor="#d9534f">Delete</Button>
            </Card.Actions>
          </Card>
        ))
      )}
    </ScrollView>
  );
}