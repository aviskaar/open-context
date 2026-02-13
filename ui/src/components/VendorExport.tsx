import { useState } from 'react';
import { useAppState } from '../store/context';
import { exporters } from '../exporters';
import type { ExportResult, VendorId } from '../types/preferences';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, Copy, Eye, EyeOff, Check } from 'lucide-react';

function CopyButton({ text, label = 'Copy' }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <Button
      variant="outline"
      size="sm"
      className="border-border text-foreground hover:bg-accent h-7 text-xs gap-1"
      onClick={() => {
        navigator.clipboard.writeText(text).then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 1800);
        });
      }}
    >
      {copied ? <Check size={11} /> : <Copy size={11} />}
      {copied ? 'Copied!' : label}
    </Button>
  );
}

function ExportPreview({ result }: { result: ExportResult }) {
  const [expandedFile, setExpandedFile] = useState<string | null>(null);

  function downloadFile(filename: string, content: string) {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  function downloadAll() {
    for (const file of result.files) {
      downloadFile(file.filename, file.content);
    }
  }

  return (
    <Card className="bg-card border-border overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between py-3 px-4 border-b border-border space-y-0">
        <CardTitle className="text-sm font-semibold text-foreground">Generated Files</CardTitle>
        <Button
          size="sm"
          className="bg-primary text-primary-foreground hover:bg-primary/90 h-7 text-xs gap-1"
          onClick={downloadAll}
        >
          <Download size={12} />
          Download All
        </Button>
      </CardHeader>
      {result.files.map((file) => (
        <div key={file.filename} className="border-b border-border last:border-b-0">
          <div className="flex items-center justify-between px-4 py-3 gap-3">
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground">{file.filename}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{file.description}</p>
            </div>
            <div className="flex gap-1.5 flex-shrink-0">
              <Button
                variant="outline"
                size="sm"
                className="border-border text-foreground hover:bg-accent h-7 text-xs gap-1"
                onClick={() =>
                  setExpandedFile(expandedFile === file.filename ? null : file.filename)
                }
              >
                {expandedFile === file.filename ? (
                  <><EyeOff size={11} /> Hide</>
                ) : (
                  <><Eye size={11} /> Preview</>
                )}
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="border-border text-foreground hover:bg-accent h-7 text-xs gap-1"
                onClick={() => downloadFile(file.filename, file.content)}
              >
                <Download size={11} />
                Download
              </Button>
              <CopyButton text={file.content} />
            </div>
          </div>
          {expandedFile === file.filename && (
            <pre className="bg-background px-4 py-3 text-xs text-muted-foreground whitespace-pre-wrap break-words max-h-96 overflow-y-auto border-t border-border font-mono">
              {file.content}
            </pre>
          )}
        </div>
      ))}
    </Card>
  );
}

export default function VendorExport() {
  const { state } = useAppState();
  const [selectedVendor, setSelectedVendor] = useState<VendorId>('claude');
  const [exportResult, setExportResult] = useState<ExportResult | null>(null);

  const vendorList = Object.values(exporters).map((e) => e.info);

  function runExport() {
    const exporter = exporters[selectedVendor];
    if (!exporter) return;

    const hasConversations = state.conversations.length > 0;
    const result = hasConversations
      ? exporter.exportConversations(state.conversations, state.preferences)
      : exporter.exportPreferences(state.preferences);

    setExportResult(result);
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-xl font-semibold text-foreground">Export</h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          Translate your preferences and context to any AI vendor's format.
          Select a target and generate the output files.
        </p>
      </div>

      {/* Vendor grid */}
      <div className="grid grid-cols-3 gap-3">
        {vendorList.map((vendor) => (
          <button
            key={vendor.id}
            className={`text-left p-4 rounded-md border transition-colors flex flex-col gap-2 ${
              selectedVendor === vendor.id
                ? 'border-foreground/50 bg-secondary'
                : 'border-border bg-card hover:bg-accent'
            }`}
            onClick={() => {
              setSelectedVendor(vendor.id);
              setExportResult(null);
            }}
          >
            <h4 className="text-sm font-semibold text-foreground">{vendor.name}</h4>
            <p className="text-xs text-muted-foreground">{vendor.description}</p>
            <div className="flex gap-1.5 flex-wrap mt-1">
              {vendor.supportsPreferences && (
                <Badge variant="secondary" className="text-xs px-1.5 py-0">Preferences</Badge>
              )}
              {vendor.supportsMemory && (
                <Badge variant="secondary" className="text-xs px-1.5 py-0">Memory</Badge>
              )}
              {vendor.supportsConversationImport && (
                <Badge variant="secondary" className="text-xs px-1.5 py-0">Import</Badge>
              )}
            </div>
          </button>
        ))}
      </div>

      {/* Export action */}
      <div className="flex items-center gap-3">
        <Button
          className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2"
          onClick={runExport}
        >
          <Download size={15} />
          Generate {exporters[selectedVendor]?.info.name} Export
        </Button>
        {state.conversations.length > 0 && (
          <span className="text-sm text-muted-foreground">
            {state.conversations.filter((c) => c.selected).length} conversations will be included
          </span>
        )}
      </div>

      {/* Preview */}
      {exportResult && <ExportPreview result={exportResult} />}
    </div>
  );
}
