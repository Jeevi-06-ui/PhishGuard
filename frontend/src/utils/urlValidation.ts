export interface UrlValidationResult {
  valid: boolean;
  normalizedUrl?: string;
  hostname?: string;
  error?: string;
}

const HOSTNAME_REGEX =
  /^(localhost|(\d{1,3}\.){3}\d{1,3}|([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,63})$/;

export function validateUrlInput(rawInput: string): UrlValidationResult {
  const trimmed = rawInput.trim();
  if (!trimmed) {
    return {
      valid: false,
      error: 'Please enter a URL to inspect.',
    };
  }

  if (/\s/.test(trimmed)) {
    return {
      valid: false,
      error: 'URLs cannot contain spaces or newline characters.',
    };
  }

  const hasProtocol = /^[a-zA-Z][a-zA-Z\d+\-.]*:\/\//.test(trimmed);
  if (hasProtocol && !/^https?:\/\//i.test(trimmed)) {
    return {
      valid: false,
      error: 'Only http:// and https:// URLs are supported by the PhishGuard scanner.',
    };
  }

  const candidate = hasProtocol ? trimmed : `https://${trimmed}`;

  try {
    const parsed = new URL(candidate);
    if (!parsed.hostname || !HOSTNAME_REGEX.test(parsed.hostname)) {
      return {
        valid: false,
        error: 'Enter a valid domain name or IPv4 host (e.g., https://example.com/login).',
      };
    }

    if (parsed.hostname.includes('.') || parsed.hostname === 'localhost') {
      // Validate IPv4 octets if numeric
      if (/^(\d{1,3}\.){3}\d{1,3}$/.test(parsed.hostname)) {
        const octets = parsed.hostname.split('.').map(Number);
        if (octets.some((num) => num < 0 || num > 255)) {
          return {
            valid: false,
            error: 'Invalid IPv4 address octet range in URL.',
          };
        }
      }
      return {
        valid: true,
        normalizedUrl: parsed.toString(),
        hostname: parsed.hostname,
      };
    }

    return {
      valid: false,
      error: 'Hostname must include a valid top-level domain.',
    };
  } catch {
    return {
      valid: false,
      error: 'Malformed URL syntax. Example: https://portal.example.com/auth',
    };
  }
}
