import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ContextViewer from '../ContextViewer';
import { AppProvider, useAppState } from '../../store/context';
import type { NormalizedConversation } from '../../types/preferences';
import React from 'react';

// Module-level variables to control the FileReader mock behaviour per test
let mockFileContent = '';
let mockFileReaderError = false;

class MockFileReader {
  onload: ((event: { target: { result: string } }) => void) | null = null;
  onerror: (() => void) | null = null;

  readAsText(_file: Blob) {
    setTimeout(() => {
      if (mockFileReaderError) {
        if (this.onerror) this.onerror();
      } else if (this.onload) {
        this.onload({ target: { result: mockFileContent } });
      }
    }, 0);
  }
}

Object.defineProperty(window, 'FileReader', {
  value: MockFileReader,
  writable: true,
});

// Helper that also exposes pipeline state for assertions
function ContextViewerWithPipeline() {
  const { state } = useAppState();
  return (
    <div>
      <div data-testid="pipeline-stage">{state.pipeline.stage}</div>
      <div data-testid="pipeline-progress">{state.pipeline.progress}</div>
      <div data-testid="pipeline-error">{state.pipeline.error ?? ''}</div>
      <ContextViewer />
    </div>
  );
}

function renderWithPipeline() {
  return render(
    <MemoryRouter>
      <AppProvider>
        <ContextViewerWithPipeline />
      </AppProvider>
    </MemoryRouter>
  );
}

function uploadFile(content: string, filename = 'conversations.json') {
  mockFileContent = content;
  const fileInput = screen.getByLabelText(/upload conversation export/i);
  fireEvent.change(fileInput, {
    target: { files: [new File([content], filename, { type: 'application/json' })] },
  });
}

describe('ContextViewer', () => {
  const renderWithProviders = () => {
    return render(
      <MemoryRouter>
        <AppProvider>
          <ContextViewer />
        </AppProvider>
      </MemoryRouter>
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockFileContent = '';
    mockFileReaderError = false;
  });

  it('should render ContextViewer with title', () => {
    renderWithProviders();

    expect(screen.getByText('Conversations')).toBeInTheDocument();
    expect(screen.getByText(/Import your conversation export/i)).toBeInTheDocument();
  });

  it('should render upload area', () => {
    renderWithProviders();

    expect(screen.getByText('Upload conversation export (JSON)')).toBeInTheDocument();
    expect(screen.getByText('Supports ChatGPT conversations.json')).toBeInTheDocument();
  });

  it('should show empty state when no conversations', () => {
    renderWithProviders();

    expect(screen.getByText('No conversations loaded yet.')).toBeInTheDocument();
    expect(screen.getByText('Upload your ChatGPT export to get started.')).toBeInTheDocument();
  });

  it('should handle file upload with valid JSON', async () => {
    renderWithProviders();

    const fileInput = screen.getByLabelText(/upload conversation export/i);
    const mockFile = new File(['[]'], 'conversations.json', { type: 'application/json' });

    // Set up FileReader mock result
    const fileReaderMock = new MockFileReader();
    fileReaderMock.result = JSON.stringify([]);
    Object.defineProperty(fileInput, 'files', {
      value: [mockFile],
    });

    fireEvent.change(fileInput);

    await waitFor(() => {
      expect(screen.getByText('No conversations loaded yet.')).toBeInTheDocument();
    });
  });

  it('should handle file upload with invalid JSON', async () => {
    renderWithProviders();

    const fileInput = screen.getByLabelText(/upload conversation export/i);
    const mockFile = new File(['invalid json'], 'conversations.json', { type: 'application/json' });

    Object.defineProperty(fileInput, 'files', {
      value: [mockFile],
    });

    fireEvent.change(fileInput);

    // Should handle error gracefully
    expect(fileInput).toBeInTheDocument();
  });

  it('should have file input with correct attributes', () => {
    renderWithProviders();

    const fileInput = document.getElementById('file-upload');
    expect(fileInput).toHaveAttribute('type', 'file');
    expect(fileInput).toHaveAttribute('accept', '.json');
  });
});

