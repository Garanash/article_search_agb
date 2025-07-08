import React, { useState, useRef, useEffect } from 'react';
import { 
  Card, 
  Input, 
  Button, 
  Avatar, 
  Typography, 
  Space, 
  Spin, 
  message, 
  Select, 
  Tooltip,
  Divider,
  Row,
  Col,
  Badge,
  Tag,
  Drawer,
  List,
  Modal,
  Form,
  Upload,
  Tree,
  Dropdown,
  Menu,
  Popconfirm
} from 'antd';
import { 
  SendOutlined, 
  RobotOutlined, 
  UserOutlined, 
  LoadingOutlined,
  SettingOutlined,
  ClearOutlined,
  CopyOutlined,
  DownloadOutlined,
  PlusOutlined,
  FolderOutlined,
  FileOutlined,
  DeleteOutlined,
  EditOutlined,
  SaveOutlined,
  ImportOutlined,
  ExportOutlined,
  MoreOutlined,
  MessageOutlined,
  BookOutlined
} from '@ant-design/icons';
import { useAuth } from '../context/AuthContext';
import ReactMarkdown from 'react-markdown';

const { Text, Title } = Typography;
const { TextArea } = Input;
const { Option } = Select;
const { Dragger } = Upload;

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  reasoning?: string;
  files?: File[];
}

interface ChatDialog {
  id: string;
  name: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
  folderId?: string;
  presetId?: string;
}

interface ChatFolder {
  id: string;
  name: string;
  color?: string;
  createdAt: Date;
}

interface ChatPreset {
  id: string;
  name: string;
  model: string;
  temperature: number;
  maxTokens: number;
  systemPrompt?: string;
  createdAt: Date;
}

interface ChatBotProps {
  onBack?: () => void;
}

