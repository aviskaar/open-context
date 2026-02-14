import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AppProvider, useAppState, defaultPreferences } from '../context';
import React from 'react';
import type { UserPreferences, NormalizedConversation, PipelineState } from '../../types/preferences';

// Helper component to test the hook
function TestComponent() {
  const { state, dispatch } = useAppState();
  return (
    <div>
      <div data-testid="preferences">{JSON.stringify(state.preferences)}</div>
      <div data-testid="conversations">{JSON.stringify(state.conversations)}</div>
      <div data-testid="pipeline">{JSON.stringify(state.pipeline)}</div>
      <button
        data-testid="set-preferences"
        onClick={() =>
          dispatch({
            type: 'SET_PREFERENCES',
            payload: { ...defaultPreferences, customInstructions: 'test' },
          })
        }
      >
        Set Preferences
      </button>
      <button
        data-testid="update-preferences"
        onClick={() =>
          dispatch({
            type: 'UPDATE_PREFERENCES',
            payload: { customInstructions: 'updated' },
          })
        }
      >
        Update Preferences
      </button>
      <button
        data-testid="set-conversations"
        onClick={() =>
          dispatch({
            type: 'SET_CONVERSATIONS',
            payload: [
              {
                id: '1',
                title: 'Test',
                created: '2024-01-01',
                updated: '2024-01-01',
                messages: [],
                selected: false,
              },
            ],
          })
        }
      >
        Set Conversations
      </button>
      <button data-testid="toggle-conversation" onClick={() => dispatch({ type: 'TOGGLE_CONVERSATION', payload: '1' })}>
        Toggle Conversation
      </button>
      <button
        data-testid="update-conversation"
        onClick={() =>
          dispatch({
            type: 'UPDATE_CONVERSATION',
            payload: { id: '1', updates: { title: 'Updated' } },
          })
        }
      >
        Update Conversation
      </button>
      <button data-testid="delete-conversation" onClick={() => dispatch({ type: 'DELETE_CONVERSATION', payload: '1' })}>
        Delete Conversation
      </button>
      <button data-testid="set-pipeline" onClick={() => dispatch({ type: 'SET_PIPELINE', payload: { stage: 'parsing', progress: 50 } })}>
        Set Pipeline
      </button>
      <button data-testid="reset-pipeline" onClick={() => dispatch({ type: 'RESET_PIPELINE' })}>
        Reset Pipeline
      </button>
    </div>
  );
}

describe('AppProvider and useAppState', () => {
  const wrapper = ({ children }: { children: React.ReactNode }) => <AppProvider>{children}</AppProvider>;

  it('should provide default state', () => {
    render(<TestComponent />, { wrapper });

    const prefsEl = screen.getByTestId('preferences');
    const prefs = JSON.parse(prefsEl.textContent || '{}');
    expect(prefs.communicationStyle.tone).toBe('neutral');
    expect(prefs.technicalProfile.experienceLevel).toBe('intermediate');
  });

  it('should handle SET_PREFERENCES', () => {
    render(<TestComponent />, { wrapper });

    fireEvent.click(screen.getByTestId('set-preferences'));

    const prefsEl = screen.getByTestId('preferences');
    const prefs = JSON.parse(prefsEl.textContent || '{}');
    expect(prefs.customInstructions).toBe('test');
  });

  it('should handle UPDATE_PREFERENCES', () => {
    render(<TestComponent />, { wrapper });

    fireEvent.click(screen.getByTestId('set-preferences'));
    fireEvent.click(screen.getByTestId('update-preferences'));

    const prefsEl = screen.getByTestId('preferences');
    const prefs = JSON.parse(prefsEl.textContent || '{}');
    expect(prefs.customInstructions).toBe('updated');
  });

  it('should handle SET_CONVERSATIONS', () => {
    render(<TestComponent />, { wrapper });

    fireEvent.click(screen.getByTestId('set-conversations'));

    const convsEl = screen.getByTestId('conversations');
    const convs = JSON.parse(convsEl.textContent || '[]');
    expect(convs).toHaveLength(1);
    expect(convs[0].title).toBe('Test');
  });

  it('should handle TOGGLE_CONVERSATION', () => {
    render(<TestComponent />, { wrapper });

    fireEvent.click(screen.getByTestId('set-conversations'));
    fireEvent.click(screen.getByTestId('toggle-conversation'));

    const convsEl = screen.getByTestId('conversations');
    const convs = JSON.parse(convsEl.textContent || '[]');
    expect(convs[0].selected).toBe(true);
  });

  it('should handle UPDATE_CONVERSATION', () => {
    render(<TestComponent />, { wrapper });

    fireEvent.click(screen.getByTestId('set-conversations'));
    fireEvent.click(screen.getByTestId('update-conversation'));

    const convsEl = screen.getByTestId('conversations');
    const convs = JSON.parse(convsEl.textContent || '[]');
    expect(convs[0].title).toBe('Updated');
  });

  it('should handle DELETE_CONVERSATION', () => {
    render(<TestComponent />, { wrapper });

    fireEvent.click(screen.getByTestId('set-conversations'));
    fireEvent.click(screen.getByTestId('delete-conversation'));

    const convsEl = screen.getByTestId('conversations');
    const convs = JSON.parse(convsEl.textContent || '[]');
    expect(convs).toHaveLength(0);
  });

  it('should handle SET_PIPELINE', () => {
    render(<TestComponent />, { wrapper });

    fireEvent.click(screen.getByTestId('set-pipeline'));

    const pipelineEl = screen.getByTestId('pipeline');
    const pipeline = JSON.parse(pipelineEl.textContent || '{}');
    expect(pipeline.stage).toBe('parsing');
    expect(pipeline.progress).toBe(50);
  });

  it('should handle RESET_PIPELINE', () => {
    render(<TestComponent />, { wrapper });

    fireEvent.click(screen.getByTestId('set-pipeline'));
    fireEvent.click(screen.getByTestId('reset-pipeline'));

    const pipelineEl = screen.getByTestId('pipeline');
    const pipeline = JSON.parse(pipelineEl.textContent || '{}');
    expect(pipeline.stage).toBe('idle');
    expect(pipeline.progress).toBe(0);
  });

  it('should throw error when useAppState is used outside AppProvider', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    function ComponentWithoutProvider() {
      try {
        useAppState();
        return <div>No error</div>;
      } catch (e) {
        return <div data-testid="error">{(e as Error).message}</div>;
      }
    }

    render(<ComponentWithoutProvider />);
    expect(screen.getByTestId('error').textContent).toBe('useAppState must be used within AppProvider');

    consoleError.mockRestore();
  });
});

