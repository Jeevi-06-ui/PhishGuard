"""Shared deterministic URL feature extraction for training and FastAPI inference."""

from __future__ import annotations

import ipaddress
import math
import re
from collections import Counter
from typing import Any
from urllib.parse import urlparse

SUSPICIOUS_KEYWORDS = (
    "login",
    "signin",
    "verify",
    "secure",
    "account",
    "update",
    "confirm",
    "banking",
    "wallet",
    "password",
    "credential",
    "oauth",
    "recover",
    "suspend",
    "billing",
    "invoice",
    "webmail",
)

URL_SHORTENERS = {
    "bit.ly",
    "tinyurl.com",
    "t.co",
    "goo.gl",
    "ow.ly",
    "is.gd",
    "buff.ly",
    "rb.gy",
    "cutt.ly",
    "shorturl.at",
}

SUSPICIOUS_TLDS = {
    "tk",
    "ml",
    "ga",
    "cf",
    "gq",
    "xyz",
    "top",
    "click",
    "zip",
    "work",
    "club",
    "icu",
    "buzz",
    "info",
    "support",
    "cam",
    "ru",
    "az",
    "biz",
}

BRAND_TOKENS = (
    "paypal",
    "microsoft",
    "apple",
    "google",
    "amazon",
    "netflix",
    "chase",
    "wellsfargo",
    "bankofamerica",
    "dropbox",
    "facebook",
    "instagram",
    "linkedin",
    "adobe",
    "binance",
    "coinbase",
)

TRUSTED_TLDS = {"edu", "gov", "ac", "mil"}

FEATURE_COLUMNS: list[str] = [
    "body_length",
    "hostname_length",
    "path_length",
    "query_length",
    "dot_count",
    "hyphen_count",
    "underscore_count",
    "slash_count",
    "question_count",
    "equal_count",
    "ampersand_count",
    "at_symbol_present",
    "double_slash_redirect",
    "has_ip_address",
    "subdomain_count",
    "digit_count",
    "digit_ratio",
    "letter_ratio",
    "special_char_ratio",
    "hostname_entropy",
    "body_entropy",
    "suspicious_keyword_count",
    "is_shortener",
    "suspicious_tld",
    "trusted_tld",
    "has_punycode",
    "brand_in_subdomain_or_path",
    "path_depth",
    "has_php_or_cgi",
    "max_token_length",
]

FEATURE_LABELS: dict[str, str] = {
    "body_length": "Host + Path Length",
    "hostname_length": "Hostname Length",
    "path_length": "Path Length",
    "query_length": "Query String Length",
    "dot_count": "Dot Count",
    "hyphen_count": "Hyphen Count",
    "underscore_count": "Underscore Count",
    "slash_count": "Path Slash Count",
    "question_count": "Query Delimiter Count (?)",
    "equal_count": "Parameter Assignment Count (=)",
    "ampersand_count": "Ampersand Count (&)",
    "at_symbol_present": "@ Symbol Obfuscation",
    "double_slash_redirect": "Embedded Redirect (//)",
    "has_ip_address": "Raw IP Host Literal",
    "subdomain_count": "Subdomain Depth",
    "digit_count": "Numeric Digit Count",
    "digit_ratio": "Digit Density Ratio",
    "letter_ratio": "Alphabetic Density Ratio",
    "special_char_ratio": "Special Character Ratio",
    "hostname_entropy": "Hostname Shannon Entropy",
    "body_entropy": "URL Body Shannon Entropy",
    "suspicious_keyword_count": "Suspicious Token Matches",
    "is_shortener": "Known URL Shortener",
    "suspicious_tld": "High-Risk TLD Signal",
    "trusted_tld": "Restricted Academic/Gov TLD",
    "has_punycode": "Punycode / IDN Encoding",
    "brand_in_subdomain_or_path": "Brand Spoof Pattern",
    "path_depth": "URL Path Depth",
    "has_php_or_cgi": "Dynamic Script Extension",
    "max_token_length": "Longest Lexical Token",
}


def shannon_entropy(text: str) -> float:
    """Compute Shannon entropy in bits per character."""
    if not text:
        return 0.0
    counts = Counter(text)
    length = len(text)
    return round(
        -sum((count / length) * math.log2(count / length) for count in counts.values()),
        4,
    )


def _is_ip_literal(hostname: str) -> bool:
    clean_host = hostname.strip("[]")
    if not clean_host:
        return False
    try:
        ipaddress.ip_address(clean_host)
        return True
    except ValueError:
        return False