const ChatBot: React.FC<ChatBotProps> = ({ onBack }) => {
  const { user } = useAuth();
  const [currentDialog, setCurrentDialog] = useState<ChatDialog | null>(null);
  const [dialogs, setDialogs] = useState<ChatDialog[]>([]);
  const [folders, setFolders] = useState<ChatFolder[]>([]);
  const [presets, setPresets] = useState<ChatPreset[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState('anthropic/claude-3-haiku');
  const [temperature, setTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(3000);
  const [showSettings, setShowSettings] = useState(false);
  const [showDialogs, setShowDialogs] = useState(false);
  const [showPresets, setShowPresets] = useState(false);
  const [balance, setBalance] = useState<any>(null);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [systemPrompt, setSystemPrompt] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [logoLoaded, setLogoLoaded] = useState(true);

  // Доступные модели
  const availableModels = [
    { value: 'anthropic/claude-3-haiku', label: 'Claude 3 Haiku', shortLabel: 'Haiku', description: 'Быстрая и эффективная модель' },
    { value: 'anthropic/claude-3-sonnet', label: 'Claude 3 Sonnet', shortLabel: 'Sonnet', description: 'Сбалансированная модель' },
    { value: 'anthropic/claude-3-opus', label: 'Claude 3 Opus', shortLabel: 'Opus', description: 'Самая мощная модель' },
    { value: 'openai/gpt-4o-mini', label: 'GPT-4o Mini', shortLabel: 'GPT-4o Mini', description: 'Быстрая модель от OpenAI' },
    { value: 'openai/gpt-4o', label: 'GPT-4o', shortLabel: 'GPT-4o', description: 'Мощная модель от OpenAI' },
    { value: 'google/gemini-flash-1.5', label: 'Gemini Flash 1.5', shortLabel: 'Gemini Flash', description: 'Модель от Google' },
    { value: 'meta-llama/llama-3.1-8b-instruct', label: 'Llama 3.1 8B', shortLabel: 'Llama 3.1', description: 'Открытая модель от Meta' },
    // Vision модели для распознавания изображений
    { value: 'vis-google/gemini-flash-1.5', label: 'Gemini Flash Vision', shortLabel: 'Gemini Vision', description: 'Распознавание изображений и OCR' },
    { value: 'vis-google/gemini-pro-vision', label: 'Gemini Pro Vision', shortLabel: 'Gemini Pro Vision', description: 'Продвинутое распознавание изображений' },
    { value: 'vis-openai/gpt-4o', label: 'GPT-4o Vision', shortLabel: 'GPT-4o Vision', description: 'Vision модель от OpenAI' },
    // Модели для генерации изображений
    { value: 'dall-e-3', label: 'DALL-E 3', shortLabel: 'DALL-E 3', description: 'Генерация изображений от OpenAI' },
    { value: 'img2img-google/flash-edit', label: 'Google Flash Edit', shortLabel: 'Flash Edit', description: 'Редактирование изображений' },
    // Модели для работы с аудио
    { value: 'stt-openai/whisper-1', label: 'Whisper STT', shortLabel: 'Whisper', description: 'Распознавание речи' },
    { value: 'tts-openai/tts-1', label: 'OpenAI TTS', shortLabel: 'TTS-1', description: 'Генерация речи' },
    { value: 'tta-stable/stable-audio', label: 'Stable Audio', shortLabel: 'Stable Audio', description: 'Генерация музыки' },
    // Модели для генерации видео
    { value: 'txt2vid-kling/standart', label: 'Kling Video', shortLabel: 'Kling', description: 'Генерация видео из текста' },
    // Модели для конвертации документов
    { value: 'utils/extract-text-1.0', label: 'Extract Text', shortLabel: 'Extract Text', description: 'Извлечение текста из документов' },
    { value: 'utils/pdf-ocr-1.0', label: 'PDF OCR', shortLabel: 'PDF OCR', description: 'OCR для PDF документов' },
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [currentDialog?.messages]);

  // Загружаем данные при монтировании компонента
  useEffect(() => {
    loadBalance();
    loadStoredData();
  }, []);

  // Автоматическая проверка и создание пресетов, если их нет
  useEffect(() => {
    if (presets.length === 0) {
      console.log('⚠️ Пресеты отсутствуют, создаем их автоматически...');
      createDefaultPresets();
    }
  }, [presets.length]);

  const loadBalance = async () => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        console.warn('Токен не найден, пропускаем загрузку баланса');
        return;
      }
      
      const response = await fetch('/api/chat/balance', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const balanceData = await response.json();
        setBalance(balanceData);
      } else if (response.status === 401) {
        console.warn('Ошибка авторизации при загрузке баланса');
        // Не показываем ошибку пользователю, так как это может быть нормально
      } else {
        console.error('Balance error:', response.status, await response.text());
      }
    } catch (error) {
      console.error('Ошибка загрузки баланса:', error);
    }
  };

  const loadStoredData = () => {
    try {
      const storedDialogs = localStorage.getItem('chat_dialogs');
      const storedFolders = localStorage.getItem('chat_folders');
      const storedPresets = localStorage.getItem('chat_presets');
      
      console.log('🔍 Загрузка данных из localStorage:');
      console.log('- storedDialogs:', !!storedDialogs);
      console.log('- storedFolders:', !!storedFolders);
      console.log('- storedPresets:', !!storedPresets);
      
      if (storedDialogs) {
        const parsedDialogs = JSON.parse(storedDialogs);
        // Преобразуем строки дат обратно в объекты Date
        const dialogsWithDates = parsedDialogs.map((dialog: any) => ({
          ...dialog,
          createdAt: new Date(dialog.createdAt),
          updatedAt: new Date(dialog.updatedAt),
          messages: dialog.messages.map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp),
            content: typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content),
            reasoning: typeof msg.reasoning === 'string' ? msg.reasoning : (msg.reasoning ? JSON.stringify(msg.reasoning) : ''),
            files: Array.isArray(msg.files) ? msg.files : []
          }))
        }));
        setDialogs(dialogsWithDates);
        console.log(`✅ Загружено ${dialogsWithDates.length} диалогов`);
      }
      
      if (storedFolders) {
        const parsedFolders = JSON.parse(storedFolders);
        const foldersWithDates = parsedFolders.map((folder: any) => ({
          ...folder,
          createdAt: new Date(folder.createdAt)
        }));
        setFolders(foldersWithDates);
        console.log(`✅ Загружено ${foldersWithDates.length} папок`);
      }
      
      // Проверяем и загружаем пресеты
      let presetsLoaded = false;
      if (storedPresets) {
        try {
          const parsedPresets = JSON.parse(storedPresets);
          if (Array.isArray(parsedPresets) && parsedPresets.length > 0) {
            const presetsWithDates = parsedPresets.map((preset: any) => ({
              ...preset,
              createdAt: new Date(preset.createdAt)
            }));
            setPresets(presetsWithDates);
            console.log(`✅ Загружено ${presetsWithDates.length} пресетов из localStorage`);
            presetsLoaded = true;
          } else {
            console.log('⚠️ Пресеты в localStorage пустые или некорректные');
          }
        } catch (e) {
          console.error('❌ Ошибка парсинга пресетов из localStorage:', e);
        }
      }
      
      // Если пресеты не загружены, создаем их принудительно
      if (!presetsLoaded) {
        console.log('📝 Создаем предустановленные пресеты...');
        createDefaultPresets();
      }
    } catch (error) {
      console.error('❌ Ошибка загрузки данных:', error);
      // Даже при ошибке создаем пресеты
      console.log('📝 Создаем пресеты после ошибки загрузки...');
      createDefaultPresets();
    }
  };

  const createDefaultPresets = () => {
    console.log('🔧 Создание предустановленных пресетов...');
    const defaultPresets: ChatPreset[] = [
      {
        id: '2',
        name: 'Генератор изображений DALL-E',
        model: 'dall-e-3',
        temperature: 0.7,
        maxTokens: 1000,
        systemPrompt: `Ты - специализированный ассистент для генерации изображений с помощью DALL-E 3. Твои задачи:

1. **Генерация изображений**: Создавай детальные и качественные изображения по описанию
2. **Оптимизация промптов**: Помогай пользователям создавать эффективные промпты для лучших результатов
3. **Консультации по стилям**: Рекомендуй художественные стили и техники
4. **Редактирование изображений**: Помогай с редактированием существующих изображений

**Инструкции для работы:**
- Всегда проси пользователя описать, что именно он хочет увидеть
- Предлагай улучшения к промптам для более качественных результатов
- Объясняй, как разные параметры влияют на результат
- Помогай с выбором размера и соотношения сторон изображения

**Параметры генерации:**
- Размеры: 1024x1024, 1792x1024, 1024x1792
- Соотношения сторон: 1:1, 16:9, 9:16
- Стили: фотографический, художественный, мультипликационный

**Формат ответа:**
1. Анализ запроса пользователя
2. Оптимизированный промпт для генерации
3. Рекомендации по параметрам
4. Дополнительные советы по улучшению результата`,
        createdAt: new Date()
      },
      {
        id: '4',
        name: 'Генератор видео Kling',
        model: 'txt2vid-kling/standart',
        temperature: 0.7,
        maxTokens: 2000,
        systemPrompt: `Ты - специализированный ассистент для генерации видео с помощью AI. Твои задачи:

1. **Генерация видео из текста**: Создавай видео по текстовому описанию
2. **Генерация видео из изображений**: Создавай видео на основе загруженных изображений
3. **Оптимизация промптов**: Помогай создавать эффективные описания для видео
4. **Консультации по параметрам**: Рекомендуй настройки для лучших результатов

**Инструкции для работы:**
- Помогай пользователям создавать детальные описания для видео
- Объясняй процесс генерации и ожидания результатов
- Консультируй по выбору соотношения сторон и длительности
- Предлагай улучшения для более качественных результатов

**Поддерживаемые параметры:**
- Соотношения сторон: 16:9, 9:16, 1:1
- Модели: txt2vid-kling/standart, другие видео модели
- Время генерации: 10-30 минут
- Форматы: MP4, MOV

**Процесс генерации:**
1. Отправка запроса на генерацию
2. Получение request_id
3. Периодическая проверка статуса
4. Скачивание готового видео

**Формат ответа:**
1. Анализ запроса пользователя
2. Оптимизированный промпт для видео
3. Рекомендации по параметрам
4. Инструкция по процессу генерации`,
        createdAt: new Date()
      }
    ];
    setPresets(defaultPresets);
    console.log(`✅ Создано ${defaultPresets.length} предустановленных пресетов:`);
    defaultPresets.forEach(preset => {
      console.log(`  - ${preset.name} (${preset.model})`);
    });
  };

  // Функция для принудительного сброса и пересоздания пресетов
  const resetPresets = () => {
    console.log('🔄 Принудительный сброс и пересоздание пресетов...');
    localStorage.removeItem('chat_presets');
    createDefaultPresets();
    message.success('Пресеты пересозданы успешно!');
  };

  const saveStoredData = () => {
    try {
      localStorage.setItem('chat_dialogs', JSON.stringify(dialogs));
      localStorage.setItem('chat_folders', JSON.stringify(folders));
      localStorage.setItem('chat_presets', JSON.stringify(presets));
    } catch (error) {
      console.error('Ошибка сохранения данных:', error);
    }
  };

  useEffect(() => {
    saveStoredData();
  }, [dialogs, folders, presets]);

  const createNewDialog = (presetId?: string) => {
    const preset = presetId ? presets.find(p => p.id === presetId) : null;
    const newDialog: ChatDialog = {
      id: Date.now().toString(),
      name: `Новый диалог ${dialogs.length + 1}`,
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      presetId: presetId
    };

    if (preset) {
      setSelectedModel(preset.model);
      setTemperature(preset.temperature);
      setMaxTokens(preset.maxTokens);
      setSystemPrompt(preset.systemPrompt || '');
    }

    setDialogs(prev => [newDialog, ...prev]);
    setCurrentDialog(newDialog);
    setShowDialogs(false);
    setShowPresets(false);
  };

  const deleteDialog = (dialogId: string) => {
    setDialogs(prev => prev.filter(d => d.id !== dialogId));
    if (currentDialog?.id === dialogId) {
      setCurrentDialog(null);
    }
  };

  const createFolder = () => {
    const newFolder: ChatFolder = {
      id: Date.now().toString(),
      name: `Новая папка ${folders.length + 1}`,
      color: '#1890ff',
      createdAt: new Date()
    };
    setFolders(prev => [...prev, newFolder]);
  };

  const createPreset = () => {
    const newPreset: ChatPreset = {
      id: Date.now().toString(),
      name: `Новый пресет ${presets.length + 1}`,
      model: selectedModel,
      temperature: temperature,
      maxTokens: maxTokens,
      systemPrompt: systemPrompt,
      createdAt: new Date()
    };
    setPresets(prev => [...prev, newPreset]);
    setShowPresets(false);
  };

  const applyPreset = (preset: ChatPreset) => {
    setSelectedModel(preset.model);
    setTemperature(preset.temperature);
    setMaxTokens(preset.maxTokens);
    setSystemPrompt(preset.systemPrompt || '');
    setShowPresets(false);
  };

  const sendMessage = async () => {
    if (!inputValue.trim() || isLoading || !currentDialog) return;

    // Проверяем наличие токена
    const token = localStorage.getItem('token');
    if (!token) {
      message.error('Ошибка авторизации. Пожалуйста, войдите в систему заново.');
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue,
      timestamp: new Date(),
      files: uploadedFiles.length > 0 ? [...uploadedFiles] : undefined
    };

    // Обновляем текущий диалог
    const updatedDialog = {
      ...currentDialog,
      messages: [...currentDialog.messages, userMessage],
      updatedAt: new Date()
    };
    setCurrentDialog(updatedDialog);
    setDialogs(prev => prev.map(d => d.id === currentDialog.id ? updatedDialog : d));

    setInputValue('');
    setUploadedFiles([]);
    setIsLoading(true);

    try {
      // Проверяем, является ли модель Vision-моделью
      const isVisionModel = selectedModel.startsWith('vis-');
      
      // Подготавливаем историю сообщений для API
      let apiMessages: any[] = [];
      
      if (isVisionModel && uploadedFiles.length > 0) {
        // Для Vision-моделей с изображениями
        const imageFiles = uploadedFiles.filter(file => file.type.startsWith('image/'));
        
        if (imageFiles.length > 0) {
          // Создаем сообщение с изображениями
          const content: any[] = [
            { type: "text", text: inputValue }
          ];
          
          // Добавляем изображения
          for (const file of imageFiles) {
            const base64 = await fileToBase64(file);
            content.push({
              type: "image_url",
              image_url: `data:${file.type};base64,${base64}`
            });
          }
          
          apiMessages.push({
            role: 'user',
            content: content
          });
        } else {
          // Если нет изображений, отправляем обычное текстовое сообщение
          apiMessages = updatedDialog.messages.map(msg => ({
            role: msg.role,
            content: msg.content
          }));
        }
      } else {
        // Для обычных моделей
        apiMessages = updatedDialog.messages.map(msg => ({
          role: msg.role,
          content: msg.content
        }));
      }

      // Добавляем системное сообщение, если есть
      if (systemPrompt) {
        apiMessages.unshift({
          role: 'system',
          content: systemPrompt
        });
      }

      const response = await fetch('/api/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          model: selectedModel,
          messages: apiMessages,
          temperature: temperature,
          max_tokens: maxTokens,
          extra_headers: { "X-Title": "Article Search Bot" }
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Chat error:', response.status, errorText);
        
        // Обрабатываем разные типы ошибок
        if (response.status === 401) {
          message.error('Ошибка авторизации. Пожалуйста, войдите в систему заново.');
          // Можно добавить редирект на страницу входа
          return;
        } else if (response.status === 403) {
          message.error('Недостаточно прав для отправки сообщений.');
          return;
        } else if (response.status === 429) {
          message.error('Слишком много запросов. Попробуйте позже.');
          return;
        } else {
          throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
        }
      }

      const data = await response.json();
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: typeof data.choices[0].message.content === 'string'
          ? data.choices[0].message.content
          : JSON.stringify(data.choices[0].message.content),
        timestamp: new Date(),
        reasoning: typeof data.choices[0].message.reasoning === 'string'
          ? data.choices[0].message.reasoning
          : (data.choices[0].message.reasoning ? JSON.stringify(data.choices[0].message.reasoning) : ''),
        files: Array.isArray(data.choices[0].message.files) ? data.choices[0].message.files : []
      };

      const finalDialog = {
        ...updatedDialog,
        messages: [...updatedDialog.messages, assistantMessage],
        updatedAt: new Date()
      };
      setCurrentDialog(finalDialog);
      setDialogs(prev => prev.map(d => d.id === currentDialog.id ? finalDialog : d));
    } catch (error) {
      console.error('Error sending message:', error);
      
      // Удаляем сообщение пользователя при ошибке
      const dialogWithoutUserMessage = {
        ...currentDialog,
        messages: currentDialog.messages.filter(msg => msg.id !== userMessage.id),
        updatedAt: new Date()
      };
      setCurrentDialog(dialogWithoutUserMessage);
      setDialogs(prev => prev.map(d => d.id === currentDialog.id ? dialogWithoutUserMessage : d));
      
      message.error('Ошибка при отправке сообщения. Попробуйте еще раз.');
    } finally {
      setIsLoading(false);
    }
  };

  // Функция для конвертации файла в base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = error => reject(error);
    });
  };

  const handleFileUpload = (files: FileList | null) => {
    if (!files) return;
    
    const newFiles = Array.from(files);
    setUploadedFiles(prev => [...prev, ...newFiles]);
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const clearChat = () => {
    if (currentDialog) {
      const updatedDialog = {
        ...currentDialog,
        messages: [],
        updatedAt: new Date()
      };
      setCurrentDialog(updatedDialog);
      setDialogs(prev => prev.map(d => d.id === currentDialog.id ? updatedDialog : d));
    }
    message.success('Чат очищен');
  };

  const copyMessage = (content: string) => {
    navigator.clipboard.writeText(content);
    message.success('Сообщение скопировано');
  };

  const formatTimestamp = (timestamp: Date) => {
    if (!timestamp || !(timestamp instanceof Date) || isNaN(timestamp.getTime())) {
      return '--:--';
    }
    return timestamp.toLocaleTimeString('ru-RU', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const formatDate = (date: Date) => {
    if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
      return 'Неизвестная дата';
    }
    return date.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const getDialogName = (dialog: ChatDialog) => {
    if (dialog.messages.length === 0) return dialog.name;
    const firstMessage = dialog.messages[0];
    return firstMessage.content.length > 30 
      ? firstMessage.content.substring(0, 30) + '...' 
      : firstMessage.content;
  };

  return (
    <div style={{ 
      maxWidth: '1400px', 
      margin: '0 auto', 
      padding: '24px',
      minHeight: '120vh',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Заголовок */}
      <Card 
        style={{ 
          marginBottom: '16px',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Avatar 
              size={48} 
              icon={<RobotOutlined />} 
              style={{ backgroundColor: '#1890ff' }}
            />
            <div>
              <Title level={4} style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 12, background: 'transparent' }}>
                IRON FELIX AI
              </Title>
              <Text type="secondary">Умный помощник для работы</Text>
              {balance && balance.data && (
                <div style={{ marginTop: '4px' }}>
                  <Tag color={balance.data.user_status === 0 ? 'green' : balance.data.user_status === 1 ? '#FCB813' : 'red'}>
                    Баланс: {parseFloat(balance.data.credits).toFixed(2)} кредитов
                  </Tag>
                  {balance.data.user_status !== 0 && (
                    <Text type="secondary" style={{ fontSize: '11px', marginLeft: '8px' }}>
                      {balance.data.user_status_text}
                    </Text>
                  )}
                </div>
              )}
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <Space>
              <Button 
                icon={<PlusOutlined />} 
                onClick={() => createNewDialog()}
                type="primary"
              >
                Новый диалог
              </Button>
              <Button 
                icon={<MessageOutlined />} 
                onClick={() => setShowDialogs(true)}
              >
                Диалоги
              </Button>
              <Button 
                icon={<BookOutlined />} 
                onClick={() => setShowPresets(true)}
              >
                Пресеты {presets.length > 0 && `(${presets.length})`}
              </Button>
              <Tooltip title="Сбросить пресеты">
                <Button 
                  icon={<ClearOutlined />} 
                  onClick={resetPresets}
                  size="small"
                  type="text"
                />
              </Tooltip>
              <Tooltip title="Настройки">
                <Button 
                  icon={<SettingOutlined />} 
                  onClick={() => setShowSettings(!showSettings)}
                  type={showSettings ? 'primary' : 'default'}
                />
              </Tooltip>
              {currentDialog && (
                <Tooltip title="Очистить чат">
                  <Button 
                    icon={<ClearOutlined />} 
                    onClick={clearChat}
                    danger
                  />
                </Tooltip>
              )}
            </Space>
          </div>
        </div>
      </Card>

      {/* Настройки */}
      {showSettings && (
        <Card 
          style={{ 
            marginBottom: '16px',
            borderRadius: '12px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}
        >
          <Title level={5}>Настройки модели</Title>
          <Row gutter={[16, 16]}>
            <Col xs={24} md={8}>
              <Text strong>Модель:</Text>
              <Select
                value={selectedModel}
                onChange={setSelectedModel}
                style={{ width: '100%', marginTop: '8px' }}
                placeholder="Выберите модель"
                dropdownStyle={{ maxHeight: 300 }}
                size="large"
                optionLabelProp="label"
              >
                {availableModels.map(model => (
                  <Option 
                    key={model.value} 
                    value={model.value}
                    label={model.shortLabel}
                  >
                    <div style={{ padding: '8px 0' }}>
                      <div style={{ fontWeight: 'bold' }}>{model.label}</div>
                      <Text type="secondary" style={{ fontSize: '12px' }}>
                        {model.description}
                      </Text>
                    </div>
                  </Option>
                ))}
              </Select>
              {selectedModel.startsWith('vis-') && (
                <Text type="secondary" style={{ fontSize: '12px', marginTop: '4px', display: 'block' }}>
                  💡 Для Vision-моделей загружайте изображения через кнопку "Прикрепить файл"
                </Text>
              )}
            </Col>
            <Col xs={12} md={4}>
              <Text strong>Креативность:</Text>
              <div style={{ marginTop: '8px' }}>
                <input
                  type="range"
                  min="0"
                  max="2"
                  step="0.1"
                  value={temperature}
                  onChange={(e) => setTemperature(parseFloat(e.target.value))}
                  style={{ width: '100%' }}
                />
                <Text style={{ marginLeft: '8px' }}>{temperature}</Text>
              </div>
            </Col>
            <Col xs={12} md={4}>
              <Text strong>Макс. токенов:</Text>
              <Input
                type="number"
                value={maxTokens}
                onChange={(e) => setMaxTokens(parseInt(e.target.value))}
                style={{ marginTop: '8px' }}
                min={100}
                max={8000}
              />
            </Col>
            <Col xs={24}>
              <Text strong>Системный промпт:</Text>
              <TextArea
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                placeholder="Введите системный промпт для настройки поведения модели..."
                style={{ marginTop: '8px' }}
                rows={3}
              />
            </Col>
          </Row>
        </Card>
      )}

      {/* Основная область чата */}
      {currentDialog ? (
        <Card 
          style={{ 
            flex: 1,
            borderRadius: '16px',
            boxShadow: '0 4px 24px rgba(0,0,0,0.10)',
            display: 'flex',
            alignItems: 'stretch',
            justifyContent: 'center',
            minHeight: '80vh',
            maxWidth: '100%',
            width: '100%',
            padding: '32px',
            margin: '0 auto',
            background: '#fff'
          }}
          bodyStyle={{ 
            padding: '16px',
            height: '100%',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          {/* Заголовок диалога */}
          <div style={{ 
            padding: '8px 0', 
            borderBottom: '1px solid #f0f0f0',
            marginBottom: '16px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div>
              <Text strong>{currentDialog.name}</Text>
              <Text type="secondary" style={{ marginLeft: '8px', fontSize: '12px' }}>
                {formatDate(currentDialog.updatedAt)}
              </Text>
            </div>
            <Badge count={currentDialog.messages.length} showZero style={{ backgroundColor: '#52c41a' }} />
          </div>

          {/* Область сообщений */}
          <div style={{ 
            flex: 1, 
            padding: '8px',
            minHeight: '80vh',
            marginBottom: 0
          }}>
            {currentDialog.messages.length === 0 ? (
              <div style={{ 
                textAlign: 'center', 
                padding: '40px 20px',
                color: '#8c8c8c'
              }}>
                <RobotOutlined style={{ fontSize: '48px', marginBottom: '16px' }} />
                <Title level={4} style={{ color: '#8c8c8c' }}>
                  Начните новый диалог!
                </Title>
                <Text>
                  Задайте любой вопрос, и IRON FELIX AI постарается помочь вам.
                </Text>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {currentDialog.messages.map((message) => {
                  // Тотальная защита от невалидных данных
                  let safeContent = '';
                  if (typeof message.content === 'string') {
                    safeContent = message.content;
                  } else if (Array.isArray(message.content)) {
                    safeContent = (message.content as any[]).map(String).join(' ');
                  } else if (message.content) {
                    safeContent = String(message.content);
                  } else {
                    safeContent = '';
                  }
                  if (
                    typeof safeContent !== 'string' ||
                    Array.isArray(safeContent) ||
                    (typeof safeContent === 'string' && safeContent.includes('$$typeof'))
                  ) {
                    safeContent = '[Ошибка данных]';
                  }
                  if (typeof safeContent === 'string') {
                    safeContent = safeContent.replace(/\\u[0-9a-fA-F]{4}/g, '').replace(/\[object Object\]/g, '');
                  }
                  let imageUrl = '';
                  if (typeof safeContent === 'string') {
                    // Пробуем вытащить ссылку на изображение из markdown
                    const match = safeContent.match(/!\[[^\]]*\]\(([^)]+)\)/);
                    if (match && match[1]) {
                      imageUrl = match[1];
                    }
                  }
                  let safeReasoning = typeof message.reasoning === 'string' ? message.reasoning : (message.reasoning ? String(message.reasoning) : '');
                  if (
                    typeof safeReasoning !== 'string' ||
                    Array.isArray(safeReasoning) ||
                    (typeof safeReasoning === 'string' && safeReasoning.includes('$$typeof'))
                  ) {
                    safeReasoning = '';
                  }
                  let safeFiles = Array.isArray(message.files)
                    ? message.files.map(f => {
                        if (!f || typeof f !== 'object' || !('name' in f)) {
                          return { name: typeof f === 'string' ? f : '[Некорректный файл]' };
                        }
                        return { ...f, name: typeof f.name === 'string' ? f.name : '[Некорректное имя файла]' };
                      })
                    : [];
                  return (
                    <div
                      key={message.id}
                      style={{
                        display: 'flex',
                        justifyContent: message.role === 'user' ? 'flex-end' : 'flex-start',
                        gap: '12px'
                      }}
                    >
                      {message.role === 'assistant' && (
                        <Avatar 
                          icon={<RobotOutlined />} 
                          style={{ backgroundColor: '#1890ff' }}
                        />
                      )}
                      <div style={{ maxWidth: '70%', minWidth: '200px' }}>
                        <Card
                          size="small"
                          style={{
                            backgroundColor: message.role === 'user' ? '#1890ff' : '#f5f5f5',
                            color: message.role === 'user' ? 'white' : 'inherit',
                            borderRadius: '12px',
                            border: 'none'
                          }}
                          bodyStyle={{ padding: '12px 16px' }}
                        >
                          <div style={{ 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            alignItems: 'flex-start',
                            marginBottom: '8px'
                          }}>
                            <Text 
                              strong 
                              style={{ 
                                color: message.role === 'user' ? 'black' : 'inherit',
                                fontSize: '12px'
                              }}
                            >
                              {message.role === 'user' ? user?.username || 'Вы' : 'IRON FELIX AI'}
                            </Text>
                            <Space size="small">
                              <Text 
                                style={{ 
                                  color: message.role === 'user' ? 'black' : '#8c8c8c',
                                  fontSize: '11px'
                                }}
                              >
                                {formatTimestamp(message.timestamp)}
                              </Text>
                              <Tooltip title="Копировать">
                                <Button
                                  type="text"
                                  size="small"
                                  icon={<CopyOutlined />}
                                  onClick={() => copyMessage(safeContent)}
                                  style={{ 
                                    color: message.role === 'user' ? 'black' : '#8c8c8c',
                                    padding: '0 4px'
                                  }}
                                />
                              </Tooltip>
                            </Space>
                          </div>
                          <div style={{ 
                            whiteSpace: 'pre-wrap',
                            lineHeight: '1.5',
                            color: message.role === 'user' ? 'black' : 'inherit'
                          }}>
                            {message.role === 'assistant' && imageUrl ? (
                              <img
                                src={imageUrl}
                                alt="Сгенерированное изображение"
                                style={{
                                  maxWidth: '100%',
                                  borderRadius: 12,
                                  margin: '12px 0',
                                  boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
                                }}
                              />
                            ) : message.role === 'assistant' ? (
                              // Если markdown безопасен, рендерим его, иначе просто текст
                              (typeof safeContent === 'string' && !safeContent.includes('$$typeof') && !Array.isArray(safeContent)) ? (
                                <ReactMarkdown
                                  components={{
                                    img: (props: any) => (
                                      <img
                                        {...props}
                                        style={{
                                          maxWidth: '100%',
                                          borderRadius: 12,
                                          margin: '12px 0',
                                          boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
                                        }}
                                        alt={props.alt || 'image'}
                                      />
                                    )
                                  }}
                                >
                                  {safeContent}
                                </ReactMarkdown>
                              ) : (
                                safeContent
                              )
                            ) : (
                              safeContent
                            )}
                          </div>
                          {safeFiles.length > 0 && (
                            <div style={{ marginTop: '12px' }}>
                              <Divider style={{ margin: '8px 0' }} />
                              <Text style={{ 
                                color: message.role === 'user' ? 'rgba(255,255,255,0.8)' : '#8c8c8c',
                                fontSize: '12px'
                              }}>
                                Прикрепленные файлы:
                              </Text>
                              <div style={{ marginTop: '8px' }}>
                                {safeFiles.map((file, index) => {
                                  if (typeof file.name !== 'string') {
                                    console.error('file.name is not a string:', file.name, file);
                                  }
                                  return (
                                    <Tag 
                                      key={index}
                                      icon={<FileOutlined />}
                                      style={{ 
                                        margin: '4px',
                                        backgroundColor: message.role === 'user' ? 'rgba(255,255,255,0.2)' : '#f0f0f0'
                                      }}
                                    >
                                      {typeof file.name === 'string' ? file.name : 'Файл'}
                                    </Tag>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                          {safeReasoning && (
                            <div style={{ marginTop: '12px' }}>
                              <Divider style={{ margin: '8px 0' }} />
                              <details>
                                <summary style={{ 
                                  cursor: 'pointer',
                                  color: message.role === 'user' ? 'rgba(255,255,255,0.8)' : '#8c8c8c',
                                  fontSize: '12px'
                                }}>
                                  Показать размышления модели
                                </summary>
                                <div style={{ 
                                  marginTop: '8px',
                                  padding: '8px',
                                  backgroundColor: message.role === 'user' ? 'rgba(255,255,255,0.1)' : '#f0f0f0',
                                  borderRadius: '6px',
                                  fontSize: '12px',
                                  fontStyle: 'italic'
                                }}>
                                  {typeof safeReasoning === 'string' ? safeReasoning : JSON.stringify(safeReasoning)}
                                </div>
                              </details>
                            </div>
                          )}
                        </Card>
                      </div>
                      {message.role === 'user' && (
                        <Avatar 
                          icon={<UserOutlined />} 
                          style={{ backgroundColor: '#52c41a' }}
                        />
                      )}
                    </div>
                  );
                })}
                
                {isLoading && (
                  <div style={{
                    display: 'flex',
                    justifyContent: 'flex-start',
                    gap: '12px'
                  }}>
                    <Avatar 
                      icon={<RobotOutlined />} 
                      style={{ backgroundColor: '#1890ff' }}
                    />
                    <Card
                      size="small"
                      style={{
                        backgroundColor: '#f5f5f5',
                        borderRadius: '12px',
                        border: 'none',
                        minWidth: '200px'
                      }}
                      bodyStyle={{ padding: '12px 16px' }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Spin indicator={<LoadingOutlined style={{ fontSize: 16 }} spin />} />
                        <Text>AI думает...</Text>
                      </div>
                    </Card>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Поле ввода */}
          <div style={{ 
            borderTop: '1px solid #f0f0f0',
            paddingTop: '16px'
          }}>
            {/* Прикрепленные файлы */}
            {uploadedFiles.length > 0 && (
              <div style={{ marginBottom: '12px' }}>
                <Text type="secondary" style={{ fontSize: '12px', marginBottom: '8px', display: 'block' }}>
                  Прикрепленные файлы:
                </Text>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {uploadedFiles.map((file, index) => (
                    <Tag
                      key={index}
                      closable
                      onClose={() => removeFile(index)}
                      icon={<FileOutlined />}
                    >
                      {file.name}
                    </Tag>
                  ))}
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end' }}>
              <TextArea
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={selectedModel.startsWith('vis-') 
                  ? "Опишите, что нужно распознать на изображении..." 
                  : "Введите ваше сообщение..."
                }
                autoSize={{ minRows: 1, maxRows: 4 }}
                style={{ 
                  borderRadius: '8px',
                  resize: 'none'
                }}
                disabled={isLoading}
              />
              <Space direction="vertical" size="small">
                <Tooltip title="Прикрепить файл">
                  <Button
                    icon={<FileOutlined />}
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isLoading}
                    style={{ 
                      borderRadius: '8px',
                      height: '40px',
                      width: '40px'
                    }}
                  />
                </Tooltip>
                <Button
                  type="primary"
                  icon={<SendOutlined />}
                  onClick={sendMessage}
                  loading={isLoading}
                  disabled={!inputValue.trim()}
                  style={{ 
                    borderRadius: '8px',
                    height: '40px',
                    width: '40px'
                  }}
                />
              </Space>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              style={{ display: 'none' }}
              onChange={(e) => handleFileUpload(e.target.files)}
            />
            <div style={{ 
              marginTop: '8px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <Text type="secondary" style={{ fontSize: '12px' }}>
                Нажмите Enter для отправки, Shift+Enter для новой строки
              </Text>
              <Badge 
                count={currentDialog.messages.length} 
                showZero 
                style={{ backgroundColor: '#52c41a' }}
              />
            </div>
          </div>
        </Card>
      ) : (
        <Card 
          style={{ 
            flex: 1,
            borderRadius: '12px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <div style={{ textAlign: 'center', padding: '40px 20px' }}>
            <RobotOutlined style={{ fontSize: '64px', marginBottom: '16px', color: '#1890ff' }} />
            <Title level={3} style={{ color: '#8c8c8c' }}>
              Выберите диалог или создайте новый
            </Title>
            <Text type="secondary">
              Начните общение с IRON FELIX AI
            </Text>
            <div style={{ marginTop: '24px' }}>
              <Button 
                type="primary" 
                size="large"
                icon={<PlusOutlined />}
                onClick={() => createNewDialog()}
              >
                Создать новый диалог
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Drawer для диалогов */}
      <Drawer
        title="Мои диалоги"
        placement="right"
        width={400}
        onClose={() => setShowDialogs(false)}
        open={showDialogs}
        extra={
          <Button 
            type="primary" 
            icon={<PlusOutlined />}
            onClick={() => createNewDialog()}
          >
            Новый
          </Button>
        }
      >
        <List
          dataSource={dialogs}
          renderItem={(dialog) => (
            <List.Item
              actions={[
                <Popconfirm
                  title="Удалить диалог?"
                  onConfirm={() => deleteDialog(dialog.id)}
                  okText="Да"
                  cancelText="Нет"
                >
                  <Button 
                    type="text" 
                    danger 
                    icon={<DeleteOutlined />}
                    size="small"
                    onClick={e => e.stopPropagation()}
                  />
                </Popconfirm>
              ]}
              style={{
                cursor: 'pointer',
                backgroundColor: currentDialog?.id === dialog.id ? '#f0f8ff' : 'transparent',
                borderRadius: '8px',
                padding: '8px'
              }}
              onClick={() => {
                setCurrentDialog(dialog);
                setShowDialogs(false);
              }}
            >
              <List.Item.Meta
                avatar={<Avatar icon={<MessageOutlined />} />}
                title={typeof getDialogName(dialog) === 'string' ? getDialogName(dialog) : '[Некорректное имя]'}
                description={
                  <div>
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      {formatDate(dialog.updatedAt)}
                    </Text>
                    <Badge 
                      count={dialog.messages.length} 
                      showZero 
                      size="small"
                      style={{ marginLeft: '8px' }}
                    />
                  </div>
                }
              />
            </List.Item>
          )}
        />
      </Drawer>

      {/* Drawer для пресетов */}
      <Drawer
        title="Пресеты"
        placement="right"
        width={400}
        onClose={() => setShowPresets(false)}
        open={showPresets}
        extra={
          <Button 
            type="primary" 
            icon={<PlusOutlined />}
            onClick={createPreset}
          >
            Создать
          </Button>
        }
      >
        <List
          dataSource={presets}
          renderItem={(preset) => (
            <List.Item
              actions={[
                <Button 
                  type="text" 
                  icon={<EditOutlined />}
                  size="small"
                />,
                <Popconfirm
                  title="Удалить пресет?"
                  onConfirm={() => setPresets(prev => prev.filter(p => p.id !== preset.id))}
                  okText="Да"
                  cancelText="Нет"
                >
                  <Button 
                    type="text" 
                    danger 
                    icon={<DeleteOutlined />}
                    size="small"
                  />
                </Popconfirm>
              ]}
            >
              <List.Item.Meta
                avatar={<Avatar icon={<BookOutlined />} />}
                title={preset.name}
                description={
                  <div>
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      {availableModels.find(m => m.value === preset.model)?.shortLabel || preset.model}
                    </Text>
                    <br />
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      Креативность: {preset.temperature} | Токены: {preset.maxTokens}
                    </Text>
                  </div>
                }
              />
              <Button 
                type="primary" 
                size="small"
                onClick={() => applyPreset(preset)}
              >
                Применить
              </Button>
            </List.Item>
          )}
        />
      </Drawer>
    </div>
  );
};

export default ChatBot; 