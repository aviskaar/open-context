import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { existsSync, mkdirSync, rmSync, writeFileSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import AdmZip from 'adm-zip';

// Mock fs so we can control rmSync for the warn-branch test.
// Default behaviour calls through to the real implementation.
vi.mock('fs', async (importOriginal) => {
  const actual = await importOriginal<typeof import('fs')>();
  return {
    ...actual,
    rmSync: vi.fn(actual.rmSync),
  };
});

// Import the module under test AFTER vi.mock is set up.
const { ZipExtractor } = await import('../src/extractor');
// Get a handle on the mocked rmSync so individual tests can override it.
const { rmSync: mockedRmSync } = await import('fs');

describe('ZipExtractor', () => {
  let extractor: InstanceType<typeof ZipExtractor>;
  let testDir: string;

  beforeEach(() => {
    extractor = new ZipExtractor();
    testDir = join(tmpdir(), `extractor-test-${Date.now()}`);
    mkdirSync(testDir, { recursive: true });
    vi.mocked(mockedRmSync).mockClear();
  });

  afterEach(() => {
    vi.mocked(mockedRmSync).mockRestore();
    // Re-apply real implementation after each test to avoid leaking mocks.
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true });
    }
  });

  describe('extractZip', () => {
    it('extracts zip with conversations.json', async () => {
      const zipPath = createTestZip(testDir, {
        'conversations.json': JSON.stringify([{ conversation_id: 'test' }]),
      });

      const result = await extractor.extractZip(zipPath);

      expect(result.conversationsPath).toContain('conversations.json');
      expect(existsSync(result.conversationsPath)).toBe(true);
      expect(result.tempDir).toBeTruthy();

      extractor.cleanup(result.tempDir);
    });

    it('includes userPath when user.json exists', async () => {
      const zipPath = createTestZip(testDir, {
        'conversations.json': '[]',
        'user.json': JSON.stringify({ id: 'user1', email: 'test@example.com' }),
      });

      const result = await extractor.extractZip(zipPath);

      expect(result.userPath).toBeDefined();
      expect(existsSync(result.userPath!)).toBe(true);

      extractor.cleanup(result.tempDir);
    });

    it('sets userPath to undefined when user.json does not exist', async () => {
      const zipPath = createTestZip(testDir, {
        'conversations.json': '[]',
      });

      const result = await extractor.extractZip(zipPath);
      expect(result.userPath).toBeUndefined();

      extractor.cleanup(result.tempDir);
    });

    it('includes imagesDir when images directory exists', async () => {
      const zipPath = createTestZip(testDir, {
        'conversations.json': '[]',
        'images/test.png': 'fake-image-data',
      });

      const result = await extractor.extractZip(zipPath);

      expect(result.imagesDir).toBeDefined();
      expect(existsSync(result.imagesDir!)).toBe(true);

      extractor.cleanup(result.tempDir);
    });

    it('sets imagesDir to undefined when images directory does not exist', async () => {
      const zipPath = createTestZip(testDir, {
        'conversations.json': '[]',
      });

      const result = await extractor.extractZip(zipPath);
      expect(result.imagesDir).toBeUndefined();

      extractor.cleanup(result.tempDir);
    });

    it('throws error when zip file does not exist', async () => {
      await expect(extractor.extractZip('/nonexistent/file.zip')).rejects.toThrow(
        'Zip file not found'
      );
    });

    it('throws error when conversations.json is missing from zip', async () => {
      const zipPath = createTestZip(testDir, {
        'readme.txt': 'No conversations here',
      });

      await expect(extractor.extractZip(zipPath)).rejects.toThrow(
        'conversations.json not found in zip archive'
      );
    });
  });

  describe('cleanup', () => {
    it('removes temporary directory', () => {
      const tempDir = join(testDir, 'temp-cleanup');
      mkdirSync(tempDir, { recursive: true });
      writeFileSync(join(tempDir, 'test.txt'), 'data');

      expect(existsSync(tempDir)).toBe(true);
      extractor.cleanup(tempDir);
      expect(existsSync(tempDir)).toBe(false);
    });

    it('does nothing when directory does not exist', () => {
      expect(() => extractor.cleanup('/nonexistent/dir')).not.toThrow();
    });

    it('handles errors gracefully without throwing', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      expect(() => extractor.cleanup('/nonexistent/dir')).not.toThrow();
      consoleSpy.mockRestore();
    });

    it('logs a warning when rmSync throws', () => {
      const tempDir = join(testDir, 'temp-throw');
      mkdirSync(tempDir, { recursive: true });
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      vi.mocked(mockedRmSync).mockImplementationOnce(() => {
        throw new Error('permission denied');
      });

      expect(() => extractor.cleanup(tempDir)).not.toThrow();
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Warning: Failed to clean up')
      );

      consoleSpy.mockRestore();
    });
  });
});

function createTestZip(dir: string, files: Record<string, string>): string {
  const zip = new AdmZip();

  for (const [path, content] of Object.entries(files)) {
    zip.addFile(path, Buffer.from(content));
  }

  const zipPath = join(dir, 'test-export.zip');
  zip.writeZip(zipPath);

  return zipPath;
}
