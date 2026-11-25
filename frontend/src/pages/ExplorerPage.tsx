import React, { useCallback, useEffect, useState } from 'react';
import {
  Blocks,
  CheckCircle2,
  Copy,
  Eye,
  Hash,
  Loader2,
  Network,
  RefreshCw,
  SearchCheck,
  ServerOff,
  ShieldCheck,
} from 'lucide-react';
import {
  EmptyState,
  GlassCard,
  HealthStatusBadge,
  PredictionBadge,
  ServiceOfflineNotice,
  SlideDrawer,
  StatusBadge,
  TableSkeleton,
} from '@/components';
import { useSystemStatus } from '@/context/SystemStatusContext';
import { useToast } from '@/context/ToastContext';
import { ApiError, blockchainService, createDisconnectedBlockchainStatus } from '@/services';
import type {
  BlockchainNetworkStatus,
  BlockchainRecord,
  BlockchainVerificationResult,
} from '@/types/api';
import { formatNumber, formatTimestamp, truncateMiddle } from '@/utils/formatters';

export function ExplorerPage() {
  const { isApiConfigured } = useSystemStatus();
  const { showToast } = useToast();

  const [status, setStatus] = useState<BlockchainNetworkStatus>(() =>
    createDisconnectedBlockchainStatus(),
  );
  const [records, setRecords] = useState<BlockchainRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [verifyQuery, setVerifyQuery] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyResult, setVerifyResult] = useState<BlockchainVerificationResult | null>(null);
  const [selectedRecord, setSelectedRecord] = useState<BlockchainRecord | null>(null);

  const loadExplorer = useCallback(async () => {
    if (!isApiConfigured) {
      setStatus(createDisconnectedBlockchainStatus());
      setRecords([]);
      setErrorMsg(
        'Ethereum RPC node and Web3.py backend are disconnected. Genuine transactions will load here once Hardhat and FastAPI are active.',
      );
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    try {
      const [chainStatus, chainRecords] = await Promise.all([
        blockchainService.getStatus(),
        blockchainService.getRecords(),
      ]);
      setStatus(chainStatus);
      setRecords(chainRecords.items);
    } catch (err) {
      setStatus(createDisconnectedBlockchainStatus());
      setRecords([]);
      setErrorMsg(
        err instanceof ApiError ? err.message : 'Unable to reach blockchain explorer endpoint.',
      );
    } finally {
      setLoading(false);
    }
  }, [isApiConfigured]);

  useEffect(() => {
    void loadExplorer();
  }, [loadExplorer]);

  const handleCopy = async (value: string, label: string) => {
    try {
      await navigator.clipboard.writeText(value);
      showToast({
        variant: 'info',
        title: `${label} copied`,
        description: truncateMiddle(value, 14, 10),
      });
    } catch {
      showToast({
        variant: 'error',
        title: 'Clipboard unavailable',
        description: 'Copy the hexadecimal value directly from the display field.',
      });
    }
  };

  const handleVerifyRecord = async (queryText: string) => {
    const trimmed = queryText.trim();
    if (!trimmed) {
      showToast({
        variant: 'warning',
        title: 'Enter a hash or URL',
        description: 'Provide a transaction hash, URL SHA-256 digest, or URL to verify.',
      });
      return;
    }

    setIsVerifying(true);
    setVerifyResult(null);
    try {
      const payload = trimmed.startsWith('0x')
        ? { txHash: trimmed }
        : /^[a-fA-F0-9]{64}$/.test(trimmed)
          ? { urlHash: trimmed }
          : { url: trimmed };

      const res = await blockchainService.verifyRecord(payload);
      setVerifyResult(res);
      showToast({
        variant: res.verified ? 'success' : 'warning',
        title: res.verified ? 'Record verified on-chain' : 'No matching on-chain record',
        description: res.message,
      });
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.message
          : 'Unable to verify record against Ethereum smart contract.';
      showToast({
        variant: 'warning',
        title: 'Verification Unavailable',
        description: msg,
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleVerifyFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void handleVerifyRecord(verifyQuery);
  };

  return (
    <div className="space-y-6">
      {errorMsg && (
        <ServiceOfflineNotice
          title="Ethereum Smart Contract Node Disconnected"
          description={errorMsg}
          onRetry={() => void loadExplorer()}
          isRetrying={loading}
        />
      )}

      {/* Network Metadata Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <GlassCard padding="sm">
          <div className="flex items-center justify-between text-xs text-text-muted">
            <span>Network Name</span>
            <Network className="h-4 w-4 text-accent-primary" />
          </div>
          <p className="mt-2.5 text-base font-bold text-text-primary">
            {status.networkName || 'Not Connected'}
          </p>
        </GlassCard>

        <GlassCard padding="sm">
          <div className="flex items-center justify-between text-xs text-text-muted">
            <span>Chain ID</span>
            <Hash className="h-4 w-4 text-accent-secondary" />
          </div>
          <p className="mt-2.5 font-mono text-base font-bold text-text-primary">
            {status.chainId ?? '—'}
          </p>
        </GlassCard>

        <GlassCard padding="sm" className="sm:col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between text-xs text-text-muted">
            <span>Smart Contract</span>
            {status.contractAddress && (
              <button
                type="button"
                onClick={() => void handleCopy(status.contractAddress ?? '', 'Contract address')}
                aria-label="Copy smart contract address"
                className="text-text-muted hover:text-accent-primary"
              >
                <Copy className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <p className="mt-2.5 truncate font-mono text-xs font-semibold text-text-primary">
            {status.contractAddress
              ? truncateMiddle(status.contractAddress, 10, 8)
              : 'Not Deployed'}
          </p>
        </GlassCard>

        <GlassCard padding="sm">
          <div className="flex items-center justify-between text-xs text-text-muted">
            <span>Connection Status</span>
            <Blocks className="h-4 w-4 text-accent-secondary" />
          </div>
          <div className="mt-2.5">
            <HealthStatusBadge
              state={status.connected ? 'online' : 'offline'}
              label={status.connected ? 'Connected' : 'Disconnected'}
            />
          </div>
        </GlassCard>

        <GlassCard padding="sm">
          <div className="flex items-center justify-between text-xs text-text-muted">
            <span>Total Recorded Scans</span>
            <ShieldCheck className="h-4 w-4 text-status-success" />
          </div>
          <p className="mt-2.5 font-mono text-base font-bold text-text-primary">
            {status.connected ? formatNumber(status.totalRecordedScans) : '—'}
          </p>
        </GlassCard>
      </div>

      {/* Interactive Record Verification Card */}
      <GlassCard accent="violet">
        <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-base font-semibold text-text-primary">
              Verify On-Chain Audit Integrity
            </h2>
            <p className="mt-0.5 text-xs text-text-muted">
              Query the smart contract by transaction hash, stored URL SHA-256 hash, or raw URL.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void loadExplorer()}
            disabled={loading}
            className="inline-flex items-center gap-1.5 self-start rounded-xl border border-border-subtle bg-bg-elevated px-3 py-2 text-xs font-semibold text-text-secondary hover:border-accent-primary/40 hover:text-text-primary"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Sync Ledger</span>
          </button>
        </div>

        <form onSubmit={handleVerifyFormSubmit} className="mt-4 flex flex-col gap-3 sm:flex-row">
          <input
            type="text"
            value={verifyQuery}
            onChange={(e) => setVerifyQuery(e.target.value)}
            placeholder="0x... transaction hash or 64-char URL SHA-256 digest"
            aria-label="Transaction hash or URL SHA-256 digest"
            className="flex-1 rounded-xl border border-border-subtle bg-bg-elevated px-4 py-2.5 font-mono text-xs text-text-primary placeholder:text-text-muted/60 focus:border-accent-secondary focus:outline-none"
          />
          <button
            type="submit"
            disabled={isVerifying}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-accent-secondary px-5 py-2.5 text-xs font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {isVerifying ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <SearchCheck className="h-4 w-4" />
            )}
            <span>Record Verification</span>
          </button>
        </form>

        {verifyResult && (
          <div
            className={`mt-4 rounded-xl border p-3.5 text-xs ${
              verifyResult.verified
                ? 'border-status-success/30 bg-status-success/10 text-status-success'
                : 'border-status-warning/30 bg-status-warning/10 text-status-warning'
            }`}
          >
            <div className="flex items-center gap-2 font-semibold">
              <CheckCircle2 className="h-4 w-4" />
              <span>{verifyResult.message}</span>
            </div>
          </div>
        )}
      </GlassCard>

      {/* Blockchain Transactions Table */}
      <GlassCard padding="none" className="overflow-hidden">
        <div className="flex items-center justify-between border-b border-border-subtle px-5 py-4">
          <div>
            <h2 className="text-base font-semibold text-text-primary">
              Smart Contract Detection Records
            </h2>
            <p className="text-xs text-text-muted">
              Only authentic on-chain Ethereum transactions are displayed here.
            </p>
          </div>
          <StatusBadge variant="neutral" label={`${records.length} record(s)`} />
        </div>

        {loading ? (
          <div className="p-6">
            <TableSkeleton rows={5} columns={6} />
          </div>
        ) : records.length === 0 ? (
          <EmptyState
            icon={errorMsg ? ServerOff : Blocks}
            title={
              errorMsg
                ? 'No Blockchain Connection Available'
                : 'No On-Chain Scan Records Found'
            }
            description={
              errorMsg
                ? 'PhishGuard never displays simulated or synthetic transaction hashes. Connect the Hardhat / Ethereum RPC node and Web3.py backend to inspect live ledger entries.'
                : 'Once scans are anchored from the URL Scanner, immutable transaction hashes, block numbers, and SHA-256 digests appear here.'
            }
            actionLabel="Go to URL Scanner"
            actionTo="/scanner"
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border-subtle bg-bg-secondary/60 font-mono text-[11px] uppercase tracking-wider text-text-muted">
                <tr>
                  <th className="px-5 py-3.5">Transaction Hash</th>
                  <th className="px-5 py-3.5">Block</th>
                  <th className="px-5 py-3.5">Stored URL Hash</th>
                  <th className="px-5 py-3.5">Verdict</th>
                  <th className="px-5 py-3.5">Timestamp</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {records.map((rec) => (
                  <tr key={rec.recordId} className="transition-colors hover:bg-bg-secondary/40">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2 font-mono text-xs text-text-primary">
                        <span>{truncateMiddle(rec.txHash, 12, 8)}</span>
                        <button
                          type="button"
                          onClick={() => void handleCopy(rec.txHash, 'Transaction hash')}
                          aria-label="Copy transaction hash"
                          className="rounded p-1 text-text-muted hover:bg-bg-secondary hover:text-accent-primary"
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 font-mono text-xs text-text-secondary">
                      #{rec.blockNumber}
                    </td>
                    <td className="px-5 py-3.5 font-mono text-xs text-text-muted">
                      {truncateMiddle(rec.urlHash, 12, 8)}
                    </td>
                    <td className="px-5 py-3.5">
                      <PredictionBadge prediction={rec.prediction} />
                    </td>
                    <td className="px-5 py-3.5 text-xs text-text-muted">
                      {formatTimestamp(rec.timestamp)}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="inline-flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => void handleVerifyRecord(rec.txHash)}
                          className="rounded-lg border border-accent-secondary/40 bg-accent-secondary/10 px-2.5 py-1.5 text-xs font-medium text-accent-secondary hover:bg-accent-secondary/20"
                        >
                          Verify
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedRecord(rec)}
                          className="inline-flex items-center gap-1 rounded-lg border border-border-subtle bg-bg-elevated px-2.5 py-1.5 text-xs font-medium text-text-primary hover:border-accent-primary/40"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          <span>Inspect</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </GlassCard>

      {/* Detailed Transaction Drawer */}
      <SlideDrawer
        open={Boolean(selectedRecord)}
        onClose={() => setSelectedRecord(null)}
        title="Ethereum Transaction Receipt"
        subtitle={
          selectedRecord ? `Block #${selectedRecord.blockNumber}` : undefined
        }
      >
        {selectedRecord && (
          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between">
              <PredictionBadge prediction={selectedRecord.prediction} />
              <StatusBadge
                variant={selectedRecord.verified ? 'verified' : 'pending'}
                label={selectedRecord.verified ? 'Contract Proof Valid' : 'Pending'}
              />
            </div>

            <div className="space-y-3 rounded-xl border border-border-subtle bg-bg-secondary/50 p-4">
              <div>
                <p className="text-text-muted">Transaction Hash</p>
                <div className="mt-1 flex items-start justify-between gap-2">
                  <p className="break-all font-mono text-text-primary">
                    {selectedRecord.txHash}
                  </p>
                  <button
                    type="button"
                    onClick={() =>
                      void handleCopy(selectedRecord.txHash, 'Transaction hash')
                    }
                    className="shrink-0 rounded-lg border border-border-subtle p-1.5 text-text-muted hover:text-accent-primary"
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              <div>
                <p className="text-text-muted">Stored URL SHA-256 Digest</p>
                <p className="mt-1 break-all font-mono text-text-primary">
                  {selectedRecord.urlHash}
                </p>
              </div>

              <div>
                <p className="text-text-muted">Contract Address</p>
                <p className="mt-1 break-all font-mono text-text-primary">
                  {selectedRecord.contractAddress}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-border-subtle p-3">
                <p className="text-text-muted">Block Number</p>
                <p className="mt-1 font-mono text-sm font-bold text-text-primary">
                  #{selectedRecord.blockNumber}
                </p>
              </div>
              <div className="rounded-xl border border-border-subtle p-3">
                <p className="text-text-muted">Risk Score</p>
                <p className="mt-1 font-mono text-sm font-bold text-text-primary">
                  {selectedRecord.riskScore}/100
                </p>
              </div>
              <div className="rounded-xl border border-border-subtle p-3">
                <p className="text-text-muted">Gas Used</p>
                <p className="mt-1 font-mono text-sm font-bold text-text-primary">
                  {formatNumber(selectedRecord.gasUsed)}
                </p>
              </div>
              <div className="rounded-xl border border-border-subtle p-3">
                <p className="text-text-muted">Timestamp</p>
                <p className="mt-1 font-medium text-text-primary">
                  {formatTimestamp(selectedRecord.timestamp)}
                </p>
              </div>
            </div>
          </div>
        )}
      </SlideDrawer>
    </div>
  );
}
