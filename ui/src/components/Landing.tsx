import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../store/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight, Layers, RefreshCw, Shield } from 'lucide-react';

const FEATURES = [
  {
    icon: Layers,
    title: 'Portable context',
    desc: 'Carry your full AI conversation history across platforms — never start from scratch.',
  },
  {
    icon: RefreshCw,
    title: 'Any-to-any migration',
    desc: 'Import from ChatGPT or Gemini and export to Claude, or any other vendor you choose.',
  },
  {
    icon: Shield,
    title: 'Fully local',
    desc: 'Nothing leaves your machine. Your data stays yours, processed entirely offline.',
  },
];

export default function Landing() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    setTimeout(() => {
      const ok = login(email, password);
      if (ok) {
        navigate('/');
      } else {
        setError('Please enter an email and password.');
      }
      setLoading(false);
    }, 400);
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top bar */}
      <header className="border-b border-border px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img src="/opencontext-logo.png" alt="opencontext" className="w-6 h-6 rounded-sm" />
          <span className="text-base font-semibold tracking-tight text-foreground">opencontext</span>
        </div>
        <span className="text-xs text-muted-foreground">Portable AI preferences &amp; context</span>
      </header>

      {/* Main */}
      <div className="flex-1 flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-4xl grid grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-20 items-center">

          {/* Left — hero */}
          <div className="flex flex-col gap-8">
            <div className="flex flex-col gap-4">
              <h1 className="text-4xl font-semibold tracking-tight text-foreground leading-tight">
                Your AI context,<br />
                <span className="text-muted-foreground">everywhere you go.</span>
              </h1>
              <p className="text-base text-muted-foreground leading-relaxed">
                opencontext migrates your full chat history and preferences from any AI platform
                into a portable format — so Claude, ChatGPT, and Gemini all know who you are from
                day one.
              </p>
            </div>

            <div className="flex flex-col gap-4">
              {FEATURES.map(({ icon: Icon, title, desc }) => (
                <div key={title} className="flex gap-3 items-start">
                  <div className="w-8 h-8 rounded-md bg-muted border border-border flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Icon size={14} className="text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{title}</p>
                    <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right — login card */}
          <div className="w-full">
            <Card className="bg-card border-border">
              <CardHeader className="px-6 pt-6 pb-4 border-b border-border">
                <CardTitle className="text-base font-semibold text-foreground">
                  Sign in to opencontext
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Use any email and password to continue.
                </p>
              </CardHeader>
              <CardContent className="px-6 py-6">
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="email" className="text-sm text-muted-foreground">
                      Email
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      autoComplete="email"
                      className="bg-input border-border text-foreground"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="password" className="text-sm text-muted-foreground">
                      Password
                    </Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoComplete="current-password"
                      className="bg-input border-border text-foreground"
                    />
                  </div>

                  {error && (
                    <p className="text-sm text-destructive">{error}</p>
                  )}

                  <Button
                    type="submit"
                    disabled={loading}
                    className="bg-primary text-primary-foreground hover:bg-primary/90 w-full gap-2 mt-1"
                  >
                    {loading ? (
                      <span className="animate-pulse">Signing in…</span>
                    ) : (
                      <>
                        Continue
                        <ArrowRight size={15} />
                      </>
                    )}
                  </Button>

                  <p className="text-xs text-center text-muted-foreground pt-1">
                    Demo mode — any non-empty credentials work.
                  </p>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-border px-8 py-4 flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
          opencontext — open source, runs locally
        </span>
        <span className="text-xs text-muted-foreground">
          No data leaves your machine
        </span>
      </footer>
    </div>
  );
}
