import { createContext, useContext, useEffect, useReducer, type ReactNode } from 'react';
import type {
  UserPreferences,
  NormalizedConversation,
  PipelineState,
} from '../types/preferences';

const defaultPreferences: UserPreferences = {
  communicationStyle: {
    tone: 'neutral',
    detailLevel: 'balanced',
    responseFormat: 'markdown',
    useCodeExamples: true,
    preferStepByStep: false,
    languagePreference: 'English',
  },
  technicalProfile: {
    experienceLevel: 'intermediate',
    primaryLanguages: [],
    frameworks: [],
    tools: [],
  },
  workContext: {
    role: '',
    industry: '',
    description: '',
  },
  personalContext: {
    interests: [],
    background: '',
  },
  currentFocus: {
    projects: [],
    goals: [],
    topOfMind: '',
  },
  behaviorPreferences: {
    proactiveness: 'moderate',
    followUpQuestions: true,
    suggestAlternatives: true,
    warnAboutRisks: true,
    assumeContext: false,
  },
  customInstructions: '',
};

const defaultPipeline: PipelineState = {
  stage: 'idle',
  progress: 0,
  message: '',
  conversationCount: 0,
  messageCount: 0,
};

interface AppState {
  preferences: UserPreferences;
  conversations: NormalizedConversation[];
  pipeline: PipelineState;
}

type AppAction =
  | { type: 'SET_PREFERENCES'; payload: UserPreferences }
  | { type: 'UPDATE_PREFERENCES'; payload: Partial<UserPreferences> }
  | { type: 'SET_CONVERSATIONS'; payload: NormalizedConversation[] }
  | { type: 'TOGGLE_CONVERSATION'; payload: string }
  | { type: 'UPDATE_CONVERSATION'; payload: { id: string; updates: Partial<NormalizedConversation> } }
  | { type: 'DELETE_CONVERSATION'; payload: string }
  | { type: 'SET_PIPELINE'; payload: Partial<PipelineState> }
  | { type: 'RESET_PIPELINE' };

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_PREFERENCES':
      return { ...state, preferences: action.payload };
    case 'UPDATE_PREFERENCES':
      return {
        ...state,
        preferences: { ...state.preferences, ...action.payload },
      };
    case 'SET_CONVERSATIONS':
      return { ...state, conversations: action.payload };
    case 'TOGGLE_CONVERSATION':
      return {
        ...state,
        conversations: state.conversations.map((c) =>
          c.id === action.payload ? { ...c, selected: !c.selected } : c
        ),
      };
    case 'UPDATE_CONVERSATION':
      return {
        ...state,
        conversations: state.conversations.map((c) =>
          c.id === action.payload.id ? { ...c, ...action.payload.updates } : c
        ),
      };
    case 'DELETE_CONVERSATION':
      return {
        ...state,
        conversations: state.conversations.filter((c) => c.id !== action.payload),
      };
    case 'SET_PIPELINE':
      return { ...state, pipeline: { ...state.pipeline, ...action.payload } };
    case 'RESET_PIPELINE':
      return { ...state, pipeline: defaultPipeline };
    default:
      return state;
  }
}

const AppContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
} | null>(null);

const STORAGE_KEY = 'opencontext';

function loadPersistedState(): Pick<AppState, 'preferences' | 'conversations'> {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        preferences: parsed.preferences ?? defaultPreferences,
        conversations: parsed.conversations ?? [],
      };
    }
  } catch {
    // ignore corrupted storage
  }
  return { preferences: defaultPreferences, conversations: [] };
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, undefined, () => ({
    ...loadPersistedState(),
    pipeline: defaultPipeline,
  }));

  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ preferences: state.preferences, conversations: state.conversations })
    );
  }, [state.preferences, state.conversations]);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppState() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppState must be used within AppProvider');
  return ctx;
}

export { defaultPreferences };
