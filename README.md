# KM TEX Backend

This is the backend service for KM TEX Dashboard, handling printer operations and other backend functionalities.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file in the root directory with the following variables:
```
PORT=3001
```

3. Start the development server:
```bash
npm run dev
```

4. For production:
```bash
npm start
```

## API Endpoints

- `POST /print-receipt`: Print a receipt
- `GET /health`: Check printer connection status

## Dependencies

- Express.js
- ESC/POS printer library
- USB adapter for printer
- CORS middleware

## Development

The server runs on port 3001 by default. Make sure to update the frontend configuration to point to the correct backend URL when deploying. 