import { useEffect, useState } from 'react';
import {
  ArrowRight,
  Blocks,
  BrainCircuit,
  CheckCircle2,
  Cpu,
  Database,
  Edit3,
  Globe,
  Plus,
  RotateCcw,
  Save,
  ShieldCheck,
  Trash2,
  Users,
} from 'lucide-react';
import { GlassCard, StatusBadge } from '@/components';
import { useToast } from '@/context/ToastContext';

interface TeamMember {
  id: string;
  name: string;
  role: string;
  academicId: string;
  focus: string;
}

const TEAM_STORAGE_KEY = 'phishguard_team_members_v1';

const DEFAULT_TEAM: TeamMember[] = [
  {
    id: 'member-1',
    name: 'Team Member 1',
    role: 'ML & Feature Engineering Lead',
    academicId: 'ID / Roll No. (Editable)',
    focus: 'Scikit-learn pipeline, feature extraction & evaluation',
  },
  {
    id: 'member-2',
    name: 'Team Member 2',
    role: 'Backend & API Architect',
    academicId: 'ID / Roll No. (Editable)',
    focus: 'Python FastAPI REST endpoints & SQLite persistence',
  },
  {
    id: 'member-3',
    name: 'Team Member 3',
    role: 'Blockchain & Smart Contract Developer',
    academicId: 'ID / Roll No. (Editable)',
    focus: 'Solidity registry, Hardhat & Web3.py anchoring',
  },
  {
    id: 'member-4',
    name: 'Team Member 4',
    role: 'Frontend & Security UX Designer',
    academicId: 'ID / Roll No. (Editable)',
    focus: 'React, TypeScript, Tailwind CSS & data visualization',
  },
];

const OBJECTIVES = [
  'Analyze URLs without executing remote page scripts or exposing end-user browsers to malicious payloads.',
  'Extract deterministic lexical, host-structural, and statistical entropy features for supervised ML classification.',
  'Compare classical ML algorithms objectively using Accuracy, Precision, Recall, F1-score, and Confusion Matrices.',
  'Anchor cryptographic SHA-256 digests and scan verdicts onto an Ethereum smart contract for tamper-evident auditability.',
];

const METHODOLOGY_STEPS = [
  {
    phase: 'Phase 1',
    title: 'Frontend & Typed API Contracts',
    detail:
      'Responsive React + TypeScript interface with URL syntax validation, theme support, visualizations, and honest offline states.',
  },
  {
    phase: 'Phase 2',
    title: 'Dataset & ML Training Pipeline',
    detail:
      'Clean labeled phishing/legitimate URL corpora, engineer lexical features, train Scikit-learn models, and export Joblib artifacts.',
  },
  {
    phase: 'Phase 3',
    title: 'FastAPI Backend & SQLite Store',
    detail:
      'Serve inference endpoints, persist scan metadata safely with redacted URLs, and expose dashboard & analytics routes.',
  },
  {
    phase: 'Phase 4',
    title: 'Solidity Contract & Web3.py Integration',
    detail:
      'Deploy registry contract on Hardhat, submit SHA-256 verification transactions via Web3.py, and verify proofs in Explorer.',
  },
];

const TECH_STACK = [
  { group: 'Frontend', items: 'React.js, TypeScript, Vite, Tailwind CSS, Framer Motion, Recharts, Lucide React' },
  { group: 'Backend', items: 'Python FastAPI, Pydantic, Uvicorn, Web3.py' },
  { group: 'Machine Learning', items: 'Scikit-learn, Pandas, NumPy, Joblib' },
  { group: 'Blockchain & DB', items: 'Ethereum, Solidity, Hardhat, SQLite' },
];

export function AboutPage() {
  const { showToast } = useToast();
  const [team, setTeam] = useState<TeamMember[]>(() => {
    try {
      const saved = window.localStorage.getItem(TEAM_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as TeamMember[];
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // Fallback to default team
    }
    return DEFAULT_TEAM;
  });
  const [isEditingTeam, setIsEditingTeam] = useState(false);

  useEffect(() => {
    try {
      window.localStorage.setItem(TEAM_STORAGE_KEY, JSON.stringify(team));
    } catch {
      // Ignore storage quota errors
    }
  }, [team]);

  const handleUpdateMember = (id: string, field: keyof TeamMember, value: string) => {
    setTeam((prev) =>
      prev.map((member) => (member.id === id ? { ...member, [field]: value } : member)),
    );
  };

  const handleAddMember = () => {
    const newId = `member-${Date.now()}`;
    setTeam((prev) => [
      ...prev,
      {
        id: newId,
        name: `Team Member ${prev.length + 1}`,
        role: 'Contributor',
        academicId: 'ID / Roll No.',
        focus: 'System design & verification',
      },
    ]);
  };

  const handleRemoveMember = (id: string) => {
    if (team.length <= 1) {
      showToast({
        variant: 'warning',
        title: 'Cannot remove last slot',
        description: 'At least one project member slot is required.',
      });
      return;
    }
    setTeam((prev) => prev.filter((m) => m.id !== id));
  };

  const handleResetTeam = () => {
    setTeam(DEFAULT_TEAM);
    showToast({
      variant: 'info',
      title: 'Team roster reset',
      description: 'Restored default editable academic team template.',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <GlassCard accent="cyan" padding="lg">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge variant="info" label="Academic Cybersecurity Capstone" />
          <span className="font-mono text-xs text-text-muted">
            Detect intelligently. Verify securely. Browse confidently.
          </span>
        </div>
        <h2 className="mt-3 text-2xl font-extrabold tracking-tight text-text-primary sm:text-3xl">
          Intelligent Phishing URL Detection Using Machine Learning and Blockchain
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-text-secondary">
          <strong className="text-text-primary">Abstract: </strong>
          Phishing remains one of the primary initial access vectors across web and enterprise
          ecosystems. Traditional signature blocklists struggle to keep pace with ephemeral domain
          generation, while centralized threat logs lack cryptographic proof against tampering.
          PhishGuard unifies supervised machine learning URL classification with Ethereum smart
          contract hash anchoring to deliver fast threat prediction alongside verifiable,
          immutable security records.
        </p>
      </GlassCard>

      {/* Problem Statement & Proposed Solution */}
      <div className="grid gap-6 lg:grid-cols-2">
        <GlassCard>
          <h3 className="text-base font-semibold text-text-primary">Problem Statement</h3>
          <p className="mt-2.5 text-sm leading-relaxed text-text-secondary">
            Attackers continuously spin up short-lived deceptive URLs using lookalike subdomains,
            punycode tricks, and open redirects that bypass static allow/block lists. Meanwhile,
            users have no safe way to inspect links without opening them, and organizational scan
            audits stored solely in mutable databases can be retroactively modified.
          </p>
        </GlassCard>

        <GlassCard>
          <h3 className="text-base font-semibold text-text-primary">Proposed Solution</h3>
          <p className="mt-2.5 text-sm leading-relaxed text-text-secondary">
            PhishGuard provides a zero-click web interface backed by a Python FastAPI inference
            service and Scikit-learn models trained on lexical and structural URL attributes. Each
            scan computes a deterministic SHA-256 digest of the URL that can be anchored on an
            Ethereum registry contract via Web3.py, establishing an auditable chain of custody.
          </p>
        </GlassCard>
      </div>

      {/* Objectives */}
      <GlassCard>
        <h3 className="text-base font-semibold text-text-primary">Core Project Objectives</h3>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {OBJECTIVES.map((obj) => (
            <div
              key={obj}
              className="flex items-start gap-2.5 rounded-xl border border-border-subtle bg-bg-secondary/40 p-3.5 text-xs leading-relaxed text-text-secondary sm:text-sm"
            >
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-accent-primary" />
              <span>{obj}</span>
            </div>
          ))}
        </div>
      </GlassCard>

      {/* System Architecture Visual */}
      <GlassCard accent="violet" padding="lg">
        <h3 className="text-base font-semibold text-text-primary">System Architecture</h3>
        <p className="mt-1 text-xs text-text-muted">
          Decoupled four-tier pipeline connecting client inspection, ML inference, relational
          persistence, and smart contract verification.
        </p>

        <div className="mt-6 grid gap-4 md:grid-cols-4">
          {[
            {
              title: '1. React + TS Client',
              desc: 'URL validation, interactive visualizations, awareness hub',
              icon: Globe,
            },
            {
              title: '2. FastAPI + SQLite',
              desc: 'Typed REST API, scan logging, redacted history storage',
              icon: Cpu,
            },
            {
              title: '3. Scikit-learn Engine',
              desc: 'Feature extraction, classification, probability & feature weights',
              icon: BrainCircuit,
            },
            {
              title: '4. Web3.py + Solidity',
              desc: 'Hardhat / Ethereum registry anchoring SHA-256 scan proofs',
              icon: Blocks,
            },
          ].map((node, index) => {
            const Icon = node.icon;
            return (
              <div
                key={node.title}
                className="relative flex flex-col justify-between rounded-2xl border border-border-subtle bg-bg-secondary/50 p-4"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-accent-primary/30 bg-accent-primary/10 text-accent-primary">
                      <Icon className="h-4 w-4" />
                    </div>
                    {index < 3 && (
                      <ArrowRight className="hidden h-4 w-4 text-text-muted md:block" />
                    )}
                  </div>
                  <h4 className="mt-3 text-sm font-semibold text-text-primary">{node.title}</h4>
                  <p className="mt-1 text-xs leading-relaxed text-text-muted">{node.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </GlassCard>

      {/* Technologies Used & Project Methodology */}
      <div className="grid gap-6 lg:grid-cols-12">
        <GlassCard className="lg:col-span-5">
          <div className="flex items-center gap-2">
            <Database className="h-4 w-4 text-accent-primary" />
            <h3 className="text-base font-semibold text-text-primary">Technologies Used</h3>
          </div>
          <div className="mt-4 space-y-3">
            {TECH_STACK.map((stack) => (
              <div
                key={stack.group}
                className="rounded-xl border border-border-subtle bg-bg-secondary/40 p-3.5"
              >
                <p className="font-mono text-xs font-semibold uppercase tracking-wider text-accent-primary">
                  {stack.group}
                </p>
                <p className="mt-1 text-xs leading-relaxed text-text-secondary">{stack.items}</p>
              </div>
            ))}
          </div>
        </GlassCard>

        <GlassCard className="lg:col-span-7">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-accent-secondary" />
            <h3 className="text-base font-semibold text-text-primary">Project Methodology</h3>
          </div>
          <div className="mt-4 space-y-3">
            {METHODOLOGY_STEPS.map((item) => (
              <div
                key={item.phase}
                className="rounded-xl border border-border-subtle bg-bg-secondary/40 p-3.5"
              >
                <div className="flex items-center gap-2">
                  <span className="rounded-md bg-accent-secondary/15 px-2 py-0.5 font-mono text-[11px] font-semibold text-accent-secondary">
                    {item.phase}
                  </span>
                  <h4 className="text-sm font-semibold text-text-primary">{item.title}</h4>
                </div>
                <p className="mt-1.5 text-xs leading-relaxed text-text-muted">{item.detail}</p>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>

      {/* Advantages, Limitations & Future Scope */}
      <div className="grid gap-4 md:grid-cols-3">
        <GlassCard>
          <h3 className="text-sm font-semibold text-status-success">Advantages</h3>
          <ul className="mt-3 space-y-2 text-xs leading-relaxed text-text-secondary">
            <li>• Detects zero-day phishing URLs via structural patterns without visiting links.</li>
            <li>• Provides transparent probability, risk score, and feature explanations.</li>
            <li>• Ensures tamper-evident audit records via Ethereum SHA-256 digests.</li>
          </ul>
        </GlassCard>

        <GlassCard>
          <h3 className="text-sm font-semibold text-status-warning">Limitations</h3>
          <ul className="mt-3 space-y-2 text-xs leading-relaxed text-text-secondary">
            <li>• Purely lexical analysis does not inspect post-login DOM or screenshots.</li>
            <li>• Blockchain transaction anchoring introduces RPC confirmation latency and gas costs.</li>
            <li>• Model accuracy depends on fresh, representative training corpora.</li>
          </ul>
        </GlassCard>

        <GlassCard>
          <h3 className="text-sm font-semibold text-accent-primary">Future Scope</h3>
          <ul className="mt-3 space-y-2 text-xs leading-relaxed text-text-secondary">
            <li>• Browser extension integration for real-time link pre-flight checks.</li>
            <li>• WHOIS, TLS certificate age, and DNS reputation enrichment features.</li>
            <li>• Layer-2 rollup anchoring and automated model retraining pipelines.</li>
          </ul>
        </GlassCard>
      </div>

      {/* Editable Team Member Information */}
      <GlassCard accent="cyan" padding="lg">
        <div className="flex flex-col justify-between gap-3 border-b border-border-subtle pb-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-2.5">
            <Users className="h-5 w-5 text-accent-primary" />
            <div>
              <h3 className="text-base font-semibold text-text-primary">
                Project Team Information
              </h3>
              <p className="text-xs text-text-muted">
                Editable academic roster saved locally in your browser.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {isEditingTeam && (
              <>
                <button
                  type="button"
                  onClick={handleAddMember}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-border-subtle bg-bg-elevated px-3 py-2 text-xs font-semibold text-text-primary hover:border-accent-primary/40"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Add Member</span>
                </button>
                <button
                  type="button"
                  onClick={handleResetTeam}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-border-subtle bg-bg-elevated px-3 py-2 text-xs font-semibold text-text-muted hover:text-text-primary"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span>Reset</span>
                </button>
              </>
            )}

            <button
              type="button"
              onClick={() => {
                if (isEditingTeam) {
                  showToast({
                    variant: 'success',
                    title: 'Team details saved',
                    description: 'Team roster changes are persisted in local storage.',
                  });
                }
                setIsEditingTeam((prev) => !prev);
              }}
              className="inline-flex items-center gap-1.5 rounded-xl bg-accent-primary px-4 py-2 text-xs font-bold text-white dark:text-slate-950"
            >
              {isEditingTeam ? (
                <>
                  <Save className="h-3.5 w-3.5" />
                  <span>Save Roster</span>
                </>
              ) : (
                <>
                  <Edit3 className="h-3.5 w-3.5" />
                  <span>Edit Team</span>
                </>
              )}
            </button>
          </div>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {team.map((member) => (
            <div
              key={member.id}
              className="rounded-2xl border border-border-subtle bg-bg-secondary/45 p-4 space-y-2.5"
            >
              {isEditingTeam ? (
                <>
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-[10px] uppercase text-text-muted">
                      Editable Slot
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveMember(member.id)}
                      aria-label={`Remove ${member.name}`}
                      className="rounded p-1 text-text-muted hover:text-status-danger"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <input
                    type="text"
                    value={member.name}
                    onChange={(e) => handleUpdateMember(member.id, 'name', e.target.value)}
                    aria-label="Member Name"
                    placeholder="Full Name"
                    className="w-full rounded-lg border border-border-subtle bg-bg-elevated px-2.5 py-1.5 text-xs font-semibold text-text-primary focus:border-accent-primary focus:outline-none"
                  />
                  <input
                    type="text"
                    value={member.role}
                    onChange={(e) => handleUpdateMember(member.id, 'role', e.target.value)}
                    aria-label="Member Role"
                    placeholder="Role"
                    className="w-full rounded-lg border border-border-subtle bg-bg-elevated px-2.5 py-1.5 text-xs text-text-secondary focus:border-accent-primary focus:outline-none"
                  />
                  <input
                    type="text"
                    value={member.academicId}
                    onChange={(e) => handleUpdateMember(member.id, 'academicId', e.target.value)}
                    aria-label="Academic ID"
                    placeholder="Academic ID"
                    className="w-full rounded-lg border border-border-subtle bg-bg-elevated px-2.5 py-1.5 font-mono text-[11px] text-text-muted focus:border-accent-primary focus:outline-none"
                  />
                  <textarea
                    rows={2}
                    value={member.focus}
                    onChange={(e) => handleUpdateMember(member.id, 'focus', e.target.value)}
                    aria-label="Focus Area"
                    placeholder="Focus Area"
                    className="w-full rounded-lg border border-border-subtle bg-bg-elevated px-2.5 py-1.5 text-xs text-text-muted focus:border-accent-primary focus:outline-none"
                  />
                </>
              ) : (
                <>
                  <p className="text-sm font-bold text-text-primary">{member.name}</p>
                  <p className="text-xs font-medium text-accent-primary">{member.role}</p>
                  <p className="font-mono text-[11px] text-text-muted">{member.academicId}</p>
                  <p className="pt-1 text-xs leading-relaxed text-text-secondary">
                    {member.focus}
                  </p>
                </>
              )}
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
}
