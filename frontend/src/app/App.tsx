import { useState, useEffect, useCallback } from "react";
import { BrowserRouter, Navigate, Route, Routes, useNavigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./auth";
import ProtectedRoute from "./ProtectedRoute";
import { request } from "./api";
import {
  LayoutDashboard, Users, Briefcase, Upload, Brain, Zap,
  Trophy, Bell, Settings, Search, Moon, Sun, LogOut,
  ChevronRight, Plus, TrendingUp, DollarSign, CheckCircle,
  Download, Copy, Bot, Sparkles, ArrowRight, Activity, Cpu,
  Eye, X, Menu, FileText, User, Mail, Lock, Building, MapPin,
  Calendar, Award, Send, Star, MessageSquare, Shield, Database,
  Inbox, Clock, AlertCircle, Filter, RefreshCw, GitBranch,
  Code, BookOpen, Globe, BarChart3, Target, Layers, ChevronDown,
  Play, Check, Loader, ArrowUpRight, Network, Gauge, MemoryStick,
  Sparkle, BrainCircuit, FlaskConical, Lightbulb, Workflow
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  LineChart, Line
} from "recharts";
import { motion, AnimatePresence } from "motion/react";

// ─── TYPES ───────────────────────────────────────────────────────────────────

type Page =
  | "login" | "dashboard" | "create-job" | "resume-upload"
  | "candidates" | "candidate-detail" | "interview-questions"
  | "hindsight" | "cascadeflow" | "ranking" | "notifications" | "settings";

interface Candidate {
  id: number; name: string; initials: string; role: string;
  score: number; experience: string; location: string;
  skills: string[]; missing: string[]; education: string;
  status: string; aiConfidence: number; summary: string;
}

type WorkspaceState = {
  jobs: any[];
  candidates: any[];
  resumes: any[];
  user: any | null;
};

const EMPTY_WORKSPACE: WorkspaceState = { jobs: [], candidates: [], resumes: [], user: null };

// ─── MOCK DATA ────────────────────────────────────────────────────────────────

const EMPTY_CANDIDATES: Candidate[] = [];
const EMPTY_MEMORIES: Array<{ id: number; date: string; type: string; title: string; description: string; confidence: number; impact: string }> = [];
const EMPTY_NOTIFS: Array<{ id: number; type: string; title: string; message: string; time: string; read: boolean }> = [];

const MEMORIES = [] as Array<{ id: number; date: string; type: string; title: string; description: string; confidence: number; impact: string }>;

const NOTIFS = [] as Array<{ id: number; type: string; title: string; message: string; time: string; read: boolean }>;

const COST_DATA = [
  { day: 'Mon', gpt4: 8.4, llama: 2.1, gemini: 1.4 },
  { day: 'Tue', gpt4: 9.1, llama: 2.3, gemini: 1.6 },
  { day: 'Wed', gpt4: 7.8, llama: 2.0, gemini: 1.3 },
  { day: 'Thu', gpt4: 8.9, llama: 2.4, gemini: 1.5 },
  { day: 'Fri', gpt4: 7.2, llama: 1.9, gemini: 1.2 },
  { day: 'Sat', gpt4: 6.8, llama: 1.8, gemini: 1.1 },
  { day: 'Sun', gpt4: 7.6, llama: 2.2, gemini: 1.4 },
];

const MODEL_DIST = [
  { name: 'GPT-4o', value: 42, color: '#6366F1' },
  { name: 'Llama 3', value: 38, color: '#22D3EE' },
  { name: 'Gemini Flash', value: 20, color: '#A78BFA' },
];

const MODEL_ROUTES = [
  { task: 'Resume Parsing', model: 'Llama 3', cost: '$0.02', latency: '470ms', reason: 'Fast extraction for structured resume data' },
  { task: 'Job Description Drafting', model: 'GPT-4o', cost: '$0.08', latency: '1.1s', reason: 'High-quality writing with strong context' },
  { task: 'Candidate Matching', model: 'GPT-4o', cost: '$0.10', latency: '1.3s', reason: 'Best scoring quality for nuanced matches' },
  { task: 'Interview Questions', model: 'Llama 3', cost: '$0.03', latency: '620ms', reason: 'Low-cost generation for personalized prompts' },
];

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function scoreColor(score: number) {
  if (score >= 90) return "text-emerald-400";
  if (score >= 80) return "text-cyan-400";
  if (score >= 70) return "text-yellow-400";
  return "text-orange-400";
}

function scoreBg(score: number) {
  if (score >= 90) return "bg-emerald-500/15 border-emerald-500/30";
  if (score >= 80) return "bg-cyan-500/15 border-cyan-500/30";
  if (score >= 70) return "bg-yellow-500/15 border-yellow-500/30";
  return "bg-orange-500/15 border-orange-500/30";
}

function statusBadge(status: string) {
  if (status === "strong_hire") return { label: "Strong Hire", cls: "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30" };
  if (status === "hire") return { label: "Hire", cls: "bg-blue-500/15 text-blue-400 border border-blue-500/30" };
  if (status === "hired") return { label: "Hired", cls: "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30" };
  if (status === "rejected") return { label: "Rejected", cls: "bg-red-500/15 text-red-400 border border-red-500/30" };
  if (status === "offer_sent") return { label: "Offer Sent", cls: "bg-cyan-500/15 text-cyan-400 border border-cyan-500/30" };
  return { label: "Consider", cls: "bg-yellow-500/15 text-yellow-400 border border-yellow-500/30" };
}

function getUserInitials(user: { name?: string; email?: string } | null | undefined) {
  const fullName = user?.name?.trim();
  if (fullName) {
    return fullName
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((word) => word[0])
      .join("")
      .toUpperCase();
  }

  if (user?.email) {
    return user.email.charAt(0).toUpperCase();
  }

  return "U";
}

function getFirstName(user: { name?: string } | null | undefined) {
  const fullName = user?.name?.trim();
  if (!fullName) return "Recruiter";
  return fullName.split(/\s+/).filter(Boolean)[0] || "Recruiter";
}

// Avatar component
function Avatar({ initials, size = "md", gradient }: { initials: string; size?: "sm" | "md" | "lg"; gradient?: string }) {
  const sz = size === "sm" ? "w-8 h-8 text-xs" : size === "lg" ? "w-14 h-14 text-lg" : "w-10 h-10 text-sm";
  const g = gradient || "from-indigo-500 to-purple-600";
  return (
    <div className={`${sz} rounded-full bg-gradient-to-br ${g} flex items-center justify-center font-semibold text-white flex-shrink-0`}>
      {initials}
    </div>
  );
}

// Glassmorphism card
function GlassCard({ children, className = "", ...props }: { children: React.ReactNode; className?: string } & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div {...props} className={`bg-card/60 dark:bg-white/[0.04] backdrop-blur-xl border border-border rounded-2xl ${className}`}>
      {children}
    </div>
  );
}

// KPI Card
function KpiCard({ title, value, sub, icon: Icon, color, trend }: {
  title: string; value: string; sub: string;
  icon: React.ElementType; color: string; trend?: number;
}) {
  return (
    <GlassCard className="p-5 flex flex-col gap-3 hover:border-white/20 transition-all duration-300 group cursor-default">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{title}</span>
        <div className={`w-9 h-9 rounded-xl ${color} bg-opacity-20 flex items-center justify-center`}>
          <Icon className={`w-4 h-4 ${color.replace("bg-", "text-")}`} />
        </div>
      </div>
      <div className="flex items-end justify-between">
        <span className="text-2xl font-bold text-foreground font-display">{value}</span>
        {trend !== undefined && (
          <span className={`text-xs font-medium px-2 py-1 rounded-lg ${trend >= 0 ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"}`}>
            {trend >= 0 ? "+" : ""}{trend}%
          </span>
        )}
      </div>
      <span className="text-xs text-muted-foreground">{sub}</span>
    </GlassCard>
  );
}

// Skill tag
function SkillTag({ label, missing = false }: { label: string; missing?: boolean }) {
  return (
    <span className={`text-xs px-2.5 py-1 rounded-lg font-medium border ${missing ? "bg-red-500/10 text-red-400 border-red-500/20" : "bg-indigo-500/10 text-indigo-300 border-indigo-500/20"}`}>
      {missing && "✗ "}{label}
    </span>
  );
}

// Section header
function SectionHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between mb-6">
      <div>
        <h1 className="text-xl font-bold text-foreground font-display">{title}</h1>
        {subtitle && <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

// ─── SIDEBAR ─────────────────────────────────────────────────────────────────

const NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "create-job", label: "Create Job", icon: Briefcase },
  { id: "resume-upload", label: "Resume Upload", icon: Upload },
  { id: "candidates", label: "Candidates", icon: Users },
  { id: "interview-questions", label: "Interview AI", icon: MessageSquare },
  { id: "ranking", label: "Ranking", icon: Trophy },
  { id: "hindsight", label: "Hindsight", icon: BrainCircuit },
  { id: "cascadeflow", label: "cascadeflow", icon: Workflow },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "settings", label: "Settings", icon: Settings },
];