def normalize_url_string(raw_url: str) -> str:
    """Ensure URL includes a scheme so urlparse splits host/path consistently."""
    trimmed = raw_url.strip()
    if not re.match(r"^[a-zA-Z][a-zA-Z\d+\-.]*://", trimmed):
        return f"https://{trimmed}"
    return trimmed


def _safe_urlparse(normalized: str):
    """Parse URL safely even when malicious strings contain malformed brackets."""
    try:
        return urlparse(normalized)
    except ValueError:
        sanitized = normalized.replace("[", "").replace("]", "")
        return urlparse(sanitized)


def extract_url_body(raw_url: str) -> str:
    """Return scheme-and-www-stripped host + path + query for char n-gram modeling."""
    normalized = normalize_url_string(raw_url)
    parsed = _safe_urlparse(normalized)
    try:
        raw_host = parsed.hostname or ""
    except ValueError:
        raw_host = parsed.netloc.split(":")[0]
    hostname = raw_host.lower()
    if hostname.startswith("www.") and len(hostname) > 4:
        hostname = hostname[4:]
    path = parsed.path or ""
    query = parsed.query or ""
    return f"{hostname}{path}{('?' + query) if query else ''}"


def extract_feature_vector(raw_url: str) -> dict[str, float]:
    """Extract scheme-invariant lexical and structural URL features."""
    normalized = normalize_url_string(raw_url)
    parsed = _safe_urlparse(normalized)

    try:
        raw_host = parsed.hostname or ""
    except ValueError:
        raw_host = parsed.netloc.split(":")[0]
    hostname = raw_host.lower()
    if hostname.startswith("www.") and len(hostname) > 4:
        hostname = hostname[4:]
    path = parsed.path or ""
    query = parsed.query or ""

    # Compute lexical body features excluding scheme ('http://' / 'https://') so
    # models do not overfit on dataset scheme formatting differences.
    body = f"{hostname}{path}{('?' + query) if query else ''}"
    body_lower = body.lower()

    body_len = max(len(body), 1)
    digits = sum(ch.isdigit() for ch in body)
    letters = sum(ch.isalpha() for ch in body)
    specials = sum(not ch.isalnum() for ch in body)

    has_ip = _is_ip_literal(hostname)
    host_parts = [p for p in hostname.split(".") if p]
    tld = host_parts[-1] if len(host_parts) >= 2 and not has_ip else ""
    registrable_root = host_parts[-2] if len(host_parts) >= 2 and not has_ip else hostname

    if has_ip:
        subdomain_count = 0
    elif len(host_parts) > 2:
        sub_parts = host_parts[:-2]
        if sub_parts and sub_parts[0] == "www":
            sub_parts = sub_parts[1:]
        subdomain_count = len(sub_parts)
    else:
        subdomain_count = 0

    subdomain_and_path = f"{'.'.join(host_parts[:-2])}.{path}".lower()
    brand_spoof = int(
        any(
            brand in subdomain_and_path and brand not in registrable_root
            for brand in BRAND_TOKENS
        )
    )

    keyword_hits = sum(1 for kw in SUSPICIOUS_KEYWORDS if kw in body_lower)
    path_segments = [seg for seg in path.split("/") if seg]
    double_slash = int("//" in body)
    tokens = [tok for tok in re.split(r"[^a-zA-Z0-9]+", body_lower) if tok]
    max_tok_len = max((len(t) for t in tokens), default=0)
    has_php_cgi = int(bool(re.search(r"\.(php|asp|aspx|cgi|exe|scr)(\?|$)", body_lower)))

    return {
        "body_length": float(len(body)),
        "hostname_length": float(len(hostname)),
        "path_length": float(len(path)),
        "query_length": float(len(query)),
        "dot_count": float(body.count(".")),
        "hyphen_count": float(body.count("-")),
        "underscore_count": float(body.count("_")),
        "slash_count": float(body.count("/")),
        "question_count": float(body.count("?")),
        "equal_count": float(body.count("=")),
        "ampersand_count": float(body.count("&")),
        "at_symbol_present": float(int("@" in body)),
        "double_slash_redirect": float(double_slash),
        "has_ip_address": float(int(has_ip)),
        "subdomain_count": float(subdomain_count),
        "digit_count": float(digits),
        "digit_ratio": round(digits / body_len, 4),
        "letter_ratio": round(letters / body_len, 4),
        "special_char_ratio": round(specials / body_len, 4),
        "hostname_entropy": shannon_entropy(hostname),
        "body_entropy": shannon_entropy(body),
        "suspicious_keyword_count": float(keyword_hits),
        "is_shortener": float(int(hostname in URL_SHORTENERS)),
        "suspicious_tld": float(int(tld in SUSPICIOUS_TLDS)),
        "trusted_tld": float(int(tld in TRUSTED_TLDS)),
        "has_punycode": float(int("xn--" in hostname)),
        "brand_in_subdomain_or_path": float(brand_spoof),
        "path_depth": float(len(path_segments)),
        "has_php_or_cgi": float(has_php_cgi),
        "max_token_length": float(max_tok_len),
    }


