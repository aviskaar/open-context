import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Landing from '../Landing';
import { AuthProvider } from '../../store/auth';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('Landing', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    sessionStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const renderWithProviders = () => {
    return render(
      <MemoryRouter>
        <AuthProvider>
          <Landing />
        </AuthProvider>
      </MemoryRouter>
    );
  };

  it('should render landing page with hero section', () => {
    renderWithProviders();

    expect(screen.getByText('Your AI context,')).toBeInTheDocument();
    expect(screen.getByText('everywhere you go.')).toBeInTheDocument();
    // Multiple images share the alt text; getAllByAltText returns all of them
    expect(screen.getAllByAltText('open-context').length).toBeGreaterThan(0);
  });

  it('should render all feature items', () => {
    renderWithProviders();

    expect(screen.getByText('Import from any platform')).toBeInTheDocument();
    expect(screen.getByText('Export anywhere')).toBeInTheDocument();
    expect(screen.getByText('MCP persistent memory')).toBeInTheDocument();
    expect(screen.getByText('Bubbles — project workspaces')).toBeInTheDocument();
  });

  it('should render navbar with sign in and get started buttons', () => {
    renderWithProviders();

    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
    // Multiple "Get started" buttons exist (navbar + hero), so check there is at least one
    expect(screen.getAllByRole('button', { name: /get started/i }).length).toBeGreaterThan(0);
  });

  it('should open sign-in modal when Sign in is clicked', () => {
    renderWithProviders();

    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByText('Welcome back')).toBeInTheDocument();
  });

  it('should open sign-up modal when Get started is clicked', () => {
    renderWithProviders();

    fireEvent.click(screen.getAllByRole('button', { name: /get started/i })[0]);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Create your account')).toBeInTheDocument();
  });

  it('should close modal when X button is clicked', () => {
    renderWithProviders();

    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /close/i }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('should handle email input in modal', () => {
    renderWithProviders();

    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    const emailInput = screen.getByLabelText('Email');
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    expect(emailInput).toHaveValue('test@example.com');
  });

  it('should handle password input in modal', () => {
    renderWithProviders();

    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    const passwordInput = screen.getByLabelText('Password');
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    expect(passwordInput).toHaveValue('password123');
  });

  it('should show loading state during form submission', async () => {
    renderWithProviders();

    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    const emailInput = screen.getByLabelText('Email');
    const passwordInput = screen.getByLabelText('Password');
    const submitButton = screen.getByRole('button', { name: /continue/i });

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);

    expect(screen.getByText('Signing in…')).toBeInTheDocument();
  });

  it('should render footer', () => {
    renderWithProviders();

    expect(screen.getByText('open-context.dev — open source, self-hosted')).toBeInTheDocument();
    expect(screen.getByText('No data leaves your machine')).toBeInTheDocument();
  });

  it('should render demo mode note in modal', () => {
    renderWithProviders();

    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    expect(screen.getByText('Demo mode — any non-empty credentials work.')).toBeInTheDocument();
  });

  it('should have correct hero description text', () => {
    renderWithProviders();

    expect(
      screen.getByText(/open-context migrates your full conversation history/i)
    ).toBeInTheDocument();
  });

  it('should render how it works section', () => {
    renderWithProviders();

    expect(screen.getByText('Export your data')).toBeInTheDocument();
    expect(screen.getByText('Import into open-context')).toBeInTheDocument();
    expect(screen.getByText('Use it everywhere')).toBeInTheDocument();
  });
});
