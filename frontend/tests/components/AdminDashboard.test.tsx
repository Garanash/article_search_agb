import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import AdminDashboard from '../../src/components/AdminDashboard';

// Mock the auth context
const mockUser = {
  id: 1,
  username: 'admin',
  role: 'admin',
  first_name: 'Admin',
  last_name: 'User',
  email: 'admin@test.com'
};

jest.mock('../../src/context/AuthContext', () => ({
  useAuth: () => ({
    user: mockUser,
    isAuthenticated: true,
    loading: false,
  }),
}));

// Mock the API calls
const mockGetSupportTickets = jest.fn();
const mockGetNews = jest.fn();
const mockGetEvents = jest.fn();

jest.mock('../../src/api/api', () => ({
  getSupportTickets: mockGetSupportTickets,
  getNews: mockGetNews,
  getEvents: mockGetEvents,
}));

const renderAdminDashboard = () => {
  return render(
    <BrowserRouter>
      <ConfigProvider>
        <AdminDashboard />
      </ConfigProvider>
    </BrowserRouter>
  );
};

describe('AdminDashboard Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock successful API responses
    mockGetSupportTickets.mockResolvedValue([
      {
        id: 1,
        title: 'Test Issue',
        description: 'Test description',
        status: 'open',
        priority: 'high',
        user: { username: 'testuser' },
        created_at: '2023-01-01T00:00:00Z'
      }
    ]);
    
    mockGetNews.mockResolvedValue([
      {
        id: 1,
        title: 'Test News',
        text: 'Test news content',
        created_at: '2023-01-01T00:00:00Z'
      }
    ]);
    
    mockGetEvents.mockResolvedValue([
      {
        id: 1,
        title: 'Test Event',
        start_date: '2023-01-01T00:00:00Z',
        end_date: '2023-01-01T23:59:59Z'
      }
    ]);
  });

  it('renders admin dashboard correctly', () => {
    renderAdminDashboard();
    
    expect(screen.getByText('Панель администратора')).toBeInTheDocument();
    expect(screen.getByText('Обращения пользователей')).toBeInTheDocument();
    expect(screen.getByText('Новости')).toBeInTheDocument();
    expect(screen.getByText('Календарь')).toBeInTheDocument();
  });

  it('displays user information in header', () => {
    renderAdminDashboard();
    
    expect(screen.getByText('Admin User')).toBeInTheDocument();
    expect(screen.getByText('admin@test.com')).toBeInTheDocument();
    expect(screen.getByText('Администратор')).toBeInTheDocument();
  });

  it('renders metrics section with correct data', () => {
    renderAdminDashboard();
    
    expect(screen.getByText('Всего пользователей')).toBeInTheDocument();
    expect(screen.getByText('Всего артикулов')).toBeInTheDocument();
    expect(screen.getByText('Всего запросов')).toBeInTheDocument();
    expect(screen.getByText('Всего поставщиков')).toBeInTheDocument();
  });

  it('renders support tickets section', () => {
    renderAdminDashboard();
    
    expect(screen.getByText('Обращения пользователей')).toBeInTheDocument();
    expect(screen.getByText('Статус')).toBeInTheDocument();
    expect(screen.getByText('Приоритет')).toBeInTheDocument();
    expect(screen.getByText('Пользователь')).toBeInTheDocument();
    expect(screen.getByText('Дата создания')).toBeInTheDocument();
  });

  it('renders news section', () => {
    renderAdminDashboard();
    
    expect(screen.getByText('Новости')).toBeInTheDocument();
    expect(screen.getByText('Заголовок')).toBeInTheDocument();
    expect(screen.getByText('Дата публикации')).toBeInTheDocument();
  });

  it('renders calendar section', () => {
    renderAdminDashboard();
    
    expect(screen.getByText('Календарь')).toBeInTheDocument();
    expect(screen.getByText('Событие')).toBeInTheDocument();
    expect(screen.getByText('Дата')).toBeInTheDocument();
  });

  it('loads support tickets on component mount', async () => {
    renderAdminDashboard();
    
    await waitFor(() => {
      expect(mockGetSupportTickets).toHaveBeenCalled();
    });
  });

  it('loads news on component mount', async () => {
    renderAdminDashboard();
    
    await waitFor(() => {
      expect(mockGetNews).toHaveBeenCalled();
    });
  });

  it('loads events on component mount', async () => {
    renderAdminDashboard();
    
    await waitFor(() => {
      expect(mockGetEvents).toHaveBeenCalled();
    });
  });

  it('displays support tickets data correctly', async () => {
    renderAdminDashboard();
    
    await waitFor(() => {
      expect(screen.getByText('Test Issue')).toBeInTheDocument();
      expect(screen.getByText('testuser')).toBeInTheDocument();
      expect(screen.getByText('high')).toBeInTheDocument();
    });
  });

  it('displays news data correctly', async () => {
    renderAdminDashboard();
    
    await waitFor(() => {
      expect(screen.getByText('Test News')).toBeInTheDocument();
      expect(screen.getByText('Test news content')).toBeInTheDocument();
    });
  });

  it('displays calendar events data correctly', async () => {
    renderAdminDashboard();
    
    await waitFor(() => {
      expect(screen.getByText('Test Event')).toBeInTheDocument();
    });
  });

  it('handles API errors gracefully', async () => {
    mockGetSupportTickets.mockRejectedValue(new Error('API Error'));
    
    renderAdminDashboard();
    
    await waitFor(() => {
      expect(mockGetSupportTickets).toHaveBeenCalled();
    });
    
    // Component should still render without crashing
    expect(screen.getByText('Панель администратора')).toBeInTheDocument();
  });

  it('renders empty state when no data', async () => {
    mockGetSupportTickets.mockResolvedValue([]);
    mockGetNews.mockResolvedValue([]);
    mockGetEvents.mockResolvedValue([]);
    
    renderAdminDashboard();
    
    await waitFor(() => {
      expect(screen.getByText('Нет обращений')).toBeInTheDocument();
      expect(screen.getByText('Нет новостей')).toBeInTheDocument();
      expect(screen.getByText('Нет событий')).toBeInTheDocument();
    });
  });

  it('renders refresh buttons for each section', () => {
    renderAdminDashboard();
    
    const refreshButtons = screen.getAllByRole('button', { name: /обновить/i });
    expect(refreshButtons.length).toBeGreaterThan(0);
  });

  it('calls refresh functions when refresh buttons are clicked', async () => {
    renderAdminDashboard();
    
    const refreshButtons = screen.getAllByRole('button', { name: /обновить/i });
    
    // Click first refresh button
    fireEvent.click(refreshButtons[0]);
    
    await waitFor(() => {
      expect(mockGetSupportTickets).toHaveBeenCalledTimes(2); // Initial + refresh
    });
  });

  it('renders with correct layout structure', () => {
    renderAdminDashboard();
    
    // Check that main sections are present
    const mainContent = screen.getByRole('main');
    expect(mainContent).toBeInTheDocument();
    
    // Check that metrics section is present
    const metricsSection = screen.getByText('Всего пользователей').closest('div');
    expect(metricsSection).toBeInTheDocument();
    
    // Check that content sections are present
    const contentSection = screen.getByText('Обращения пользователей').closest('div');
    expect(contentSection).toBeInTheDocument();
  });

  it('displays correct status badges for support tickets', async () => {
    mockGetSupportTickets.mockResolvedValue([
      {
        id: 1,
        title: 'Open Issue',
        status: 'open',
        priority: 'high',
        user: { username: 'testuser' },
        created_at: '2023-01-01T00:00:00Z'
      },
      {
        id: 2,
        title: 'Closed Issue',
        status: 'closed',
        priority: 'low',
        user: { username: 'testuser2' },
        created_at: '2023-01-01T00:00:00Z'
      }
    ]);
    
    renderAdminDashboard();
    
    await waitFor(() => {
      expect(screen.getByText('open')).toBeInTheDocument();
      expect(screen.getByText('closed')).toBeInTheDocument();
    });
  });

  it('displays correct priority badges for support tickets', async () => {
    mockGetSupportTickets.mockResolvedValue([
      {
        id: 1,
        title: 'High Priority Issue',
        status: 'open',
        priority: 'high',
        user: { username: 'testuser' },
        created_at: '2023-01-01T00:00:00Z'
      },
      {
        id: 2,
        title: 'Low Priority Issue',
        status: 'open',
        priority: 'low',
        user: { username: 'testuser2' },
        created_at: '2023-01-01T00:00:00Z'
      }
    ]);
    
    renderAdminDashboard();
    
    await waitFor(() => {
      expect(screen.getByText('high')).toBeInTheDocument();
      expect(screen.getByText('low')).toBeInTheDocument();
    });
  });

  it('formats dates correctly', async () => {
    renderAdminDashboard();
    
    await waitFor(() => {
      // Check that dates are formatted and displayed
      expect(screen.getByText(/01\.01\.2023/)).toBeInTheDocument();
    });
  });

  it('renders action buttons for support tickets', async () => {
    renderAdminDashboard();
    
    await waitFor(() => {
      const actionButtons = screen.getAllByRole('button');
      expect(actionButtons.length).toBeGreaterThan(0);
    });
  });

  it('handles loading states correctly', () => {
    mockGetSupportTickets.mockImplementation(() => new Promise(() => {})); // Never resolves
    
    renderAdminDashboard();
    
    // Should show loading indicators
    expect(screen.getByText('Панель администратора')).toBeInTheDocument();
  });

  it('renders with responsive design classes', () => {
    renderAdminDashboard();
    
    // Check that flexbox classes are applied
    const mainContent = screen.getByRole('main');
    expect(mainContent).toHaveStyle({ display: 'flex' });
  });

  it('displays user statistics correctly', () => {
    renderAdminDashboard();
    
    // Check that user stats are displayed
    expect(screen.getByText('Всего пользователей')).toBeInTheDocument();
    expect(screen.getByText('Всего артикулов')).toBeInTheDocument();
    expect(screen.getByText('Всего запросов')).toBeInTheDocument();
    expect(screen.getByText('Всего поставщиков')).toBeInTheDocument();
  });

  it('renders navigation elements correctly', () => {
    renderAdminDashboard();
    
    // Check that navigation elements are present
    expect(screen.getByText('Панель администратора')).toBeInTheDocument();
    expect(screen.getByText('Обращения пользователей')).toBeInTheDocument();
  });
});


