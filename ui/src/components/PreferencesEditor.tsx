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
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';

function PrefSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card className="bg-card border-border">
      <CardHeader className="px-4 py-3 border-b border-border space-y-0">
        <CardTitle className="text-sm font-semibold text-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        <div className="grid grid-cols-2 gap-4">{children}</div>
      </CardContent>
    </Card>
  );
}

function Field({
  label,
  htmlFor,
  fullWidth,
  children,
}: {
  label: string;
  htmlFor?: string;
  fullWidth?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className={`flex flex-col gap-1.5 ${fullWidth ? 'col-span-2' : ''}`}>
      <Label htmlFor={htmlFor} className="text-xs text-muted-foreground font-medium">
        {label}
      </Label>
      {children}
    </div>
  );
}

function SelectField({
  id,
  value,
  onChange,
  children,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  children: React.ReactNode;
}) {
  return (
    <select
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="bg-input border border-border rounded-md text-foreground text-sm px-3 py-2 w-full focus:outline-none focus:ring-1 focus:ring-ring"
    >
      {children}
    </select>
  );
}

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
    <div className="flex flex-col gap-1.5">
      <Label className="text-xs text-muted-foreground font-medium">{label}</Label>
      <div className="flex flex-col gap-1.5">
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {tags.map((tag) => (
              <Badge
                key={tag}
                variant="secondary"
                className="flex items-center gap-1 text-xs px-2 py-0.5"
              >
                {tag}
                <button
                  onClick={() => removeTag(tag)}
                  aria-label={`Remove ${tag}`}
                  className="text-muted-foreground hover:text-foreground ml-0.5"
                >
                  <X size={10} />
                </button>
              </Badge>
            ))}
          </div>
        )}
        <Input
          type="text"
          placeholder={placeholder}
          onKeyDown={handleKeyDown}
          className="bg-input border-border text-foreground text-sm"
        />
      </div>
    </div>
  );
}

function CheckField({
  id,
  checked,
  onChange,
  label,
}: {
  id: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <Checkbox
        id={id}
        checked={checked}
        onCheckedChange={(v) => onChange(v === true)}
        className="border-border data-[state=checked]:bg-primary data-[state=checked]:border-primary"
      />
      <Label htmlFor={id} className="text-sm text-foreground cursor-pointer">
        {label}
      </Label>
    </div>
  );
}