def extract_feature_details(raw_url: str) -> list[dict[str, Any]]:
    """Return user-friendly URL feature inspection cards matching the frontend schema."""
    normalized = normalize_url_string(raw_url)
    parsed = _safe_urlparse(normalized)
    uses_https = parsed.scheme.lower() == "https"
    vec = extract_feature_vector(normalized)

    return [
        {
            "key": "uses_https",
            "label": "HTTPS Transport",
            "value": uses_https,
            "riskSignal": "low" if uses_https else "high",
            "description": (
                "URL specifies encrypted HTTPS transport."
                if uses_https
                else "Plaintext HTTP scheme increases interception and credential risk."
            ),
        },
        {
            "key": "body_length",
            "label": "URL Body Length",
            "value": int(vec["body_length"]),
            "riskSignal": "high" if vec["body_length"] > 90 else "medium" if vec["body_length"] > 60 else "low",
            "description": "Longer host + path strings often conceal deceptive tokens or redirects.",
        },
        {
            "key": "has_ip_address",
            "label": "Raw IPv4/IPv6 Host",
            "value": bool(vec["has_ip_address"]),
            "riskSignal": "high" if vec["has_ip_address"] else "low",
            "description": (
                "Hostname is an IP literal rather than a registered domain."
                if vec["has_ip_address"]
                else "Target uses a domain name instead of a raw IP address."
            ),
        },
        {
            "key": "subdomain_count",
            "label": "Subdomain Nesting Depth",
            "value": int(vec["subdomain_count"]),
            "riskSignal": "high" if vec["subdomain_count"] >= 3 else "medium" if vec["subdomain_count"] == 2 else "low",
            "description": "Deep subdomain chains are often used to mimic trusted login hierarchies.",
        },
        {
            "key": "suspicious_keyword_count",
            "label": "Suspicious Token Matches",
            "value": int(vec["suspicious_keyword_count"]),
            "riskSignal": "high" if vec["suspicious_keyword_count"] >= 2 else "medium" if vec["suspicious_keyword_count"] == 1 else "low",
            "description": "Count of credential or urgency tokens (e.g. login, verify, secure, update).",
        },
        {
            "key": "hostname_entropy",
            "label": "Hostname Shannon Entropy",
            "value": round(vec["hostname_entropy"], 2),
            "riskSignal": "medium" if vec["hostname_entropy"] > 3.8 else "low",
            "description": "Measures randomness in domain characters; high entropy can indicate DGA domains.",
        },
        {
            "key": "brand_in_subdomain_or_path",
            "label": "Brand Spoofing Pattern",
            "value": bool(vec["brand_in_subdomain_or_path"]),
            "riskSignal": "high" if vec["brand_in_subdomain_or_path"] else "low",
            "description": (
                "Known brand token appears outside the primary registrable domain."
                if vec["brand_in_subdomain_or_path"]
                else "No mismatched brand keyword detected in subdomain or path."
            ),
        },
        {
            "key": "special_char_ratio",
            "label": "Special Symbol Density",
            "value": f"{vec['special_char_ratio'] * 100:.1f}%",
            "riskSignal": "medium" if vec["special_char_ratio"] > 0.28 else "low",
            "description": "Proportion of punctuation, hyphens, and query delimiters in the URL.",
        },
        {
            "key": "suspicious_tld",
            "label": "Abused TLD Indicator",
            "value": bool(vec["suspicious_tld"]),
            "riskSignal": "medium" if vec["suspicious_tld"] else "low",
            "description": "Checks whether the top-level domain has elevated phishing prevalence.",
        },
        {
            "key": "has_php_or_cgi",
            "label": "Legacy Script Endpoint",
            "value": bool(vec["has_php_or_cgi"]),
            "riskSignal": "medium" if vec["has_php_or_cgi"] else "low",
            "description": "Indicates `.php`, `.asp`, or `.cgi` endpoints frequently targeted by credential kits.",
        },
    ]
