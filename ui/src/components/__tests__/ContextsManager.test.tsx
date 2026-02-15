import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import React from 'react';
import ContextsManager from '../ContextsManager';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const entry1 = {
  id: 'id-1',
  content: 'Use TypeScript for all projects',
  tags: ['work', 'code'],
  source: 'chat',
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
};

const entry2 = {
  id: 'id-2',
  content: 'Prefer dark mode everywhere',
  tags: ['personal'],
  source: 'ui',
  createdAt: '2024-02-01T00:00:00.000Z',
  updatedAt: '2024-02-15T00:00:00.000Z',
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function renderComponent() {
  return render(
    <MemoryRouter>
      <ContextsManager />
    </MemoryRouter>,
  );
}

function mockFetch(handler: (url: string, init?: RequestInit) => Response | Promise<Response>) {
  vi.stubGlobal('fetch', vi.fn((url: string, init?: RequestInit) => handler(url, init)));
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('ContextsManager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // -------------------------------------------------------------------------
  // Initial render + loading
  // -------------------------------------------------------------------------

  describe('initial render', () => {
    it('shows the page heading and New Context button', async () => {
      mockFetch(() => Response.json([]));
      renderComponent();
      expect(screen.getByText('MCP Contexts')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /new context/i })).toBeInTheDocument();
    });

    it('shows loading state before fetch resolves', () => {
      // Never resolves so we can observe the loading message
      vi.stubGlobal('fetch', vi.fn(() => new Promise(() => {})));
      renderComponent();
      expect(screen.getByText(/loading contexts/i)).toBeInTheDocument();
    });

    it('renders a list of contexts after fetch', async () => {
      mockFetch(() => Response.json([entry1, entry2]));
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText(entry1.content)).toBeInTheDocument();
        expect(screen.getByText(entry2.content)).toBeInTheDocument();
      });
    });

    it('shows empty state when no contexts exist', async () => {
      mockFetch(() => Response.json([]));
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText(/no contexts saved yet/i)).toBeInTheDocument();
      });
    });

    it('shows context count at the bottom', async () => {
      mockFetch(() => Response.json([entry1, entry2]));
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('2 contexts')).toBeInTheDocument();
      });
    });
  });

  // -------------------------------------------------------------------------
  // Error handling
  // -------------------------------------------------------------------------

  describe('error handling', () => {
    it('shows an error banner when fetch fails', async () => {
      mockFetch(() => { throw new Error('Network error'); });
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Network error')).toBeInTheDocument();
      });
    });

    it('shows an error banner when server returns non-ok status', async () => {
      mockFetch(() => new Response('{}', { status: 500 }));
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText(/server error 500/i)).toBeInTheDocument();
      });
    });

    it('dismisses the error banner when X is clicked', async () => {
      mockFetch(() => { throw new Error('Network error'); });
      renderComponent();

      await waitFor(() => screen.getByText('Network error'));

      const dismiss = screen.getByRole('button', { name: '' }); // the X inside the banner
      // Find the dismiss button inside the error banner by looking for the svg sibling
      const banner = screen.getByText('Network error').closest('div[class*="destructive"]') as HTMLElement;
      const dismissBtn = banner.querySelector('button') as HTMLButtonElement;
      fireEvent.click(dismissBtn);

      await waitFor(() => {
        expect(screen.queryByText('Network error')).not.toBeInTheDocument();
      });
    });
  });

  // -------------------------------------------------------------------------
  // Tags and metadata display
  // -------------------------------------------------------------------------

  describe('context card rendering', () => {
    it('renders tags as badges', async () => {
      mockFetch(() => Response.json([entry1]));
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('work')).toBeInTheDocument();
        expect(screen.getByText('code')).toBeInTheDocument();
      });
    });

    it('shows "Updated" date when updatedAt differs from createdAt', async () => {
      mockFetch(() => Response.json([entry2]));
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText(/updated/i)).toBeInTheDocument();
      });
    });

    it('shows the source when it is not "ui"', async () => {
      mockFetch(() => Response.json([entry1]));
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('chat')).toBeInTheDocument();
      });
    });
  });

  // -------------------------------------------------------------------------
  // Search / filter
  // -------------------------------------------------------------------------

  describe('search', () => {
    it('filters contexts by content', async () => {
      mockFetch(() => Response.json([entry1, entry2]));
      renderComponent();

      await waitFor(() => screen.getByText(entry1.content));

      const searchInput = screen.getByPlaceholderText(/search contexts/i);
      fireEvent.change(searchInput, { target: { value: 'typescript' } });

      expect(screen.getByText(entry1.content)).toBeInTheDocument();
      expect(screen.queryByText(entry2.content)).not.toBeInTheDocument();
    });

    it('filters contexts by tag', async () => {
      mockFetch(() => Response.json([entry1, entry2]));
      renderComponent();

      await waitFor(() => screen.getByText(entry1.content));

      const searchInput = screen.getByPlaceholderText(/search contexts/i);
      fireEvent.change(searchInput, { target: { value: 'personal' } });

      expect(screen.queryByText(entry1.content)).not.toBeInTheDocument();
      expect(screen.getByText(entry2.content)).toBeInTheDocument();
    });

    it('shows "no match" message when search yields nothing', async () => {
      mockFetch(() => Response.json([entry1]));
      renderComponent();

      await waitFor(() => screen.getByText(entry1.content));

      const searchInput = screen.getByPlaceholderText(/search contexts/i);
      fireEvent.change(searchInput, { target: { value: 'zzz-no-match' } });

      expect(screen.getByText(/no contexts match your search/i)).toBeInTheDocument();
    });

    it('shows filtered count in the footer', async () => {
      mockFetch(() => Response.json([entry1, entry2]));
      renderComponent();

      await waitFor(() => screen.getByText(entry1.content));

      const searchInput = screen.getByPlaceholderText(/search contexts/i);
      fireEvent.change(searchInput, { target: { value: 'typescript' } });

      expect(screen.getByText(/1 of 2 contexts/i)).toBeInTheDocument();
    });
  });

  // -------------------------------------------------------------------------
  // Create
  // -------------------------------------------------------------------------

  describe('create new context', () => {
    it('toggles the create form on "New Context" click', async () => {
      mockFetch(() => Response.json([]));
      renderComponent();

      await waitFor(() => screen.queryByText(/loading/i) === null);

      const btn = screen.getByRole('button', { name: /new context/i });
      fireEvent.click(btn);

      expect(screen.getByText('New Context', { selector: 'span' })).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/enter context content/i)).toBeInTheDocument();
    });

    it('hides the create form when Cancel is clicked', async () => {
      mockFetch(() => Response.json([]));
      renderComponent();

      await waitFor(() => screen.queryByText(/loading/i) === null);

      fireEvent.click(screen.getByRole('button', { name: /new context/i }));
      expect(screen.getByPlaceholderText(/enter context content/i)).toBeInTheDocument();

      fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
      expect(screen.queryByPlaceholderText(/enter context content/i)).not.toBeInTheDocument();
    });

    it('Save button is disabled when content is empty', async () => {
      mockFetch(() => Response.json([]));
      renderComponent();

      await waitFor(() => screen.queryByText(/loading/i) === null);

      fireEvent.click(screen.getByRole('button', { name: /new context/i }));

      const saveBtn = screen.getByRole('button', { name: /save/i });
      expect(saveBtn).toBeDisabled();
    });

    it('calls POST /api/contexts and adds the new entry', async () => {
      const newEntry = {
        id: 'id-new',
        content: 'New context content',
        tags: ['tag1'],
        source: 'ui',
        createdAt: '2024-03-01T00:00:00.000Z',
        updatedAt: '2024-03-01T00:00:00.000Z',
      };

      const fetchMock = vi.fn()
        .mockResolvedValueOnce(Response.json([]))     // initial GET
        .mockResolvedValueOnce(new Response(JSON.stringify(newEntry), { status: 201 })); // POST
      vi.stubGlobal('fetch', fetchMock);

      renderComponent();
      await waitFor(() => screen.queryByText(/loading/i) === null);

      fireEvent.click(screen.getByRole('button', { name: /new context/i }));

      const textarea = screen.getByPlaceholderText(/enter context content/i);
      const tagsInput = screen.getByPlaceholderText('e.g. work, project, goal');
      fireEvent.change(textarea, { target: { value: 'New context content' } });
      fireEvent.change(tagsInput, { target: { value: 'tag1' } });

      fireEvent.click(screen.getByRole('button', { name: /save/i }));

      await waitFor(() => {
        expect(fetchMock).toHaveBeenCalledWith('/api/contexts', expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ content: 'New context content', tags: ['tag1'], source: 'ui' }),
        }));
        expect(screen.getByText('New context content')).toBeInTheDocument();
      });

      // Form should close after save
      expect(screen.queryByPlaceholderText(/enter context content/i)).not.toBeInTheDocument();
    });

    it('shows error banner when POST fails', async () => {
      const fetchMock = vi.fn()
        .mockResolvedValueOnce(Response.json([]))
        .mockResolvedValueOnce(new Response('{}', { status: 500 }));
      vi.stubGlobal('fetch', fetchMock);

      renderComponent();
      await waitFor(() => screen.queryByText(/loading/i) === null);

      fireEvent.click(screen.getByRole('button', { name: /new context/i }));
      fireEvent.change(screen.getByPlaceholderText(/enter context content/i), {
        target: { value: 'Some content' },
      });
      fireEvent.click(screen.getByRole('button', { name: /save/i }));

      await waitFor(() => {
        expect(screen.getByText(/server error 500/i)).toBeInTheDocument();
      });
    });
  });

  // -------------------------------------------------------------------------
  // Edit
  // -------------------------------------------------------------------------

  describe('edit context', () => {
    it('shows the inline edit form when pencil icon is clicked', async () => {
      mockFetch(() => Response.json([entry1]));
      renderComponent();

      await waitFor(() => screen.getByText(entry1.content));

      const editBtn = screen.getByRole('button', { name: /edit context/i });
      fireEvent.click(editBtn);

      const textarea = screen.getByPlaceholderText(/enter context content/i);
      expect(textarea).toBeInTheDocument();
      expect((textarea as HTMLTextAreaElement).value).toBe(entry1.content);
    });

    it('pre-fills the tags input with existing tags', async () => {
      mockFetch(() => Response.json([entry1]));
      renderComponent();

      await waitFor(() => screen.getByText(entry1.content));

      fireEvent.click(screen.getByRole('button', { name: /edit context/i }));

      const tagsInput = screen.getByPlaceholderText('e.g. work, project, goal');
      expect((tagsInput as HTMLInputElement).value).toBe('work, code');
    });

    it('calls PUT /api/contexts/:id and updates the entry', async () => {
      const updated = { ...entry1, content: 'Updated content', tags: ['updated'] };

      const fetchMock = vi.fn()
        .mockResolvedValueOnce(Response.json([entry1]))
        .mockResolvedValueOnce(Response.json(updated));
      vi.stubGlobal('fetch', fetchMock);

      renderComponent();
      await waitFor(() => screen.getByText(entry1.content));

      fireEvent.click(screen.getByRole('button', { name: /edit context/i }));

      const textarea = screen.getByPlaceholderText(/enter context content/i);
      fireEvent.change(textarea, { target: { value: 'Updated content' } });

      const tagsInput = screen.getByPlaceholderText('e.g. work, project, goal');
      fireEvent.change(tagsInput, { target: { value: 'updated' } });

      fireEvent.click(screen.getByRole('button', { name: /save/i }));

      await waitFor(() => {
        expect(fetchMock).toHaveBeenCalledWith(`/api/contexts/${entry1.id}`, expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify({ content: 'Updated content', tags: ['updated'], source: entry1.source }),
        }));
        expect(screen.getByText('Updated content')).toBeInTheDocument();
      });

      // Edit form should close after save
      expect(screen.queryByPlaceholderText(/enter context content/i)).not.toBeInTheDocument();
    });

    it('closes the edit form when Cancel is clicked', async () => {
      mockFetch(() => Response.json([entry1]));
      renderComponent();

      await waitFor(() => screen.getByText(entry1.content));

      fireEvent.click(screen.getByRole('button', { name: /edit context/i }));
      expect(screen.getByPlaceholderText(/enter context content/i)).toBeInTheDocument();

      fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
      expect(screen.queryByPlaceholderText(/enter context content/i)).not.toBeInTheDocument();
    });

    it('shows error banner when PUT fails', async () => {
      const fetchMock = vi.fn()
        .mockResolvedValueOnce(Response.json([entry1]))
        .mockResolvedValueOnce(new Response('{}', { status: 500 }));
      vi.stubGlobal('fetch', fetchMock);

      renderComponent();
      await waitFor(() => screen.getByText(entry1.content));

      fireEvent.click(screen.getByRole('button', { name: /edit context/i }));
      fireEvent.change(screen.getByPlaceholderText(/enter context content/i), {
        target: { value: 'Edited' },
      });
      fireEvent.click(screen.getByRole('button', { name: /save/i }));

      await waitFor(() => {
        expect(screen.getByText(/server error 500/i)).toBeInTheDocument();
      });
    });
  });

  // -------------------------------------------------------------------------
  // Delete
  // -------------------------------------------------------------------------

  describe('delete context', () => {
    it('calls DELETE /api/contexts/:id and removes the entry', async () => {
      const fetchMock = vi.fn()
        .mockResolvedValueOnce(Response.json([entry1, entry2]))
        .mockResolvedValueOnce(new Response(null, { status: 204 }));
      vi.stubGlobal('fetch', fetchMock);

      renderComponent();
      await waitFor(() => screen.getByText(entry1.content));

      const deleteButtons = screen.getAllByRole('button', { name: /delete context/i });
      // The list is reversed (newest first), so entry2 is first; entry1 is second
      fireEvent.click(deleteButtons[1]);

      await waitFor(() => {
        expect(fetchMock).toHaveBeenCalledWith(`/api/contexts/${entry1.id}`, { method: 'DELETE' });
        expect(screen.queryByText(entry1.content)).not.toBeInTheDocument();
      });

      expect(screen.getByText(entry2.content)).toBeInTheDocument();
    });

    it('shows error banner when DELETE fails', async () => {
      const fetchMock = vi.fn()
        .mockResolvedValueOnce(Response.json([entry1]))
        .mockResolvedValueOnce(new Response('{}', { status: 500 }));
      vi.stubGlobal('fetch', fetchMock);

      renderComponent();
      await waitFor(() => screen.getByText(entry1.content));

      fireEvent.click(screen.getByRole('button', { name: /delete context/i }));

      await waitFor(() => {
        expect(screen.getByText(/server error 500/i)).toBeInTheDocument();
      });
    });
  });

  // -------------------------------------------------------------------------
  // Create form hides edit form and vice-versa
  // -------------------------------------------------------------------------

  describe('form mutual exclusion', () => {
    it('hides the create form when an edit form is opened', async () => {
      mockFetch(() => Response.json([entry1]));
      renderComponent();

      await waitFor(() => screen.getByText(entry1.content));

      // Open create form
      fireEvent.click(screen.getByRole('button', { name: /new context/i }));
      expect(screen.getByPlaceholderText(/enter context content/i)).toBeInTheDocument();

      // Opening edit form should close create form
      fireEvent.click(screen.getByRole('button', { name: /edit context/i }));

      // Only one textarea should be visible (the edit one)
      const textareas = screen.getAllByPlaceholderText(/enter context content/i);
      expect(textareas).toHaveLength(1);
    });

    it('hides the edit form when New Context is clicked again', async () => {
      mockFetch(() => Response.json([entry1]));
      renderComponent();

      await waitFor(() => screen.getByText(entry1.content));

      // Open edit form
      fireEvent.click(screen.getByRole('button', { name: /edit context/i }));
      expect(screen.getByPlaceholderText(/enter context content/i)).toBeInTheDocument();

      // Toggle New Context button
      fireEvent.click(screen.getByRole('button', { name: /new context/i }));

      // Only one textarea visible (the create one, pre-filled with empty string)
      const textareas = screen.getAllByPlaceholderText(/enter context content/i);
      expect(textareas).toHaveLength(1);
      expect((textareas[0] as HTMLTextAreaElement).value).toBe('');
    });
  });
});
