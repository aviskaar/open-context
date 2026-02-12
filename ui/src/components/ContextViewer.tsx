import { useState } from 'react';
import { useAppState } from '../store/context';
import type { NormalizedConversation } from '../types/preferences';

function ConversationCard({
  conversation,
  onToggle,
  onDelete,
  onSelect,
  isExpanded,
}: {
  conversation: NormalizedConversation;
  onToggle: () => void;
  onDelete: () => void;
  onSelect: () => void;
  isExpanded: boolean;
}) {
  const messageCount = conversation.messages.length;
  const created = new Date(conversation.created).toLocaleDateString();

  return (
    <div className={`conversation-card ${conversation.selected ? 'selected' : ''}`}>
      <div className="card-header">
        <label className="card-checkbox">
          <input
            type="checkbox"
            checked={conversation.selected}
            onChange={onToggle}
          />
        </label>
        <div className="card-info" onClick={onSelect} role="button" tabIndex={0}>
          <h4>{conversation.title || 'Untitled conversation'}</h4>
          <span className="card-meta">
            {messageCount} messages &middot; {created}
          </span>
        </div>
        <button className="btn-icon" onClick={onDelete} aria-label="Delete" title="Delete conversation">
          x
        </button>
      </div>
      {isExpanded && (
        <div className="card-messages">
          {conversation.messages.map((msg, i) => (
            <div key={i} className={`message message-${msg.role}`}>
              <span className="message-role">{msg.role}</span>
              <p className="message-content">
                {msg.content.length > 500
                  ? msg.content.slice(0, 500) + '...'
                  : msg.content}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ContextViewer() {
  const { state, dispatch } = useAppState();
  const { conversations } = state;
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        const parsed = parseImportedData(data);
        dispatch({ type: 'SET_CONVERSATIONS', payload: parsed });
        dispatch({
          type: 'SET_PIPELINE',
          payload: {
            stage: 'complete',
            progress: 100,
            message: `Loaded ${parsed.length} conversations`,
            conversationCount: parsed.length,
            messageCount: parsed.reduce((s, c) => s + c.messages.length, 0),
          },
        });
      } catch {
        dispatch({
          type: 'SET_PIPELINE',
          payload: {
            stage: 'error',
            message: 'Failed to parse file. Make sure it is a valid JSON export.',
          },
        });
      }
    };
    reader.readAsText(file);
  }

  const filtered = conversations.filter((c) =>
    c.title.toLowerCase().includes(search.toLowerCase())
  );

  const selectedCount = conversations.filter((c) => c.selected).length;

  function selectAll() {
    const allSelected = conversations.every((c) => c.selected);
    dispatch({
      type: 'SET_CONVERSATIONS',
      payload: conversations.map((c) => ({ ...c, selected: !allSelected })),
    });
  }

  return (
    <div className="context-viewer">
      <h2>Conversations</h2>
      <p className="description">
        Import your conversation export and review, search, or edit your context
        before exporting.
      </p>

      <div className="upload-area">
        <label className="upload-button" htmlFor="file-upload">
          Upload conversation export (JSON)
        </label>
        <input
          id="file-upload"
          type="file"
          accept=".json"
          onChange={handleFileUpload}
          style={{ display: 'none' }}
        />
        <span className="upload-hint">
          Supports ChatGPT conversations.json
        </span>
      </div>

      {conversations.length > 0 && (
        <>
          <div className="context-toolbar">
            <input
              type="text"
              placeholder="Search conversations..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="search-input"
            />
            <div className="toolbar-actions">
              <span className="selection-count">
                {selectedCount} / {conversations.length} selected
              </span>
              <button className="btn btn-secondary" onClick={selectAll}>
                {conversations.every((c) => c.selected) ? 'Deselect all' : 'Select all'}
              </button>
            </div>
          </div>

          <div className="conversation-list">
            {filtered.map((conv) => (
              <ConversationCard
                key={conv.id}
                conversation={conv}
                onToggle={() =>
                  dispatch({ type: 'TOGGLE_CONVERSATION', payload: conv.id })
                }
                onDelete={() =>
                  dispatch({ type: 'DELETE_CONVERSATION', payload: conv.id })
                }
                onSelect={() =>
                  setExpandedId(expandedId === conv.id ? null : conv.id)
                }
                isExpanded={expandedId === conv.id}
              />
            ))}
          </div>

          {filtered.length === 0 && (
            <p className="empty-state">No conversations match your search.</p>
          )}
        </>
      )}

      {conversations.length === 0 && (
        <div className="empty-state-large">
          <p>No conversations loaded yet.</p>
          <p>Upload your ChatGPT export to get started.</p>
        </div>
      )}
    </div>
  );
}

/** Minimal parser for ChatGPT conversations.json format */
function parseImportedData(data: unknown): NormalizedConversation[] {
  let conversations: Array<Record<string, unknown>> = [];

  if (Array.isArray(data)) {
    conversations = data;
  } else if (typeof data === 'object' && data !== null && 'conversations' in data) {
    conversations = (data as Record<string, unknown>).conversations as Array<Record<string, unknown>>;
  } else {
    throw new Error('Unrecognized format');
  }

  return conversations.map((conv, index) => {
    const messages = extractMessages(conv);
    return {
      id: (conv.conversation_id as string) || `conv-${index}`,
      title: (conv.title as string) || `Conversation ${index + 1}`,
      created: conv.create_time
        ? new Date((conv.create_time as number) * 1000).toISOString()
        : new Date().toISOString(),
      updated: conv.update_time
        ? new Date((conv.update_time as number) * 1000).toISOString()
        : new Date().toISOString(),
      messages,
      selected: true,
    };
  });
}

function extractMessages(conv: Record<string, unknown>) {
  const mapping = conv.mapping as Record<string, Record<string, unknown>> | undefined;
  if (!mapping) return [];

  const messages: NormalizedConversation['messages'] = [];

  // Walk the message tree using BFS
  const rootIds = Object.keys(mapping).filter((id) => {
    const node = mapping[id];
    return !node.parent;
  });

  const queue = [...rootIds];
  const visited = new Set<string>();

  while (queue.length > 0) {
    const nodeId = queue.shift()!;
    if (visited.has(nodeId)) continue;
    visited.add(nodeId);

    const node = mapping[nodeId];
    if (!node) continue;

    const msg = node.message as Record<string, unknown> | null;
    if (msg) {
      const author = msg.author as Record<string, unknown> | undefined;
      const role = author?.role as string;
      const content = msg.content as Record<string, unknown> | undefined;
      const parts = content?.parts as unknown[] | undefined;

      if (role && (role === 'user' || role === 'assistant') && parts) {
        const textContent = parts
          .filter((p): p is string => typeof p === 'string')
          .join('\n')
          .trim();

        if (textContent) {
          messages.push({
            role: role as 'user' | 'assistant',
            content: textContent,
            timestamp: msg.create_time
              ? new Date((msg.create_time as number) * 1000).toISOString()
              : new Date().toISOString(),
          });
        }
      }
    }

    const children = (node.children as string[]) || [];
    queue.push(...children);
  }

  return messages;
}
