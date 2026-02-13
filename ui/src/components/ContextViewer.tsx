import { useState } from 'react';
import { useAppState } from '../store/context';
import type { NormalizedConversation } from '../types/preferences';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Upload, X, ChevronDown, ChevronRight } from 'lucide-react';

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
    <Card
      className={`bg-card border-border overflow-hidden ${
        conversation.selected ? 'border-foreground/30' : ''
      }`}
    >
      <CardHeader className="flex flex-row items-center gap-3 p-3 space-y-0">
        <Checkbox
          checked={conversation.selected}
          onCheckedChange={onToggle}
          className="border-border data-[state=checked]:bg-primary data-[state=checked]:border-primary flex-shrink-0"
        />
        <div
          className="flex-1 cursor-pointer min-w-0"
          onClick={onSelect}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && onSelect()}
        >
          <h4 className="text-sm font-medium text-foreground overflow-hidden text-ellipsis whitespace-nowrap">
            {conversation.title || 'Untitled conversation'}
          </h4>
          <span className="text-xs text-muted-foreground">
            {messageCount} messages &middot; {created}
          </span>
        </div>
        <button
          onClick={onSelect}
          className="text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
          aria-label={isExpanded ? 'Collapse' : 'Expand'}
        >
          {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </button>
        <button
          className="text-muted-foreground hover:text-destructive transition-colors flex-shrink-0"
          onClick={onDelete}
          aria-label="Delete"
          title="Delete conversation"
        >
          <X size={14} />
        </button>
      </CardHeader>
      {isExpanded && (
        <CardContent className="p-0 border-t border-border">
          <div className="max-h-96 overflow-y-auto p-3 flex flex-col gap-2">
            {conversation.messages.map((msg, i) => (
              <div
                key={i}
                className={`rounded-sm p-2.5 bg-muted border-l-2 ${
                  msg.role === 'user'
                    ? 'border-foreground/60'
                    : msg.role === 'assistant'
                      ? 'border-green-500/60'
                      : 'border-yellow-500/60'
                }`}
              >
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {msg.role}
                </span>
                <p className="text-xs text-foreground mt-1 whitespace-pre-wrap break-words">
                  {msg.content.length > 500
                    ? msg.content.slice(0, 500) + '...'
                    : msg.content}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      )}
    </Card>
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
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-xl font-semibold text-foreground">Conversations</h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          Import your conversation export and review, search, or edit your context before exporting.
        </p>
      </div>

      {/* Upload area */}
      <div className="bg-card border-2 border-dashed border-border rounded-md p-8 text-center">
        <label
          htmlFor="file-upload"
          className="inline-flex items-center gap-2 bg-primary text-primary-foreground text-sm font-medium px-4 py-2 rounded-md cursor-pointer hover:bg-primary/90 transition-colors"
        >
          <Upload size={15} />
          Upload conversation export (JSON)
        </label>
        <input
          id="file-upload"
          type="file"
          accept=".json"
          onChange={handleFileUpload}
          className="hidden"
        />
        <span className="block text-xs text-muted-foreground mt-2">
          Supports ChatGPT conversations.json
        </span>
      </div>

      {/* Toolbar + list */}
      {conversations.length > 0 && (
        <>
          <div className="flex items-center justify-between gap-3">
            <Input
              type="text"
              placeholder="Search conversations..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-input border-border text-foreground text-sm max-w-xs"
            />
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground">
                {selectedCount} / {conversations.length} selected
              </span>
              <Button variant="outline" size="sm" onClick={selectAll} className="border-border text-foreground hover:bg-accent">
                {conversations.every((c) => c.selected) ? 'Deselect all' : 'Select all'}
              </Button>
            </div>
          </div>

          <div className="flex flex-col gap-2">
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
            <p className="text-sm text-muted-foreground text-center py-4">
              No conversations match your search.
            </p>
          )}
        </>
      )}

      {conversations.length === 0 && (
        <div className="text-center text-muted-foreground py-12">
          <p>No conversations loaded yet.</p>
          <p className="mt-1">Upload your ChatGPT export to get started.</p>
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
