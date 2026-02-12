import type { VendorExporter } from './base';
import { claudeExporter } from './claude';
import { chatgptExporter } from './chatgpt';
import { geminiExporter } from './gemini';

export const exporters: Record<string, VendorExporter> = {
  claude: claudeExporter,
  chatgpt: chatgptExporter,
  gemini: geminiExporter,
};

export type { VendorExporter } from './base';