describe('localStorage persistence', () => {
  const wrapper = ({ children }: { children: React.ReactNode }) => <AppProvider>{children}</AppProvider>;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.mocked(localStorage.getItem).mockReset();
    vi.mocked(localStorage.setItem).mockReset();
  });

  it('should load persisted preferences from localStorage on init', () => {
    const stored = {
      preferences: { ...defaultPreferences, customInstructions: 'persisted instruction' },
      conversations: [],
    };
    vi.mocked(localStorage.getItem).mockReturnValue(JSON.stringify(stored));

    render(<TestComponent />, { wrapper });

    const prefs = JSON.parse(screen.getByTestId('preferences').textContent || '{}');
    expect(prefs.customInstructions).toBe('persisted instruction');
  });

  it('should load persisted conversations from localStorage on init', () => {
    const stored = {
      preferences: defaultPreferences,
      conversations: [
        { id: 'saved-1', title: 'Saved Conv', created: '2024-01-01', updated: '2024-01-01', messages: [], selected: true },
      ],
    };
    vi.mocked(localStorage.getItem).mockReturnValue(JSON.stringify(stored));

    render(<TestComponent />, { wrapper });

    const convs = JSON.parse(screen.getByTestId('conversations').textContent || '[]');
    expect(convs).toHaveLength(1);
    expect(convs[0].id).toBe('saved-1');
  });

  it('should fall back to defaults when localStorage has corrupted data', () => {
    vi.mocked(localStorage.getItem).mockReturnValue('invalid json {{{');

    render(<TestComponent />, { wrapper });

    const prefs = JSON.parse(screen.getByTestId('preferences').textContent || '{}');
    expect(prefs.communicationStyle.tone).toBe('neutral');
    expect(JSON.parse(screen.getByTestId('conversations').textContent || '[]')).toEqual([]);
  });

  it('should fall back to defaults when localStorage is empty', () => {
    vi.mocked(localStorage.getItem).mockReturnValue(null);

    render(<TestComponent />, { wrapper });

    const prefs = JSON.parse(screen.getByTestId('preferences').textContent || '{}');
    expect(prefs.communicationStyle.tone).toBe('neutral');
    expect(JSON.parse(screen.getByTestId('conversations').textContent || '[]')).toEqual([]);
  });

  it('should persist preferences to localStorage when they change', async () => {
    vi.mocked(localStorage.getItem).mockReturnValue(null);
    render(<TestComponent />, { wrapper });

    fireEvent.click(screen.getByTestId('set-preferences'));

    await waitFor(() => {
      expect(localStorage.setItem).toHaveBeenCalledWith(
        'opencontext',
        expect.stringContaining('"customInstructions":"test"')
      );
    });
  });

  it('should persist conversations to localStorage when they change', async () => {
    vi.mocked(localStorage.getItem).mockReturnValue(null);
    render(<TestComponent />, { wrapper });

    fireEvent.click(screen.getByTestId('set-conversations'));

    await waitFor(() => {
      expect(localStorage.setItem).toHaveBeenCalledWith(
        'opencontext',
        expect.stringContaining('"title":"Test"')
      );
    });
  });

  it('should not include pipeline state in localStorage', async () => {
    vi.mocked(localStorage.getItem).mockReturnValue(null);
    render(<TestComponent />, { wrapper });

    fireEvent.click(screen.getByTestId('set-pipeline'));

    await waitFor(() => {
      const calls = vi.mocked(localStorage.setItem).mock.calls;
      expect(calls.length).toBeGreaterThan(0);
      const lastCall = calls.at(-1)?.[1] || '';
      expect(JSON.parse(lastCall).pipeline).toBeUndefined();
    });
  });

  it('should use STORAGE_KEY "opencontext" for all reads and writes', async () => {
    vi.mocked(localStorage.getItem).mockReturnValue(null);
    render(<TestComponent />, { wrapper });

    fireEvent.click(screen.getByTestId('set-preferences'));

    await waitFor(() => {
      expect(localStorage.getItem).toHaveBeenCalledWith('opencontext');
      expect(localStorage.setItem).toHaveBeenCalledWith('opencontext', expect.any(String));
    });
  });
});

describe('defaultPreferences export', () => {
  it('should have correct default values', () => {
    expect(defaultPreferences.communicationStyle.tone).toBe('neutral');
    expect(defaultPreferences.communicationStyle.detailLevel).toBe('balanced');
    expect(defaultPreferences.technicalProfile.experienceLevel).toBe('intermediate');
    expect(defaultPreferences.workContext.role).toBe('');
    expect(defaultPreferences.personalContext.interests).toEqual([]);
    expect(defaultPreferences.currentFocus.projects).toEqual([]);
    expect(defaultPreferences.behaviorPreferences.proactiveness).toBe('moderate');
    expect(defaultPreferences.customInstructions).toBe('');
  });
});
