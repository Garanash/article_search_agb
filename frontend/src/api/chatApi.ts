// API функции для работы с чатом и ботами

export interface Message {
  id: string;
  content: string;
  sender: 'user' | 'bot';
  timestamp: string;
  botId: string;
  userId: string;
}

export interface Bot {
  id: string;
  name: string;
  description: string;
  avatar: string;
  role: string;
  isOnline: boolean;
  lastMessage?: string;
  unreadCount?: number;
}

export interface ChatSession {
  id: string;
  userId: string;
  botId: string;
  createdAt: string;
  lastActivity: string;
  messageCount: number;
}

// Получить список доступных ботов для пользователя
export const getAvailableBots = async (token: string, userRole: string): Promise<Bot[]> => {
  const response = await fetch(`/api/chat/bots?role=${userRole}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!response.ok) {
    throw new Error('Ошибка загрузки ботов');
  }
  return response.json();
};

// Получить историю сообщений с ботом
export const getChatHistory = async (token: string, botId: string): Promise<Message[]> => {
  const response = await fetch(`http://localhost:8000/chat/history/${botId}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!response.ok) {
    throw new Error('Ошибка загрузки истории чата');
  }
  return response.json();
};

// Отправить сообщение боту
export const sendMessage = async (token: string, botId: string, content: string): Promise<Message> => {
  const response = await fetch('http://localhost:8000/chat/send', {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ botId, content })
  });
  if (!response.ok) {
    throw new Error('Ошибка отправки сообщения');
  }
  return response.json();
};

// Получить активные чат-сессии пользователя
export const getChatSessions = async (token: string): Promise<ChatSession[]> => {
  const response = await fetch('http://localhost:8000/chat/sessions', {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!response.ok) {
    throw new Error('Ошибка загрузки сессий чата');
  }
  return response.json();
};

// Создать новую чат-сессию с ботом
export const createChatSession = async (token: string, botId: string): Promise<ChatSession> => {
  const response = await fetch('/api/chat/sessions', {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ botId })
  });
  if (!response.ok) {
    throw new Error('Ошибка создания сессии чата');
  }
  return response.json();
};

// Удалить чат-сессию
export const deleteChatSession = async (token: string, sessionId: string): Promise<void> => {
  const response = await fetch(`http://localhost:8000/chat/sessions/${sessionId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!response.ok) {
    throw new Error('Ошибка удаления сессии чата');
  }
};

// Получить статус бота (онлайн/оффлайн)
export const getBotStatus = async (token: string, botId: string): Promise<{ isOnline: boolean }> => {
  const response = await fetch(`http://localhost:8000/chat/bots/${botId}/status`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!response.ok) {
    throw new Error('Ошибка получения статуса бота');
  }
  return response.json();
};

// Подписаться на WebSocket для получения сообщений в реальном времени
export const subscribeToChat = (token: string, botId: string, onMessage: (message: Message) => void): WebSocket => {
  const ws = new WebSocket(`ws://localhost:8000/chat/ws?token=${token}&botId=${botId}`);
  
  ws.onmessage = (event) => {
    try {
      const message: Message = JSON.parse(event.data);
      onMessage(message);
    } catch (error) {
      console.error('Ошибка парсинга сообщения WebSocket:', error);
    }
  };
  
  ws.onerror = (error) => {
    console.error('WebSocket ошибка:', error);
  };
  
  return ws;
};

// Получить непрочитанные сообщения
export const getUnreadMessages = async (token: string): Promise<{ [botId: string]: number }> => {
  const response = await fetch('/api/chat/unread', {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!response.ok) {
    throw new Error('Ошибка загрузки непрочитанных сообщений');
  }
  return response.json();
};

// Отметить сообщения как прочитанные
export const markMessagesAsRead = async (token: string, botId: string): Promise<void> => {
  const response = await fetch(`http://localhost:8000/chat/read/${botId}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!response.ok) {
    throw new Error('Ошибка отметки сообщений как прочитанных');
  }
}; 