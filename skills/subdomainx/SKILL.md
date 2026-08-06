---
name: subdomainx
description: Reference for driving SubdomainX, a Go CLI for subdomain enumeration and reconnaissance. Use when a task involves running subdomainx, choosing its flags, wiring API keys, interpreting its output formats, or exporting results to Burp/ZAP/Nessus. Authorized security testing only.
---

# SubdomainX

SubdomainX is a Go CLI that runs subdomain enumeration and reconnaissance. It
combines 20+ enumeration tools and API sources into one pipeline, resolves and
fingerprints live hosts (httpx), scans ports (smap), flags subdomain-takeover
risk, and exports results to multiple formats.

- Module: `github.com/itszeeshan/subdomainx`
- Invocation: `subdomainx [flags] <domain>` — **flags come before the domain**.

## Authorization (read first)

SubdomainX is a reconnaissance / attack-surface tool for **authorized testing
only**. Before running any scan, confirm the target is owned by the user or has
explicit written permission to test. Do not use it for mass/untargeted scanning
or against assets you cannot confirm are in scope.

## Install

```bash
go install github.com/itszeeshan/subdomainx/v2@latest
# or download a prebuilt binary from the GitHub releases page
```

Check external tool availability first: `subdomainx --check-tools`
(installation hints: `subdomainx --install-tools`). Each enumeration tool
(subfinder, amass, httpx, smap, …) must be installed separately and on `PATH`.

## Basic usage

```bash
# Single tool + HTTP probing on one domain
subdomainx --subfinder --httpx example.com

# Several enumeration tools + API sources
subdomainx --subfinder --amass --crtsh --securitytrails --virustotal example.com

# Multiple domains from a file, HTML report
subdomainx --wildcard domains.txt --format html

# Export directly into a security tool
subdomainx --subfinder --httpx --format burp example.com   # or: zap, nessus, csv
```

## Flag reference

### Source selection (opt-in)

**Enumeration tools:** `--subfinder --amass --findomain --assetfinder
--sublist3r --knockpy --dnsrecon --fierce --massdns --altdns --waybackurls
--linkheader`

**API sources:** `--securitytrails --virustotal --censys --crtsh --urlscan
--hackertarget` (crt.sh needs no key; the others need API keys — see below)

**Scanning:** `--httpx` (HTTP probe/fingerprint), `--smap` (port scan)

At least one source must be selected. Results are deduplicated across all
sources, with the discovering source(s) tracked per subdomain.

### Input / output

| Flag | Default | Purpose |
| --- | --- | --- |
| `<domain>` (positional) | — | Single target domain |
| `--wildcard <file>` | — | File of domains (one per line) instead of a single positional domain |
| `--format <fmt>` | — | `json`, `txt`, `html`, `csv`, `burp`, `nessus`, `zap` |
| `--output <dir>` | `output` | Output directory |
| `--name <str>` | `scan` | Base name for output files |
| `--config <file>` | — | YAML config file (CLI flags override it) |

### Performance / behavior

| Flag | Default | Purpose |
| --- | --- | --- |
| `--threads <n>` | `10` | Worker count |
| `--rate-limit <n>` | `100` | Requests/sec cap |
| `--retries <n>` | `3` | Retry attempts |
| `--timeout <n>` | `30` | Timeout (seconds) |
| `--max-http-targets <n>` | `1000` | Cap on subdomains sent to httpx |
| `--verbose` | off | Verbose logging |

### Filtering

| Flag | Purpose |
| --- | --- |
| `--status-codes "200,301,302"` | Keep only these HTTP status codes |
| `--ports "80,443,8080"` | Keep only these ports |
| `--tech-filter "WordPress,nginx"` | Keep hosts matching these technologies (needs `--tech`) |

### Feature toggles

| Flag | Purpose |
| --- | --- |
| `--tech` | Technology fingerprinting during HTTP scan |
| `--takeover` | Check for subdomain-takeover vulnerabilities |
| `--takeover-only` | Only report takeover-vulnerable subdomains |
| `--screenshot` | Screenshot HTTP-alive hosts (`--screenshot-dir`, `--screenshot-timeout`, `--screenshot-resolution WxH`) |
| `--wordlist <file>` | Custom wordlist for brute-forcing |
| `--diff` / `--baseline <file>` | Compare against a previous scan |
| `--notify "slack,discord,telegram,email"` | Send notifications (credentials via env vars only) |
| `--tui` | Interactive TUI dashboard |

### Checkpoints & meta

| Flag | Purpose |
| --- | --- |
| `--resume <scan-id>` | Resume from a checkpoint |
| `--list-checkpoints` | List available checkpoints |
| `--check-tools` | Report which external tools are installed |
| `--install-tools` | Print installation instructions |
| `--version` / `--help` | Version / help |

## API keys (environment variables)

API sources read credentials from the environment — never from CLI flags:

```bash
export SECURITYTRAILS_API_KEY="..."
export VIRUSTOTAL_API_KEY="..."
export CENSYS_API_ID="..."
export CENSYS_SECRET="..."
export URLSCAN_API_KEY="..."
export HACKERTARGET_API_KEY="..."
```

Notification credentials (Slack/Discord/Telegram/email) are likewise env-only.
`crtsh` and most enumeration tools need no keys.

## Config file (YAML)

CLI flags always override config-file values. Enumeration tools default to
enabled in config; API sources and scanners default to disabled.

```yaml
unique_name: "scan"
output_format: "json"   # json, txt, html
output_dir: "output"
threads: 10
retries: 3
timeout: 30
rate_limit: 100
filters:
  status_code: ""       # e.g. "200,301,302"
  ports: ""             # e.g. "80,443,8080"
tools:
  subfinder: true
  amass: true
  securitytrails: false # APIs off by default
  httpx: false          # scanners off by default
```

Use with `--config configs/default.yaml`.

## Server mode

`subdomainx serve` starts a REST API server (default port `8080`, optional
`--api-key` bearer token). Server flags are separate from scan flags.

## Interpreting output

- Structured results (`json`, `csv`) carry each subdomain plus its discovering
  source(s), and — when scanning is enabled — HTTP status/title/tech and open
  ports.
- `html` produces a self-contained report.
- `burp`, `zap`, `nessus` produce import files for those tools.
- Output files are written to `--output` using the `--name` base name.

## Agent guidance

- Always confirm authorization/scope before running a scan.
- Start with a single fast source (e.g. `--subfinder --httpx`) before enabling
  heavy tools (amass, massdns) or many APIs.
- Prefer `--format json` when you need to parse results programmatically.
- Respect `--rate-limit`; do not raise it to aggressive levels against a target
  you do not control.
- Run `--check-tools` first if a source silently returns nothing — the
  underlying binary may not be installed.