export default function PreferencesEditor() {
  const { state, dispatch } = useAppState();
  const { preferences } = state;

  function updateCommunication(updates: Partial<CommunicationStyle>) {
    dispatch({
      type: 'UPDATE_PREFERENCES',
      payload: { communicationStyle: { ...preferences.communicationStyle, ...updates } },
    });
  }

  function updateTechnical(updates: Partial<TechnicalProfile>) {
    dispatch({
      type: 'UPDATE_PREFERENCES',
      payload: { technicalProfile: { ...preferences.technicalProfile, ...updates } },
    });
  }

  function updateWork(updates: Partial<WorkContext>) {
    dispatch({
      type: 'UPDATE_PREFERENCES',
      payload: { workContext: { ...preferences.workContext, ...updates } },
    });
  }

  function updatePersonal(updates: Partial<PersonalContext>) {
    dispatch({
      type: 'UPDATE_PREFERENCES',
      payload: { personalContext: { ...preferences.personalContext, ...updates } },
    });
  }

  function updateFocus(updates: Partial<CurrentFocus>) {
    dispatch({
      type: 'UPDATE_PREFERENCES',
      payload: { currentFocus: { ...preferences.currentFocus, ...updates } },
    });
  }

  function updateBehavior(updates: Partial<BehaviorPreferences>) {
    dispatch({
      type: 'UPDATE_PREFERENCES',
      payload: { behaviorPreferences: { ...preferences.behaviorPreferences, ...updates } },
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-xl font-semibold text-foreground">Preferences</h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          Set your preferences once, then export them to any AI vendor.
          These settings define how AI assistants should communicate with you.
        </p>
      </div>

      {/* Communication Style */}
      <PrefSection title="Communication Style">
        <Field label="Tone" htmlFor="tone">
          <SelectField
            id="tone"
            value={preferences.communicationStyle.tone}
            onChange={(v) => updateCommunication({ tone: v as ToneStyle })}
          >
            <option value="formal">Formal</option>
            <option value="professional">Professional</option>
            <option value="neutral">Neutral</option>
            <option value="friendly">Friendly</option>
            <option value="casual">Casual</option>
          </SelectField>
        </Field>

        <Field label="Detail Level" htmlFor="detail">
          <SelectField
            id="detail"
            value={preferences.communicationStyle.detailLevel}
            onChange={(v) => updateCommunication({ detailLevel: v as DetailLevel })}
          >
            <option value="concise">Concise</option>
            <option value="balanced">Balanced</option>
            <option value="thorough">Thorough</option>
          </SelectField>
        </Field>

        <Field label="Response Format" htmlFor="format">
          <SelectField
            id="format"
            value={preferences.communicationStyle.responseFormat}
            onChange={(v) => updateCommunication({ responseFormat: v as ResponseFormat })}
          >
            <option value="markdown">Markdown</option>
            <option value="plain">Plain text</option>
            <option value="structured">Structured</option>
          </SelectField>
        </Field>

        <Field label="Language" htmlFor="language">
          <Input
            id="language"
            type="text"
            value={preferences.communicationStyle.languagePreference}
            onChange={(e) => updateCommunication({ languagePreference: e.target.value })}
            className="bg-input border-border text-foreground text-sm"
          />
        </Field>

        <div className="col-span-2 flex flex-col gap-2">
          <CheckField
            id="code-examples"
            checked={preferences.communicationStyle.useCodeExamples}
            onChange={(v) => updateCommunication({ useCodeExamples: v })}
            label="Include code examples"
          />
          <CheckField
            id="step-by-step"
            checked={preferences.communicationStyle.preferStepByStep}
            onChange={(v) => updateCommunication({ preferStepByStep: v })}
            label="Prefer step-by-step instructions"
          />
        </div>
      </PrefSection>

      {/* Technical Profile */}
      <PrefSection title="Technical Profile">
        <Field label="Experience Level" htmlFor="experience">
          <SelectField
            id="experience"
            value={preferences.technicalProfile.experienceLevel}
            onChange={(v) =>
              updateTechnical({ experienceLevel: v as TechnicalProfile['experienceLevel'] })
            }
          >
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
            <option value="expert">Expert</option>
          </SelectField>
        </Field>

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
      </PrefSection>

      {/* Work Context */}
      <PrefSection title="Work Context">
        <Field label="Role" htmlFor="role">
          <Input
            id="role"
            type="text"
            value={preferences.workContext.role}
            onChange={(e) => updateWork({ role: e.target.value })}
            placeholder="e.g. Software Engineer"
            className="bg-input border-border text-foreground text-sm"
          />
        </Field>
        <Field label="Industry" htmlFor="industry">
          <Input
            id="industry"
            type="text"
            value={preferences.workContext.industry}
            onChange={(e) => updateWork({ industry: e.target.value })}
            placeholder="e.g. Fintech, Healthcare"
            className="bg-input border-border text-foreground text-sm"
          />
        </Field>
        <Field label="Description" htmlFor="work-desc" fullWidth>
          <Textarea
            id="work-desc"
            rows={3}
            value={preferences.workContext.description}
            onChange={(e) => updateWork({ description: e.target.value })}
            placeholder="Briefly describe your work context..."
            className="bg-input border-border text-foreground text-sm resize-y"
          />
        </Field>
      </PrefSection>

      {/* Personal Context */}
      <PrefSection title="Personal Context">
        <Field label="Background" htmlFor="background" fullWidth>
          <Textarea
            id="background"
            rows={3}
            value={preferences.personalContext.background}
            onChange={(e) => updatePersonal({ background: e.target.value })}
            placeholder="Brief background about yourself..."
            className="bg-input border-border text-foreground text-sm resize-y"
          />
        </Field>
        <TagInput
          label="Interests"
          tags={preferences.personalContext.interests}
          onChange={(tags) => updatePersonal({ interests: tags })}
          placeholder="e.g. distributed systems, ML (press Enter)"
        />
      </PrefSection>

      {/* Current Focus */}
      <PrefSection title="Current Focus">
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
        <Field label="Top of Mind" htmlFor="top-of-mind" fullWidth>
          <Textarea
            id="top-of-mind"
            rows={2}
            value={preferences.currentFocus.topOfMind}
            onChange={(e) => updateFocus({ topOfMind: e.target.value })}
            placeholder="What are you focused on right now?"
            className="bg-input border-border text-foreground text-sm resize-y"
          />
        </Field>
      </PrefSection>

      {/* AI Behavior */}
      <PrefSection title="AI Behavior">
        <Field label="Proactiveness" htmlFor="proactiveness">
          <SelectField
            id="proactiveness"
            value={preferences.behaviorPreferences.proactiveness}
            onChange={(v) => updateBehavior({ proactiveness: v as ProactivenessLevel })}
          >
            <option value="minimal">Minimal — answer only what I ask</option>
            <option value="moderate">Moderate — balanced suggestions</option>
            <option value="proactive">Proactive — suggest improvements</option>
          </SelectField>
        </Field>

        <div className="col-span-2 flex flex-col gap-2.5">
          <CheckField
            id="follow-up"
            checked={preferences.behaviorPreferences.followUpQuestions}
            onChange={(v) => updateBehavior({ followUpQuestions: v })}
            label="Ask follow-up questions when ambiguous"
          />
          <CheckField
            id="alternatives"
            checked={preferences.behaviorPreferences.suggestAlternatives}
            onChange={(v) => updateBehavior({ suggestAlternatives: v })}
            label="Suggest alternative approaches"
          />
          <CheckField
            id="risks"
            checked={preferences.behaviorPreferences.warnAboutRisks}
            onChange={(v) => updateBehavior({ warnAboutRisks: v })}
            label="Warn about potential risks"
          />
          <CheckField
            id="context"
            checked={preferences.behaviorPreferences.assumeContext}
            onChange={(v) => updateBehavior({ assumeContext: v })}
            label="Assume context from previous messages"
          />
        </div>
      </PrefSection>

      {/* Custom Instructions */}
      <Card className="bg-card border-border">
        <CardHeader className="px-4 py-3 border-b border-border space-y-0">
          <CardTitle className="text-sm font-semibold text-foreground">Custom Instructions</CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <Field
            label="Free-form instructions that will be appended to every vendor export"
            htmlFor="custom"
            fullWidth
          >
            <Textarea
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
              className="bg-input border-border text-foreground text-sm resize-y col-span-2"
            />
          </Field>
        </CardContent>
      </Card>
    </div>
  );
}
