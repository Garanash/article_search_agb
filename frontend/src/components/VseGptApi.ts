// Модуль для работы с API VseGPT
// Все функции асинхронные, возвращают данные или выбрасывают ошибку

const API_URL = '/api/chat';

export async function getChats(token: string) {
  const res = await fetch(`${API_URL}/sessions`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Ошибка получения списка чатов');
  return await res.json();
}

export async function createChat(token: string, params: any) {
  const res = await fetch(`${API_URL}/sessions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(params),
  });
  if (!res.ok) throw new Error('Ошибка создания чата');
  return await res.json();
}

export async function getChatHistory(token: string, session_id: string) {
  const res = await fetch(`${API_URL}/history/${session_id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Ошибка получения истории чата');
  return await res.json();
}

export async function sendMessage(token: string, params: any) {
  const res = await fetch(`${API_URL}/completions`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json', 
      Authorization: `Bearer ${token}`,
      'session_id': params.session_id || ''
    },
    body: JSON.stringify(params),
  });
  if (!res.ok) throw new Error('Ошибка отправки сообщения');
  return await res.json();
}

export async function deleteChat(token: string, session_id: string) {
  const res = await fetch(`${API_URL}/sessions/${session_id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Ошибка удаления чата');
  return true;
}

export async function updateChat(token: string, session_id: string, params: any) {
  const res = await fetch(`${API_URL}/sessions/${session_id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(params),
  });
  if (!res.ok) throw new Error('Ошибка обновления чата');
  return await res.json();
}

export async function getAvailableModels(token: string) {
  const res = await fetch(`${API_URL}/models`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Ошибка получения списка моделей');
  return await res.json();
}

export async function getBalance(token: string) {
  const res = await fetch(`${API_URL}/balance`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Ошибка получения баланса');
  return await res.json();
} 