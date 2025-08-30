import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';

export async function exportReceiptsToCSV(receipts) {
  if (!receipts || receipts.length === 0) return null;
  const headers = ['Merchant', 'Date', 'Total', 'Category', 'Receipt ID'];
  const rows = receipts.map(r => [
    r.merchant_name || (r.fields && r.fields.merchant) || '',
    r.purchase_date || (r.fields && r.fields.date) || '',
    r.fields && r.fields.total ? r.fields.total : '',
    r.category || (r.fields && r.fields.category) || '',
    r._id || r.receipt_id || '',
  ]);
  const csv = [headers, ...rows].map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}` ).join(',')).join('\n');
  const fileUri = FileSystem.cacheDirectory + 'receipts_export.csv';
  await FileSystem.writeAsStringAsync(fileUri, csv, { encoding: FileSystem.EncodingType.UTF8 });
  return fileUri;
}

export async function shareCSV(fileUri) {
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(fileUri, { mimeType: 'text/csv' });
  } else {
    alert('Sharing is not available on this device.');
  }
}
