import type {
  UserPreferences,
  NormalizedConversation,
  ExportResult,
  VendorInfo,
} from '../types/preferences';

export interface VendorExporter {
  info: VendorInfo;
  exportPreferences(preferences: UserPreferences): ExportResult;
  exportConversations(
    conversations: NormalizedConversation[],
    preferences: UserPreferences
  ): ExportResult;
}
