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

  // Новый layout: слева — настройки и диалоги, справа — чат
  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 64px)', minHeight: 600, background: '#f6f7f9' }}>
      {/* Левая панель: настройки и диалоги */}
      <div style={{ width: 340, background: '#fff', borderRight: '1.5px solid #e3e7ed', display: 'flex', flexDirection: 'column', height: '100vh', minHeight: 600, maxHeight: '100vh', position: 'relative' }}>
        {/* Настройки чата и кнопки пресетов в один flexbox */}
        <div style={{ padding: '24px 20px 12px 20px', borderBottom: '1.5px solid #e3e7ed' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <div style={{ fontWeight: 700, fontSize: 18, letterSpacing: 0.5 }}>Настройки</div>
            <Button type="primary" icon={<PlusOutlined />} size="small" onClick={() => createNewDialog()} />
            <Button type="default" icon={<BookOutlined />} size="small" onClick={() => setShowPresets(true)} />
          </div>
          <div style={{ marginBottom: 10 }}>
            <Select
              value={selectedModel}
              onChange={setSelectedModel}
              style={{ width: '100%' }}
              size="large"
              options={availableModels.map(m => ({ value: m.value, label: m.label }))}
            />
          </div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
            <Input
              type="number"
              min={0}
              max={2}
              step={0.1}
              value={temperature}
              onChange={e => setTemperature(Number(e.target.value))}
              size="small"
              style={{ width: 80 }}
              addonBefore="Креативность"
            />
            <Input
              type="number"
              min={256}
              max={8000}
              step={100}
              value={maxTokens}
              onChange={e => setMaxTokens(Number(e.target.value))}
              size="small"
              style={{ width: 100 }}
              addonBefore="Токены"
            />
          </div>
          <Input.TextArea
            value={systemPrompt}
            onChange={e => setSystemPrompt(e.target.value)}
            placeholder="Системный prompt (опционально)"
            autoSize={{ minRows: 1, maxRows: 3 }}
            style={{ marginBottom: 0 }}
          />
        </div>
        {/* Список диалогов */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 0 0 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px 8px 20px' }}>
            <div style={{ fontWeight: 700, fontSize: 16 }}>Диалоги</div>
          </div>
          <div style={{ padding: '0 10px' }}>
            {dialogs.length === 0 && (
              <div style={{ color: '#aaa', textAlign: 'center', margin: '32px 0' }}>Нет диалогов</div>
            )}
            {dialogs.map(dialog => (
              <div
                key={dialog.id}
                style={{
                  background: currentDialog?.id === dialog.id ? '#e3e7ed' : '#f9fafb',
                  border: currentDialog?.id === dialog.id ? '2px solid #1976d2' : '1.5px solid #e3e7ed',
                  borderRadius: 10,
                  marginBottom: 10,
                  padding: '12px 14px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  boxShadow: currentDialog?.id === dialog.id ? '0 2px 8px #1976d220' : 'none',
                  transition: 'all 0.15s'
                }}
                onClick={() => setCurrentDialog(dialog)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Avatar icon={<MessageOutlined />} size={32} />
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 15 }}>{getDialogName(dialog)}</div>
                    <div style={{ color: '#888', fontSize: 12 }}>{formatDate(dialog.updatedAt)}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <Badge count={dialog.messages.length} showZero size="small" style={{ background: '#1976d2' }} />
                  <Popconfirm
                    title="Удалить диалог?"
                    onConfirm={e => { e?.stopPropagation(); deleteDialog(dialog.id); }}
                    okText="Да"
                    cancelText="Нет"
                  >
                    <Button type="text" danger icon={<DeleteOutlined />} size="small" onClick={e => e.stopPropagation()} />
                  </Popconfirm>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      {/* Правая часть: чат с ботом */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, height: '100vh', position: 'relative' }}>
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px 32px 0 32px', background: '#f6f7f9' }}>
          {currentDialog && currentDialog.messages.length === 0 && (
            <div style={{ color: '#aaa', textAlign: 'center', marginTop: 80 }}>Нет сообщений</div>
          )}
          {currentDialog && currentDialog.messages.map((msg, idx) => (
            <div key={msg.id} style={{
              display: 'flex',
              flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
              alignItems: 'flex-end',
              marginBottom: 18,
              gap: 14
            }}>
              <Avatar icon={msg.role === 'user' ? <UserOutlined /> : <RobotOutlined />} style={{ background: msg.role === 'user' ? '#1976d2' : '#FCB813' }} />
              <div style={{
                background: msg.role === 'user' ? '#e3e7ed' : '#fffbe6',
                color: '#23272b',
                borderRadius: 12,
                padding: '14px 18px',
                maxWidth: '70%',
                boxShadow: '0 2px 8px #b0bec520',
                fontSize: 16,
                wordBreak: 'break-word',
                border: msg.role === 'user' ? '1.5px solid #b0bec5' : '1.5px solid #FCB813',
              }}>
                <ReactMarkdown>{msg.content}</ReactMarkdown>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
        {/* Ввод сообщения — всегда внизу (sticky) */}
        <div style={{ position: 'sticky', bottom: 0, left: 0, right: 0, background: '#fff', borderTop: '1.5px solid #e3e7ed', zIndex: 10, padding: '18px 32px', display: 'flex', alignItems: 'flex-end', gap: 10 }}>
          <TextArea
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder={
              isLoading
                ? "Ожидание ответа..."
                : "Введите ваше сообщение..."
            }
            autoSize={{ minRows: 1, maxRows: 4 }}
            style={{ borderRadius: '8px', resize: 'none' }}
            disabled={isLoading}
          />
          <Space direction="vertical" size="small">
            <Tooltip title="Прикрепить файл">
              <Button
                icon={<FileOutlined />}
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading}
                style={{ borderRadius: '8px', height: '40px', width: '40px' }}
              />
            </Tooltip>
            <Button
              type="primary"
              icon={<SendOutlined />}
              onClick={sendMessage}
              loading={isLoading}
              disabled={!inputValue.trim()}
              style={{ borderRadius: '8px', height: '40px', width: '40px' }}
            />
          </Space>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            style={{ display: 'none' }}
            onChange={(e) => handleFileUpload(e.target.files)}
          />
        </div>
        <div style={{ marginTop: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 32px 8px 32px' }}>
          <span style={{ fontSize: 12, color: '#888' }}>Нажмите Enter для отправки, Shift+Enter для новой строки</span>
          <Badge count={currentDialog?.messages.length || 0} showZero style={{ backgroundColor: '#52c41a' }} />
        </div>
      </div>
    </div>
  );
};

export default ChatBot; 