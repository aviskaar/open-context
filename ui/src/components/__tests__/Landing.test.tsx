import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Landing from '../Landing';
import { AuthProvider } from '../../store/auth';

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual };
});

describe('Landing', () => {
  beforeEach(() => {
    vi.clearAllMocks();
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
    expect(screen.getAllByAltText('open-context').length).toBeGreaterThan(0);
  });

  it('should render all feature items', () => {
    renderWithProviders();

    expect(screen.getByText('Import from any platform')).toBeInTheDocument();
    expect(screen.getByText('Export anywhere')).toBeInTheDocument();
    expect(screen.getByText('MCP persistent memory')).toBeInTheDocument();
    expect(screen.getByText('Bubbles — project workspaces')).toBeInTheDocument();
  });

  it('should render navbar with Get started link pointing to GitHub', () => {
    renderWithProviders();

    const getStartedLinks = screen.getAllByRole('link', { name: /get started/i });
    expect(getStartedLinks.length).toBeGreaterThan(0);
    expect(getStartedLinks[0]).toHaveAttribute('href', expect.stringContaining('github.com'));
  });

  it('should not render a Sign in button', () => {
    renderWithProviders();

    expect(screen.queryByRole('button', { name: /sign in/i })).not.toBeInTheDocument();
  });

  it('should not render an auth modal or dialog', () => {
    renderWithProviders();

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('should render footer', () => {
    renderWithProviders();

    expect(screen.getByText('open-context.dev — open source, self-hosted')).toBeInTheDocument();
    expect(screen.getByText('No data leaves your machine')).toBeInTheDocument();
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

  it('should render GitHub links in navbar and hero', () => {
    renderWithProviders();

    const githubLinks = screen.getAllByRole('link', { name: /github/i });
    expect(githubLinks.length).toBeGreaterThan(0);
    githubLinks.forEach((link) => {
      expect(link).toHaveAttribute('href', expect.stringContaining('github.com'));
    });
  });

  it('should render copy buttons for terminal snippets', () => {
    renderWithProviders();

    const copyButtons = screen.getAllByRole('button', { name: /copy/i });
    expect(copyButtons.length).toBeGreaterThan(0);
  });
});
