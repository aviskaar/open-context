import { useAppState } from '../store/context';
import type { PipelineStage } from '../types/preferences';

const stageLabels: Record<PipelineStage, string> = {
  idle: 'Ready',
  uploading: 'Uploading file...',
  parsing: 'Parsing conversations...',
  normalizing: 'Normalizing data...',
  analyzing: 'Analyzing preferences...',
  exporting: 'Generating export...',
  complete: 'Complete',
  error: 'Error',
};

const stageOrder: PipelineStage[] = [
  'uploading',
  'parsing',
  'normalizing',
  'analyzing',
  'exporting',
  'complete',
];

export default function ConversionPipeline() {
  const { state, dispatch } = useAppState();
  const { pipeline, conversations } = state;

  const currentStageIndex = stageOrder.indexOf(pipeline.stage);

  function resetPipeline() {
    dispatch({ type: 'RESET_PIPELINE' });
    dispatch({ type: 'SET_CONVERSATIONS', payload: [] });
  }

  return (
    <div className="conversion-pipeline">
      <h2>Conversion Pipeline</h2>
      <p className="description">
        Monitor the progress of your conversation import and conversion.
      </p>

      {/* Stage progress */}
      <div className="pipeline-stages">
        {stageOrder.map((stage, index) => {
          let status: 'pending' | 'active' | 'done' | 'error' = 'pending';
          if (pipeline.stage === 'error' && index <= currentStageIndex) {
            status = index === currentStageIndex ? 'error' : 'done';
          } else if (index < currentStageIndex) {
            status = 'done';
          } else if (index === currentStageIndex) {
            status = 'active';
          }

          return (
            <div key={stage} className={`pipeline-stage stage-${status}`}>
              <div className="stage-indicator">
                {status === 'done' ? (
                  <span className="stage-check">&#10003;</span>
                ) : status === 'error' ? (
                  <span className="stage-error">!</span>
                ) : status === 'active' ? (
                  <span className="stage-active">&#9679;</span>
                ) : (
                  <span className="stage-pending">&#9675;</span>
                )}
              </div>
              <span className="stage-label">{stageLabels[stage]}</span>
            </div>
          );
        })}
      </div>

      {/* Progress bar */}
      {pipeline.stage !== 'idle' && (
        <div className="progress-section">
          <div className="progress-bar">
            <div
              className={`progress-fill ${pipeline.stage === 'error' ? 'progress-error' : ''}`}
              style={{ width: `${pipeline.progress}%` }}
            />
          </div>
          <p className="progress-message">{pipeline.message}</p>
        </div>
      )}

      {/* Stats */}
      <div className="pipeline-stats">
        <div className="stat-card">
          <span className="stat-value">{pipeline.conversationCount}</span>
          <span className="stat-label">Conversations</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{pipeline.messageCount}</span>
          <span className="stat-label">Messages</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">
            {conversations.filter((c) => c.selected).length}
          </span>
          <span className="stat-label">Selected</span>
        </div>
      </div>

      {/* Error display */}
      {pipeline.stage === 'error' && pipeline.error && (
        <div className="error-banner">
          <strong>Error:</strong> {pipeline.error}
        </div>
      )}

      {/* Actions */}
      {(pipeline.stage === 'complete' || pipeline.stage === 'error') && (
        <div className="pipeline-actions">
          <button className="btn btn-secondary" onClick={resetPipeline}>
            Reset
          </button>
        </div>
      )}

      {pipeline.stage === 'idle' && (
        <div className="empty-state-large">
          <p>No conversion in progress.</p>
          <p>Go to the Conversations tab to upload an export file.</p>
        </div>
      )}
    </div>
  );
}
