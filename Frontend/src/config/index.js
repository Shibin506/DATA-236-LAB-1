// Frontend Configuration
// Centralized configuration for API endpoints and app settings

export const config = {
  // Backend API Configuration
  api: {
    baseURL: import.meta.env.VITE_API_BASE || 'http://localhost:3002/api',
    timeout: 30000,
  },
  
  // Agent AI Configuration
  agent: {
    baseURL: import.meta.env.VITE_AGENT_API_BASE || 'http://localhost:5000/api/v1',
    timeout: 30000,
  },
  
  // Mock Mode
  mock: import.meta.env.VITE_MOCK === 'true',
  
  // Feature Flags
  features: {
    agentAI: true,
    kafkaNotifications: true,
  }
};

// Helper to get backend origin for image URLs
export const getBackendOrigin = () => {
  try {
    return new URL(config.api.baseURL).origin;
  } catch {
    return 'http://localhost:3002';
  }
};

export default config;
