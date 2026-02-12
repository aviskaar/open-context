import { useAppState } from '../store/context';
import type {
  CommunicationStyle,
  TechnicalProfile,
  WorkContext,
  PersonalContext,
  CurrentFocus,
  BehaviorPreferences,
  ToneStyle,
  DetailLevel,
  ResponseFormat,
  ProactivenessLevel,
} from '../types/preferences';

function TagInput({
  label,
  tags,
  onChange,
  placeholder,
}: {
  label: string;
  tags: string[];
  onChange: (tags: string[]) => void;
  placeholder: string;
}) {
  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const value = e.currentTarget.value.trim();
      if (value && !tags.includes(value)) {
        onChange([...tags, value]);
        e.currentTarget.value = '';
      }
    }
  }

  function removeTag(tag: string) {
    onChange(tags.filter((t) => t !== tag));
  }

  return (
    <div className="field">
      <label>{label}</label>
      <div className="tag-input">
        <div className="tags">
          {tags.map((tag) => (
            <span key={tag} className="tag">
              {tag}
              <button onClick={() => removeTag(tag)} aria-label={`Remove ${tag}`}>
                x
              </button>
            </span>
          ))}
        </div>
        <input
          type="text"
          placeholder={placeholder}
          onKeyDown={handleKeyDown}
        />
      </div>
    </div>
  );
}