function Sidebar({ page, setPage, collapsed, setCollapsed, user }: {
  page: Page; setPage: (p: Page) => void;
  collapsed: boolean; setCollapsed: (b: boolean) => void;
  user: WorkspaceState['user'];
}) {
  const unread = NOTIFS.filter(n => !n.read).length;
  return (
    <motion.aside
      animate={{ width: collapsed ? 72 : 240 }}
      transition={{ duration: 0.25, ease: "easeInOut" }}
      className="h-screen bg-sidebar border-r border-sidebar-border flex flex-col flex-shrink-0 overflow-hidden z-30"
    >
      {/* Logo */}
      <div className="h-16 flex items-center px-4 gap-3 border-b border-sidebar-border flex-shrink-0">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-indigo-500/30">
          <BrainCircuit className="w-5 h-5 text-white" />
        </div>
        <AnimatePresence>
          {!collapsed && (
            <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.15 }}>
              <div className="text-sm font-bold text-sidebar-foreground font-display whitespace-nowrap">RecruitAI</div>
              <div className="text-[10px] text-sidebar-accent-foreground whitespace-nowrap">Powered by cascadeflow</div>
            </motion.div>
          )}
        </AnimatePresence>
        <button onClick={() => setCollapsed(!collapsed)} className="ml-auto text-muted-foreground hover:text-foreground transition-colors flex-shrink-0">
          <Menu className="w-4 h-4" />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 flex flex-col gap-1 px-2">
        {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
          const active = page === id;
          return (
            <button
              key={id}
              onClick={() => setPage(id as Page)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 relative group ${active ? "bg-sidebar-accent text-sidebar-primary" : "text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"}`}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <AnimatePresence>
                {!collapsed && (
                  <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="whitespace-nowrap">
                    {label}
                  </motion.span>
                )}
              </AnimatePresence>
              {id === "notifications" && unread > 0 && (
                <span className={`${collapsed ? "absolute top-1 right-1" : "ml-auto"} w-5 h-5 rounded-full bg-indigo-500 text-white text-[10px] font-bold flex items-center justify-center`}>
                  {unread}
                </span>
              )}
              {id === "hindsight" && !collapsed && (
                <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded-md bg-purple-500/20 text-purple-400 font-bold">AI</span>
              )}
              {id === "cascadeflow" && !collapsed && (
                <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded-md bg-cyan-500/20 text-cyan-400 font-bold">$</span>
              )}
            </button>
          );
        })}
      </nav>

      {/* User */}
      <div className="border-t border-sidebar-border p-3">
        <div className="flex items-center gap-3">
          <Avatar initials={getUserInitials(user)} size="sm" gradient="from-indigo-400 to-cyan-500" />
          <AnimatePresence>
            {!collapsed && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 min-w-0">
                <div className="text-xs font-semibold text-sidebar-foreground truncate">{user?.name || 'Recruiter'}</div>
                <div className="text-[10px] text-muted-foreground truncate">{user?.email || 'RecruitAI workspace'}</div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.aside>
  );
}

// ─── TOP NAV ─────────────────────────────────────────────────────────────────

function TopNav({ page, isDark, setIsDark, setPage, unreadCount, user }: {
  page: Page; isDark: boolean; setIsDark: (b: boolean) => void;
  setPage: (p: Page) => void; unreadCount: number; user: WorkspaceState['user'];
}) {
  const labels: Record<string, string> = {
    dashboard: "Dashboard", "create-job": "Create Job Requirement",
    "resume-upload": "Resume Upload", candidates: "Candidate Analysis",
    "candidate-detail": "Candidate Profile", "interview-questions": "AI Interview Questions",
    hindsight: "Hindsight Memory", cascadeflow: "cascadeflow Runtime",
    ranking: "Candidate Ranking", notifications: "Notifications", settings: "Settings",
  };
  return (
    <header className="h-16 border-b border-border bg-background/80 backdrop-blur-xl flex items-center px-6 gap-4 flex-shrink-0 z-20">
      <div className="flex-1">
        <h2 className="text-sm font-semibold text-foreground">{labels[page] || page}</h2>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <span>RecruitAI</span>
          <ChevronRight className="w-3 h-3" />
          <span className="text-foreground">{labels[page]}</span>
        </div>
      </div>

      <div className="flex items-center gap-1.5 bg-input-background rounded-xl px-3 py-2 w-56 border border-border">
        <Search className="w-3.5 h-3.5 text-muted-foreground" />
        <input placeholder="Search candidates…" className="bg-transparent text-xs text-foreground placeholder:text-muted-foreground outline-none flex-1" />
      </div>

      <button onClick={() => setIsDark(!isDark)} className="w-9 h-9 rounded-xl border border-border bg-card hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-all">
        {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
      </button>

      <button onClick={() => setPage("notifications")} className="w-9 h-9 rounded-xl border border-border bg-card hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-all relative">
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 bg-indigo-500 rounded-full text-[9px] text-white font-bold flex items-center justify-center">{unreadCount}</span>}
      </button>

      <Avatar initials={getUserInitials(user)} size="sm" gradient="from-indigo-400 to-cyan-500" />
    </header>
  );
}

// ─── LOGIN PAGE ───────────────────────────────────────────────────────────────

function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("Password123!");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await request('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password: pw }) });
      login(data.token, data.user);
      navigate('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0F1E] flex items-center justify-center relative overflow-hidden">
      {/* Animated background orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-500/15 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "2s" }} />
        {/* Grid pattern */}
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,.3) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.3) 1px,transparent 1px)", backgroundSize: "40px 40px" }} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-md px-4"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-2xl shadow-indigo-500/40 mb-4">
            <BrainCircuit className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white font-display">RecruitAI</h1>
          <p className="text-slate-400 mt-2 text-sm">Hire Smarter with AI — powered by cascadeflow & Hindsight</p>
        </div>

        {/* Card */}
        <div className="bg-white/[0.05] backdrop-blur-2xl border border-white/10 rounded-2xl p-8 shadow-2xl">
          <h2 className="text-lg font-semibold text-white mb-6">Sign in to your workspace</h2>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-slate-400 mb-1.5 block">Work Email</label>
              <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-2.5">
                <Mail className="w-4 h-4 text-slate-500" />
                <input value={email} onChange={e => setEmail(e.target.value)} className="bg-transparent text-sm text-white placeholder:text-slate-500 outline-none flex-1" />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-400 mb-1.5 block">Password</label>
              <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-2.5">
                <Lock className="w-4 h-4 text-slate-500" />
                <input type="password" value={pw} onChange={e => setPw(e.target.value)} className="bg-transparent text-sm text-white placeholder:text-slate-500 outline-none flex-1" />
              </div>
            </div>
            {error && <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</div>}
            <button
              onClick={handleLogin}
              disabled={loading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold text-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/25 disabled:opacity-60"
            >
              {loading ? <><Loader className="w-4 h-4 animate-spin" /> Authenticating…</> : "Sign In"}
            </button>
          </div>

          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-xs text-slate-500">or continue with</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            {[{ name: "Google", color: "from-red-500/20 to-orange-500/20", border: "border-red-500/20" },
              { name: "Microsoft", color: "from-blue-500/20 to-cyan-500/20", border: "border-blue-500/20" }].map(p => (
              <button key={p.name} onClick={handleLogin} className={`flex items-center justify-center gap-2 py-2.5 rounded-xl border ${p.border} bg-gradient-to-r ${p.color} text-sm text-white hover:brightness-110 transition-all`}>
                <Globe className="w-4 h-4" /> {p.name}
              </button>
            ))}
          </div>
        </div>

        <div className="text-center text-xs text-slate-600 mt-4">
          <button onClick={() => navigate('/signup')} className="text-indigo-400 hover:text-indigo-300">Create an account</button>
        </div>
      </motion.div>
    </div>
  );
}

function SignupPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', companyName: '', email: '', password: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [strength, setStrength] = useState(0);

  const evaluateStrength = (value: string) => {
    let score = 0;
    if (value.length >= 8) score += 1;
    if (/[A-Z]/.test(value)) score += 1;
    if (/\d/.test(value)) score += 1;
    if (/[^A-Za-z0-9]/.test(value)) score += 1;
    setStrength(score);
  };

  useEffect(() => {
    evaluateStrength(form.password);
  }, [form.password]);

  const handleChange = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSignup = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await request('/api/auth/signup', {
        method: 'POST',
        body: JSON.stringify({ ...form })
      });
      login(data.token, data.user);
      navigate('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0F1E] flex items-center justify-center relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-500/15 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="relative z-10 w-full max-w-lg px-4 py-8">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-2xl shadow-indigo-500/40 mb-3">
            <BrainCircuit className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white font-display">Create your RecruitAI workspace</h1>
          <p className="text-slate-400 mt-2 text-sm">Start with a clean workspace and build your own hiring pipeline.</p>
        </div>
        <div className="bg-white/[0.05] backdrop-blur-2xl border border-white/10 rounded-2xl p-6 shadow-2xl space-y-4">
          {error && <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</div>}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-slate-400 mb-1.5 block">Name</label>
              <input value={form.name} onChange={e => handleChange('name', e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white outline-none" />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-400 mb-1.5 block">Company Name</label>
              <input value={form.companyName} onChange={e => handleChange('companyName', e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white outline-none" />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-400 mb-1.5 block">Work Email</label>
            <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-2.5">
              <Mail className="w-4 h-4 text-slate-500" />
              <input type="email" value={form.email} onChange={e => handleChange('email', e.target.value)} className="bg-transparent text-sm text-white placeholder:text-slate-500 outline-none flex-1" />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-400 mb-1.5 block">Password</label>
            <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-2.5">
              <Lock className="w-4 h-4 text-slate-500" />
              <input type="password" value={form.password} onChange={e => handleChange('password', e.target.value)} className="bg-transparent text-sm text-white placeholder:text-slate-500 outline-none flex-1" />
            </div>
            <div className="mt-2 h-2 rounded-full bg-white/10 overflow-hidden">
              <div className={`h-full rounded-full transition-all ${strength >= 3 ? 'bg-emerald-500' : strength >= 2 ? 'bg-yellow-500' : 'bg-red-500'}`} style={{ width: `${(strength / 4) * 100}%` }} />
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Use 8+ chars with uppercase, number, and symbol for a strong password.</p>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-400 mb-1.5 block">Confirm Password</label>
            <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-2.5">
              <Lock className="w-4 h-4 text-slate-500" />
              <input type="password" value={form.confirmPassword} onChange={e => handleChange('confirmPassword', e.target.value)} className="bg-transparent text-sm text-white placeholder:text-slate-500 outline-none flex-1" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[{ name: 'Google', color: 'from-red-500/20 to-orange-500/20', border: 'border-red-500/20' }, { name: 'Microsoft', color: 'from-blue-500/20 to-cyan-500/20', border: 'border-blue-500/20' }].map(p => (
              <button key={p.name} className={`flex items-center justify-center gap-2 py-2.5 rounded-xl border ${p.border} bg-gradient-to-r ${p.color} text-sm text-white hover:brightness-110 transition-all`}>
                <Globe className="w-4 h-4" /> {p.name}
              </button>
            ))}
          </div>
          <button onClick={handleSignup} disabled={loading} className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold text-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/25 disabled:opacity-60">
            {loading ? <><Loader className="w-4 h-4 animate-spin" /> Creating workspace…</> : 'Create Account'}
          </button>
          <p className="text-center text-xs text-slate-500">Already have an account? <button onClick={() => navigate('/login')} className="text-indigo-400 hover:text-indigo-300">Sign in</button></p>
        </div>
      </motion.div>
    </div>
  );
}

// ─── DASHBOARD ────────────────────────────────────────────────────────────────

function Dashboard({ setPage, setSelectedId, workspace, refreshWorkspace, token }: { setPage: (p: Page) => void; setSelectedId: (id: number) => void; workspace: WorkspaceState; refreshWorkspace?: () => Promise<void> | void; token?: string | null }) {
  const [demoStep, setDemoStep] = useState(-1);
  const [demoRunning, setDemoRunning] = useState(false);
  const [aiCostSaved, setAiCostSaved] = useState("$0");
  const [memoryReuses, setMemoryReuses] = useState("0");
  const [demoNotification, setDemoNotification] = useState<string | null>(null);

  const candidateStatusData = [
    { name: 'Strong Hire', value: workspace.candidates.filter((candidate: any) => candidate.status === 'strong_hire').length, color: '#10b981' },
    { name: 'Hire', value: workspace.candidates.filter((candidate: any) => candidate.status === 'hire').length, color: '#3b82f6' },
    { name: 'Consider', value: workspace.candidates.filter((candidate: any) => candidate.status === 'consider' || candidate.status === 'new').length, color: '#f59e0b' }
  ];

  const resumeStatusData = [
    { name: 'Uploaded', value: workspace.resumes.filter((resume: any) => resume.status === 'uploaded').length, color: '#6366f1' },
    { name: 'Processing', value: workspace.resumes.filter((resume: any) => resume.status === 'processing').length, color: '#06b6d4' },
    { name: 'Complete', value: workspace.resumes.filter((resume: any) => resume.status === 'complete').length, color: '#10b981' }
  ];

  const hiringFunnelData = [
    { stage: 'Applied', count: Math.max(workspace.candidates.length, 1) },
    { stage: 'Screened', count: Math.max(Math.ceil(workspace.candidates.length * 0.7), 1) },
    { stage: 'Interview', count: Math.max(Math.ceil(workspace.candidates.length * 0.4), 1) },
    { stage: 'Offer', count: Math.max(Math.ceil(workspace.candidates.length * 0.2), 1) }
  ];

  const flowData = workspace.jobs.length > 0 || workspace.candidates.length > 0 ? [
    { month: 'Jan', applied: Math.max(workspace.candidates.length, 1), hired: Math.max(Math.ceil(workspace.candidates.length * 0.2), 0) },
    { month: 'Feb', applied: Math.max(workspace.candidates.length + 1, 2), hired: Math.max(Math.ceil(workspace.candidates.length * 0.25), 1) },
    { month: 'Mar', applied: Math.max(workspace.candidates.length + 2, 3), hired: Math.max(Math.ceil(workspace.candidates.length * 0.3), 1) }
  ] : [];

  const jobAnalyticsData = [
    { name: 'Jobs', value: workspace.jobs.length },
    { name: 'Candidates', value: workspace.candidates.length },
    { name: 'Resumes', value: workspace.resumes.length }
  ];

  const DEMO_STEPS = [
    "Reading Job Description",
    "Uploading Resume",
    "Parsing Resume (Groq)",
    "Extracting Skills",
    "AI Match Scoring",
    "Searching Hindsight Memory",
    "Ranking Candidates",
    "Generating Interview Questions",
    "Recommendation Ready"
  ];

  const runDemo = async () => {
    if (demoRunning) return;
    setDemoRunning(true);
    setDemoStep(0);
    setDemoNotification(null);

    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

    try {
      // Step 1: Reading Job Description
      await delay(1200);
      setDemoStep(1);
      try {
        await request('/api/jobs', {
          method: 'POST',
          body: JSON.stringify({
            title: "Staff Frontend Architect",
            company: "Figma Labs",
            location: "San Francisco, CA (Hybrid)",
            description: "We are seeking a staff frontend architect to design our next-generation design systems and collaborative editors using React and Canvas/WebGL.",
            requirements: "React, TypeScript, Node.js, WebGL, Canvas"
          })
        }, token);
      } catch (e) {
        console.error("Job creation failed in demo", e);
      }

      // Step 2: Uploading Resume
      await delay(1200);
      setDemoStep(2);
      try {
        await request('/api/resumes/upload', {
          method: 'POST',
          body: JSON.stringify({
            filename: "Sarah_Chen_Resume.pdf",
            originalName: "Sarah_Chen_Resume.pdf",
            size: "142 KB",
            status: "uploaded",
            score: 95,
            name: "Sarah Chen",
            email: "sarah.chen@example.com",
            text: "Staff Frontend Architect with expertise in React, TypeScript, canvas graphics, and state machines. Designed design systems at Uber."
          })
        }, token);
      } catch (e) {
        console.error("Resume 1 upload failed in demo", e);
      }

      // Step 3: Parsing Resume (Groq)
      await delay(1200);
      setDemoStep(3);
      try {
        await request('/api/resumes/upload', {
          method: 'POST',
          body: JSON.stringify({
            filename: "Michael_Vance_Resume.pdf",
            originalName: "Michael_Vance_Resume.pdf",
            size: "115 KB",
            status: "uploaded",
            score: 86,
            name: "Michael Vance",
            email: "michael.vance@example.com",
            text: "Senior Frontend Engineer specializing in React, TypeScript, testing, and performance optimization."
          })
        }, token);
      } catch (e) {
        console.error("Resume 2 upload failed in demo", e);
      }

      // Step 4: Extracting Skills
      await delay(1200);
      setDemoStep(4);
      try {
        await request('/api/resumes/upload', {
          method: 'POST',
          body: JSON.stringify({
            filename: "Aisha_Patel_CV.pdf",
            originalName: "Aisha_Patel_CV.pdf",
            size: "98 KB",
            status: "uploaded",
            score: 72,
            name: "Aisha Patel",
            email: "aisha.patel@example.com",
            text: "Frontend Developer working with React, JavaScript, HTML, and CSS. 2 years experience."
          })
        }, token);
      } catch (e) {
        console.error("Resume 3 upload failed in demo", e);
      }

      // Step 5: AI Match Scoring
      await delay(1200);
      setDemoStep(5);

      // Step 6: Searching Hindsight Memory
      await delay(1200);
      setDemoStep(6);
      setMemoryReuses("3");

      // Step 7: Ranking Candidates
      await delay(1200);
      setDemoStep(7);

      // Step 8: Generating Interview Questions
      await delay(1200);
      setDemoStep(8);
      setAiCostSaved("$14.80");

      // Step 9: Recommendation Ready
      await delay(1200);
      setDemoStep(9);

      if (refreshWorkspace) {
        await refreshWorkspace();
      }

      setDemoNotification("AI Live Demo completed successfully! Dashboard statistics and candidates have been updated.");
    } catch (error) {
      console.error(error);
    } finally {
      setDemoRunning(false);
    }
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-card border border-border rounded-xl p-3 shadow-xl text-xs">
        <p className="font-medium text-foreground mb-1">{label}</p>
        {payload.map((p: any) => (
          <p key={p.name} style={{ color: p.color }}>{p.name}: {p.value}</p>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {demoNotification && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-4 py-3 rounded-xl flex items-center justify-between shadow-lg"
        >
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 flex-shrink-0" />
            <span className="font-semibold text-sm">{demoNotification}</span>
          </div>
          <button onClick={() => setDemoNotification(null)} className="text-emerald-400/80 hover:text-emerald-300">
            <X className="w-4 h-4" />
          </button>
        </motion.div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground font-display">Good morning, {getFirstName(workspace.user)} 👋</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Here&apos;s what&apos;s happening with your hiring pipeline today.</p>
        </div>
        <button
          onClick={runDemo}
          disabled={demoRunning}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-semibold hover:opacity-90 transition-opacity shadow-lg shadow-indigo-500/25 disabled:opacity-60"
        >
          {demoRunning ? (
            <Loader className="w-4 h-4 animate-spin" />
          ) : (
            <Play className="w-4 h-4" />
          )}
          {demoRunning ? "Running Demo…" : "▶ Run Live AI Demo"}
        </button>
      </div>

      {/* Demo Progress */}
      <AnimatePresence>
        {demoStep >= 0 && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
            className="bg-indigo-500/10 border border-indigo-500/30 rounded-2xl p-4">
            <div className="flex items-center gap-3 mb-3">
              <Bot className="w-5 h-5 text-indigo-400 animate-bounce" />
              <span className="text-sm font-semibold text-indigo-300">AI Live Demo</span>
              {!demoRunning && <span className="ml-auto text-xs text-emerald-400 font-medium flex items-center gap-1"><Check className="w-3.5 h-3.5" /> Complete</span>}
            </div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 md:grid-cols-9">
              {DEMO_STEPS.map((s, i) => {
                const isCompleted = i < demoStep;
                const isRunning = i === demoStep;
                const isPending = i > demoStep;
                return (
                  <div key={i} className={`text-[10px] px-3 py-2.5 rounded-xl border flex items-center gap-1.5 transition-all duration-300 ${
                    isCompleted ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" :
                    isRunning ? "bg-indigo-500/20 border-indigo-500/50 text-indigo-200 animate-pulse font-medium shadow-md shadow-indigo-500/10" :
                    "bg-white/5 border-transparent text-muted-foreground"
                  }`}>
                    {isCompleted && <Check className="w-3.5 h-3.5 flex-shrink-0" />}
                    {isRunning && <Loader className="w-3.5 h-3.5 animate-spin flex-shrink-0" />}
                    {isPending && <Clock className="w-3.5 h-3.5 flex-shrink-0 opacity-40" />}
                    <span className="truncate">{s}</span>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {workspace.jobs.length === 0 && workspace.candidates.length === 0 && workspace.resumes.length === 0 ? (
        <GlassCard className="p-6 text-center">
          <h3 className="text-lg font-semibold text-foreground">Your workspace is ready</h3>
          <p className="text-sm text-muted-foreground mt-2">Create your first job opening or upload a resume to start building your own isolated pipeline.</p>
          <div className="flex justify-center gap-3 mt-4">
            <button onClick={() => setPage('create-job')} className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-medium">Create a job</button>
            <button onClick={() => setPage('resume-upload')} className="px-4 py-2 rounded-xl border border-border text-sm text-muted-foreground">Upload resumes</button>
          </div>
        </GlassCard>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            <KpiCard title="Total Candidates" value={String(workspace.candidates.length)} sub="This workspace" icon={Users} color="bg-indigo-500" trend={workspace.candidates.length ? 8 : 0} />
            <KpiCard title="Active Openings" value={String(workspace.jobs.length)} sub="Owned by you" icon={Briefcase} color="bg-purple-500" trend={workspace.jobs.length ? 3 : 0} />
            <KpiCard title="Resumes Uploaded" value={String(workspace.resumes.length)} sub="Ready to review" icon={Upload} color="bg-cyan-500" trend={workspace.resumes.length ? 5 : 0} />
            <KpiCard title="Strong Hires" value={String(workspace.candidates.filter((candidate: any) => candidate.status === 'strong_hire').length)} sub="From this workspace" icon={Star} color="bg-emerald-500" trend={0} />
            <KpiCard title="AI Cost Saved" value={aiCostSaved} sub={aiCostSaved === "$0" ? "Start using cascadeflow" : "Saved from LLM fallback"} icon={DollarSign} color="bg-yellow-500" trend={aiCostSaved !== "$0" ? 100 : 0} />
            <KpiCard title="Memory Reuses" value={memoryReuses} sub={memoryReuses === "0" ? "Waiting for first insights" : "Hindsight matches found"} icon={BrainCircuit} color="bg-rose-500" trend={memoryReuses !== "0" ? 100 : 0} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <GlassCard className="lg:col-span-2 p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-semibold text-foreground">Your Jobs</h3>
                  <p className="text-xs text-muted-foreground">Only jobs created in this workspace appear here.</p>
                </div>
              </div>
              <div className="space-y-3">
                {workspace.jobs.length === 0 ? <div className="text-sm text-muted-foreground">No jobs yet. Create one to begin.</div> : workspace.jobs.slice(0, 3).map((job: any) => (
                  <div key={job._id} className="rounded-xl border border-border bg-white/5 p-3">
                    <div className="text-sm font-semibold text-foreground">{job.title || 'Untitled role'}</div>
                    <div className="text-xs text-muted-foreground">{job.location || 'Location TBD'}</div>
                  </div>
                ))}
              </div>
            </GlassCard>
            <GlassCard className="p-5">
              <h3 className="text-sm font-semibold text-foreground mb-4">Recent Resumes</h3>
              <div className="space-y-3">
                {workspace.resumes.length === 0 ? <div className="text-sm text-muted-foreground">No resumes have been uploaded yet.</div> : workspace.resumes.slice(0, 3).map((resume: any) => (
                  <div key={resume._id} className="rounded-xl border border-border bg-white/5 p-3">
                    <div className="text-sm font-semibold text-foreground">{resume.originalName || resume.filename}</div>
                    <div className="text-xs text-muted-foreground">{resume.status}</div>
                  </div>
                ))}
              </div>
            </GlassCard>
          </div>
        </>
      )}

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <GlassCard className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-foreground">Candidate Status</h3>
              <p className="text-xs text-muted-foreground">Live counts from this workspace</p>
            </div>
          </div>
          {candidateStatusData.every(item => item.value === 0) ? (
            <div className="h-[180px] flex flex-col items-center justify-center">
              <Users className="w-12 h-12 text-muted-foreground/30 mb-3" />
              <p className="text-xs text-muted-foreground text-center">No candidate data yet.<br />Upload resumes to see analytics.</p>
            </div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={candidateStatusData.filter(item => item.value > 0)} dataKey="value" nameKey="name" innerRadius={40} outerRadius={70} paddingAngle={2}>
                    {candidateStatusData.filter(item => item.value > 0).map((entry) => <Cell key={entry.name} fill={entry.color} />)}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </>
          )}
          <div className="mt-3 space-y-2">
            {candidateStatusData.map((item) => (
              <div key={item.name} className="flex items-center justify-between text-xs text-muted-foreground">
                <span className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />{item.name}</span>
                <span className="font-medium text-foreground">{item.value}</span>
              </div>
            ))}
          </div>
        </GlassCard>

        <GlassCard className="lg:col-span-2 p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-foreground">Candidate Flow</h3>
              <p className="text-xs text-muted-foreground">Applied vs Hired — Live workspace trend</p>
            </div>
            <span className="text-xs px-2 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 font-medium">Live data</span>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={flowData}>
              <defs>
                <linearGradient id="gApplied" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366F1" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6366F1" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gHired" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22D3EE" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#22D3EE" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="applied" name="Applied" stroke="#6366F1" fill="url(#gApplied)" strokeWidth={2} />
              <Area type="monotone" dataKey="hired" name="Hired" stroke="#22D3EE" fill="url(#gHired)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </GlassCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <GlassCard className="p-5">
          <h3 className="text-sm font-semibold text-foreground mb-1">Resume Processing</h3>
          <p className="text-xs text-muted-foreground mb-4">Current resume pipeline status</p>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={resumeStatusData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {resumeStatusData.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </GlassCard>

        <GlassCard className="p-5">
          <h3 className="text-sm font-semibold text-foreground mb-1">Job Analytics</h3>
          <p className="text-xs text-muted-foreground mb-4">Current workspace volume</p>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={jobAnalyticsData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" radius={[4, 4, 0, 0]} fill="#6366f1" />
            </BarChart>
          </ResponsiveContainer>
        </GlassCard>

        <GlassCard className="p-5">
          <h3 className="text-sm font-semibold text-foreground mb-1">Hiring Funnel</h3>
          <p className="text-xs text-muted-foreground mb-4">Current pipeline status</p>
          <div className="space-y-2">
            {hiringFunnelData.map((f, i) => {
              const pct = Math.round((f.count / Math.max(hiringFunnelData[0].count, 1)) * 100);
              const colors = ["bg-indigo-500", "bg-purple-500", "bg-cyan-500", "bg-blue-500", "bg-emerald-500", "bg-yellow-500"];
              return (
                <div key={f.stage}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-muted-foreground">{f.stage}</span>
                    <span className="font-medium text-foreground">{f.count}</span>
                  </div>
                  <div className="h-1.5 bg-white/5 rounded-full">
                    <div className={`h-full rounded-full ${colors[i]} transition-all duration-500`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </GlassCard>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Recent candidates */}
        <GlassCard className="lg:col-span-2 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-foreground">AI Recommended Candidates</h3>
            <button onClick={() => setPage("candidates")} className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1">View all <ArrowRight className="w-3 h-3" /></button>
          </div>
          <div className="space-y-3">
            {workspace.candidates.slice(0, 3).map((c: any) => {
              const badge = statusBadge(c.status);
              return (
                <div key={c._id || c.id} onClick={() => { setSelectedId(c.id); setPage("candidate-detail"); }} className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors cursor-pointer group">
                  <Avatar initials={(c.name || 'U').split(' ').map((word: string) => word[0]).join('').toUpperCase().slice(0, 2)} gradient={c.id === 1 ? "from-indigo-500 to-purple-600" : c.id === 2 ? "from-cyan-500 to-blue-600" : "from-purple-500 to-pink-600"} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-foreground">{c.name}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${badge.cls}`}>{badge.label}</span>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{c.email || 'Candidate'} · {c.status || 'new'}</p>
                  </div>
                  <div className={`text-sm font-bold px-3 py-1.5 rounded-xl border ${scoreBg(c.score || 0)} ${scoreColor(c.score || 0)}`}>
                    {c.score || 0}%
                  </div>
                </div>
              );
            })}
          </div>
        </GlassCard>

        {/* AI Widget */}
        <GlassCard className="p-5 flex flex-col">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="text-sm font-semibold text-foreground">AI Recruiter</div>
              <div className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /><span className="text-[10px] text-muted-foreground">Online</span></div>
            </div>
          </div>
          <div className="flex-1 space-y-3 mb-4">
            {[
              { msg: `I found ${Math.max(workspace.candidates.length, 0)} candidate${workspace.candidates.length === 1 ? '' : 's'} in your workspace.`, type: "ai" },
              { msg: `${workspace.jobs.length} active opening${workspace.jobs.length === 1 ? '' : 's'} are ready to review.`, type: "ai" },
              { msg: `${workspace.resumes.length} resume${workspace.resumes.length === 1 ? '' : 's'} are waiting for review.`, type: "ai" },
            ].map((m, i) => (
              <div key={i} className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-3 text-xs text-foreground leading-relaxed">
                <span className="text-indigo-400 font-medium">🤖 </span>{m.msg}
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            {["Generate Questions", "View Candidates"].map(label => (
              <button key={label} onClick={() => setPage(label === "Generate Questions" ? "interview-questions" : "candidates")}
                className="flex-1 py-2 rounded-xl text-[11px] font-medium bg-indigo-500/15 text-indigo-300 border border-indigo-500/20 hover:bg-indigo-500/25 transition-colors">
                {label}
              </button>
            ))}
          </div>
        </GlassCard>
      </div>
    </div>
  );
}

// ─── CREATE JOB ───────────────────────────────────────────────────────────────

function CreateJobPage({ onCreated, refreshWorkspace }: { onCreated?: () => void; refreshWorkspace?: () => Promise<void> }) {
  const { token } = useAuth();
  const [step, setStep] = useState(1);
  const [skills, setSkills] = useState(["React", "TypeScript", "Node.js"]);
  const [generating, setGenerating] = useState(false);
  const [jdGenerated, setJdGenerated] = useState(false);
  const [newSkill, setNewSkill] = useState("");
  const [form, setForm] = useState({ title: 'Senior React Developer', department: 'Engineering', location: 'Remote / San Francisco', employmentType: 'Full-time', salary: '$140,000 – $200,000', workMode: 'Remote', description: 'We are hiring a senior frontend engineer to own high-impact product experiences.' });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleGenerate = () => {
    setGenerating(true);
    setTimeout(() => { setGenerating(false); setJdGenerated(true); }, 2000);
  };

  const STEPS = ["Job Details", "Requirements", "AI Description", "Review"];
  const AI_SUGGESTIONS = ["Docker", "Kubernetes", "GraphQL", "Redis", "Jest"];

  const handlePublish = async () => {
    setSaving(true);
    setMessage(null);
    try {
      await request('/api/jobs', {
        method: 'POST',
        body: JSON.stringify({
          title: form.title,
          company: form.department,
          location: form.location,
          description: form.description || JD_TEXT,
          requirements: skills.join(', ')
        })
      }, token);
      setMessage('Job opening created and added to your workspace.');
      await refreshWorkspace?.();
      onCreated?.();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Unable to create job');
    } finally {
      setSaving(false);
    }
  };

  const JD_TEXT = `We are seeking a passionate ${form.title} to join our world-class engineering team. You will architect and deliver scalable front-end solutions that serve millions of users globally.

Key Responsibilities:
• Lead development of complex React applications with TypeScript
• Collaborate with design and backend teams to deliver pixel-perfect features
• Mentor junior developers and conduct thorough code reviews
• Drive technical decisions and maintain high code quality standards

You will thrive here if you are obsessed with performance, user experience, and writing clean, maintainable code.`;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <SectionHeader title="Create Job Requirement" subtitle="AI-assisted job posting creation" />

      {/* Steps */}
      <div className="flex items-center gap-0">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center flex-1">
            <button onClick={() => setStep(i + 1)} className="flex items-center gap-2 group">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${step > i + 1 ? "bg-emerald-500 text-white" : step === i + 1 ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/30" : "bg-white/10 text-muted-foreground"}`}>
                {step > i + 1 ? <Check className="w-4 h-4" /> : i + 1}
              </div>
              <span className={`text-xs font-medium hidden sm:block ${step === i + 1 ? "text-foreground" : "text-muted-foreground"}`}>{s}</span>
            </button>
            {i < STEPS.length - 1 && <div className={`flex-1 h-px mx-2 ${step > i + 1 ? "bg-emerald-500/50" : "bg-white/10"}`} />}
          </div>
        ))}
      </div>

      <GlassCard className="p-6">
        {step === 1 && (
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground">Job Details</h3>
            <div className="grid grid-cols-2 gap-4">
              {[["Job Title", "title"], ["Department", "department"], ["Location", "location"], ["Employment Type", "employmentType"]].map(([l, field]) => (
                <div key={l}>
                  <label className="text-xs text-muted-foreground mb-1.5 block">{l}</label>
                  <input value={form[field as keyof typeof form]} onChange={e => setForm(prev => ({ ...prev, [field]: e.target.value }))} className="w-full bg-input-background border border-border rounded-xl px-3 py-2.5 text-sm text-foreground outline-none focus:border-indigo-500 transition-colors" />
                </div>
              ))}
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block">Salary Range</label>
                <input value={form.salary} onChange={e => setForm(prev => ({ ...prev, salary: e.target.value }))} className="w-full bg-input-background border border-border rounded-xl px-3 py-2.5 text-sm text-foreground outline-none focus:border-indigo-500 transition-colors" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block">Work Mode</label>
                <select value={form.workMode} onChange={e => setForm(prev => ({ ...prev, workMode: e.target.value }))} className="w-full bg-input-background border border-border rounded-xl px-3 py-2.5 text-sm text-foreground outline-none focus:border-indigo-500 transition-colors">
                  <option>Remote</option><option>Hybrid</option><option>Onsite</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5">
            <h3 className="text-sm font-semibold text-foreground">Skill Requirements</h3>
            <div>
              <label className="text-xs text-muted-foreground mb-2 block">Required Skills</label>
              <div className="flex flex-wrap gap-2 mb-3">
                {skills.map(s => (
                  <span key={s} className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg bg-indigo-500/15 text-indigo-300 border border-indigo-500/20">
                    {s}
                    <button onClick={() => setSkills(prev => prev.filter(x => x !== s))} className="hover:text-red-400 transition-colors"><X className="w-3 h-3" /></button>
                  </span>
                ))}
                <div className="flex items-center gap-1 bg-input-background border border-border rounded-lg px-2">
                  <input value={newSkill} onChange={e => setNewSkill(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && newSkill) { setSkills(p => [...p, newSkill]); setNewSkill(""); } }} placeholder="Add skill…" className="bg-transparent text-xs text-foreground outline-none w-24 py-1.5 placeholder:text-muted-foreground" />
                  <button onClick={() => { if (newSkill) { setSkills(p => [...p, newSkill]); setNewSkill(""); } }} className="text-indigo-400"><Plus className="w-3.5 h-3.5" /></button>
                </div>
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                <span className="text-xs text-muted-foreground">AI Suggested Skills (based on Hindsight memory)</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {AI_SUGGESTIONS.map(s => (
                  <button key={s} onClick={() => !skills.includes(s) && setSkills(p => [...p, s])} className={`text-xs px-2.5 py-1 rounded-lg border transition-all ${skills.includes(s) ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-white/5 text-muted-foreground border-border hover:border-indigo-500/30 hover:text-indigo-300"}`}>
                    {skills.includes(s) ? "✓ " : "+ "}{s}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">Experience Required</label>
              <input defaultValue="5+ years" className="w-full bg-input-background border border-border rounded-xl px-3 py-2.5 text-sm text-foreground outline-none focus:border-indigo-500 transition-colors" />
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground">AI-Generated Job Description</h3>
              <button onClick={handleGenerate} disabled={generating}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xs font-semibold hover:opacity-90 transition-opacity disabled:opacity-60">
                {generating ? <><Loader className="w-3.5 h-3.5 animate-spin" /> Generating…</> : <><Sparkles className="w-3.5 h-3.5" /> Generate with AI</>}
              </button>
            </div>
            {jdGenerated ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-input-background border border-border rounded-xl p-4">
                <p className="text-sm text-foreground leading-relaxed whitespace-pre-line">{JD_TEXT}</p>
              </motion.div>
            ) : (
              <div className="bg-input-background border border-dashed border-border rounded-xl p-8 text-center">
                <Sparkles className="w-8 h-8 text-indigo-400 mx-auto mb-2 opacity-50" />
                <p className="text-sm text-muted-foreground">Click "Generate with AI" to create a tailored job description based on your requirements and Hindsight memory.</p>
              </div>
            )}
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground">Review & Publish</h3>
            <div className="grid grid-cols-2 gap-3">
              {[["Title", form.title], ["Department", form.department], ["Location", form.location], ["Salary", form.salary]].map(([k, v]) => (
                <div key={k} className="bg-input-background rounded-xl p-3">
                  <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">{k}</div>
                  <div className="text-sm font-medium text-foreground">{v}</div>
                </div>
              ))}
            </div>
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0" />
              <div>
                <div className="text-sm font-medium text-emerald-400">Ready to Publish</div>
                <div className="text-xs text-muted-foreground">AI will begin sourcing candidates immediately after posting.</div>
              </div>
            </div>
            {message && <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300">{message}</div>}
            <button onClick={handlePublish} disabled={saving} className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-60">
              {saving ? 'Publishing…' : 'Publish Job Opening'}
            </button>
          </div>
        )}

        <div className="flex items-center justify-between mt-6 pt-4 border-t border-border">
          <button onClick={() => setStep(s => Math.max(1, s - 1))} disabled={step === 1} className="px-4 py-2 rounded-xl text-sm text-muted-foreground hover:text-foreground border border-border hover:border-white/20 transition-all disabled:opacity-30">
            Back
          </button>
          {step < 4 && (
            <button onClick={() => setStep(s => Math.min(4, s + 1))} className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-500 transition-colors flex items-center gap-2">
              Continue <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </GlassCard>
    </div>
  );
}

// ─── RESUME UPLOAD ────────────────────────────────────────────────────────────

function ResumeUploadPage({ onUploaded, refreshWorkspace }: { onUploaded?: () => void; refreshWorkspace?: () => Promise<void> }) {
  const { token } = useAuth();
  const [files, setFiles] = useState<Array<{ name: string; size: string; status: string; score: number | null }>>([]);
  const [dragging, setDragging] = useState(false);
  const [processingStep, setProcessingStep] = useState(3);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');
  const [candidateName, setCandidateName] = useState('');
  const [candidateEmail, setCandidateEmail] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);

  const EMAIL_REGEX = /^[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}$/;

  const PROC_STEPS = [
    { label: "Uploading Resume", done: true },
    { label: "Extracting Skills", done: true },
    { label: "Reading Experience", done: true },
    { label: "Comparing with JD", done: processingStep >= 4 },
    { label: "Searching Memory", done: processingStep >= 5 },
    { label: "Selecting AI Model", done: processingStep >= 6 },
    { label: "Computing Final Score", done: processingStep >= 7 },
  ];

  useEffect(() => {
    if (processingStep < 7) {
      const t = setTimeout(() => setProcessingStep(s => s + 1), 800);
      return () => clearTimeout(t);
    }
  }, [processingStep]);

  const validateEmail = (email: string) => {
    if (!email.trim()) return 'Candidate email is required.';
    if (!EMAIL_REGEX.test(email.trim())) return 'Please enter a valid email address (e.g. jane@company.com).';
    return null;
  };

  const handleFiles = async (selected: FileList | null) => {
    if (!selected?.length) return;

    // Validate email before proceeding
    const err = validateEmail(candidateEmail);
    if (err) {
      setEmailError(err);
      setMessage('Please fill in a valid candidate email before uploading.');
      setMessageType('error');
      return;
    }
    setEmailError(null);

    setUploading(true);
    setMessage(null);
    try {
      const nextFiles = Array.from(selected).map(file => ({ name: file.name, size: `${Math.max(1, Math.round(file.size / 1024))} KB`, status: 'processing', score: null }));
      setFiles(prev => [...nextFiles, ...prev]);
      for (const file of Array.from(selected)) {
        await request('/api/resumes/upload', {
          method: 'POST',
          body: JSON.stringify({
            filename: file.name,
            originalName: file.name,
            size: `${Math.max(1, Math.round(file.size / 1024))} KB`,
            status: 'uploaded',
            score: null,
            name: candidateName.trim() || file.name.replace(/\.(pdf|docx?|txt)$/i, ''),
            email: candidateEmail.trim()
          })
        }, token);
      }
      setMessage('Resumes uploaded to your workspace.');
      setMessageType('success');
      await refreshWorkspace?.();
      onUploaded?.();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unable to upload resume';
      setMessage(msg);
      setMessageType('error');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <SectionHeader title="Resume Upload" subtitle="Upload and AI-parse candidate resumes"
        action={
          <label className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-500 transition-colors cursor-pointer">
            <Plus className="w-4 h-4" /> Upload More
            <input type="file" multiple className="hidden" onChange={e => handleFiles(e.target.files)} />
          </label>
        }
      />

      {/* Candidate Info Form */}
      <GlassCard className="p-5">
        <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
          <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-[10px] font-bold">1</span>
          Candidate Details
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Name field */}
          <div className="space-y-1.5">
            <label htmlFor="candidate-name" className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Candidate Name
            </label>
            <input
              id="candidate-name"
              type="text"
              value={candidateName}
              onChange={e => setCandidateName(e.target.value)}
              placeholder="Jane Smith"
              className="w-full px-3 py-2.5 rounded-xl bg-white/[0.05] border border-border text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/30 transition-all"
            />
          </div>

          {/* Email field */}
          <div className="space-y-1.5">
            <label htmlFor="candidate-email" className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Candidate Email <span className="text-red-400">*</span>
            </label>
            <input
              id="candidate-email"
              type="email"
              value={candidateEmail}
              onChange={e => { setCandidateEmail(e.target.value); if (emailError) setEmailError(validateEmail(e.target.value)); }}
              onBlur={() => setEmailError(validateEmail(candidateEmail))}
              placeholder="jane@company.com"
              className={`w-full px-3 py-2.5 rounded-xl bg-white/[0.05] border text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 transition-all ${
                emailError
                  ? 'border-red-500/60 focus:border-red-500/80 focus:ring-red-500/20'
                  : 'border-border focus:border-indigo-500/60 focus:ring-indigo-500/30'
              }`}
            />
            {emailError && (
              <p className="text-[11px] text-red-400 flex items-center gap-1">
                <span>⚠</span> {emailError}
              </p>
            )}
          </div>
        </div>
        <p className="text-[11px] text-muted-foreground mt-3">
          💡 Tip: The system will also try to auto-extract the email from the resume text. You can override it here.
        </p>
      </GlassCard>

      {/* Drop Zone */}
      <GlassCard className="p-0 overflow-hidden">
        <div className="px-5 pt-4 pb-2">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-[10px] font-bold">2</span>
            Upload Resume
          </h3>
        </div>
        <div
          onDragOver={e => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={e => { e.preventDefault(); setDragging(false); void handleFiles(e.dataTransfer.files); }}
          className={`border-2 border-dashed rounded-2xl m-4 p-10 text-center transition-all duration-300 ${dragging ? "border-indigo-500 bg-indigo-500/10" : "border-border hover:border-indigo-500/50 hover:bg-white/2"}`}
        >
          <div className="w-16 h-16 rounded-2xl bg-indigo-500/15 flex items-center justify-center mx-auto mb-4">
            <Upload className="w-8 h-8 text-indigo-400" />
          </div>
          <p className="text-base font-semibold text-foreground mb-1">Drop resumes here</p>
          <p className="text-sm text-muted-foreground mb-4">Supports PDF, DOCX, DOC · Up to 50 files at once</p>
          <label className="inline-flex px-5 py-2.5 rounded-xl bg-indigo-600/80 text-white text-sm font-medium hover:bg-indigo-600 transition-colors cursor-pointer">
            Browse Files
            <input type="file" multiple className="hidden" onChange={e => handleFiles(e.target.files)} />
          </label>
        </div>
      </GlassCard>

      {message && (
        <div className={`rounded-xl border px-3 py-2 text-sm ${
          messageType === 'error'
            ? 'border-red-500/20 bg-red-500/10 text-red-300'
            : 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300'
        }`}>
          {message}
        </div>
      )}
      {uploading && <div className="text-sm text-muted-foreground">Uploading to your workspace…</div>}

      {/* Files list */}
      <GlassCard className="p-5">
        <h3 className="text-sm font-semibold text-foreground mb-4">Processing Queue ({files.length} files)</h3>
        <div className="space-y-3">
          {files.map((f, i) => (
            <div key={f.name} className="flex items-center gap-4 p-3 rounded-xl bg-white/[0.03] border border-border">
              <div className="w-9 h-9 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center flex-shrink-0">
                <FileText className="w-4 h-4 text-red-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-foreground truncate">{f.name}</div>
                <div className="text-xs text-muted-foreground">{f.size}</div>
                {f.status === "processing" && (
                  <div className="mt-2">
                    <div className="flex flex-wrap gap-1 mb-1">
                      {PROC_STEPS.map(s => (
                        <span key={s.label} className={`text-[10px] px-1.5 py-0.5 rounded-md font-medium ${s.done ? "bg-emerald-500/15 text-emerald-400" : "bg-white/5 text-muted-foreground"}`}>
                          {s.done ? "✓" : "○"} {s.label}
                        </span>
                      ))}
                    </div>
                    <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-indigo-500 to-cyan-500 rounded-full transition-all duration-500" style={{ width: `${(processingStep / 7) * 100}%` }} />
                    </div>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {f.status === "complete" && f.score && (
                  <span className={`text-sm font-bold px-3 py-1.5 rounded-xl border ${scoreBg(f.score)} ${scoreColor(f.score)}`}>{f.score}%</span>
                )}
                <span className={`text-[10px] px-2 py-1 rounded-lg font-medium ${f.status === "complete" ? "bg-emerald-500/10 text-emerald-400" : f.status === "processing" ? "bg-indigo-500/10 text-indigo-400" : "bg-white/5 text-muted-foreground"}`}>
                  {f.status === "complete" ? "✓ Done" : f.status === "processing" ? "Processing…" : "Queued"}
                </span>
              </div>
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
}

// ─── CANDIDATE ANALYSIS ───────────────────────────────────────────────────────

function CandidatesPage({ setPage, setSelectedId, workspace }: { setPage: (p: Page) => void; setSelectedId: (id: number) => void; workspace: WorkspaceState }) {
  const [filter, setFilter] = useState("all");
  const candidates = workspace.candidates as Candidate[];

  const filtered = filter === "all" ? candidates : candidates.filter(c => c.status === filter);

  return (
    <div className="space-y-6">
      <SectionHeader title="Candidate Analysis" subtitle={`${candidates.length} candidates analyzed by AI`}
        action={
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border text-sm text-muted-foreground hover:text-foreground hover:border-white/20 transition-all">
              <Filter className="w-3.5 h-3.5" /> Filter
            </button>
            <button className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border text-sm text-muted-foreground hover:text-foreground hover:border-white/20 transition-all">
              <Download className="w-3.5 h-3.5" /> Export
            </button>
          </div>
        }
      />

      {/* Filter tabs */}
      <div className="flex gap-2">
        {[["all", "All Candidates"], ["strong_hire", "Strong Hire"], ["hire", "Hire"], ["consider", "Consider"]].map(([v, l]) => (
          <button key={v} onClick={() => setFilter(v)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${filter === v ? "bg-indigo-600 text-white" : "bg-card text-muted-foreground border border-border hover:border-white/20"}`}>
            {l}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4">
        {filtered.map((c, i) => {
          const badge = statusBadge(c.status);
          const gradients = ["from-indigo-500 to-purple-600", "from-cyan-500 to-blue-600", "from-purple-500 to-pink-600", "from-emerald-500 to-teal-600", "from-orange-500 to-red-600"];
          return (
            <motion.div
              key={c.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <GlassCard className="p-5 hover:border-white/20 transition-all duration-300 group">
                <div className="flex items-start gap-4">
                  <Avatar initials={c.initials} size="lg" gradient={gradients[i % gradients.length]} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-base font-bold text-foreground">{c.name}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${badge.cls}`}>{badge.label}</span>
                      {c.status === "strong_hire" && <span className="text-[10px] px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">⭐ AI Top Pick</span>}
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{c.role} · {c.experience} · {c.location}</p>
                    <p className="text-xs text-muted-foreground mb-3 leading-relaxed line-clamp-2">{c.summary}</p>
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {c.skills.map(s => <SkillTag key={s} label={s} />)}
                      {c.missing.map(s => <SkillTag key={s} label={s} missing />)}
                    </div>
                    <div className="text-xs text-muted-foreground">{c.education}</div>
                  </div>

                  <div className="flex flex-col items-end gap-3 flex-shrink-0">
                    <div className={`text-2xl font-black px-4 py-2 rounded-xl border ${scoreBg(c.score)} ${scoreColor(c.score)}`}>
                      {c.score}%
                    </div>
                    <div className="text-[10px] text-muted-foreground text-center">AI Confidence<br /><span className="text-foreground font-semibold text-xs">{c.aiConfidence}%</span></div>
                    <button onClick={() => { setSelectedId(c.id); setPage("candidate-detail"); }}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-600 text-white text-xs font-medium hover:bg-indigo-500 transition-colors">
                      <Eye className="w-3.5 h-3.5" /> View Profile
                    </button>
                  </div>
                </div>

                {/* Why AI recommends */}
                <div className="mt-4 pt-4 border-t border-border">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                    <span className="font-medium text-indigo-400">Why AI Recommends This Candidate</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {c.skills.slice(0, 4).map(s => (
                      <span key={s} className="text-[10px] px-2 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">✔ {s}</span>
                    ))}
                    {c.missing.slice(0, 1).map(s => (
                      <span key={s} className="text-[10px] px-2 py-1 rounded-lg bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">⚠ Missing: {s}</span>
                    ))}
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

// ─── CANDIDATE DETAIL ─────────────────────────────────────────────────────────

function CandidateDetailPage({ candidateId, setPage, workspace, refreshWorkspace }: { candidateId: number; setPage: (p: Page) => void; workspace: WorkspaceState; refreshWorkspace: () => Promise<void> }) {
  const candidates = workspace.candidates as Candidate[];
  const c = candidates.find(x => x.id === candidateId) || candidates[0];
  const { token } = useAuth();
  const [hiring, setHiring] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [offerMessage, setOfferMessage] = useState<string | null>(null);
  const [decisionStatus, setDecisionStatus] = useState(c.status);
  const badge = statusBadge(decisionStatus);
  const gradients = ["from-indigo-500 to-purple-600", "from-cyan-500 to-blue-600", "from-purple-500 to-pink-600", "from-emerald-500 to-teal-600", "from-orange-500 to-red-600"];
  const gradIdx = c.id - 1;

  useEffect(() => {
    setDecisionStatus(c.status);
  }, [c.status]);

  const handleHire = async () => {
    setHiring(true);
    try {
      const candidateId = (c as Candidate & { _id?: string | number })._id ?? c.id;
      await request(`/api/hiring/${candidateId}/hire`, {
        method: 'POST',
        body: JSON.stringify({
          notes: `Hired based on match score of ${c.score}%`,
          offerDetails: {
            salary: '$120,000 - $160,000',
            startDate: 'TBD',
            position: c.role
          }
        })
      }, token);
      setDecisionStatus('hired');
      await refreshWorkspace();
      setOfferMessage(`Offer email sent successfully.`);
      setTimeout(() => { setPage("candidates"); }, 2000);
    } catch (err) {
      setOfferMessage(`❌ Failed: ${err instanceof Error ? err.message : 'Error'}`);
    } finally {
      setHiring(false);
    }
  };

  const handleReject = async () => {
    setRejecting(true);
    try {
      const candidateId = (c as Candidate & { _id?: string | number })._id ?? c.id;
      await request(`/api/hiring/${candidateId}/reject`, {
        method: 'POST',
        body: JSON.stringify({
          reason: 'Better fit found',
          notes: `Score ${c.score}% did not meet threshold`
        })
      }, token);
      setDecisionStatus('rejected');
      await refreshWorkspace();
      setOfferMessage(`Rejection email sent successfully.`);
      setTimeout(() => { setPage("candidates"); }, 2000);
    } catch (err) {
      setOfferMessage(`❌ Failed: ${err instanceof Error ? err.message : 'Error'}`);
    } finally {
      setRejecting(false);
    }
  };

  const radarData = [
    { subject: "Technical", A: 90, fullMark: 100 },
    { subject: "Communication", A: 85, fullMark: 100 },
    { subject: "Leadership", A: c.score > 85 ? 80 : 65, fullMark: 100 },
    { subject: "Culture Fit", A: 88, fullMark: 100 },
    { subject: "Problem Solving", A: 92, fullMark: 100 },
    { subject: "Domain", A: c.score, fullMark: 100 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <button onClick={() => setPage("candidates")} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors">
          ← Back to Candidates
        </button>
      </div>

      {offerMessage && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className={`rounded-xl border p-3 text-sm ${offerMessage.includes('✅') ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' : 'bg-red-500/10 border-red-500/30 text-red-300'}`}>
          {offerMessage}
        </motion.div>
      )}

      {/* Header card */}
      <GlassCard className="p-6">
        <div className="flex items-start gap-5">
          <Avatar initials={c.initials} size="lg" gradient={gradients[gradIdx % gradients.length]} />
          <div className="flex-1">
            <div className="flex items-center gap-3 flex-wrap mb-1">
              <h2 className="text-xl font-bold text-foreground font-display">{c.name}</h2>
              <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${badge.cls}`}>{badge.label}</span>
            </div>
            <p className="text-muted-foreground text-sm mb-3">{c.role} · {c.experience} experience</p>
            <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{c.location}</span>
              <span className="flex items-center gap-1"><Award className="w-3.5 h-3.5" />{c.education}</span>
            </div>
          </div>
          <div className="text-center">
            <div className={`text-3xl font-black ${scoreColor(c.score)}`}>{c.score}%</div>
            <div className="text-xs text-muted-foreground">Match Score</div>
            <div className="text-xs text-indigo-400 mt-1">Confidence {c.aiConfidence}%</div>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-border flex flex-wrap gap-2">
          <button className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-600 text-white text-xs font-medium hover:bg-indigo-500 transition-colors">
            <Send className="w-3.5 h-3.5" /> Schedule Interview
          </button>
          <button onClick={() => setPage("interview-questions")} className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-purple-600/80 text-white text-xs font-medium hover:bg-purple-600 transition-colors">
            <MessageSquare className="w-3.5 h-3.5" /> Generate Questions
          </button>
          <button className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border text-xs text-muted-foreground hover:text-foreground hover:border-white/20 transition-all">
            <Download className="w-3.5 h-3.5" /> Download Resume
          </button>
          <div className="ml-auto flex gap-2">
            <button
              onClick={handleReject}
              disabled={rejecting || decisionStatus === 'rejected' || decisionStatus === 'hired'}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-600/20 text-red-400 text-xs font-medium hover:bg-red-600/30 transition-colors border border-red-500/20 disabled:opacity-50"
            >
              <X className="w-3.5 h-3.5" /> {rejecting ? 'Rejecting...' : 'Reject'}
            </button>
            <button
              onClick={handleHire}
              disabled={hiring || decisionStatus === 'hired' || decisionStatus === 'rejected' || decisionStatus === 'offer_sent'}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 text-white text-xs font-medium hover:bg-emerald-500 transition-colors disabled:opacity-50"
            >
              <CheckCircle className="w-3.5 h-3.5" /> {hiring ? 'Sending Offer...' : 'Hire'}
            </button>
          </div>
        </div>
      </GlassCard>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Radar Chart */}
        <GlassCard className="p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">Competency Analysis</h3>
          <ResponsiveContainer width="100%" height={220}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="rgba(255,255,255,0.08)" />
              <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fill: "#94A3B8" }} />
              <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 9, fill: "#94A3B8" }} />
              <Radar name="Score" dataKey="A" stroke="#6366F1" fill="#6366F1" fillOpacity={0.25} strokeWidth={2} />
            </RadarChart>
          </ResponsiveContainer>
        </GlassCard>

        {/* Skills breakdown */}
        <GlassCard className="p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">Skills Assessment</h3>
          <div className="space-y-3">
            {[...c.skills.map(s => ({ s, val: Math.floor(Math.random() * 20 + 75), match: true })),
              ...c.missing.map(s => ({ s, val: 0, match: false }))].map(({ s, val, match }) => (
              <div key={s}>
                <div className="flex justify-between text-xs mb-1">
                  <span className={match ? "text-foreground" : "text-red-400"}>{s}{!match && " (Missing)"}</span>
                  <span className={match ? "text-foreground font-medium" : "text-red-400"}>
                    {match ? `${val}%` : "Not Found"}
                  </span>
                </div>
                <div className="h-1.5 bg-white/5 rounded-full">
                  {match && <div className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-cyan-500" style={{ width: `${val}%` }} />}
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>

      {/* AI Summary */}
      <GlassCard className="p-5">
        <div className="flex items-center gap-2 mb-3">
          <BrainCircuit className="w-4 h-4 text-indigo-400" />
          <h3 className="text-sm font-semibold text-foreground">AI Recommendation Summary</h3>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed mb-4">{c.summary}</p>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3">
            <div className="text-xs font-semibold text-emerald-400 mb-2">Strengths</div>
            {c.skills.map(s => <div key={s} className="text-xs text-foreground py-0.5">✔ {s} experience</div>)}
          </div>
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-3">
            <div className="text-xs font-semibold text-yellow-400 mb-2">Development Areas</div>
            {c.missing.length > 0 ? c.missing.map(s => <div key={s} className="text-xs text-foreground py-0.5">⚠ {s} — trainable</div>) : <div className="text-xs text-emerald-400">No major gaps detected</div>}
          </div>
        </div>
      </GlassCard>
    </div>
  );
}

// ─── INTERVIEW QUESTIONS ──────────────────────────────────────────────────────

function InterviewQuestionsPage() {
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState(true);
  const [difficulty, setDifficulty] = useState("senior");
  const [tab, setTab] = useState("technical");
  const [copied, setCopied] = useState<string | null>(null);

  const QUESTIONS: Record<string, string[]> = {
    technical: [
      "Design a scalable state management solution for a React app with 50+ interconnected components. Walk me through your decision-making process.",
      "How would you optimize a React application that re-renders 300+ components on every state change? What profiling tools would you use?",
      "Explain the difference between useCallback, useMemo, and React.memo. When would misusing them hurt performance?",
      "You need to implement real-time collaborative editing (like Google Docs) in React. Describe your architecture.",
      "How do you handle race conditions in useEffect when multiple async operations can resolve in any order?",
    ],
    hr: [
      "Tell me about a time you disagreed with a technical decision made by your team lead. How did you handle it?",
      "Describe your experience mentoring junior developers. What's your approach to code reviews?",
      "How do you stay current with the rapidly evolving React ecosystem?",
      "Give an example of a project where you had to make significant technical compromises due to business constraints.",
    ],
    coding: [
      "Implement a custom useDebounce hook that can handle async functions and properly cancels in-flight requests.",
      "Build a virtualized list component that can efficiently render 100,000 items with variable heights.",
      "Write a React hook that manages a finite state machine with guaranteed transition safety.",
    ],
  };

  const handleCopy = (q: string) => {
    navigator.clipboard.writeText(q);
    setCopied(q);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleGenerate = () => {
    setGenerating(true);
    setTimeout(() => { setGenerating(false); setGenerated(true); }, 1800);
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <SectionHeader title="AI Interview Questions" subtitle="Personalized questions for Sarah Chen — Senior React Developer" />

      <GlassCard className="p-5">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Difficulty:</span>
            {["junior", "mid", "senior", "principal"].map(d => (
              <button key={d} onClick={() => setDifficulty(d)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${difficulty === d ? "bg-indigo-600 text-white" : "bg-white/5 text-muted-foreground border border-border hover:border-white/20"}`}>
                {d}
              </button>
            ))}
          </div>
          <button onClick={handleGenerate} disabled={generating}
            className="ml-auto flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xs font-semibold hover:opacity-90 disabled:opacity-60 transition-opacity">
            {generating ? <><Loader className="w-3.5 h-3.5 animate-spin" /> Generating…</> : <><Sparkles className="w-3.5 h-3.5" /> Regenerate</>}
          </button>
        </div>
      </GlassCard>

      {/* Tabs */}
      <div className="flex gap-1 bg-card border border-border rounded-xl p-1">
        {([["technical", "Technical", Code], ["hr", "HR & Behavioral", User], ["coding", "Coding Challenge", BookOpen]] as [string, string, React.ElementType][]).map(([v, l, IconComp]) => (
          <button key={v} onClick={() => setTab(v)}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-medium transition-all ${tab === v ? "bg-indigo-600 text-white shadow-lg" : "text-muted-foreground hover:text-foreground"}`}>
            <IconComp className="w-3.5 h-3.5" /> {l}
          </button>
        ))}
      </div>

      {generated && (
        <div className="space-y-3">
          {(QUESTIONS[tab] || []).map((q, i) => (
            <motion.div key={q} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <GlassCard className="p-4 hover:border-white/20 transition-all group">
                <div className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-lg bg-indigo-500/15 text-indigo-400 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</span>
                  <p className="text-sm text-foreground leading-relaxed flex-1">{q}</p>
                  <button onClick={() => handleCopy(q)} className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground flex-shrink-0">
                    {copied === q ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </div>
      )}

      <div className="flex gap-3">
        <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border text-sm text-muted-foreground hover:text-foreground hover:border-white/20 transition-all">
          <Download className="w-4 h-4" /> Export PDF
        </button>
        <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border text-sm text-muted-foreground hover:text-foreground hover:border-white/20 transition-all">
          <Copy className="w-4 h-4" /> Copy All
        </button>
      </div>
    </div>
  );
}

// ─── HINDSIGHT ────────────────────────────────────────────────────────────────

function HindsightPage() {
  const typeConfig: Record<string, { color: string; icon: React.ElementType; label: string }> = {
    preference: { color: "text-indigo-400 bg-indigo-500/15 border-indigo-500/30", icon: Lightbulb, label: "Preference" },
    pattern: { color: "text-cyan-400 bg-cyan-500/15 border-cyan-500/30", icon: TrendingUp, label: "Pattern" },
    feedback: { color: "text-purple-400 bg-purple-500/15 border-purple-500/30", icon: MessageSquare, label: "Feedback" },
    correction: { color: "text-yellow-400 bg-yellow-500/15 border-yellow-500/30", icon: RefreshCw, label: "Correction" },
  };

  return (
    <div className="space-y-6">
      <SectionHeader title="Hindsight Memory" subtitle="AI learns from every hiring decision to improve future recommendations"
        action={
          <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-2 rounded-xl">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Memory Active · 63 insights stored
          </div>
        }
      />

      {/* Before/After showcase */}
      <GlassCard className="p-5 bg-gradient-to-r from-indigo-500/5 to-purple-500/5">
        <div className="flex items-center gap-2 mb-4">
          <BrainCircuit className="w-5 h-5 text-indigo-400" />
          <h3 className="text-sm font-semibold text-foreground">How Hindsight Improves Decisions</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-4">
            <div className="text-xs font-semibold text-red-400 mb-3">⏮ Yesterday (Without Memory)</div>
            <div className="space-y-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-2"><X className="w-3.5 h-3.5 text-red-400" /> Docker not weighted in scoring</div>
              <div className="flex items-center gap-2"><X className="w-3.5 h-3.5 text-red-400" /> Recruiter manually ranks each time</div>
              <div className="flex items-center gap-2"><X className="w-3.5 h-3.5 text-red-400" /> Communication bias not detected</div>
              <div className="flex items-center gap-2"><X className="w-3.5 h-3.5 text-red-400" /> 47 min average per candidate review</div>
            </div>
          </div>
          <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-4">
            <div className="text-xs font-semibold text-emerald-400 mb-3">⏩ Today (With Hindsight)</div>
            <div className="space-y-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> Docker auto-boosted +15% in score</div>
              <div className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> Preferences applied automatically</div>
              <div className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> Communication signals flagged</div>
              <div className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> 13 min average — saving 34 min/day</div>
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Memory Timeline */}
      <div className="relative space-y-4">
        <div className="absolute left-5 top-0 bottom-0 w-px bg-white/10" />
        {MEMORIES.map((m, i) => {
          const cfg = typeConfig[m.type];
          const Icon = cfg.icon;
          return (
            <motion.div key={m.id} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }}
              className="relative pl-12">
              <div className={`absolute left-2.5 top-4 w-5 h-5 rounded-full border flex items-center justify-center ${cfg.color}`}>
                <Icon className="w-2.5 h-2.5" />
              </div>
              <GlassCard className="p-4 hover:border-white/20 transition-all">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${cfg.color}`}>{cfg.label}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${m.impact === "high" ? "bg-red-500/10 text-red-400" : "bg-yellow-500/10 text-yellow-400"}`}>
                        {m.impact === "high" ? "High Impact" : "Medium Impact"}
                      </span>
                    </div>
                    <h4 className="text-sm font-semibold text-foreground mb-1.5">{m.title}</h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">{m.description}</p>
                    <p className="text-[10px] text-muted-foreground mt-2">{m.date}</p>
                  </div>
                  <div className="text-center flex-shrink-0">
                    <div className="text-lg font-bold text-foreground">{m.confidence}%</div>
                    <div className="text-[10px] text-muted-foreground">Confidence</div>
                    <div className="mt-1 h-1 w-16 bg-white/5 rounded-full">
                      <div className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-cyan-500" style={{ width: `${m.confidence}%` }} />
                    </div>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

// ─── CASCADEFLOW ──────────────────────────────────────────────────────────────

function CascadeFlowPage() {
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-card border border-border rounded-xl p-3 shadow-xl text-xs">
        <p className="font-medium text-foreground mb-1">{label}</p>
        {payload.map((p: any) => (
          <p key={p.name} style={{ color: p.color }}>{p.name}: ${p.value}</p>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <SectionHeader title="cascadeflow Runtime" subtitle="Intelligent AI model routing — optimize cost, latency, and quality"
        action={
          <div className="flex items-center gap-3">
            <div className="text-xs text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-3 py-2 rounded-xl flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5" /> Live Routing Active
            </div>
          </div>
        }
      />

      {/* Top stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Spent", value: "$68.40", sub: "This week", icon: DollarSign, color: "text-yellow-400" },
          { label: "Budget Remaining", value: "$131.60", sub: "of $200 budget", icon: Gauge, color: "text-emerald-400" },
          { label: "Avg Latency", value: "620ms", sub: "Across all models", icon: Clock, color: "text-cyan-400" },
          { label: "Cost Saved", value: "$184", sub: "vs. GPT-4 only routing", icon: TrendingUp, color: "text-indigo-400" },
        ].map(s => (
          <GlassCard key={s.label} className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <s.icon className={`w-4 h-4 ${s.color}`} />
              <span className="text-xs text-muted-foreground">{s.label}</span>
            </div>
            <div className={`text-xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{s.sub}</div>
          </GlassCard>
        ))}
      </div>

      {/* Budget gauge */}
      <GlassCard className="p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-foreground">Weekly Budget Usage</h3>
          <span className="text-xs text-muted-foreground">$68.40 / $200.00</span>
        </div>
        <div className="h-3 bg-white/5 rounded-full overflow-hidden">
          <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-yellow-500 to-red-500" style={{ width: "34.2%" }} />
        </div>
        <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
          <span>$0</span><span className="text-emerald-400">34% used</span><span>$200</span>
        </div>
      </GlassCard>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Cost chart */}
        <GlassCard className="p-5">
          <h3 className="text-sm font-semibold text-foreground mb-1">Daily Cost by Model</h3>
          <p className="text-xs text-muted-foreground mb-4">7-day breakdown</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={COST_DATA} barGap={2}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="gpt4" name="GPT-4o" fill="#6366F1" radius={[3, 3, 0, 0]} />
              <Bar dataKey="llama" name="Llama 3" fill="#22D3EE" radius={[3, 3, 0, 0]} />
              <Bar dataKey="gemini" name="Gemini Flash" fill="#A78BFA" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </GlassCard>

        {/* Model distribution */}
        <GlassCard className="p-5">
          <h3 className="text-sm font-semibold text-foreground mb-1">Model Distribution</h3>
          <p className="text-xs text-muted-foreground mb-4">Task routing this week</p>
          <div className="flex items-center gap-4">
            <ResponsiveContainer width="50%" height={160}>
              <PieChart>
                <Pie data={MODEL_DIST} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value" strokeWidth={0}>
                  {MODEL_DIST.map(entry => <Cell key={entry.name} fill={entry.color} />)}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2">
              {MODEL_DIST.map(m => (
                <div key={m.name} className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ backgroundColor: m.color }} />
                  <span className="text-xs text-muted-foreground">{m.name}</span>
                  <span className="text-xs font-medium text-foreground ml-auto">{m.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Routing table */}
      <GlassCard className="p-5">
        <h3 className="text-sm font-semibold text-foreground mb-4">Model Routing Flow</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-[10px] text-muted-foreground uppercase tracking-wider border-b border-border">
                <th className="text-left pb-3 pr-4">Task</th>
                <th className="text-left pb-3 pr-4">Model Selected</th>
                <th className="text-left pb-3 pr-4">Cost / Call</th>
                <th className="text-left pb-3 pr-4">Latency</th>
                <th className="text-left pb-3">Why This Model</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {MODEL_ROUTES.map(r => (
                <tr key={r.task} className="hover:bg-white/2 transition-colors">
                  <td className="py-3 pr-4 text-sm text-foreground font-medium">{r.task}</td>
                  <td className="py-3 pr-4">
                    <span className="text-xs px-2 py-1 rounded-lg bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">{r.model}</span>
                  </td>
                  <td className="py-3 pr-4 text-xs font-mono text-cyan-400">{r.cost}</td>
                  <td className="py-3 pr-4 text-xs font-mono text-yellow-400">{r.latency}</td>
                  <td className="py-3 text-xs text-muted-foreground">{r.reason}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  );
}

// ─── RANKING ──────────────────────────────────────────────────────────────────

function RankingPage({ setPage, setSelectedId, workspace }: { setPage: (p: Page) => void; setSelectedId: (id: number) => void; workspace: WorkspaceState }) {
  const candidates = workspace.candidates as Candidate[];
  const gradients = ["from-indigo-500 to-purple-600", "from-cyan-500 to-blue-600", "from-purple-500 to-pink-600", "from-emerald-500 to-teal-600", "from-orange-500 to-red-600"];
  const rankBadge = (r: number) => {
    if (r === 1) return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
    if (r === 2) return "bg-slate-500/20 text-slate-300 border-slate-500/30";
    if (r === 3) return "bg-orange-500/20 text-orange-400 border-orange-500/30";
    return "bg-white/5 text-muted-foreground border-border";
  };
  return (
    <div className="space-y-6">
      <SectionHeader title="Candidate Ranking" subtitle="AI-ranked leaderboard for Senior React Developer" />

      <GlassCard className="overflow-hidden">
        <div className="p-5 border-b border-border flex items-center gap-3">
          <Trophy className="w-4 h-4 text-yellow-400" />
          <span className="text-sm font-semibold text-foreground">Ranked by AI Match Score</span>
          <span className="ml-auto text-xs text-muted-foreground">{candidates.length} candidates</span>
        </div>
        <div className="divide-y divide-border">
          {candidates.map((c, i) => {
            const badge = statusBadge(c.status);
            return (
              <div key={c.id} className="flex items-center gap-4 p-4 hover:bg-white/[0.02] transition-colors group">
                <div className={`w-8 h-8 rounded-xl border font-bold text-sm flex items-center justify-center flex-shrink-0 ${rankBadge(i + 1)}`}>
                  {i + 1}
                </div>
                <Avatar initials={c.initials} size="sm" gradient={gradients[i % gradients.length]} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-foreground">{c.name}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${badge.cls}`}>{badge.label}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{c.role} · {c.experience}</p>
                </div>
                <div className="hidden sm:flex items-center gap-6 text-center">
                  <div>
                    <div className={`text-lg font-black ${scoreColor(c.score)}`}>{c.score}%</div>
                    <div className="text-[10px] text-muted-foreground">Match</div>
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-foreground">{c.aiConfidence}%</div>
                    <div className="text-[10px] text-muted-foreground">Confidence</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => { setSelectedId(c.id); setPage("candidate-detail"); }} className="px-2.5 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-medium hover:bg-indigo-500 transition-colors">
                    View
                  </button>
                  <button className="px-2.5 py-1.5 rounded-lg bg-emerald-600/80 text-white text-xs font-medium hover:bg-emerald-600 transition-colors">
                    Hire
                  </button>
                  <button className="px-2.5 py-1.5 rounded-lg bg-red-600/60 text-white text-xs font-medium hover:bg-red-600 transition-colors">
                    Reject
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </GlassCard>
    </div>
  );
}

// ─── NOTIFICATIONS ────────────────────────────────────────────────────────────

function NotificationsPage() {
  const [notifs, setNotifs] = useState(NOTIFS);
  const typeIcon: Record<string, React.ElementType> = {
    ai: Bot, interview: Calendar, application: Users, hire: Award, budget: DollarSign
  };
  const typeColor: Record<string, string> = {
    ai: "bg-indigo-500/15 text-indigo-400 border-indigo-500/20",
    interview: "bg-purple-500/15 text-purple-400 border-purple-500/20",
    application: "bg-cyan-500/15 text-cyan-400 border-cyan-500/20",
    hire: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
    budget: "bg-yellow-500/15 text-yellow-400 border-yellow-500/20",
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <SectionHeader title="Notifications" subtitle={`${notifs.filter(n => !n.read).length} unread`} />
        <button onClick={() => setNotifs(prev => prev.map(n => ({ ...n, read: true })))} className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors">
          Mark all read
        </button>
      </div>
      <div className="space-y-2">
        {notifs.map(n => {
          const Icon = typeIcon[n.type] || Bell;
          return (
            <GlassCard key={n.id} className={`p-4 cursor-pointer hover:border-white/20 transition-all ${!n.read ? "border-indigo-500/20" : ""}`}
              onClick={() => setNotifs(prev => prev.map(x => x.id === n.id ? { ...x, read: true } : x))}>
              <div className="flex items-start gap-3">
                <div className={`w-8 h-8 rounded-xl border flex items-center justify-center flex-shrink-0 ${typeColor[n.type]}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-foreground">{n.title}</span>
                    {!n.read && <span className="w-2 h-2 rounded-full bg-indigo-500 flex-shrink-0" />}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{n.message}</p>
                  <p className="text-[10px] text-muted-foreground mt-1.5">{n.time}</p>
                </div>
              </div>
            </GlassCard>
          );
        })}
      </div>
    </div>
  );
}

// ─── SETTINGS ────────────────────────────────────────────────────────────────

function SettingsPage() {
  const [tab, setTab] = useState("company");
  const [darkDefault, setDarkDefault] = useState(true);
  const [budget, setBudget] = useState(200);

  const TABS = [
    { id: "company", label: "Company", icon: Building },
    { id: "ai", label: "AI Config", icon: BrainCircuit },
    { id: "hindsight", label: "Hindsight", icon: MemoryStick },
    { id: "cascadeflow", label: "cascadeflow", icon: Workflow },
    { id: "team", label: "Team", icon: Users },
    { id: "notifications", label: "Notifications", icon: Bell },
  ];

  return (
    <div className="space-y-6">
      <SectionHeader title="Settings" subtitle="Configure your RecruitAI workspace" />

      <div className="flex gap-1 flex-wrap bg-card border border-border rounded-xl p-1">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${tab === t.id ? "bg-indigo-600 text-white" : "text-muted-foreground hover:text-foreground"}`}>
            <t.icon className="w-3.5 h-3.5" /> {t.label}
          </button>
        ))}
      </div>

      {tab === "company" && (
        <GlassCard className="p-6 space-y-4">
          <h3 className="text-sm font-semibold text-foreground">Company Profile</h3>
          <div className="grid grid-cols-2 gap-4">
            {[["Company Name", "Acme Corp"], ["Industry", "Technology"], ["Company Size", "500-1000"], ["HQ Location", "San Francisco, CA"], ["Website", "acme.com"], ["ATS Integration", "Greenhouse"]].map(([l, v]) => (
              <div key={l}>
                <label className="text-xs text-muted-foreground mb-1.5 block">{l}</label>
                <input defaultValue={v} className="w-full bg-input-background border border-border rounded-xl px-3 py-2.5 text-sm text-foreground outline-none focus:border-indigo-500 transition-colors" />
              </div>
            ))}
          </div>
          <button className="px-4 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-500 transition-colors">
            Save Changes
          </button>
        </GlassCard>
      )}

      {tab === "ai" && (
        <GlassCard className="p-6 space-y-5">
          <h3 className="text-sm font-semibold text-foreground">AI Configuration</h3>
          <div className="space-y-4">
            {[
              { label: "AI Match Threshold", desc: "Minimum score to flag as 'Strong Hire'", value: "90%" },
              { label: "Auto-generate JD", desc: "Automatically draft JD on new job creation", toggle: true, on: true },
              { label: "Bias Detection", desc: "Flag potentially biased language in JDs", toggle: true, on: true },
              { label: "Memory Auto-apply", desc: "Auto-apply Hindsight memory to new searches", toggle: true, on: false },
            ].map(s => (
              <div key={s.label} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                <div>
                  <div className="text-sm font-medium text-foreground">{s.label}</div>
                  <div className="text-xs text-muted-foreground">{s.desc}</div>
                </div>
                {s.toggle ? (
                  <div className={`w-11 h-6 rounded-full flex items-center px-1 cursor-pointer transition-colors ${s.on ? "bg-indigo-600" : "bg-white/10"}`}>
                    <div className={`w-4 h-4 rounded-full bg-white shadow transition-transform ${s.on ? "translate-x-5" : ""}`} />
                  </div>
                ) : (
                  <input defaultValue={s.value} className="bg-input-background border border-border rounded-lg px-3 py-1.5 text-sm text-foreground outline-none w-20 text-right" />
                )}
              </div>
            ))}
          </div>
        </GlassCard>
      )}

      {tab === "cascadeflow" && (
        <GlassCard className="p-6 space-y-5">
          <h3 className="text-sm font-semibold text-foreground">cascadeflow Budget Controls</h3>
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-foreground">Weekly Budget Cap</span>
              <span className="font-semibold text-cyan-400">${budget}</span>
            </div>
            <input type="range" min="50" max="1000" step="10" value={budget} onChange={e => setBudget(Number(e.target.value))}
              className="w-full accent-indigo-500" />
            <div className="flex justify-between text-xs text-muted-foreground mt-1"><span>$50</span><span>$1000</span></div>
          </div>
          <div className="space-y-3">
            {MODEL_ROUTES.slice(0, 4).map(r => (
              <div key={r.task} className="flex items-center justify-between py-2.5 border-b border-border last:border-0">
                <div>
                  <div className="text-sm text-foreground">{r.task}</div>
                  <div className="text-xs text-muted-foreground">Current: {r.model}</div>
                </div>
                <select className="bg-input-background border border-border rounded-lg px-2 py-1.5 text-xs text-foreground outline-none">
                  <option>Auto (cascadeflow)</option>
                  <option>GPT-4o</option>
                  <option>Llama 3</option>
                  <option>Gemini Flash</option>
                  <option>Claude 3.5</option>
                </select>
              </div>
            ))}
          </div>
        </GlassCard>
      )}

      {tab === "hindsight" && (
        <GlassCard className="p-6 space-y-5">
          <h3 className="text-sm font-semibold text-foreground">Hindsight Memory Settings</h3>
          <div className="space-y-3">
            {[
              { label: "Memory Retention Period", desc: "How long to retain hiring pattern data", options: ["6 months", "1 year", "2 years", "Forever"] },
              { label: "Confidence Threshold", desc: "Minimum confidence to apply a memory", options: ["70%", "80%", "90%", "95%"] },
              { label: "Learning Mode", desc: "How aggressively AI learns from decisions", options: ["Conservative", "Balanced", "Aggressive"] },
            ].map(s => (
              <div key={s.label} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                <div>
                  <div className="text-sm font-medium text-foreground">{s.label}</div>
                  <div className="text-xs text-muted-foreground">{s.desc}</div>
                </div>
                <select className="bg-input-background border border-border rounded-lg px-3 py-1.5 text-xs text-foreground outline-none">
                  {s.options.map(o => <option key={o}>{o}</option>)}
                </select>
              </div>
            ))}
          </div>
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
            <div className="text-sm font-medium text-red-400 mb-1">Danger Zone</div>
            <div className="text-xs text-muted-foreground mb-3">Clearing memory will permanently delete all learned preferences and patterns.</div>
            <button className="px-3 py-2 rounded-lg bg-red-600/80 text-white text-xs font-medium hover:bg-red-600 transition-colors">
              Clear All Memory
            </button>
          </div>
        </GlassCard>
      )}

      {(tab === "team" || tab === "notifications") && (
        <GlassCard className="p-8 text-center">
          <Settings className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-50" />
          <p className="text-sm text-muted-foreground">
            {tab === "team" ? "Team management settings — add members, assign roles, manage permissions." : "Configure email, Slack, and in-app notification preferences."}
          </p>
          <button className="mt-4 px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-500 transition-colors">
            Configure
          </button>
        </GlassCard>
      )}
    </div>
  );
}

// ─── AI CHAT WIDGET ───────────────────────────────────────────────────────────

function AiChatWidget({ open, setOpen, user, workspace, refreshWorkspace }: { open: boolean; setOpen: (b: boolean) => void; user: WorkspaceState['user']; workspace: WorkspaceState; refreshWorkspace?: () => Promise<void> | void }) {
  const [messages, setMessages] = useState<Array<{ role: string; text: string; meta?: any }>>([
    { role: "ai", text: "👋 Welcome!\nAsk me to analyze resumes, rank candidates, generate interview questions, or make hiring decisions." },
  ]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const { token } = useAuth();

  const send = async (promptOverride?: string, options?: { confirm?: boolean; pendingAction?: any }) => {
    const userMsg = (promptOverride ?? input).trim();
    if (!userMsg || thinking) return;

    setMessages(prev => [...prev, { role: "user", text: userMsg }]);
    setInput("");
    setThinking(true);
    setHasInteracted(true);

    try {
      console.log("AI Chat Token:", token);
      const data = await request('/api/ai/chat', {
        method: 'POST',
        body: JSON.stringify({
          message: userMsg,
          workspace,
          confirmAction: options?.confirm || false,
          pendingAction: options?.pendingAction || null
        })
      }, token);

      setMessages(prev => [...prev, {
        role: "ai",
        text: data.reply || 'I’m ready to help with your next hiring move.',
        meta: {
          confidence: data.confidence,
          action: data.action,
          intent: data.intent,
          toolSummary: data.toolSummary,
          candidate: data.candidate,
          candidateId: data.candidateId,
          candidateName: data.candidateName,
          job: data.job,
          reasoning: data.reasoning || [],
          cards: data.cards || [],
          actions: data.actions || [],
          requiresConfirmation: data.requiresConfirmation,
          confirmationPrompt: data.confirmationPrompt,
          pendingAction: data.pendingAction,
          timeline: data.timeline || [],
          status: data.status,
          draft: data.draft
        }
      }]);

      if ((data.action === 'hire-candidate' || data.action === 'reject-candidate') && refreshWorkspace) {
        await refreshWorkspace();
      }
    } catch (error: any) {
      setMessages(prev => [...prev, { role: "ai", text: `I hit a snag while analyzing your hiring pipeline. ${error?.message || 'Please try again in a moment.'}` }]);
    } finally {
      setThinking(false);
    }
  };

  const executeWorkflowAction = async (action: 'hire' | 'reject', candidate: any) => {
    const candidateId = candidate?._id || candidate?.id;
    if (!candidateId || thinking) return;

    setThinking(true);

    try {
      const endpoint = action === 'hire' ? `/api/hiring/${candidateId}/hire` : `/api/hiring/${candidateId}/reject`;
      const data = await request(endpoint, {
        method: 'POST',
        body: JSON.stringify({
          notes: action === 'hire' ? 'Hired from AI Recruiter chat' : 'Rejected from AI Recruiter chat'
        })
      }, token);

      setMessages(prev => [...prev, {
        role: 'ai',
        text: data.message || (action === 'hire' ? 'The candidate was moved into the hiring workflow.' : 'The candidate was marked as rejected.'),
        meta: {
          action: action === 'hire' ? 'hire-candidate' : 'reject-candidate',
          candidate,
          workflowResult: data
        }
      }]);

      if (refreshWorkspace) {
        await refreshWorkspace();
      }
    } catch (error: any) {
      setMessages(prev => [...prev, { role: 'ai', text: `I couldn’t complete that workflow action. ${error?.message || 'Please try again.'}` }]);
    } finally {
      setThinking(false);
    }
  };

  return (
    <>
      {/* FAB */}
      <button onClick={() => setOpen(!open)}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 text-white shadow-2xl shadow-indigo-500/40 flex items-center justify-center hover:scale-105 transition-transform z-50">
        {open ? <X className="w-6 h-6" /> : <Bot className="w-6 h-6" />}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-24 right-6 w-[450px] h-[700px] z-50 flex flex-col bg-card border border-border rounded-2xl shadow-2xl shadow-black/40 overflow-hidden"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-5 text-xl font-bold flex items-center gap-3 min-h-[72px] text-white">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                <Bot className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1 flex flex-col justify-center">
                <div className="text-xl font-bold leading-tight">AI Recruiter</div>
                <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /><span className="text-xs font-normal text-indigo-200">Online · cascadeflow</span></div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {!hasInteracted && (
                <div className="bg-indigo-50/5 dark:bg-indigo-950/20 border border-indigo-500/20 rounded-xl p-3 text-xs text-muted-foreground mb-1">
                  <div className="font-semibold text-indigo-400 mb-1">💡 Tips &amp; Quick Guide</div>
                  <p className="mb-2">This intelligent recruiting assistant can query MongoDB databases, use Groq LLMs, and track interactions in real-time.</p>
                  <p className="font-medium text-foreground">Suggested queries:</p>
                  <ul className="list-disc list-inside space-y-0.5 mt-1">
                    <li>Rank applicants by candidate score</li>
                    <li>Generate technical interview questions</li>
                    <li>Draft job specifications</li>
                  </ul>
                </div>
              )}
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[94%] text-base rounded-xl px-4 py-3 leading-7 ${m.role === "user" ? "bg-indigo-600 text-white" : "bg-muted text-foreground"}`}>
                    <div>{m.text}</div>
                    {m.meta && (
                      <div className="mt-2 space-y-1 border-t border-white/10 pt-2 text-xs text-indigo-100">
                        {m.meta.confidence && <div>Confidence: {m.meta.confidence}%</div>}
                        {m.meta.intent && <div>Intent: {m.meta.intent.replace(/_/g, ' ')}</div>}
                        {m.meta.toolSummary && <div>Tools: {m.meta.toolSummary.mongodb ? 'MongoDB' : ''}{m.meta.toolSummary.hindsight ? ' • Hindsight' : ''}{m.meta.toolSummary.groq ? ' • Groq' : ''}</div>}
                        {m.meta.candidate?.name && <div>Candidate: {m.meta.candidate.name}</div>}
                        {m.meta.actions?.length > 0 && <div>Actions: {m.meta.actions.join(' • ')}</div>}
                        {m.meta.reasoning?.length ? <div>{m.meta.reasoning[0]}</div> : null}
                      </div>
                    )}
                    {m.meta?.cards?.length > 0 && (
                      <div className="mt-2 space-y-2">
                        {m.meta.cards.map((card: any, cardIndex: number) => (
                          <div key={cardIndex} className="rounded-lg border border-white/10 bg-background/70 p-3 text-xs text-foreground">
                            <div className="font-semibold text-foreground">{card.name || card.title}</div>
                            {card.score !== undefined && <div className="text-emerald-400">Match: {card.score}%</div>}
                            {card.body && <div className="mt-1 text-muted-foreground">{card.body}</div>}
                            {card.skills?.length > 0 && <div className="mt-1 text-muted-foreground">Skills: {card.skills.join(', ')}</div>}
                            {card.recommendation && <div className="mt-1 text-cyan-400">Action: {card.recommendation}</div>}
                          </div>
                        ))}
                      </div>
                    )}
                    {m.meta?.timeline?.length > 0 && (
                      <div className="mt-2 rounded-lg border border-white/10 bg-background/70 p-2">
                        <div className="mb-1 font-semibold text-foreground">Execution timeline</div>
                        <div className="space-y-1">
                          {m.meta.timeline.map((step: string, index: number) => (
                            <div key={`${step}-${index}`} className="text-xs text-muted-foreground">{step}</div>
                          ))}
                        </div>
                      </div>
                    )}
                    {m.meta?.draft && (
                      <div className="mt-2 rounded-lg border border-white/10 bg-background/70 p-2">
                        <div className="mb-1 font-semibold text-foreground">Draft</div>
                        <div className="text-xs text-muted-foreground whitespace-pre-wrap">{typeof m.meta.draft === 'string' ? m.meta.draft : JSON.stringify(m.meta.draft)}</div>
                      </div>
                    )}
                    {m.meta?.requiresConfirmation && m.meta?.pendingAction && (
                      <div className="mt-3 flex gap-2">
                        <button onClick={() => void send('Confirm', { confirm: true, pendingAction: m.meta.pendingAction })} className="rounded-xl bg-emerald-600/90 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-500 min-h-[44px] transition-colors">
                          Confirm
                        </button>
                        <button onClick={() => void send('Cancel')} className="rounded-xl bg-slate-600/90 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-500 min-h-[44px] transition-colors">
                          Cancel
                        </button>
                      </div>
                    )}
                    {(m.meta?.action === 'hire-candidate' || m.meta?.action === 'reject-candidate' || m.meta?.action === 'recommend-candidate') && (m.meta?.candidate?._id || m.meta?.candidate?.id) && !m.meta?.requiresConfirmation && (
                      <div className="mt-3 flex gap-2">
                        <button onClick={() => void executeWorkflowAction('hire', m.meta.candidate)} className="rounded-xl bg-emerald-600/90 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-500 min-h-[44px] transition-colors">
                          Hire
                        </button>
                        <button onClick={() => void executeWorkflowAction('reject', m.meta.candidate)} className="rounded-xl bg-red-600/90 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-500 min-h-[44px] transition-colors">
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {thinking && (
                <div className="flex justify-start">
                  <div className="max-w-[90%] text-sm rounded-xl px-4 py-3 leading-7 bg-muted text-foreground">
                    <div className="flex items-center gap-2 text-indigo-400"><Loader className="w-4 h-4 animate-spin" /> Thinking...</div>
                    <div className="mt-1 text-xs text-muted-foreground">Scanning candidates • Loading Hindsight memory • Generating response</div>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="px-5 py-3 border-t border-border/50 bg-background/50">
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: '🏆 Rank Candidates', prompt: 'Rank the candidates' },
                  { label: '📄 Analyze Resume', prompt: 'Analyze the current resumes' },
                  { label: '❓ Interview Questions', prompt: 'Generate interview questions' },
                  { label: '📋 Job Description', prompt: 'Generate a job description' },
                  { label: '✅ Hire Top Candidate', prompt: 'Hire the top candidate' },
                  { label: '🔍 Compare Candidates', prompt: 'Compare the candidates' }
                ].map((chip) => (
                  <button
                    key={chip.label}
                    onClick={() => { void send(chip.prompt); }}
                    className="px-5 py-3 text-base font-semibold rounded-xl min-h-[52px] border border-indigo-500/20 bg-indigo-500/10 text-indigo-300 hover:bg-indigo-500/20 transition-all flex items-center justify-center text-center leading-tight"
                  >
                    {chip.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Input */}
            <div className="p-4 border-t border-border flex gap-3 min-h-[72px] items-center bg-card">
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && void send()}
                placeholder="Ask AI anything…"
                className="flex-1 bg-input-background border border-border rounded-xl px-4 py-3 h-14 text-base text-foreground placeholder:text-muted-foreground outline-none focus:border-indigo-500 transition-colors"
              />
              <button onClick={() => void send()} className="w-14 h-14 rounded-xl bg-indigo-600 text-white flex items-center justify-center hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-500/20 active:scale-95 flex-shrink-0">
                <Send className="w-6 h-6" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────

function AppShell() {
  const [page, setPage] = useState<Page>("dashboard");
  const [workspace, setWorkspace] = useState<WorkspaceState>(EMPTY_WORKSPACE);
  const [loadingWorkspace, setLoadingWorkspace] = useState(true);
  const [isDark, setIsDark] = useState(true);
  const [collapsed, setCollapsed] = useState(false);
  const [selectedCandidateId, setSelectedCandidateId] = useState(1);
  const [aiChatOpen, setAiChatOpen] = useState(false);
  const { logout, token, login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isDark) document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
  }, [isDark]);

  const refreshWorkspace = useCallback(async () => {
    if (!token) {
      setWorkspace(EMPTY_WORKSPACE);
      setLoadingWorkspace(false);
      return;
    }

    setLoadingWorkspace(true);
    try {
      const data = await request('/api/workspace', {}, token);
      setWorkspace(data || EMPTY_WORKSPACE);
      if (data?.user && token) {
        login(token, data.user);
      }
    } catch {
      setWorkspace(EMPTY_WORKSPACE);
    } finally {
      setLoadingWorkspace(false);
    }
  }, [token, login]);

  useEffect(() => {
    void refreshWorkspace();
  }, [token]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const renderPage = () => {
    switch (page) {
      case "dashboard": return <Dashboard setPage={setPage} setSelectedId={setSelectedCandidateId} workspace={workspace} refreshWorkspace={refreshWorkspace} token={token} />;
      case "create-job": return <CreateJobPage onCreated={() => { void refreshWorkspace(); }} refreshWorkspace={refreshWorkspace} />;
      case "resume-upload": return <ResumeUploadPage onUploaded={() => { void refreshWorkspace(); }} refreshWorkspace={refreshWorkspace} />;
      case "candidates": return <CandidatesPage setPage={setPage} setSelectedId={setSelectedCandidateId} workspace={workspace} />;
      case "candidate-detail": return <CandidateDetailPage candidateId={selectedCandidateId} setPage={setPage} workspace={workspace} refreshWorkspace={refreshWorkspace} />;
      case "interview-questions": return <InterviewQuestionsPage />;
      case "hindsight": return <HindsightPage />;
      case "cascadeflow": return <CascadeFlowPage />;
      case "ranking": return <RankingPage setPage={setPage} setSelectedId={setSelectedCandidateId} workspace={workspace} />;
      case "notifications": return <NotificationsPage />;
      case "settings": return <SettingsPage />;
      default: return <Dashboard setPage={setPage} setSelectedId={setSelectedCandidateId} workspace={workspace} refreshWorkspace={refreshWorkspace} token={token} />;
    }
  };

  const unreadCount = NOTIFS.filter(n => !n.read).length;

  return (
    <div className="flex h-screen bg-background overflow-hidden font-sans">
      <Sidebar page={page} setPage={setPage} collapsed={collapsed} setCollapsed={setCollapsed} user={workspace.user} />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopNav page={page} isDark={isDark} setIsDark={setIsDark} setPage={setPage} unreadCount={unreadCount} user={workspace.user} />
        <main className="flex-1 overflow-y-auto p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={page}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18 }}
            >
              {loadingWorkspace ? <div className="text-sm text-muted-foreground">Loading workspace…</div> : renderPage()}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      <button onClick={handleLogout} className="fixed bottom-24 left-6 z-40 flex items-center gap-2 rounded-xl border border-border bg-card/80 px-3 py-2 text-sm text-muted-foreground hover:text-foreground">
        <LogOut className="w-4 h-4" /> Logout
      </button>
      <AiChatWidget open={aiChatOpen} setOpen={setAiChatOpen} user={workspace.user} workspace={workspace} refreshWorkspace={refreshWorkspace} />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<AppShell />} />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
          </Route>
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
