import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  AlertTriangle,
  Blocks,
  CheckCircle2,
  ClipboardPaste,
  Eraser,
  Fingerprint,
  Loader2,
  ScanSearch,
  ServerOff,
  ShieldAlert,
  ShieldCheck,
  ShieldQuestion,
} from 'lucide-react';
import {
  BlockchainStatusBadge,
  GlassCard,
  HealthStatusBadge,
  PredictionBadge,
  RiskScoreGauge,
} from '@/components';
import { useSystemStatus } from '@/context/SystemStatusContext';
import { useToast } from '@/context/ToastContext';
import { ApiError, blockchainService, scannerService } from '@/services';
import type { ScanResult } from '@/types/api';
import { formatPercent, formatTimestamp, truncateMiddle } from '@/utils/formatters';
import { validateUrlInput } from '@/utils/urlValidation';

const SAMPLE_URLS = [
  {
    label: 'Academic Domain Sample',
    url: 'https://www.stanford.edu/academics/',
    note: 'Clean HTTPS educational domain',
  },
  {
    label: 'Python Documentation',
    url: 'https://docs.python.org/3/library/urllib.parse.html',
    note: 'Standard multi-segment path',
  },
  {
    label: 'Suspicious Token Sample',
    url: 'https://secure-verify-account.example.com/auth/confirm?session=892a1f',
    note: 'Fictional .example lookalike subdomain',
  },
  {
    label: 'IP-Literal URL Sample',
    url: 'http://192.0.2.45/webmail/update-credentials.php',
    note: 'RFC 5737 test IP over plain HTTP',
  },
];

const SCAN_STAGES = [
  'Validating URL syntax & hostname',
  'Dispatching request to FastAPI ML engine',
  'Evaluating lexical & structural features',
  'Formatting risk score & cryptographic digest',
];

const PLANNED_FEATURE_GROUPS = [
  {
    title: 'Lexical & Length Signals',
    items: 'URL character length, dot count, hyphen density, special delimiter ratio, path depth',
  },
  {
    title: 'Host & Obfuscation Signals',
    items: 'Raw IPv4 usage, subdomain nesting, Shannon character entropy, Punycode presence',
  },
  {
    title: 'Protocol & Keyword Signals',
    items: 'HTTPS scheme usage, credential token indicators, suspicious query redirect parameters',
  },
  {
    title: 'Cryptographic Integrity',
    items: 'Deterministic SHA-256 URL hash prepared for optional Ethereum smart contract anchoring',
  },
];

