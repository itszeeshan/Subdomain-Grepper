<div align="center">
  <img src="docs/public/logo.png" alt="SubdomainX Logo" width="200"/>
  <h1>SubdomainX</h1>
  <p><strong>Subdomain Enumeration & Reconnaissance Framework</strong></p>
  <p>Open-source recon framework for bug bounty, pentesting, and attack surface mapping — 20+ tools & APIs, HTTP fingerprinting, port scanning, and subdomain takeover detection in one CLI.</p>
</div>

<div align="center">

[![Go Version](https://img.shields.io/badge/Go-1.21+-blue.svg)](https://golang.org)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Go Reference](https://pkg.go.dev/badge/github.com/itszeeshan/subdomainx.svg)](https://pkg.go.dev/github.com/itszeeshan/subdomainx)
[![GitHub release](https://img.shields.io/github/release/itszeeshan/subdomainx.svg)](https://github.com/itszeeshan/subdomainx/releases)
[![GitHub stars](https://img.shields.io/github/stars/itszeeshan/subdomainx.svg)](https://github.com/itszeeshan/subdomainx/stargazers)
[![GitHub forks](https://img.shields.io/github/forks/itszeeshan/subdomainx.svg)](https://github.com/itszeeshan/subdomainx/network)
[![GitHub issues](https://img.shields.io/github/issues/itszeeshan/subdomainx.svg)](https://github.com/itszeeshan/subdomainx/issues)
[![GitHub pull requests](https://img.shields.io/github/issues-pr/itszeeshan/subdomainx.svg)](https://github.com/itszeeshan/subdomainx/pulls)
[![CI/CD](https://img.shields.io/github/actions/workflow/status/itszeeshan/subdomainx/ci.yml?branch=main)](https://github.com/itszeeshan/subdomainx/actions)
[![Code Coverage](https://img.shields.io/badge/coverage-85%25-brightgreen.svg)](https://github.com/itszeeshan/subdomainx)

</div>

SubdomainX is a subdomain-focused reconnaissance framework. It started as a subdomain enumerator and grew into a full recon pipeline: it combines 20+ enumeration tools and API services into a single CLI, resolves and fingerprints live hosts (httpx), scans ports (smap), and flags subdomain takeover risks — then exports to JSON, HTML, CSV, or directly into Burp Suite, OWASP ZAP, and Nessus. Run one command and get deduplicated results from subfinder, amass, crt.sh, SecurityTrails, VirusTotal, and more.

## Install

```bash
go install github.com/itszeeshan/subdomainx/v2@latest
```

Or [download a pre-built binary](https://github.com/itszeeshan/subdomainx/releases) from the releases page.

Already installed? Update to the latest version with:

```bash
subdomainx update
```

## Usage

```bash
# Enumerate subdomains with subfinder + HTTP probing
subdomainx --subfinder --httpx example.com

# Multiple tools + API sources
subdomainx --subfinder --amass --crtsh --securitytrails --virustotal example.com

# Multiple domains from a file
subdomainx --wildcard domains.txt --format html

# Export to security tools
subdomainx --subfinder --httpx --format burp example.com   # Also: zap, nessus, csv
```

> Flags go before the domain: `subdomainx --subfinder example.com`

## Features

**Enumeration** — subfinder, amass, findomain, assetfinder, sublist3r, knockpy, dnsrecon, fierce, massdns, altdns, waybackurls, linkheader

**API Sources** — SecurityTrails, VirusTotal, Censys, crt.sh, URLScan.io, HackerTarget

**Scanning** — HTTP probing via httpx, port scanning via smap

**Screenshots** — Capture screenshots of discovered subdomains with `--screenshot`

**Tech Fingerprinting** — Detect technologies running on subdomains with `--tech`

**Takeover Detection** — Check for subdomain takeover vulnerabilities with `--takeover`

**Diff/Monitoring** — Compare scans over time with `--diff` to track changes

**Notifications** — Get alerts via Slack, Discord, Telegram, or Email with `--notify`

**Interactive TUI** — Real-time dashboard with `--tui`

**REST API Server** — Run as an API server with `subdomainx serve`

**Reports** — HTML, JSON, TXT, CSV, plus Burp Suite, Nessus, and OWASP ZAP formats

**Checkpointing** — Resume interrupted scans with `--resume`

<div align="center">
  <img src="docs/public/ui_dashboard.gif" alt="SubdomainX HTML Dashboard" width="800"/>
  <p><em>Interactive HTML report</em></p>
</div>
<div align="center">
  <img src="docs/public/cli-dashboard.png" alt="SubdomainX TUI Dashboard" width="800"/>
  <p><em>Interactive TUI Dashboard</em></p>
</div>

## Documentation

**[subdomainx.com](https://subdomainx.com)**

- [Installation](https://subdomainx.com/installation)
- [CLI Reference](https://subdomainx.com/cli-reference)
- [REST API Server](https://subdomainx.com/api-server)
- [Examples](https://subdomainx.com/examples)
- [Configuration](https://subdomainx.com/configuration)
- [Deployment](https://subdomainx.com/deployment)
- [Supported Tools](https://subdomainx.com/supported-tools)

## Contributing

We welcome contributions! Here's how you can help:

1. **Report Bugs**: [Create an issue](https://github.com/itszeeshan/subdomainx/issues)
2. **Suggest Features**: [Start a discussion](https://github.com/itszeeshan/subdomainx/discussions)
3. **Submit PRs**: Fork the repo and submit pull requests
4. **Improve Docs**: Help us make the documentation better
5. **Star the Repo**: Show your support!

### Development Setup

```bash
git clone https://github.com/itszeeshan/subdomainx.git
cd subdomainx
go mod download && go build -o subdomainx .
```

## License

MIT — see [LICENSE](LICENSE).

**SubdomainX is designed for authorized security testing and research purposes only.**

- Always ensure you have proper authorization before scanning any domain
- Respect rate limits and terms of service of target systems
- Use responsibly and ethically
- The authors are not responsible for any misuse of this tool

## Acknowledgments

- All the amazing open-source tools that make SubdomainX possible
- The security community for continuous feedback and improvements
- Contributors and users who help make this tool better

---

<div align="center">
  <p><strong>Happy Hunting! 🎯</strong></p>
  <p>Made with ❤️ by Zeeshan</p>
</div>
