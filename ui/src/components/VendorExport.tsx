import { useState } from 'react';
import { useAppState } from '../store/context';
import { exporters } from '../exporters';
import type { ExportResult, VendorId } from '../types/preferences';

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
    <div className="export-preview">
      <div className="export-header">
        <h4>Generated Files</h4>
        <button className="btn btn-primary btn-sm" onClick={downloadAll}>
          Download All
        </button>
      </div>
      {result.files.map((file) => (
        <div key={file.filename} className="export-file">
          <div className="export-file-header">
            <div>
              <strong>{file.filename}</strong>
              <p className="export-file-desc">{file.description}</p>
            </div>
            <div className="export-file-actions">
              <button
                className="btn btn-secondary btn-sm"
                onClick={() =>
                  setExpandedFile(
                    expandedFile === file.filename ? null : file.filename
                  )
                }
              >
                {expandedFile === file.filename ? 'Hide' : 'Preview'}
              </button>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => downloadFile(file.filename, file.content)}
              >
                Download
              </button>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => navigator.clipboard.writeText(file.content)}
              >
                Copy
              </button>
            </div>
          </div>
          {expandedFile === file.filename && (
            <pre className="export-file-content">{file.content}</pre>
          )}
        </div>
      ))}
    </div>
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
    <div className="vendor-export">
      <h2>Export</h2>
      <p className="description">
        Translate your preferences and context to any AI vendor's format.
        Select a target and generate the output files.
      </p>

      <div className="vendor-grid">
        {vendorList.map((vendor) => (
          <button
            key={vendor.id}
            className={`vendor-card ${selectedVendor === vendor.id ? 'vendor-active' : ''}`}
            onClick={() => {
              setSelectedVendor(vendor.id);
              setExportResult(null);
            }}
          >
            <h4>{vendor.name}</h4>
            <p>{vendor.description}</p>
            <div className="vendor-features">
              {vendor.supportsPreferences && <span className="badge">Preferences</span>}
              {vendor.supportsMemory && <span className="badge">Memory</span>}
              {vendor.supportsConversationImport && (
                <span className="badge">Import</span>
              )}
            </div>
          </button>
        ))}
      </div>

      <div className="export-actions">
        <button className="btn btn-primary" onClick={runExport}>
          Generate {exporters[selectedVendor]?.info.name} Export
        </button>
        {state.conversations.length > 0 && (
          <span className="export-note">
            {state.conversations.filter((c) => c.selected).length} conversations
            will be included
          </span>
        )}
      </div>

      {exportResult && <ExportPreview result={exportResult} />}
    </div>
  );
}
