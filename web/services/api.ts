import { Product, Plan, License, LicenseStatus, LogEvent, ValidationResponse } from '../types';
import { auth } from './firebase';

const API_BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? 'https://licenses-web--license-513ef.europe-west4.hosted.app' : 'http://localhost:3001');

// Module-level state for dev login (set by AuthContext)
let isDevLoginActive = false;

// Function to set dev login state (called from AuthContext)
export const setDevLoginState = (isDev: boolean) => {
  isDevLoginActive = isDev;
};

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

async function fetchApi<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  // Get the current user's ID token if they are logged in (and not in dev login mode)
  let token: string | undefined;
  if (auth?.currentUser && !isDevLoginActive) {
    try {
      token = await auth.currentUser.getIdToken();
    } catch (error) {
      console.error('Error getting ID token:', error);
    }
  }
  
  const headers: Record<string, string> = {
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...(isDevLoginActive ? { 'X-Dev-Login': 'true' } : {}),
    ...options?.headers,
  };

  if (options?.body) {
    headers['Content-Type'] = 'application/json';
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    // Handle 401 Unauthorized with token refresh (reactive refresh on expiration)
    if (response.status === 401 && auth?.currentUser && !isDevLoginActive) {
      try {
        // Force token refresh
        const newToken = await auth.currentUser.getIdToken(true);
        
        // Retry the original request with new token
        const retryHeaders: Record<string, string> = {
          'Authorization': `Bearer ${newToken}`,
          ...options?.headers,
        };
        
        if (options?.body) {
          retryHeaders['Content-Type'] = 'application/json';
        }
        
        const retryResponse = await fetch(url, {
          ...options,
          headers: retryHeaders,
        });
        
        if (!retryResponse.ok) {
          const error = await retryResponse.json().catch(() => ({ error: retryResponse.statusText }));
          throw new ApiError(retryResponse.status, error.error || `HTTP ${retryResponse.status}`);
        }
        
        // Handle 204 No Content
        if (retryResponse.status === 204) {
          return undefined as T;
        }
        
        return await retryResponse.json();
      } catch (refreshError) {
        // Token refresh failed - redirect to login
        if (refreshError instanceof ApiError && refreshError.status === 401) {
          // User needs to re-authenticate
          window.location.href = '/login';
          throw new Error('Authentication required. Please log in again.');
        }
        throw refreshError;
      }
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: response.statusText }));
      
      // Provide user-friendly error messages for authentication failures
      if (response.status === 401) {
        if (!auth?.currentUser && !isDevLoginActive) {
          throw new ApiError(response.status, 'Authentication required. Please log in to continue.');
        }
        throw new ApiError(response.status, 'Authentication failed. Please try again.');
      }
      
      throw new ApiError(response.status, error.error || `HTTP ${response.status}`);
    }

    // Handle 204 No Content
    if (response.status === 204) {
      return undefined as T;
    }

    return await response.json();
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new Error(`Network error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export const api = {
  products: {
    getAll: async (): Promise<Product[]> => {
      return fetchApi<Product[]>('/api/products');
    },
    add: async (item: Omit<Product, 'id'>): Promise<Product> => {
      return fetchApi<Product>('/api/products', {
        method: 'POST',
        body: JSON.stringify(item),
      });
    },
    delete: async (id: string): Promise<void> => {
      return fetchApi<void>(`/api/products/${id}`, {
        method: 'DELETE',
      });
    },
  },
  plans: {
    getAll: async (): Promise<Plan[]> => {
      return fetchApi<Plan[]>('/api/plans');
    },
    add: async (item: Omit<Plan, 'id'>): Promise<Plan> => {
      return fetchApi<Plan>('/api/plans', {
        method: 'POST',
        body: JSON.stringify(item),
      });
    },
    delete: async (id: string): Promise<void> => {
      return fetchApi<void>(`/api/plans/${id}`, {
        method: 'DELETE',
      });
    },
  },
  licenses: {
    getAll: async (): Promise<License[]> => {
      return fetchApi<License[]>('/api/licenses');
    },
    getByKey: async (key: string): Promise<License | undefined> => {
      try {
        return await fetchApi<License>(`/api/licenses/key/${key}`);
      } catch (error) {
        if (error instanceof ApiError && error.status === 404) {
          return undefined;
        }
        throw error;
      }
    },
    add: async (item: Omit<License, 'id' | 'key' | 'status' | 'activations' | 'issuedAt' | 'expiresAt'>): Promise<License> => {
      return fetchApi<License>('/api/licenses', {
        method: 'POST',
        body: JSON.stringify(item),
      });
    },
    renew: async (id: string): Promise<void> => {
      return fetchApi<void>(`/api/licenses/${id}/renew`, {
        method: 'POST',
      });
    },
    cancel: async (id: string): Promise<void> => {
      return fetchApi<void>(`/api/licenses/${id}/cancel`, {
        method: 'POST',
      });
    },
    topup: async (id: string, amount: number): Promise<{
      success: boolean;
      license: {
        id: string;
        currentUsageCount: number;
        totalUsageCount: number;
      };
    }> => {
      return fetchApi(`/api/licenses/${id}/topup`, {
        method: 'POST',
        body: JSON.stringify({ amount }),
      });
    },
  },
  logs: {
    getAll: async (limit?: number): Promise<LogEvent[]> => {
      const query = limit ? `?limit=${limit}` : '';
      return fetchApi<LogEvent[]>(`/api/logs${query}`);
    },
  },
  validate: async (key: string, deviceId: string): Promise<ValidationResponse> => {
    return fetchApi<ValidationResponse>('/api/validate', {
      method: 'POST',
      body: JSON.stringify({ key, deviceId }),
    });
  },
};

