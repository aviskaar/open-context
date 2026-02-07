// ChatGPT Export Format Types

export interface ChatGPTExport {
  conversations: ChatGPTConversation[];
}

export interface ChatGPTConversation {
  conversation_id: string;
  title: string;
  create_time: number;
  update_time: number;
  mapping: Record<string, MessageNode>;
  current_node: string;
  moderation_results: any[];
  plugin_ids: any[] | null;
  conversation_template_id: any | null;
  gizmo_id: any | null;
  is_archived: boolean;
  safe_urls: string[];
}

export interface MessageNode {
  id: string;
  message: Message | null;
  parent: string | null;
  children: string[];
}

export interface Message {
  id: string;
  author: {
    role: 'user' | 'assistant' | 'system' | 'tool';
    name?: string;
    metadata?: any;
  };
  create_time: number;
  update_time?: number | null;
  content: {
    content_type: 'text' | 'multimodal_text' | 'code' | 'execution_output';
    parts?: (string | ImagePart)[];
    text?: string;
  };
  status: string;
  end_turn?: boolean | null;
  weight: number;
  metadata: {
    attachments?: Attachment[];
    finish_details?: any;
    citations?: any[];
    gizmo_id?: string | null;
    is_complete?: boolean;
    model_slug?: string;
    timestamp_?: string;
  };
  recipient: string;
}

export interface ImagePart {
  asset_pointer?: string;
  content_type?: string;
  size_bytes?: number;
  width?: number;
  height?: number;
  fovea?: number;
  metadata?: any;
}

export interface Attachment {
  id: string;
  name: string;
  size: number;
  mimeType: string;
  url?: string;
}

export interface ChatGPTUser {
  id: string;
  email?: string;
  name?: string;
  picture?: string;
  created?: number;
}

// Normalized Intermediate Format

export interface NormalizedConversation {
  id: string;
  title: string;
  created: Date;
  updated: Date;
  messages: NormalizedMessage[];
}

export interface NormalizedMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  images?: string[];
  timestamp: Date;
  metadata?: {
    model?: string;
    attachments?: string[];
  };
}

// Extracted Files Structure

export interface ExtractedFiles {
  conversationsPath: string;
  userPath?: string;
  imagesDir?: string;
  tempDir: string;
}
