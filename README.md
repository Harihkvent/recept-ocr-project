# Receipt OCR Project

A mobile application for scanning and processing receipts using OCR, built with React Native (Expo) and FastAPI.

## Prerequisites

### Backend Requirements
- Python 3.10+ 
- MongoDB installed and running on default port (27017)
- Tesseract OCR installed on your system
  - Windows: Install from [UB-Mannheim Tesseract](https://github.com/UB-Mannheim/tesseract/wiki)
  - Add Tesseract to your system PATH

### Mobile Requirements
- Node.js (Latest LTS version)
- npm/yarn
- Expo Go app on your mobile device (for testing)

## Setup Instructions

### Backend (FastAPI + MongoDB)

1. Navigate to backend directory:
   ```powershell
   cd backend
   ```

2. Create and activate virtual environment:
   ```powershell
   python -m venv venv
   .\venv\Scripts\Activate.ps1
   ```

3. Install dependencies:
   ```powershell
   pip install -r requirements.txt
   python -m spacy download en_core_web_sm
   ```

4. Ensure MongoDB is running on your system
   - Default connection URL: mongodb://localhost:27017
   - Database name: receiptocr

5. Start the FastAPI server:
   ```powershell
   uvicorn main:app --host 0.0.0.0 --port 8000 --reload
   ```
   Server will be available at http://localhost:8000

### Mobile App (React Native + Expo)

1. Navigate to mobile directory:
   ```powershell
   cd mobile
   ```

2. Install dependencies:
   ```powershell
   npm install
   ```

3. Start the Expo development server:
   ```powershell
   npx expo start
   ```

4. To run the app:
   - Scan the QR code with Expo Go (Android) or Camera app (iOS)
   - Press 'a' for Android emulator
   - Press 'w' for web browser

## API Endpoints

- `POST /receipts` - Upload and process a receipt image
- `GET /receipts` - List all processed receipts
- `DELETE /receipts/{id}` - Delete a specific receipt

## Features

- Image capture/upload from device
- OCR text extraction using Tesseract
- Named Entity Recognition for merchant, date, and total
- MongoDB storage for receipt data
- Mobile interface for viewing and managing receipts

## Configuration

### Backend
- **Environment Variables**:
  - `MONGO_URL`: Connection string for MongoDB (default: `mongodb://localhost:27017`)
- The backend uses FastAPI on port 8000.

### Mobile
- API URL is configured to use host machine's IP (default: http://10.46.5.252:8000)
- Update the API URL in mobile app screens if needed:
  - `mobile/app/(tabs)/upload.tsx`
  - `mobile/app/(tabs)/dashboard.tsx`

## Troubleshooting

### Backend
- Ensure Tesseract is properly installed and accessible from PATH
- Verify MongoDB is running and accessible
- Check Python virtual environment is activated

### Mobile
- If using a physical device, ensure it's on the same network as the backend
- For network errors, verify the API URL matches your host machine's IP
- Clear Metro bundler cache if needed: `npx expo start --clear`

## Contributing

We welcome contributions! Here's how you can help:

### Getting Started

1. Fork the repository
2. Create a new branch for your feature:
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. Make your changes
4. Run tests if available
5. Commit your changes:
   ```bash
   git commit -m "Add some feature"
   ```
6. Push to your fork:
   ```bash
   git push origin feature/your-feature-name
   ```
7. Create a Pull Request

### Development Guidelines

#### Backend
- Follow PEP 8 style guide for Python code
- Add docstrings for new functions and classes
- Update requirements.txt if adding new dependencies
- Add appropriate error handling
- Test new endpoints manually or add automated tests

#### Mobile
- Follow ESLint configuration
- Use TypeScript for new components
- Keep components small and focused
- Follow the existing project structure
- Test on both Android and iOS if possible

### Areas for Contribution

1. **Features**
   - User authentication
   - Receipt categories
   - Export functionality
   - Advanced receipt analysis
   - Offline support

2. **Improvements**
   - Better error handling
   - Enhanced OCR accuracy
   - UI/UX enhancements
   - Performance optimizations
   - Additional receipt fields detection

3. **Documentation**
   - API documentation
   - Setup guides for different OS
   - Component documentation
   - Architecture diagrams

### Code Review Process

1. All PRs require review before merging
2. Ensure all existing tests pass
3. Include screenshots for UI changes
4. Update documentation if needed
5. Follow the PR template if provided

## Notes
- For production deployment, configure proper security measures
- Use environment variables for sensitive configuration
- Consider implementing user authentication
- Regular MongoDB backups recommended
