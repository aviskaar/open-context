/** Vendor-agnostic preferences schema that can be translated to any AI provider */

export type ToneStyle = 'formal' | 'casual' | 'neutral' | 'friendly' | 'professional';
export type DetailLevel = 'concise' | 'balanced' | 'thorough';
export type ResponseFormat = 'markdown' | 'plain' | 'structured';
export type ProactivenessLevel = 'minimal' | 'moderate' | 'proactive';

export interface CommunicationStyle {
  tone: ToneStyle;
  detailLevel: DetailLevel;
  responseFormat: ResponseFormat;
  useCodeExamples: boolean;
  preferStepByStep: boolean;
  languagePreference: string;
}

export interface TechnicalProfile {
  experienceLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  primaryLanguages: string[];
  frameworks: string[];
  tools: string[];
}

export interface WorkContext {
  role: string;
  industry: string;
  description: string;
}

export interface PersonalContext {
  interests: string[];
  background: string;
}

export interface CurrentFocus {
  projects: string[];
  goals: string[];
  topOfMind: string;
}

export interface BehaviorPreferences {
  proactiveness: ProactivenessLevel;
  followUpQuestions: boolean;
  suggestAlternatives: boolean;
  warnAboutRisks: boolean;
  assumeContext: boolean;
}

export interface UserPreferences {
  communicationStyle: CommunicationStyle;
  technicalProfile: TechnicalProfile;
  workContext: WorkContext;
  personalContext: PersonalContext;
  currentFocus: CurrentFocus;
  behaviorPreferences: BehaviorPreferences;
  customInstructions: string;
}

/** Normalized conversation format matching the CLI's NormalizedConversation */
export interface NormalizedMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  images?: string[];
  timestamp: string;
  metadata?: {
    model?: string;
    attachments?: string[];
  };
}

export interface NormalizedConversation {
  id: string;
  title: string;
  created: string;
  updated: string;
  messages: NormalizedMessage[];
  selected: boolean;
}

/** Conversion pipeline types */
export type PipelineStage =
  | 'idle'
  | 'uploading'
  | 'parsing'
  | 'normalizing'
  | 'analyzing'
  | 'exporting'
  | 'complete'
  | 'error';

export interface PipelineState {
  stage: PipelineStage;
  progress: number;
  message: string;
  conversationCount: number;
  messageCount: number;
  error?: string;
}

/** Supported AI vendors */
export type VendorId = 'claude' | 'chatgpt' | 'gemini' | 'generic';

export interface VendorInfo {
  id: VendorId;
  name: string;
  description: string;
  supportsPreferences: boolean;
  supportsMemory: boolean;
  supportsConversationImport: boolean;
}

export interface ExportResult {
  vendorId: VendorId;
  files: ExportFile[];
}

export interface ExportFile {
  filename: string;
  content: string;
  description: string;
}
