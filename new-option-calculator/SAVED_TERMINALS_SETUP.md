# Saved Terminals Feature - Setup Guide

## Overview
The Saved Terminals feature allows users to save their complete terminal workspace (layout, components, calculations, and inputs) and load them later from the dashboard.

## What's Been Implemented

### Backend (Node.js/Express)
1. **Database Model** (`models/Terminal.js`)
   - Stores terminal layout, calculation results, input data
   - User-specific terminals with authentication
   - Includes ticker and option type metadata

2. **API Routes** (`routes/terminals.js`)
   - `GET /api/terminals` - Get all user's terminals
   - `GET /api/terminals/:id` - Get specific terminal
   - `POST /api/terminals` - Create new terminal
   - `PUT /api/terminals/:id` - Update existing terminal
   - `DELETE /api/terminals/:id` - Delete terminal
   - All routes protected with JWT authentication

### Frontend (SvelteKit)
1. **Save Terminal Modal** (`lib/components/SaveTerminalModal.svelte`)
   - Beautiful modal UI for saving terminals
   - Name and description fields
   - Mobile-responsive design

2. **Terminal Page Updates** (`routes/terminal/+page.svelte`)
   - "Save Terminal" button (desktop and mobile)
   - Auto-load terminal from URL parameter (`?id=xxx`)
   - Save functionality (create new or update existing)
   - Preserves all terminal state

3. **Dashboard Updates** (`routes/dashboard/+page.svelte`)
   - Fetches and displays real saved terminals
   - Loading state while fetching
   - Empty state when no terminals saved
   - Click to load terminal
   - Delete button with confirmation
   - Shows terminal metadata (name, ticker, date)

## Environment Variables

### Backend (.env)
```bash
# MongoDB connection
MONGODB_URI=your_mongodb_connection_string

# JWT secret for authentication
JWT_SECRET=your_secret_key_here

# Port (optional, defaults to 5001)
PORT=5001
```

### Frontend (.env)
```bash
# API URL (optional, defaults to http://localhost:5001)
VITE_API_URL=http://localhost:5001

# For production:
# VITE_API_URL=https://your-backend-url.com
```

## How to Use

### For Users:
1. **Save a Terminal:**
   - Open the terminal and set up your workspace
   - Add components, run calculations
   - Click "Save Terminal" button
   - Enter a name and optional description
   - Click "Save Terminal" in the modal

2. **Load a Terminal:**
   - Go to Dashboard
   - Click on any saved terminal in the "Saved Terminals" section
   - Terminal will load with all components, layout, and data

3. **Delete a Terminal:**
   - Go to Dashboard
   - Click the trash icon on any saved terminal
   - Confirm deletion

### For Developers:

#### Starting the Backend:
```bash
cd new-option-calculator/backend
npm install
# Create .env file with MONGODB_URI and JWT_SECRET
npm start
```

#### Starting the Frontend:
```bash
cd new-option-calculator/frontend
npm install
# Create .env file with VITE_API_URL (optional)
npm run dev
```

## Mobile Responsiveness

✅ **Fully Mobile Responsive:**
- Save button optimized for mobile (compact text)
- Modal adapts to small screens
- Dashboard terminal list stacks properly
- Delete buttons are touch-friendly
- All interactions work on mobile devices

## Features

### Save Terminal
- Saves complete terminal state including:
  - Layout configuration (component positions and sizes)
  - All component configurations
  - Calculation results
  - Input data (ticker, prices, dates, etc.)
  - Option type (call/put)

### Load Terminal
- Restores exact terminal state
- Maintains all calculations
- Preserves component layout
- Auto-expands components if needed

### Update Terminal
- If you load a saved terminal and modify it, saving again will update the existing terminal
- Original terminal preserved until you save

### Delete Terminal
- Confirmation dialog prevents accidental deletion
- Immediate removal from dashboard
- Cannot be undone

## Security
- All terminal operations require authentication
- Users can only access their own terminals
- JWT token validation on all API endpoints
- MongoDB queries scoped to user ID

## Database Schema
```javascript
{
  userId: ObjectId,          // Reference to User
  name: String,              // Terminal name
  description: String,       // Optional description
  layout: [{                 // Component layout
    id: String,
    component: String,
    x: Number,
    y: Number,
    w: Number,
    h: Number,
    config: Mixed
  }],
  calculationResults: Mixed, // Calculation data
  inputData: Mixed,          // Input form data
  ticker: String,            // Stock ticker
  optionType: String,        // 'call' or 'put'
  createdAt: Date,
  updatedAt: Date
}
```

## Future Enhancements (Optional)
- Share terminals with other users
- Terminal templates
- Duplicate terminal functionality
- Export terminal to PDF/JSON
- Terminal search and filtering
- Terminal tags/categories
- Terminal favorites/pinning

## Testing Checklist
- [x] Save new terminal
- [x] Load saved terminal
- [x] Update existing terminal
- [x] Delete terminal
- [x] Mobile responsive save modal
- [x] Mobile responsive dashboard
- [x] Error handling (network failures, auth errors)
- [x] Empty states (no terminals saved)
- [x] Loading states
- [x] Delete confirmation dialog

## Notes
- Terminals are saved immediately upon clicking "Save Terminal"
- No automatic saving - user must explicitly save
- Terminal IDs are MongoDB ObjectIds
- Date formatting uses locale-based formatting
- All API calls include proper error handling

