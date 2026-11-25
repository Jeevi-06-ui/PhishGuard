import type { ScanResult } from '@/types/api';

export function formatNumber(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  return new Intl.NumberFormat('en-US').format(value);
}

export function formatPercent(value: number | null | undefined, decimals = 1): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  const normalized = value <= 1 && value > 0 ? value * 100 : value;
  return `${normalized.toFixed(decimals)}%`;
}

export function formatTimestamp(isoString: string | null | undefined): string {
  if (!isoString) return '—';
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return isoString;
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

export function truncateMiddle(text: string, startChars = 10, endChars = 6): string {
  if (!text || text.length <= startChars + endChars + 3) return text;
  return `${text.slice(0, startChars)}...${text.slice(-endChars)}`;
}

function escapeCsvField(value: string | number | null | undefined): string {
  const str = value === undefined || value === null ? '' : String(value);
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function exportScansToCsv(scans: ScanResult[]): void {
  const headers = [
    'Scan ID',
    'Hostname',
    'Redacted URL',
    'Prediction',
    'Risk Score',
    'Phishing Probability (%)',
    'Confidence (%)',
    'Model Name',
    'Model Version',
    'Analyzed At',
    'Blockchain Status',
    'Transaction Hash',
    'URL SHA-256',
  ];

  const rows = scans.map((item) => [
    item.scanId,
    item.hostname,
    item.redactedUrl,
    item.prediction,
    item.riskScore,
    (item.phishingProbability * 100).toFixed(2),
    (item.confidence * 100).toFixed(2),
    item.modelName,
    item.modelVersion,
    item.analyzedAt,
    item.blockchainStatus,
    item.blockchainTxHash ?? '',
    item.urlSha256,
  ]);

  const csvContent = [
    headers.map(escapeCsvField).join(','),
    ...rows.map((row) => row.map(escapeCsvField).join(',')),
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `phishguard-scans-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