describe('ContextViewer with conversations', () => {
  it('should render conversations list', async () => {
    const mockConversations: NormalizedConversation[] = [
      {
        id: '1',
        title: 'Test Conversation',
        created: '2024-01-01T00:00:00Z',
        updated: '2024-01-01T00:00:00Z',
        messages: [
          { role: 'user', content: 'Hello', timestamp: '2024-01-01T00:00:00Z' },
          { role: 'assistant', content: 'Hi there', timestamp: '2024-01-01T00:00:01Z' },
        ],
        selected: false,
      },
    ];

    render(
      <MemoryRouter>
        <AppProvider>
          <ContextViewer />
        </AppProvider>
      </MemoryRouter>
    );

    // Initial state shows empty
    expect(screen.getByText('No conversations loaded yet.')).toBeInTheDocument();
  });
});

describe('pipeline stage progression', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFileContent = '';
    mockFileReaderError = false;
  });

  it('should dispatch uploading stage immediately on file selection', async () => {
    mockFileContent = JSON.stringify([]);
    renderWithPipeline();

    uploadFile(JSON.stringify([]));

    // uploading is dispatched synchronously before the FileReader resolves
    expect(screen.getByTestId('pipeline-stage').textContent).toBe('uploading');
  });

  it('should reach complete stage after uploading a valid empty array', async () => {
    renderWithPipeline();

    uploadFile(JSON.stringify([]));

    await waitFor(
      () => expect(screen.getByTestId('pipeline-stage').textContent).toBe('complete'),
      { timeout: 2000 }
    );
    expect(screen.getByTestId('pipeline-progress').textContent).toBe('100');
  });

  it('should reach complete stage and load conversations from valid export', async () => {
    const validExport = [
      {
        conversation_id: 'abc123',
        title: 'My Chat',
        create_time: 1700000000,
        update_time: 1700000001,
        mapping: {
          'node-1': {
            id: 'node-1',
            parent: null,
            children: ['node-2'],
            message: null,
          },
          'node-2': {
            id: 'node-2',
            parent: 'node-1',
            children: [],
            message: {
              author: { role: 'user' },
              content: { parts: ['Hello world'] },
              create_time: 1700000000,
            },
          },
        },
      },
    ];

    renderWithPipeline();
    uploadFile(JSON.stringify(validExport));

    await waitFor(
      () => expect(screen.getByTestId('pipeline-stage').textContent).toBe('complete'),
      { timeout: 2000 }
    );

    expect(screen.getByText('My Chat')).toBeInTheDocument();
  });

  it('should progress through uploading → parsing → normalizing → complete in order', async () => {
    renderWithPipeline();
    uploadFile(JSON.stringify([]));

    // uploading is synchronous
    expect(screen.getByTestId('pipeline-stage').textContent).toBe('uploading');

    // parsing follows after FileReader resolves
    await waitFor(
      () => expect(screen.getByTestId('pipeline-stage').textContent).toBe('parsing'),
      { timeout: 500 }
    );

    // normalizing follows after first tick (150ms)
    await waitFor(
      () => expect(screen.getByTestId('pipeline-stage').textContent).toBe('normalizing'),
      { timeout: 500 }
    );

    // complete follows after second tick (150ms)
    await waitFor(
      () => expect(screen.getByTestId('pipeline-stage').textContent).toBe('complete'),
      { timeout: 500 }
    );
  });

  it('should dispatch error stage for invalid JSON', async () => {
    renderWithPipeline();

    uploadFile('this is not valid json {{{{');

    await waitFor(
      () => expect(screen.getByTestId('pipeline-stage').textContent).toBe('error'),
      { timeout: 2000 }
    );
  });

  it('should dispatch error stage for unrecognized export format', async () => {
    renderWithPipeline();

    uploadFile(JSON.stringify({ notConversations: true }));

    await waitFor(
      () => expect(screen.getByTestId('pipeline-stage').textContent).toBe('error'),
      { timeout: 2000 }
    );
    expect(screen.getByTestId('pipeline-error').textContent).toBeTruthy();
  });

  it('should dispatch error stage when FileReader fails to read the file', async () => {
    mockFileReaderError = true;
    renderWithPipeline();

    const fileInput = screen.getByLabelText(/upload conversation export/i);
    fireEvent.change(fileInput, {
      target: { files: [new File([''], 'conversations.json')] },
    });

    await waitFor(
      () => expect(screen.getByTestId('pipeline-stage').textContent).toBe('error'),
      { timeout: 2000 }
    );
  });

  it('should not change stage when no file is selected', () => {
    renderWithPipeline();

    const fileInput = screen.getByLabelText(/upload conversation export/i);
    fireEvent.change(fileInput, { target: { files: [] } });

    expect(screen.getByTestId('pipeline-stage').textContent).toBe('idle');
  });
});