export function ScannerPage() {
  const { health } = useSystemStatus();
  const { showToast } = useToast();

  const [urlInput, setUrlInput] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanStageIdx, setScanStageIdx] = useState(0);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [backendError, setBackendError] = useState<string | null>(null);
  const [isAnchoring, setIsAnchoring] = useState(false);

  const handleUrlChange = (value: string) => {
    setUrlInput(value);
    if (validationError) {
      const check = validateUrlInput(value);
      if (check.valid) {
        setValidationError(null);
      }
    }
  };

  const handlePasteClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (!text.trim()) {
        showToast({
          variant: 'warning',
          title: 'Clipboard is empty',
          description: 'Copy a URL first, then paste it into the scanner.',
        });
        return;
      }
      setUrlInput(text.trim());
      setValidationError(null);
      showToast({
        variant: 'info',
        title: 'URL pasted from clipboard',
      });
    } catch {
      showToast({
        variant: 'error',
        title: 'Clipboard access blocked',
        description: 'Paste manually using Ctrl+V / Cmd+V inside the input field.',
      });
    }
  };

  const handleClear = () => {
    setUrlInput('');
    setValidationError(null);
    setScanResult(null);
    setBackendError(null);
  };

  const handleAnalyze = async (event: React.FormEvent) => {
    event.preventDefault();
    const validation = validateUrlInput(urlInput);
    if (!validation.valid || !validation.normalizedUrl) {
      setValidationError(validation.error || 'Enter a valid http:// or https:// URL.');
      return;
    }

    setValidationError(null);
    setBackendError(null);
    setScanResult(null);
    setIsScanning(true);
    setScanStageIdx(0);

    const stageTimer = window.setInterval(() => {
      setScanStageIdx((prev) => (prev < SCAN_STAGES.length - 1 ? prev + 1 : prev));
    }, 360);

    try {
      const result = await scannerService.analyzeUrl({ url: validation.normalizedUrl });
      setScanResult(result);
      showToast({
        variant: result.prediction === 'Phishing' ? 'warning' : 'success',
        title: `Analysis complete: ${result.prediction}`,
        description: `Risk score ${result.riskScore}/100 evaluated by ${result.modelName}.`,
      });
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : 'Unexpected error communicating with the ML inference service.';
      setBackendError(message);
      showToast({
        variant: 'warning',
        title: 'ML Analysis Unavailable',
        description: message,
      });
    } finally {
      window.clearInterval(stageTimer);
      setIsScanning(false);
    }
  };

  const handleSaveToBlockchain = async () => {
    if (!scanResult) return;
    setIsAnchoring(true);
    try {
      const txRecord = await blockchainService.recordScan({ scanId: scanResult.scanId });
      setScanResult((prev) =>
        prev
          ? {
              ...prev,
              blockchainStatus: txRecord.verified ? 'verified' : 'pending',
              blockchainTxHash: txRecord.txHash,
              blockNumber: txRecord.blockNumber,
            }
          : prev,
      );
      showToast({
        variant: 'success',
        title: 'Anchored to Ethereum',
        description: `Transaction ${truncateMiddle(txRecord.txHash, 10, 8)} recorded.`,
      });
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : 'Failed to anchor scan record onto Ethereum blockchain.';
      showToast({
        variant: 'error',
        title: 'Blockchain Anchoring Unavailable',
        description: message,
      });
    } finally {
      setIsAnchoring(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Main URL Scanner Card */}
      <GlassCard accent="cyan" padding="lg">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-accent-primary">
              <ScanSearch className="h-4 w-4" />
              <span>Machine Learning URL Threat Analyzer</span>
            </div>
            <h2 className="mt-1 text-xl font-bold text-text-primary sm:text-2xl">
              Inspect a Suspicious URL Safely
            </h2>
            <p className="mt-1 text-sm text-text-muted">
              Enter any web link below. PhishGuard validates its syntax and sends it to the trained
              Scikit-learn inference backend without navigating to the target page.
            </p>
          </div>
          <HealthStatusBadge
            state={health.mlModel.status}
            label={health.mlModel.status === 'online' ? 'ML Engine Ready' : 'ML Engine Offline'}
          />
        </div>

        <form onSubmit={handleAnalyze} className="mt-6 space-y-4" noValidate>
          <div className="relative">
            <label htmlFor="url-scanner-input" className="sr-only">
              Target URL to analyze
            </label>
            <input
              id="url-scanner-input"
              type="url"
              value={urlInput}
              onChange={(e) => handleUrlChange(e.target.value)}
              placeholder="https://example-login-verification.example.com/auth"
              aria-invalid={Boolean(validationError)}
              className={`w-full rounded-2xl border bg-bg-elevated/90 px-4 py-4 pr-12 font-mono text-sm text-text-primary placeholder:text-text-muted/60 focus:outline-none focus:ring-2 ${
                validationError
                  ? 'border-status-danger focus:ring-status-danger/30'
                  : 'border-border-subtle focus:border-accent-primary focus:ring-accent-primary/25'
              }`}
            />
            {urlInput && (
              <button
                type="button"
                onClick={handleClear}
                aria-label="Clear URL input"
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-2 text-text-muted transition-colors hover:bg-bg-secondary hover:text-text-primary"
              >
                <Eraser className="h-4 w-4" />
              </button>
            )}
          </div>

          {validationError && (
            <p role="alert" className="flex items-center gap-2 text-xs font-medium text-status-danger">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>{validationError}</span>
            </p>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={() => void handlePasteClipboard()}
                className="inline-flex items-center gap-2 rounded-xl border border-border-subtle bg-bg-elevated px-3.5 py-2.5 text-xs font-semibold text-text-secondary transition-colors hover:border-accent-primary/40 hover:text-text-primary"
              >
                <ClipboardPaste className="h-4 w-4" />
                <span>Paste from Clipboard</span>
              </button>

              <button
                type="button"
                onClick={handleClear}
                disabled={!urlInput && !scanResult && !backendError}
                className="inline-flex items-center gap-2 rounded-xl border border-border-subtle bg-bg-elevated px-3.5 py-2.5 text-xs font-semibold text-text-secondary transition-colors hover:border-border-strong hover:text-text-primary disabled:opacity-45"
              >
                <Eraser className="h-4 w-4" />
                <span>Clear</span>
              </button>
            </div>

            <button
              type="submit"
              disabled={isScanning}
              className="inline-flex items-center gap-2 rounded-xl bg-accent-primary px-6 py-2.5 text-sm font-semibold text-white shadow-glow transition-opacity hover:opacity-90 disabled:opacity-60 dark:text-slate-950"
            >
              {isScanning ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Analyzing URL...</span>
                </>
              ) : (
                <>
                  <ScanSearch className="h-4 w-4" />
                  <span>Analyze URL</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Example Demonstration URLs */}
        <div className="mt-6 border-t border-border-subtle pt-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">
            Demonstration URL Inputs (Fictional / Safe Examples)
          </p>
          <div className="mt-3 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
            {SAMPLE_URLS.map((sample) => (
              <button
                key={sample.url}
                type="button"
                onClick={() => {
                  setUrlInput(sample.url);
                  setValidationError(null);
                  setBackendError(null);
                }}
                className="group rounded-xl border border-border-subtle bg-bg-secondary/50 p-3 text-left transition-all hover:border-accent-primary/40 hover:bg-bg-secondary"
              >
                <p className="text-xs font-semibold text-text-primary group-hover:text-accent-primary">
                  {sample.label}
                </p>
                <p className="mt-1 truncate font-mono text-[11px] text-text-muted">
                  {sample.url}
                </p>
                <p className="mt-1 text-[11px] text-text-muted/80">{sample.note}</p>
              </button>
            ))}
          </div>
        </div>
      </GlassCard>

      {/* Scanning Progress Animation */}
      {isScanning && (
        <GlassCard accent="cyan">
          <div className="flex items-center gap-3">
            <Loader2 className="h-5 w-5 animate-spin text-accent-primary" />
            <div>
              <h3 className="text-sm font-semibold text-text-primary">
                Running Phishing Threat Analysis
              </h3>
              <p className="text-xs text-text-muted">{SCAN_STAGES[scanStageIdx]}</p>
            </div>
          </div>

          <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-bg-secondary">
            <motion.div
              className="h-full bg-gradient-to-r from-accent-primary to-accent-secondary"
              initial={{ width: '15%' }}
              animate={{ width: `${((scanStageIdx + 1) / SCAN_STAGES.length) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>

          <div className="mt-4 grid gap-2 sm:grid-cols-4">
            {SCAN_STAGES.map((stage, idx) => (
              <div
                key={stage}
                className={`rounded-xl border px-3 py-2 text-xs ${
                  idx <= scanStageIdx
                    ? 'border-accent-primary/40 bg-accent-primary/10 text-text-primary'
                    : 'border-border-subtle bg-bg-secondary/40 text-text-muted'
                }`}
              >
                {stage}
              </div>
            ))}
          </div>
        </GlassCard>
      )}

      {/* Honest Service Unavailable Response (No Fake ML Prediction) */}
      {!isScanning && backendError && (
        <GlassCard accent="danger">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-status-danger/30 bg-status-danger/10 text-status-danger">
              <ServerOff className="h-5 w-5" />
            </div>
            <div className="space-y-2">
              <h3 className="text-base font-semibold text-text-primary">
                Unable to Generate Prediction — Backend Service Unavailable
              </h3>
              <p className="text-sm leading-relaxed text-text-secondary">{backendError}</p>
              <p className="text-xs text-text-muted">
                PhishGuard never fabricates heuristic or random predictions in the browser. Once
                the FastAPI backend and trained Scikit-learn artifacts are running, this panel
                displays the live risk score, phishing probability, extracted URL features, and
                blockchain anchoring controls.
              </p>
            </div>
          </div>
        </GlassCard>
      )}

      {/* Live Detection Result Card (Rendered strictly from backend ScanResult) */}
      {!isScanning && scanResult && (
        <div className="space-y-6">
          <GlassCard
            accent={scanResult.prediction === 'Phishing' ? 'danger' : 'success'}
            padding="lg"
          >
            <div className="grid gap-8 lg:grid-cols-12 lg:items-center">
              <div className="flex flex-col items-center border-b border-border-subtle pb-6 lg:col-span-4 lg:border-b-0 lg:border-r lg:pb-0 lg:pr-6">
                <RiskScoreGauge score={scanResult.riskScore} />
                <div className="mt-3 flex items-center gap-2">
                  <PredictionBadge prediction={scanResult.prediction} />
                </div>
              </div>

              <div className="space-y-5 lg:col-span-8">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <span className="font-mono text-xs uppercase tracking-wider text-text-muted">
                      Analyzed Target
                    </span>
                    <p className="mt-1 break-all font-mono text-sm font-semibold text-text-primary">
                      {scanResult.redactedUrl || scanResult.normalizedUrl}
                    </p>
                    <p className="mt-1 text-xs text-text-muted">
                      Scan ID: <span className="font-mono">{scanResult.scanId}</span> •{' '}
                      {formatTimestamp(scanResult.analyzedAt)}
                    </p>
                  </div>
                  <BlockchainStatusBadge status={scanResult.blockchainStatus} />
                </div>

                {/* Probability & Confidence Bars */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-xl border border-border-subtle bg-bg-secondary/50 p-3.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-text-muted">Phishing Probability</span>
                      <span className="font-mono font-semibold text-text-primary">
                        {formatPercent(scanResult.phishingProbability)}
                      </span>
                    </div>
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-bg-main">
                      <div
                        className="h-full bg-status-danger"
                        style={{
                          width: `${Math.min(100, Math.round(scanResult.phishingProbability <= 1 ? scanResult.phishingProbability * 100 : scanResult.phishingProbability))}%`,
                        }}
                      />
                    </div>
                  </div>

                  <div className="rounded-xl border border-border-subtle bg-bg-secondary/50 p-3.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-text-muted">Prediction Confidence</span>
                      <span className="font-mono font-semibold text-text-primary">
                        {formatPercent(scanResult.confidence)}
                      </span>
                    </div>
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-bg-main">
                      <div
                        className="h-full bg-accent-primary"
                        style={{
                          width: `${Math.min(100, Math.round(scanResult.confidence <= 1 ? scanResult.confidence * 100 : scanResult.confidence))}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Digest & Blockchain Anchor Action */}
                <div className="flex flex-col justify-between gap-4 rounded-xl border border-border-subtle bg-bg-secondary/40 p-4 sm:flex-row sm:items-center">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 text-xs font-medium text-text-muted">
                      <Fingerprint className="h-3.5 w-3.5 text-accent-secondary" />
                      <span>URL SHA-256 Fingerprint</span>
                    </div>
                    <p className="mt-1 truncate font-mono text-xs text-text-primary">
                      {scanResult.urlSha256}
                    </p>
                    {scanResult.blockchainTxHash && (
                      <p className="mt-1 font-mono text-[11px] text-status-success">
                        Tx: {truncateMiddle(scanResult.blockchainTxHash, 14, 10)} (Block #
                        {scanResult.blockNumber})
                      </p>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => void handleSaveToBlockchain()}
                    disabled={isAnchoring || scanResult.blockchainStatus === 'verified'}
                    className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-accent-secondary/40 bg-accent-secondary/15 px-4 py-2.5 text-xs font-semibold text-accent-secondary transition-colors hover:bg-accent-secondary/25 disabled:opacity-50"
                  >
                    {isAnchoring ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Blocks className="h-4 w-4" />
                    )}
                    <span>
                      {scanResult.blockchainStatus === 'verified'
                        ? 'Anchored On-Chain'
                        : isAnchoring
                          ? 'Submitting Tx...'
                          : 'Save to Blockchain'}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </GlassCard>

          {/* Feature Analysis & Safety Recommendations */}
          <div className="grid gap-6 lg:grid-cols-12">
            <GlassCard className="lg:col-span-7">
              <h3 className="text-base font-semibold text-text-primary">URL Feature Analysis</h3>
              <p className="mt-0.5 text-xs text-text-muted">
                Extracted lexical and structural attributes evaluated by {scanResult.modelName} (v
                {scanResult.modelVersion})
              </p>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {scanResult.features.map((feat) => (
                  <div
                    key={feat.key}
                    className="rounded-xl border border-border-subtle bg-bg-secondary/40 p-3"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-medium text-text-muted">{feat.label}</span>
                      <span className="font-mono text-xs font-semibold text-text-primary">
                        {String(feat.value)}
                      </span>
                    </div>
                    <p className="mt-1 text-[11px] text-text-muted">{feat.description}</p>
                  </div>
                ))}
              </div>
            </GlassCard>

            <GlassCard className="lg:col-span-5">
              <div className="flex items-center gap-2">
                {scanResult.prediction === 'Phishing' ? (
                  <ShieldAlert className="h-5 w-5 text-status-danger" />
                ) : scanResult.prediction === 'Suspicious' ? (
                  <ShieldQuestion className="h-5 w-5 text-status-warning" />
                ) : (
                  <ShieldCheck className="h-5 w-5 text-status-success" />
                )}
                <h3 className="text-base font-semibold text-text-primary">
                  Safety Recommendations
                </h3>
              </div>
              <ul className="mt-4 space-y-3">
                {scanResult.recommendations.map((rec) => (
                  <li
                    key={rec}
                    className="flex items-start gap-2.5 text-sm leading-relaxed text-text-secondary"
                  >
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-accent-primary" />
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </GlassCard>
          </div>
        </div>
      )}

      {/* Pre-scan Reference Architecture Card */}
      {!isScanning && !scanResult && (
        <GlassCard>
          <h3 className="text-base font-semibold text-text-primary">
            What the ML Pipeline Inspects
          </h3>
          <p className="mt-1 text-xs text-text-muted">
            When connected to FastAPI, each submitted URL is decomposed into structured feature
            groups rather than relying on static signatures alone.
          </p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {PLANNED_FEATURE_GROUPS.map((group) => (
              <div
                key={group.title}
                className="rounded-xl border border-border-subtle bg-bg-secondary/40 p-4"
              >
                <h4 className="text-xs font-semibold text-text-primary">{group.title}</h4>
                <p className="mt-1.5 text-xs leading-relaxed text-text-muted">{group.items}</p>
              </div>
            ))}
          </div>
        </GlassCard>
      )}
    </div>
  );
}
