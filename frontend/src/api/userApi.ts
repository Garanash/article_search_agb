import { User } from '../context/AuthContext';

const API_BASE_URL = "";

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

export const getUserProfile = async (authToken?: string): Promise<User> => {
  const token = authToken || getToken();
  if (!token) {
    throw new Error('No authentication token');
  }

  console.log('getUserProfile called with token:', token ? 'present' : 'missing');
  
  const response = await fetch(`${API_BASE_URL}/api/users/profile`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  console.log('getUserProfile response status:', response.status);

  if (!response.ok) {
    const errorText = await response.text();
    console.error('getUserProfile error response:', errorText);
    throw new Error(`Failed to get user profile: ${response.status}`);
  }

  const userData = await response.json();
  console.log('getUserProfile success:', userData);
  return userData;
};

// Загрузка аватара пользователя (заглушка, если нет backend endpoint)
export const uploadUserAvatar = async (file: File): Promise<string> => {
  const token = getToken();
  if (!token) throw new Error('No authentication token');
  const formData = new FormData();
  formData.append('file', file);
  const response = await fetch(`${API_BASE_URL}/api/users/avatar`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    body: formData
  });
  if (!response.ok) {
    throw new Error('Ошибка загрузки аватара');
  }
  const data = await response.json();
  return data.avatar_url;
}; 