export default function PreferencesEditor() {
  const { state, dispatch } = useAppState();
  const { preferences } = state;

  function updateCommunication(updates: Partial<CommunicationStyle>) {
    dispatch({
      type: 'UPDATE_PREFERENCES',
      payload: {
        communicationStyle: { ...preferences.communicationStyle, ...updates },
      },
    });
  }

  function updateTechnical(updates: Partial<TechnicalProfile>) {
    dispatch({
      type: 'UPDATE_PREFERENCES',
      payload: {
        technicalProfile: { ...preferences.technicalProfile, ...updates },
      },
    });
  }

  function updateWork(updates: Partial<WorkContext>) {
    dispatch({
      type: 'UPDATE_PREFERENCES',
      payload: {
        workContext: { ...preferences.workContext, ...updates },
      },
    });
  }

  function updatePersonal(updates: Partial<PersonalContext>) {
    dispatch({
      type: 'UPDATE_PREFERENCES',
      payload: {
        personalContext: { ...preferences.personalContext, ...updates },
      },
    });
  }

  function updateFocus(updates: Partial<CurrentFocus>) {
    dispatch({
      type: 'UPDATE_PREFERENCES',
      payload: {
        currentFocus: { ...preferences.currentFocus, ...updates },
      },
    });
  }

  function updateBehavior(updates: Partial<BehaviorPreferences>) {
    dispatch({
      type: 'UPDATE_PREFERENCES',
      payload: {
        behaviorPreferences: { ...preferences.behaviorPreferences, ...updates },
      },
    });
  }

  return (
    <div className="preferences-editor">
      <h2>Preferences</h2>
      <p className="description">
        Set your preferences once, then export them to any AI vendor.
        These settings define how AI assistants should communicate with you.
      </p>

      {/* Communication Style */}
      <section className="pref-section">
        <h3>Communication Style</h3>
        <div className="fields-grid">
          <div className="field">
            <label htmlFor="tone">Tone</label>
            <select
              id="tone"
              value={preferences.communicationStyle.tone}
              onChange={(e) => updateCommunication({ tone: e.target.value as ToneStyle })}
            >
              <option value="formal">Formal</option>
              <option value="professional">Professional</option>
              <option value="neutral">Neutral</option>
              <option value="friendly">Friendly</option>
              <option value="casual">Casual</option>
            </select>
          </div>

          <div className="field">
            <label htmlFor="detail">Detail Level</label>
            <select
              id="detail"
              value={preferences.communicationStyle.detailLevel}
              onChange={(e) =>
                updateCommunication({ detailLevel: e.target.value as DetailLevel })
              }
            >
              <option value="concise">Concise</option>
              <option value="balanced">Balanced</option>
              <option value="thorough">Thorough</option>
            </select>
          </div>

          <div className="field">
            <label htmlFor="format">Response Format</label>
            <select
              id="format"
              value={preferences.communicationStyle.responseFormat}
              onChange={(e) =>
                updateCommunication({ responseFormat: e.target.value as ResponseFormat })
              }
            >
              <option value="markdown">Markdown</option>
              <option value="plain">Plain text</option>
              <option value="structured">Structured</option>
            </select>
          </div>

          <div className="field">
            <label htmlFor="language">Language</label>
            <input
              id="language"
              type="text"
              value={preferences.communicationStyle.languagePreference}
              onChange={(e) =>
                updateCommunication({ languagePreference: e.target.value })
              }
            />
          </div>

          <div className="field checkbox-group">
            <label>
              <input
                type="checkbox"
                checked={preferences.communicationStyle.useCodeExamples}
                onChange={(e) =>
                  updateCommunication({ useCodeExamples: e.target.checked })
                }
              />
              Include code examples
            </label>
            <label>
              <input
                type="checkbox"
                checked={preferences.communicationStyle.preferStepByStep}
                onChange={(e) =>
                  updateCommunication({ preferStepByStep: e.target.checked })
                }
              />
              Prefer step-by-step instructions
            </label>
          </div>
        </div>
      </section>

      {/* Technical Profile */}
      <section className="pref-section">
        <h3>Technical Profile</h3>
        <div className="fields-grid">
          <div className="field">
            <label htmlFor="experience">Experience Level</label>
            <select
              id="experience"
              value={preferences.technicalProfile.experienceLevel}
              onChange={(e) =>
                updateTechnical({
                  experienceLevel: e.target.value as TechnicalProfile['experienceLevel'],
                })
              }
            >
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
              <option value="expert">Expert</option>
            </select>
          </div>
          <TagInput
            label="Programming Languages"
            tags={preferences.technicalProfile.primaryLanguages}
            onChange={(tags) => updateTechnical({ primaryLanguages: tags })}
            placeholder="e.g. TypeScript, Python (press Enter)"
          />
          <TagInput
            label="Frameworks"
            tags={preferences.technicalProfile.frameworks}
            onChange={(tags) => updateTechnical({ frameworks: tags })}
            placeholder="e.g. React, FastAPI (press Enter)"
          />
          <TagInput
            label="Tools"
            tags={preferences.technicalProfile.tools}
            onChange={(tags) => updateTechnical({ tools: tags })}
            placeholder="e.g. Docker, Git (press Enter)"
          />
        </div>
      </section>

      {/* Work Context */}
      <section className="pref-section">
        <h3>Work Context</h3>
        <div className="fields-grid">
          <div className="field">
            <label htmlFor="role">Role</label>
            <input
              id="role"
              type="text"
              value={preferences.workContext.role}
              onChange={(e) => updateWork({ role: e.target.value })}
              placeholder="e.g. Software Engineer"
            />
          </div>
          <div className="field">
            <label htmlFor="industry">Industry</label>
            <input
              id="industry"
              type="text"
              value={preferences.workContext.industry}
              onChange={(e) => updateWork({ industry: e.target.value })}
              placeholder="e.g. Fintech, Healthcare"
            />
          </div>
          <div className="field full-width">
            <label htmlFor="work-desc">Description</label>
            <textarea
              id="work-desc"
              rows={3}
              value={preferences.workContext.description}
              onChange={(e) => updateWork({ description: e.target.value })}
              placeholder="Briefly describe your work context..."
            />
          </div>
        </div>
      </section>

      {/* Personal Context */}
      <section className="pref-section">
        <h3>Personal Context</h3>
        <div className="fields-grid">
          <div className="field full-width">
            <label htmlFor="background">Background</label>
            <textarea
              id="background"
              rows={3}
              value={preferences.personalContext.background}
              onChange={(e) => updatePersonal({ background: e.target.value })}
              placeholder="Brief background about yourself..."
            />
          </div>
          <TagInput
            label="Interests"
            tags={preferences.personalContext.interests}
            onChange={(tags) => updatePersonal({ interests: tags })}
            placeholder="e.g. distributed systems, ML (press Enter)"
          />
        </div>
      </section>

      {/* Current Focus */}
      <section className="pref-section">
        <h3>Current Focus</h3>
        <div className="fields-grid">
          <TagInput
            label="Active Projects"
            tags={preferences.currentFocus.projects}
            onChange={(tags) => updateFocus({ projects: tags })}
            placeholder="e.g. API migration (press Enter)"
          />
          <TagInput
            label="Goals"
            tags={preferences.currentFocus.goals}
            onChange={(tags) => updateFocus({ goals: tags })}
            placeholder="e.g. Launch MVP (press Enter)"
          />
          <div className="field full-width">
            <label htmlFor="top-of-mind">Top of Mind</label>
            <textarea
              id="top-of-mind"
              rows={2}
              value={preferences.currentFocus.topOfMind}
              onChange={(e) => updateFocus({ topOfMind: e.target.value })}
              placeholder="What are you focused on right now?"
            />
          </div>
        </div>
      </section>

      {/* Behavior Preferences */}
      <section className="pref-section">
        <h3>AI Behavior</h3>
        <div className="fields-grid">
          <div className="field">
            <label htmlFor="proactiveness">Proactiveness</label>
            <select
              id="proactiveness"
              value={preferences.behaviorPreferences.proactiveness}
              onChange={(e) =>
                updateBehavior({ proactiveness: e.target.value as ProactivenessLevel })
              }
            >
              <option value="minimal">Minimal — answer only what I ask</option>
              <option value="moderate">Moderate — balanced suggestions</option>
              <option value="proactive">Proactive — suggest improvements</option>
            </select>
          </div>
          <div className="field checkbox-group">
            <label>
              <input
                type="checkbox"
                checked={preferences.behaviorPreferences.followUpQuestions}
                onChange={(e) =>
                  updateBehavior({ followUpQuestions: e.target.checked })
                }
              />
              Ask follow-up questions when ambiguous
            </label>
            <label>
              <input
                type="checkbox"
                checked={preferences.behaviorPreferences.suggestAlternatives}
                onChange={(e) =>
                  updateBehavior({ suggestAlternatives: e.target.checked })
                }
              />
              Suggest alternative approaches
            </label>
            <label>
              <input
                type="checkbox"
                checked={preferences.behaviorPreferences.warnAboutRisks}
                onChange={(e) =>
                  updateBehavior({ warnAboutRisks: e.target.checked })
                }
              />
              Warn about potential risks
            </label>
            <label>
              <input
                type="checkbox"
                checked={preferences.behaviorPreferences.assumeContext}
                onChange={(e) =>
                  updateBehavior({ assumeContext: e.target.checked })
                }
              />
              Assume context from previous messages
            </label>
          </div>
        </div>
      </section>

      {/* Custom Instructions */}
      <section className="pref-section">
        <h3>Custom Instructions</h3>
        <div className="field full-width">
          <label htmlFor="custom">
            Free-form instructions that will be appended to every vendor export
          </label>
          <textarea
            id="custom"
            rows={4}
            value={preferences.customInstructions}
            onChange={(e) =>
              dispatch({
                type: 'UPDATE_PREFERENCES',
                payload: { customInstructions: e.target.value },
              })
            }
            placeholder="Any additional instructions for the AI..."
          />
        </div>
      </section>
    </div>
  );
}
