import { Platform } from 'react-native';

export const API_URL = Platform.OS === 'web' 
  ? 'http://localhost:8000' 
  : 'http://10.36.129.171:8000';
