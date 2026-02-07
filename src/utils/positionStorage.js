import { validatePositionData } from './positionSchema';

const STORAGE_KEY = 'cryptoBot_positions';

const getStorage = () => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error reading from localStorage:', error);
    return [];
  }
};

const setStorage = (positions) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(positions));
    return true;
  } catch (error) {
    console.error('Error writing to localStorage:', error);
    if (error.name === 'QuotaExceededError') {
      console.error('LocalStorage quota exceeded!');
    }
    return false;
  }
};

export const savePosition = (position) => {
  try {
    const { isValid, errors } = validatePositionData(position);
    if (!isValid) {
      console.error('Invalid position data:', errors);
      throw new Error(`Invalid position: ${errors.join(', ')}`);
    }

    const positions = getStorage();
    const existingIndex = positions.findIndex(p => p.id === position.id);
    
    if (existingIndex >= 0) {
      positions[existingIndex] = { ...positions[existingIndex], ...position, updatedAt: Date.now() };
    } else {
      positions.push({ ...position, createdAt: Date.now(), updatedAt: Date.now() });
    }

    return setStorage(positions);
  } catch (error) {
    console.error('savePosition failed:', error);
    throw error;
  }
};

export const loadAllPositions = () => {
  return getStorage();
};

export const getPositionById = (positionId) => {
  const positions = getStorage();
  return positions.find(p => p.id === positionId) || null;
};

export const updatePosition = (positionId, updates) => {
  const positions = getStorage();
  const index = positions.findIndex(p => p.id === positionId);
  
  if (index === -1) {
    throw new Error(`Position with ID ${positionId} not found`);
  }

  positions[index] = { ...positions[index], ...updates, updatedAt: Date.now() };
  setStorage(positions);
  return positions[index];
};

export const deletePosition = (positionId) => {
  const positions = getStorage();
  const filtered = positions.filter(p => p.id !== positionId);
  
  if (filtered.length === positions.length) {
    return false; // Nothing deleted
  }
  
  return setStorage(filtered);
};

export const getPositionsByBotId = (botId) => {
  const positions = getStorage();
  return positions.filter(p => p.botId === botId);
};

export const getPositionsByStrategy = (strategyType) => {
  const positions = getStorage();
  return positions.filter(p => p.strategyType === strategyType);
};

export const clearAllPositions = () => {
  return setStorage([]);
};