# Position Management System Guide

## Overview
The Position Management System is a centralized architecture for handling all trading positions across the CryptoBot application. It replaces scattered localStorage calls and mock data with a robust, react-hook-based state management system that integrates with real-time price updates.

## Architecture
The system is built on four layers:
1.  **Storage Layer**: `src/utils/positionStorage.js` - Handles persistent data in `localStorage`.
2.  **Logic Layer**: `src/utils/positionCalculations.js` & `src/utils/positionSchema.js` - Handles math and data validation.
3.  **State Layer**: `src/hooks/usePositionManager.js` & `src/context/PositionContext.jsx` - Manages React state and global access.
4.  **Update Layer**: `src/utils/positionUpdateManager.js` - Connects WebSocket data to state updates.

## Integration Guide

### 1. Accessing Positions
To access position data in any component, use the `usePositions` hook: