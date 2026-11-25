import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  Blocks,
  BookOpen,
  BrainCircuit,
  CheckCircle2,
  Cpu,
  Database,
  FileSearch,
  LockKeyhole,
  Menu,
  Network,
  ScanSearch,
  ShieldAlert,
  ShieldCheck,
  X,
} from 'lucide-react';
import { BrandLogo } from '@/components/brand/BrandLogo';
import { GlassCard } from '@/components/ui/GlassCard';
import { NetworkBackground } from '@/components/ui/NetworkBackground';
import { ThemeToggle } from '@/components/ui/ThemeToggle';

const PIPELINE_STEPS = [
  {
    step: '01',
    title: 'URL Syntax & Normalization',
    description:
      'Validates URL protocols, extracts canonical hostnames, and generates a deterministic SHA-256 fingerprint without exposing credentials.',
    icon: FileSearch,
  },
  {
    step: '02',
    title: 'Feature Vector Extraction',
    description:
      'Computes lexical length, Shannon entropy, subdomain depth, IP literal presence, and suspicious token frequencies.',
    icon: Cpu,
  },
  {
    step: '03',
    title: 'ML Threat Classification',
    description:
      'Trained Scikit-learn ensemble evaluates feature weights to output a risk score, prediction confidence, and actionable guidance.',
    icon: BrainCircuit,
  },
  {
    step: '04',
    title: 'Ethereum Hash Anchoring',
    description:
      'Records the URL SHA-256 digest, verdict, and timestamp on an Ethereum smart contract for tamper-evident auditability.',
    icon: Blocks,
  },
];

const ML_CAPABILITIES = [
  'Lexical analysis of path depth, query parameters, special delimiters, and domain entropy',
  'Supervised Scikit-learn model pipeline benchmarked across accuracy, precision, recall, and F1-score',
  'Transparent feature importance explanations alongside every prediction result',
  'Version-tagged inference artifacts tracked with dataset evaluation metrics',
];

const BLOCKCHAIN_CAPABILITIES = [
  'Solidity registry contract storing cryptographic URL hashes rather than raw sensitive links',
  'Immutable block timestamps and transaction receipts verified through Web3.py',
  'Independent integrity verification allowing auditors to confirm a scan record has not been altered',
  'Deterministic local Hardhat network support with clean migration path to Ethereum testnets',
];

const AWARENESS_PILLARS = [
  {
    title: 'Domain & Subdomain Inspection',
    description:
      'Learn how attackers disguise malicious registrable domains behind trusted brand keywords.',
    icon: ShieldAlert,
  },
  {
    title: 'Zero-Click Safe Analysis',
    description:
      'Inspect links structurally before visiting them in a browser, eliminating drive-by exposure.',
    icon: LockKeyhole,
  },
  {
    title: 'Interactive Defense Quiz',
    description:
      'Test your threat recognition against realistic, non-clickable phishing scenarios.',
    icon: BookOpen,
  },
];

export function LandingPage() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="relative min-h-screen text-text-primary">
      <NetworkBackground />

      {/* Top Navigation */}
      <header className="sticky top-0 z-40 border-b border-border-subtle bg-bg-main/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <BrandLogo showTagline />

          <nav className="hidden items-center gap-7 text-sm font-medium text-text-secondary md:flex">
            <a href="#how-it-works" className="transition-colors hover:text-accent-primary">
              How It Works
            </a>
            <a href="#ml-engine" className="transition-colors hover:text-accent-primary">
              ML Technology
            </a>
            <a href="#blockchain" className="transition-colors hover:text-accent-primary">
              Blockchain
            </a>
            <a href="#awareness" className="transition-colors hover:text-accent-primary">
              Awareness
            </a>
            <Link to="/about" className="transition-colors hover:text-accent-primary">
              About
            </Link>
          </nav>

          <div className="flex items-center gap-2.5">
            <ThemeToggle />
            <Link
              to="/dashboard"
              className="hidden rounded-xl border border-border-subtle bg-bg-elevated/80 px-3.5 py-2 text-xs font-semibold text-text-primary transition-colors hover:border-accent-primary/40 hover:text-accent-primary sm:inline-flex"
            >
              Dashboard
            </Link>
            <Link
              to="/scanner"
              className="hidden items-center gap-1.5 rounded-xl bg-accent-primary px-4 py-2 text-xs font-semibold text-white shadow-glow transition-opacity hover:opacity-90 dark:text-slate-950 sm:inline-flex"
            >
              <ScanSearch className="h-3.5 w-3.5" />
              <span>Scan a URL</span>
            </Link>
            <button
              type="button"
              onClick={() => setMobileNavOpen((prev) => !prev)}
              aria-label="Toggle navigation menu"
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-border-subtle bg-bg-elevated text-text-secondary md:hidden"
            >
              {mobileNavOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Mobile menu dropdown */}
        {mobileNavOpen && (
          <div className="border-t border-border-subtle bg-bg-elevated px-4 py-4 md:hidden">
            <div className="flex flex-col space-y-3 text-sm font-medium">
              <a
                href="#how-it-works"
                onClick={() => setMobileNavOpen(false)}
                className="text-text-secondary hover:text-accent-primary"
              >
                How It Works
              </a>
              <a
                href="#ml-engine"
                onClick={() => setMobileNavOpen(false)}
                className="text-text-secondary hover:text-accent-primary"
              >
                ML Technology
              </a>
              <a
                href="#blockchain"
                onClick={() => setMobileNavOpen(false)}
                className="text-text-secondary hover:text-accent-primary"
              >
                Blockchain Verification
              </a>
              <a
                href="#awareness"
                onClick={() => setMobileNavOpen(false)}
                className="text-text-secondary hover:text-accent-primary"
              >
                Cybersecurity Awareness
              </a>
              <Link
                to="/about"
                onClick={() => setMobileNavOpen(false)}
                className="text-text-secondary hover:text-accent-primary"
              >
                About Project
              </Link>
              <div className="flex gap-2 pt-2">
                <Link
                  to="/dashboard"
                  onClick={() => setMobileNavOpen(false)}
                  className="flex-1 rounded-xl border border-border-subtle py-2 text-center text-xs font-semibold"
                >
                  Explore Dashboard
                </Link>
                <Link
                  to="/scanner"
                  onClick={() => setMobileNavOpen(false)}
                  className="flex-1 rounded-xl bg-accent-primary py-2 text-center text-xs font-semibold text-white dark:text-slate-950"
                >
                  Scan a URL
                </Link>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-16 sm:py-24 lg:py-28">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-12 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="lg:col-span-7"
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-accent-primary/30 bg-accent-primary/10 px-3.5 py-1.5 text-xs font-semibold text-accent-primary">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>Detect intelligently. Verify securely. Browse confidently.</span>
            </div>

            <h1 className="mt-6 text-4xl font-extrabold tracking-tight text-text-primary sm:text-5xl lg:text-6xl">
              Think Before You Click.
            </h1>

            <p className="mt-5 max-w-2xl text-base leading-relaxed text-text-secondary sm:text-lg">
              PhishGuard combines supervised machine learning URL threat classification with
              Ethereum smart contract verification. Analyze suspicious links before opening them and
              anchor cryptographic detection proofs for tamper-evident cybersecurity auditing.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3.5">
              <Link
                to="/scanner"
                className="inline-flex items-center gap-2 rounded-xl bg-accent-primary px-6 py-3.5 text-sm font-semibold text-white shadow-glow transition-all hover:opacity-95 dark:text-slate-950"
              >
                <ScanSearch className="h-4 w-4" />
                <span>Scan a URL</span>
                <ArrowRight className="h-4 w-4" />
              </Link>

              <Link
                to="/dashboard"
                className="inline-flex items-center gap-2 rounded-xl border border-border-subtle bg-bg-elevated/90 px-6 py-3.5 text-sm font-semibold text-text-primary transition-colors hover:border-accent-primary/40 hover:text-accent-primary"
              >
                <span>Explore Dashboard</span>
              </Link>
            </div>

            {/* Academic tech summary strip */}
            <div className="mt-10 grid grid-cols-2 gap-4 border-t border-border-subtle pt-7 sm:grid-cols-4">
              <div>
                <p className="font-mono text-xs uppercase tracking-wider text-text-muted">Engine</p>
                <p className="mt-1 text-sm font-semibold text-text-primary">Scikit-learn</p>
              </div>
              <div>
                <p className="font-mono text-xs uppercase tracking-wider text-text-muted">API Layer</p>
                <p className="mt-1 text-sm font-semibold text-text-primary">Python FastAPI</p>
              </div>
              <div>
                <p className="font-mono text-xs uppercase tracking-wider text-text-muted">Ledger</p>
                <p className="mt-1 text-sm font-semibold text-text-primary">Ethereum Solidity</p>
              </div>
              <div>
                <p className="font-mono text-xs uppercase tracking-wider text-text-muted">Storage</p>
                <p className="mt-1 text-sm font-semibold text-text-primary">SQLite + On-Chain</p>
              </div>
            </div>
          </motion.div>

          {/* Animated Cyber Shield & Blockchain Lattice Visualization */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="lg:col-span-5"
          >
            <GlassCard accent="cyan" padding="lg" className="relative overflow-hidden">
              <div className="flex items-center justify-between border-b border-border-subtle pb-3">
                <div className="flex items-center gap-2">
                  <Network className="h-4 w-4 text-accent-primary" />
                  <span className="font-mono text-xs font-medium text-text-secondary">
                    VERIFICATION TOPOLOGY
                  </span>
                </div>
                <span className="rounded-full border border-accent-secondary/30 bg-accent-secondary/10 px-2.5 py-0.5 font-mono text-[11px] font-medium text-accent-secondary">
                  SHA-256 + ML
                </span>
              </div>

              <div className="relative my-6 flex items-center justify-center py-4">
                <svg
                  viewBox="0 0 320 260"
                  className="h-60 w-full max-w-[320px]"
                  role="img"
                  aria-label="Animated PhishGuard shield and blockchain verification network"
                >
                  {/* Concentric radar rings */}
                  <motion.circle
                    cx="160"
                    cy="130"
                    r="102"
                    fill="none"
                    stroke="currentColor"
                    className="text-accent-primary/20"
                    strokeWidth="1"
                    strokeDasharray="6 6"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 40, repeat: Infinity, ease: 'linear' }}
                    style={{ transformOrigin: '160px 130px' }}
                  />
                  <motion.circle
                    cx="160"
                    cy="130"
                    r="76"
                    fill="none"
                    stroke="currentColor"
                    className="text-accent-secondary/25"
                    strokeWidth="1.25"
                    strokeDasharray="4 5"
                    animate={{ rotate: -360 }}
                    transition={{ duration: 28, repeat: Infinity, ease: 'linear' }}
                    style={{ transformOrigin: '160px 130px' }}
                  />

                  {/* Connecting mesh lines */}
                  <line
                    x1="46"
                    y1="56"
                    x2="160"
                    y2="130"
                    className="stroke-accent-primary/35"
                    strokeWidth="1.2"
                  />
                  <line
                    x1="274"
                    y1="56"
                    x2="160"
                    y2="130"
                    className="stroke-accent-secondary/35"
                    strokeWidth="1.2"
                  />
                  <line
                    x1="46"
                    y1="204"
                    x2="160"
                    y2="130"
                    className="stroke-accent-secondary/35"
                    strokeWidth="1.2"
                  />
                  <line
                    x1="274"
                    y1="204"
                    x2="160"
                    y2="130"
                    className="stroke-accent-primary/35"
                    strokeWidth="1.2"
                  />

                  {/* Corner verification nodes */}
                  {[
                    { x: 46, y: 56, label: 'URL', delay: 0 },
                    { x: 274, y: 56, label: 'ML', delay: 0.6 },
                    { x: 46, y: 204, label: 'DB', delay: 1.2 },
                    { x: 274, y: 204, label: 'ETH', delay: 1.8 },
                  ].map((node) => (
                    <g key={node.label}>
                      <motion.circle
                        cx={node.x}
                        cy={node.y}
                        r="18"
                        className="fill-bg-elevated stroke-accent-primary/50"
                        strokeWidth="1.5"
                        animate={{ scale: [1, 1.07, 1] }}
                        transition={{
                          duration: 3,
                          delay: node.delay,
                          repeat: Infinity,
                          ease: 'easeInOut',
                        }}
                        style={{ transformOrigin: `${node.x}px ${node.y}px` }}
                      />
                      <text
                        x={node.x}
                        y={node.y + 4}
                        textAnchor="middle"
                        className="fill-text-primary font-mono text-[10px] font-semibold"
                      >
                        {node.label}
                      </text>
                    </g>
                  ))}

                  {/* Center Shield */}
                  <motion.g
                    animate={{ y: [0, -3, 0] }}
                    transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                  >
                    <path
                      d="M160 72L116 91V126.5C116 156.5 135 182.2 160 190C185 182.2 204 156.5 204 126.5V91L160 72Z"
                      className="fill-bg-secondary stroke-accent-primary"
                      strokeWidth="2.2"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M160 98L180 109.5V132.5L160 144L140 132.5V109.5L160 98Z"
                      className="fill-accent-secondary/15 stroke-accent-secondary"
                      strokeWidth="1.8"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M152 121L157.5 126.5L169 115"
                      fill="none"
                      className="stroke-accent-primary"
                      strokeWidth="2.4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </motion.g>
                </svg>
              </div>

              <div className="grid grid-cols-3 gap-2 border-t border-border-subtle pt-4 text-center">
                <div className="rounded-xl bg-bg-secondary/60 px-2 py-2.5">
                  <p className="font-mono text-[11px] text-text-muted">Feature Set</p>
                  <p className="mt-0.5 text-xs font-semibold text-text-primary">Lexical + Host</p>
                </div>
                <div className="rounded-xl bg-bg-secondary/60 px-2 py-2.5">
                  <p className="font-mono text-[11px] text-text-muted">Digest</p>
                  <p className="mt-0.5 text-xs font-semibold text-text-primary">SHA-256 Hash</p>
                </div>
                <div className="rounded-xl bg-bg-secondary/60 px-2 py-2.5">
                  <p className="font-mono text-[11px] text-text-muted">Audit</p>
                  <p className="mt-0.5 text-xs font-semibold text-text-primary">Smart Contract</p>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="border-t border-border-subtle py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <span className="font-mono text-xs font-semibold uppercase tracking-widest text-accent-primary">
              Workflow Pipeline
            </span>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-text-primary sm:text-3xl">
              How PhishGuard Evaluates &amp; Verifies Links
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-text-secondary sm:text-base">
              Every URL moves through a deterministic four-stage pipeline separating safe syntactic
              inspection from immutable cryptographic verification.
            </p>
          </div>

          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {PIPELINE_STEPS.map((item) => {
              const Icon = item.icon;
              return (
                <GlassCard key={item.step} hover className="flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-accent-primary/30 bg-accent-primary/10 text-accent-primary">
                        <Icon className="h-5 w-5" />
                      </div>
                      <span className="font-mono text-xs font-bold text-text-muted">
                        STEP {item.step}
                      </span>
                    </div>
                    <h3 className="mt-4 text-base font-semibold text-text-primary">{item.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-text-muted">
                      {item.description}
                    </p>
                  </div>
                </GlassCard>
              );
            })}
          </div>
        </div>
      </section>

      {/* ML & Blockchain Split Sections */}
      <section className="border-t border-border-subtle py-16 sm:py-20">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
          {/* ML Technology */}
          <div id="ml-engine">
            <GlassCard accent="cyan" padding="lg" className="h-full">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-accent-primary/30 bg-accent-primary/10 text-accent-primary">
                  <BrainCircuit className="h-5 w-5" />
                </div>
                <div>
                  <span className="font-mono text-xs uppercase tracking-wider text-accent-primary">
                    Machine Learning Engine
                  </span>
                  <h3 className="text-xl font-bold text-text-primary">
                    Explainable URL Threat Classification
                  </h3>
                </div>
              </div>

              <p className="mt-4 text-sm leading-relaxed text-text-secondary">
                Instead of relying solely on static blocklists that lag behind newly registered
                phishing domains, PhishGuard inspects structural URL patterns with Scikit-learn
                classifiers trained on labeled phishing and legitimate corpora.
              </p>

              <ul className="mt-6 space-y-3">
                {ML_CAPABILITIES.map((point) => (
                  <li key={point} className="flex items-start gap-2.5 text-sm text-text-secondary">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-accent-primary" />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-7 pt-5 border-t border-border-subtle flex items-center justify-between">
                <span className="text-xs text-text-muted">
                  Evaluation metrics load dynamically from trained model reports
                </span>
                <Link
                  to="/analytics"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-accent-primary hover:underline"
                >
                  <span>View ML Analytics</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </GlassCard>
          </div>

          {/* Blockchain Verification */}
          <div id="blockchain">
            <GlassCard accent="violet" padding="lg" className="h-full">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-accent-secondary/30 bg-accent-secondary/10 text-accent-secondary">
                  <Database className="h-5 w-5" />
                </div>
                <div>
                  <span className="font-mono text-xs uppercase tracking-wider text-accent-secondary">
                    Blockchain Verification
                  </span>
                  <h3 className="text-xl font-bold text-text-primary">
                    Tamper-Evident Ethereum Audit Log
                  </h3>
                </div>
              </div>

              <p className="mt-4 text-sm leading-relaxed text-text-secondary">
                Security logs stored exclusively in mutable databases can be altered or disputed.
                PhishGuard optionally anchors a SHA-256 hash of each analyzed URL alongside its
                risk verdict on an Ethereum smart contract.
              </p>

              <ul className="mt-6 space-y-3">
                {BLOCKCHAIN_CAPABILITIES.map((point) => (
                  <li key={point} className="flex items-start gap-2.5 text-sm text-text-secondary">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-accent-secondary" />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-7 pt-5 border-t border-border-subtle flex items-center justify-between">
                <span className="text-xs text-text-muted">
                  Live ledger queries inspect deployed Hardhat / RPC contracts
                </span>
                <Link
                  to="/explorer"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-accent-secondary hover:underline"
                >
                  <span>Open Explorer</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </GlassCard>
          </div>
        </div>
      </section>

      {/* Cybersecurity Awareness Section */}
      <section id="awareness" className="border-t border-border-subtle py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div className="max-w-2xl">
              <span className="font-mono text-xs font-semibold uppercase tracking-widest text-accent-primary">
                Human Layer Defense
              </span>
              <h2 className="mt-2 text-2xl font-bold tracking-tight text-text-primary sm:text-3xl">
                Cybersecurity Awareness &amp; Phishing Education
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-text-secondary sm:text-base">
                Technical detection is strongest when paired with informed users. Explore URL
                deception anatomy, security best practices, and an interactive quiz.
              </p>
            </div>
            <Link
              to="/awareness"
              className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-accent-primary/40 bg-accent-primary/10 px-4 py-2.5 text-xs font-semibold text-accent-primary transition-colors hover:bg-accent-primary/20"
            >
              <span>Launch Awareness Hub &amp; Quiz</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {AWARENESS_PILLARS.map((pillar) => {
              const Icon = pillar.icon;
              return (
                <GlassCard key={pillar.title} hover>
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-border-subtle bg-bg-secondary text-accent-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-4 text-base font-semibold text-text-primary">{pillar.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-text-muted">
                    {pillar.description}
                  </p>
                </GlassCard>
              );
            })}
          </div>
        </div>
      </section>

      {/* Project Information & Footer */}
      <footer className="border-t border-border-subtle bg-bg-elevated/70 py-12 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 md:grid-cols-12">
            <div className="md:col-span-5">
              <BrandLogo showTagline />
              <p className="mt-4 text-sm font-medium text-text-primary">
                Intelligent Phishing URL Detection Using Machine Learning and Blockchain
              </p>
              <p className="mt-2 text-xs leading-relaxed text-text-muted">
                Detect intelligently. Verify securely. Browse confidently. Built as a full-stack
                academic cybersecurity platform integrating Scikit-learn classification with
                Ethereum smart contract verification.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 md:col-span-7">
              <div>
                <h4 className="font-mono text-xs font-semibold uppercase tracking-wider text-text-muted">
                  Platform
                </h4>
                <ul className="mt-3 space-y-2 text-sm text-text-secondary">
                  <li>
                    <Link to="/dashboard" className="hover:text-accent-primary">
                      Dashboard
                    </Link>
                  </li>
                  <li>
                    <Link to="/scanner" className="hover:text-accent-primary">
                      URL Scanner
                    </Link>
                  </li>
                  <li>
                    <Link to="/history" className="hover:text-accent-primary">
                      Scan History
                    </Link>
                  </li>
                </ul>
              </div>

              <div>
                <h4 className="font-mono text-xs font-semibold uppercase tracking-wider text-text-muted">
                  Verification &amp; ML
                </h4>
                <ul className="mt-3 space-y-2 text-sm text-text-secondary">
                  <li>
                    <Link to="/explorer" className="hover:text-accent-primary">
                      Blockchain Explorer
                    </Link>
                  </li>
                  <li>
                    <Link to="/analytics" className="hover:text-accent-primary">
                      ML Analytics
                    </Link>
                  </li>
                </ul>
              </div>

              <div>
                <h4 className="font-mono text-xs font-semibold uppercase tracking-wider text-text-muted">
                  Resources
                </h4>
                <ul className="mt-3 space-y-2 text-sm text-text-secondary">
                  <li>
                    <Link to="/awareness" className="hover:text-accent-primary">
                      Cyber Awareness
                    </Link>
                  </li>
                  <li>
                    <Link to="/about" className="hover:text-accent-primary">
                      About Project
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <div className="mt-10 flex flex-col items-start justify-between gap-3 border-t border-border-subtle pt-6 text-xs text-text-muted sm:flex-row sm:items-center">
            <p>PhishGuard Academic Cybersecurity Platform — Phase 1 Frontend Interface</p>
            <p className="font-mono">React • TypeScript • FastAPI • Scikit-learn • Ethereum</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
