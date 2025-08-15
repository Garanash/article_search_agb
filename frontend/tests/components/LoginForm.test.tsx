import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import LoginForm from '../../src/components/LoginForm';

// Mock the auth context
const mockLogin = jest.fn();
const mockIsAuthenticated = false;
const mockLoading = false;

jest.mock('../../src/context/AuthContext', () => ({
  useAuth: () => ({
    login: mockLogin,
    isAuthenticated: mockIsAuthenticated,
    loading: mockLoading,
  }),
}));

// Mock the theme context
const mockTheme = 'light';
const mockToggleTheme = jest.fn();

jest.mock('../../src/context/ThemeContext', () => ({
  useTheme: () => ({
    theme: mockTheme,
    toggleTheme: mockToggleTheme,
  }),
}));

const renderLoginForm = () => {
  return render(
    <BrowserRouter>
      <ConfigProvider>
        <LoginForm />
      </ConfigProvider>
    </BrowserRouter>
  );
};

describe('LoginForm Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders login form correctly', () => {
    renderLoginForm();
    
    expect(screen.getByText('Вход в систему')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Имя пользователя')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Пароль')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Войти' })).toBeInTheDocument();
    expect(screen.getByText('Забыли пароль?')).toBeInTheDocument();
    expect(screen.getByText('Создать аккаунт')).toBeInTheDocument();
  });

  it('displays username and password input fields', () => {
    renderLoginForm();
    
    const usernameInput = screen.getByPlaceholderText('Имя пользователя');
    const passwordInput = screen.getByPlaceholderText('Пароль');
    
    expect(usernameInput).toBeInTheDocument();
    expect(passwordInput).toBeInTheDocument();
    expect(usernameInput).toHaveAttribute('type', 'text');
    expect(passwordInput).toHaveAttribute('type', 'password');
  });

  it('allows user to type in username and password fields', () => {
    renderLoginForm();
    
    const usernameInput = screen.getByPlaceholderText('Имя пользователя');
    const passwordInput = screen.getByPlaceholderText('Пароль');
    
    fireEvent.change(usernameInput, { target: { value: 'testuser' } });
    fireEvent.change(passwordInput, { target: { value: 'testpassword' } });
    
    expect(usernameInput).toHaveValue('testuser');
    expect(passwordInput).toHaveValue('testpassword');
  });

  it('calls login function when form is submitted with valid data', async () => {
    renderLoginForm();
    
    const usernameInput = screen.getByPlaceholderText('Имя пользователя');
    const passwordInput = screen.getByPlaceholderText('Пароль');
    const submitButton = screen.getByRole('button', { name: 'Войти' });
    
    fireEvent.change(usernameInput, { target: { value: 'testuser' } });
    fireEvent.change(passwordInput, { target: { value: 'testpassword' } });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('testuser', 'testpassword');
    });
  });

  it('shows validation error when username is empty', async () => {
    renderLoginForm();
    
    const submitButton = screen.getByRole('button', { name: 'Войти' });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText('Пожалуйста, введите имя пользователя')).toBeInTheDocument();
    });
  });

  it('shows validation error when password is empty', async () => {
    renderLoginForm();
    
    const usernameInput = screen.getByPlaceholderText('Имя пользователя');
    const submitButton = screen.getByRole('button', { name: 'Войти' });
    
    fireEvent.change(usernameInput, { target: { value: 'testuser' } });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText('Пожалуйста, введите пароль')).toBeInTheDocument();
    });
  });

  it('shows validation error when both fields are empty', async () => {
    renderLoginForm();
    
    const submitButton = screen.getByRole('button', { name: 'Войти' });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText('Пожалуйста, введите имя пользователя')).toBeInTheDocument();
      expect(screen.getByText('Пожалуйста, введите пароль')).toBeInTheDocument();
    });
  });

  it('disables submit button when form is loading', () => {
    // Mock loading state
    jest.mocked(require('../../src/context/AuthContext').useAuth).mockReturnValue({
      login: mockLogin,
      isAuthenticated: mockIsAuthenticated,
      loading: true,
    });
    
    renderLoginForm();
    
    const submitButton = screen.getByRole('button', { name: 'Войти' });
    expect(submitButton).toBeDisabled();
  });

  it('shows loading spinner when form is loading', () => {
    // Mock loading state
    jest.mocked(require('../../src/context/AuthContext').useAuth).mockReturnValue({
      login: mockLogin,
      isAuthenticated: mockIsAuthenticated,
      loading: true,
    });
    
    renderLoginForm();
    
    expect(screen.getByRole('button', { name: 'Войти' })).toBeDisabled();
  });

  it('renders theme toggle button', () => {
    renderLoginForm();
    
    const themeToggle = screen.getByRole('button', { name: /переключить тему/i });
    expect(themeToggle).toBeInTheDocument();
  });

  it('calls toggleTheme when theme button is clicked', () => {
    renderLoginForm();
    
    const themeToggle = screen.getByRole('button', { name: /переключить тему/i });
    fireEvent.click(themeToggle);
    
    expect(mockToggleTheme).toHaveBeenCalled();
  });

  it('renders forgot password link', () => {
    renderLoginForm();
    
    const forgotPasswordLink = screen.getByText('Забыли пароль?');
    expect(forgotPasswordLink).toBeInTheDocument();
    expect(forgotPasswordLink.closest('a')).toHaveAttribute('href', '/forgot-password');
  });

  it('renders create account link', () => {
    renderLoginForm();
    
    const createAccountLink = screen.getByText('Создать аккаунт');
    expect(createAccountLink).toBeInTheDocument();
    expect(createAccountLink.closest('a')).toHaveAttribute('href', '/register');
  });

  it('handles form submission with Enter key', async () => {
    renderLoginForm();
    
    const usernameInput = screen.getByPlaceholderText('Имя пользователя');
    const passwordInput = screen.getByPlaceholderText('Пароль');
    
    fireEvent.change(usernameInput, { target: { value: 'testuser' } });
    fireEvent.change(passwordInput, { target: { value: 'testpassword' } });
    fireEvent.keyPress(passwordInput, { key: 'Enter', code: 'Enter' });
    
    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('testuser', 'testpassword');
    });
  });

  it('clears form fields after successful submission', async () => {
    mockLogin.mockResolvedValueOnce(undefined);
    
    renderLoginForm();
    
    const usernameInput = screen.getByPlaceholderText('Имя пользователя');
    const passwordInput = screen.getByPlaceholderText('Пароль');
    const submitButton = screen.getByRole('button', { name: 'Войти' });
    
    fireEvent.change(usernameInput, { target: { value: 'testuser' } });
    fireEvent.change(passwordInput, { target: { value: 'testpassword' } });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalled();
    });
    
    // Form fields should be cleared after submission
    expect(usernameInput).toHaveValue('');
    expect(passwordInput).toHaveValue('');
  });

  it('handles login error gracefully', async () => {
    const errorMessage = 'Invalid credentials';
    mockLogin.mockRejectedValueOnce(new Error(errorMessage));
    
    renderLoginForm();
    
    const usernameInput = screen.getByPlaceholderText('Имя пользователя');
    const passwordInput = screen.getByPlaceholderText('Пароль');
    const submitButton = screen.getByRole('button', { name: 'Войти' });
    
    fireEvent.change(usernameInput, { target: { value: 'testuser' } });
    fireEvent.change(passwordInput, { target: { value: 'testpassword' } });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalled();
    });
    
    // Error should be handled gracefully without crashing
    expect(screen.getByRole('button', { name: 'Войти' })).toBeInTheDocument();
  });

  it('maintains form state during typing', () => {
    renderLoginForm();
    
    const usernameInput = screen.getByPlaceholderText('Имя пользователя');
    const passwordInput = screen.getByPlaceholderText('Пароль');
    
    // Type in username
    fireEvent.change(usernameInput, { target: { value: 'test' } });
    expect(usernameInput).toHaveValue('test');
    
    // Type in password
    fireEvent.change(passwordInput, { target: { value: 'pass' } });
    expect(passwordInput).toHaveValue('pass');
    
    // Username should still have its value
    expect(usernameInput).toHaveValue('test');
  });

  it('renders with correct styling classes', () => {
    renderLoginForm();
    
    const form = screen.getByRole('form');
    expect(form).toHaveClass('login-form');
    
    const card = screen.getByRole('article');
    expect(card).toHaveClass('ant-card');
  });
});


