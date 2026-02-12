import type {
  UserPreferences,
  NormalizedConversation,
  VendorInfo,
} from '../types/preferences';
import type { VendorExporter } from './base';

const info: VendorInfo = {
  id: 'gemini',
  name: 'Google Gemini',
  description: 'Export as Gemini Gems / custom instructions',
  supportsPreferences: true,
  supportsMemory: true,
  supportsConversationImport: false,
};

function buildGeminiInstructions(prefs: UserPreferences, conversations: NormalizedConversation[]): string {
  const sections: string[] = [];
  const { communicationStyle: cs, workContext, personalContext, currentFocus, technicalProfile, behaviorPreferences: bp } = prefs;

  // About me section
  const about: string[] = [];
  if (workContext.role) about.push(`I'm a ${workContext.role}.`);
  if (workContext.industry) about.push(`I work in ${workContext.industry}.`);
  if (workContext.description) about.push(workContext.description);
  if (technicalProfile.experienceLevel) {
    about.push(`Technical level: ${technicalProfile.experienceLevel}.`);
  }
  if (technicalProfile.primaryLanguages.length > 0) {
    about.push(`Languages: ${technicalProfile.primaryLanguages.join(', ')}.`);
  }
  if (technicalProfile.frameworks.length > 0) {
    about.push(`Frameworks: ${technicalProfile.frameworks.join(', ')}.`);
  }
  if (personalContext.background) about.push(personalContext.background);
  if (about.length > 0) {
    sections.push('About me:\n' + about.join(' '));
  }

  // Current focus
  const focus: string[] = [];
  if (currentFocus.projects.length > 0) {
    focus.push(`Projects: ${currentFocus.projects.join(', ')}.`);
  }
  if (currentFocus.goals.length > 0) {
    focus.push(`Goals: ${currentFocus.goals.join(', ')}.`);
  }
  if (currentFocus.topOfMind) focus.push(currentFocus.topOfMind);
  if (conversations.length > 0) {
    const recent = [...conversations]
      .sort((a, b) => new Date(b.updated).getTime() - new Date(a.updated).getTime())
      .slice(0, 3)
      .map((c) => c.title);
    focus.push(`Recent topics: ${recent.join('; ')}.`);
  }
  if (focus.length > 0) {
    sections.push('Current focus:\n' + focus.join(' '));
  }

  // Response preferences
  const style: string[] = [];
  const toneMap: Record<string, string> = {
    formal: 'formal', casual: 'casual', neutral: 'neutral',
    friendly: 'friendly', professional: 'professional',
  };
  style.push(`Tone: ${toneMap[cs.tone] || 'neutral'}.`);
  style.push(`Detail: ${cs.detailLevel}.`);
  if (cs.useCodeExamples) style.push('Include code examples.');
  if (cs.preferStepByStep) style.push('Use step-by-step format.');
  if (bp.suggestAlternatives) style.push('Suggest alternatives.');
  if (bp.warnAboutRisks) style.push('Flag risks.');
  sections.push('Response style:\n' + style.join(' '));

  if (prefs.customInstructions.trim()) {
    sections.push('Additional instructions:\n' + prefs.customInstructions.trim());
  }

  return sections.join('\n\n');
}

export const geminiExporter: VendorExporter = {
  info,
  exportPreferences(preferences) {
    return {
      vendorId: 'gemini',
      files: [
        {
          filename: 'gemini-instructions.txt',
          content: buildGeminiInstructions(preferences, []),
          description: 'Custom instructions for Google Gemini',
        },
      ],
    };
  },
  exportConversations(conversations, preferences) {
    return {
      vendorId: 'gemini',
      files: [
        {
          filename: 'gemini-instructions.txt',
          content: buildGeminiInstructions(preferences, conversations),
          description: 'Custom instructions for Google Gemini',
        },
      ],
    };
  },
};
