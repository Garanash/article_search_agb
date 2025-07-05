import { User } from '../context/AuthContext';

const API_BASE_URL = 'http://localhost:8000';

// Получаем токен из localStorage
const getToken = (): string | null => {
  return localStorage.getItem('token');
};

export const updateUserProfile = async (userData: Partial<User>): Promise<User> => {
  const token = getToken();
  if (!token) {
    throw new Error('No authentication token');
  }

  const response = await fetch(`${API_BASE_URL}/api/users/profile`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(userData)
  });

  if (!response.ok) {
    throw new Error('Failed to update user profile');
  }

  return response.json();
};

export const getUserProfile = async (): Promise<User> => {
  const token = getToken();
  if (!token) {
    throw new Error('No authentication token');
  }

  const response = await fetch(`${API_BASE_URL}/api/users/profile`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) {
    throw new Error('Failed to get user profile');
  }

  return response.json();
}; 