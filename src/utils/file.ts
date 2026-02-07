import { mkdirSync, existsSync, writeFileSync, copyFileSync, readdirSync, statSync } from 'fs';
import { join, basename } from 'path';

/**
 * Ensure directory exists, create if not
 */
export function ensureDir(path: string): void {
  if (!existsSync(path)) {
    mkdirSync(path, { recursive: true });
  }
}

/**
 * Write content to file, ensuring parent directory exists
 */
export function writeFile(path: string, content: string): void {
  const dir = path.substring(0, path.lastIndexOf('/'));
  ensureDir(dir);
  writeFileSync(path, content, 'utf-8');
}

/**
 * Copy images from source directory to destination
 */
export function copyImages(sourceDir: string, destDir: string): number {
  if (!existsSync(sourceDir)) {
    return 0;
  }

  ensureDir(destDir);

  let copiedCount = 0;
  const files = readdirSync(sourceDir);

  for (const file of files) {
    const sourcePath = join(sourceDir, file);
    const stat = statSync(sourcePath);

    if (stat.isFile()) {
      const destPath = join(destDir, file);
      copyFileSync(sourcePath, destPath);
      copiedCount++;
    }
  }

  return copiedCount;
}

/**
 * Sanitize filename (remove special characters, limit length)
 */
export function sanitizeFilename(name: string, maxLength: number = 50): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, maxLength);
}

/**
 * Format file size in human-readable format
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}
