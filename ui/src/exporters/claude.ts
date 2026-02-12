import type {
  UserPreferences,
  NormalizedConversation,
  VendorInfo,
} from '../types/preferences';
import type { VendorExporter } from './base';

const info: VendorInfo = {
  id: 'claude',
  name: 'Claude',
  description: 'Export as Claude preferences and memory documents',
  supportsPreferences: true,
  supportsMemory: true,
  supportsConversationImport: false,
};

function buildPreferencesDoc(prefs: UserPreferences): string {
  const lines: string[] = [];
  const { communicationStyle: cs, behaviorPreferences: bp } = prefs;

  const toneMap = {
    formal: 'formal and professional',
    casual: 'casual and conversational',
    neutral: 'clear and neutral',
    friendly: 'warm and approachable',
    professional: 'precise and business-like',
  };

  const detailMap = {
    concise: 'concise responses that get to the point quickly',
    balanced: 'balanced responses with enough detail to be thorough but not verbose',
    thorough: 'detailed, comprehensive explanations that cover edge cases',
  };

  lines.push(
    `I prefer ${toneMap[cs.tone]} communication with ${detailMap[cs.detailLevel]}.`
  );

  if (cs.useCodeExamples) {
    lines.push(
      'When explaining technical concepts, please provide code examples where relevant.'
    );
  }

  if (cs.preferStepByStep) {
    lines.push(
      'I prefer step-by-step instructions for complex tasks.'
    );
  }

  if (cs.responseFormat === 'markdown') {
    lines.push('Please use markdown formatting in responses.');
  } else if (cs.responseFormat === 'plain') {
    lines.push('Please keep responses in plain text without heavy formatting.');
  }

  if (bp.proactiveness === 'proactive') {
    lines.push(
      'Feel free to proactively suggest improvements or point out potential issues.'
    );
  } else if (bp.proactiveness === 'minimal') {
    lines.push(
      'Please focus on answering exactly what I ask without adding unsolicited suggestions.'
    );
  }

  if (bp.warnAboutRisks) {
    lines.push('Please warn me about potential risks or pitfalls in my approach.');
  }

  if (bp.suggestAlternatives) {
    lines.push('When relevant, suggest alternative approaches I might consider.');
  }

  if (prefs.customInstructions.trim()) {
    lines.push('');
    lines.push(prefs.customInstructions.trim());
  }

  return lines.join(' ');
}

function buildMemoryDoc(prefs: UserPreferences, conversations: NormalizedConversation[]): string {
  const sections: string[] = [];
  const { workContext, personalContext, currentFocus, technicalProfile } = prefs;

  sections.push('Work context:');
  const workParts: string[] = [];
  if (workContext.role) workParts.push(`User works as a ${workContext.role}`);
  if (workContext.industry) workParts.push(`in the ${workContext.industry} industry`);
  if (workContext.description) workParts.push(`. ${workContext.description}`);
  if (technicalProfile.primaryLanguages.length > 0) {
    workParts.push(
      `. Primary programming languages: ${technicalProfile.primaryLanguages.join(', ')}`
    );
  }
  if (technicalProfile.frameworks.length > 0) {
    workParts.push(`. Frameworks: ${technicalProfile.frameworks.join(', ')}`);
  }
  if (technicalProfile.tools.length > 0) {
    workParts.push(`. Tools: ${technicalProfile.tools.join(', ')}`);
  }
  sections.push(workParts.join('') || 'No work context provided.');

  sections.push('');
  sections.push('Personal context:');
  const personalParts: string[] = [];
  if (personalContext.background) personalParts.push(personalContext.background);
  if (personalContext.interests.length > 0) {
    personalParts.push(`Interests include: ${personalContext.interests.join(', ')}.`);
  }
  personalParts.push(
    `Technical experience level: ${technicalProfile.experienceLevel}.`
  );
  sections.push(personalParts.join(' ') || 'No personal context provided.');

  sections.push('');
  sections.push('Top of mind:');
  const focusParts: string[] = [];
  if (currentFocus.projects.length > 0) {
    focusParts.push(`Active projects: ${currentFocus.projects.join(', ')}.`);
  }
  if (currentFocus.goals.length > 0) {
    focusParts.push(`Goals: ${currentFocus.goals.join(', ')}.`);
  }
  if (currentFocus.topOfMind) {
    focusParts.push(currentFocus.topOfMind);
  }
  if (conversations.length > 0) {
    const recent = [...conversations]
      .sort((a, b) => new Date(b.updated).getTime() - new Date(a.updated).getTime())
      .slice(0, 5)
      .map((c) => c.title);
    focusParts.push(`Recent conversation topics: ${recent.join('; ')}.`);
  }
  sections.push(focusParts.join(' ') || 'No current focus provided.');

  return sections.join('\n');
}

export const claudeExporter: VendorExporter = {
  info,
  exportPreferences(preferences) {
    return {
      vendorId: 'claude',
      files: [
        {
          filename: 'claude-preferences.md',
          content: buildPreferencesDoc(preferences),
          description: 'Communication style preferences for Claude',
        },
      ],
    };
  },
  exportConversations(conversations, preferences) {
    const selected = conversations.filter((c) => c.selected);
    const memory = buildMemoryDoc(preferences, selected);
    const prefs = buildPreferencesDoc(preferences);
    return {
      vendorId: 'claude',
      files: [
        {
          filename: 'claude-preferences.md',
          content: prefs,
          description: 'Communication style preferences for Claude',
        },
        {
          filename: 'claude-memory.md',
          content: memory,
          description: 'Memory and context document for Claude',
        },
      ],
    };
  },
};
