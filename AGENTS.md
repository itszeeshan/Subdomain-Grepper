# AGENTS.md

Guidance for AI coding agents (and their humans) working in this repository.
Also read [AI_USAGE_POLICY.md](AI_USAGE_POLICY.md) — a human must understand,
verify, and take responsibility for every change.

## Project

SubdomainX is a Go CLI for subdomain enumeration and reconnaissance. It wraps
20+ enumeration tools and API sources, probes live hosts (httpx), scans ports
(smap), flags subdomain takeover risks, and exports to multiple formats
(JSON, HTML, CSV, Burp, ZAP, Nessus).

- Module: `github.com/itszeeshan/subdomainx`
- Language: Go 1.21+

## Layout

- Root (`package main`) — `main.go` (flags + orchestration), `display.go`
  (banner/usage), `setup.go` (flag/config wiring), `run.go` (scan pipeline).
- `internal/enumerator/` — one file per enumeration tool; enumerators
  self-register via `init()` calling `RegisterEnumerator()`.
- `internal/scanner/` — HTTP (httpx) and port (smap) scanning.
- `internal/output/` — output formatters (json, txt, html, csv, burp, nessus, zap).
- `internal/config/` — YAML config and defaults.
- `internal/utils/` — checkpoint, concurrency (`WorkerPool`), retry, progress, validation.
- `internal/types/` — shared result structs.

## Build, test, run

```bash
make build      # build the binary
make test       # run the test suite
make lint       # run linters (if configured)
go test ./...   # run all tests directly
go vet ./...    # static checks
gofmt -w .      # format before committing
```

Verify changes build and tests pass before opening a PR.

## Conventions

- Match the style, naming, and structure of surrounding code.
- Keep `main.go` limited to flag definitions and orchestration; put logic in
  `internal/` packages.
- New enumerators go in their own file under `internal/enumerator/` and
  self-register via `init()`.
- CLI flags take precedence over config-file values (see `mergeConfig`).
- Never log or commit API keys, tokens, or other secrets.
- Add or update tests for behavior changes.

## Security & scope

This is an offensive-security / reconnaissance tool. Do not add features whose
primary purpose is to enable abuse (e.g., built-in DoS, mass untargeted
scanning, or detection evasion for unauthorized use). See [SECURITY.md](SECURITY.md).

## Pull requests

- Keep changes focused and explain the "why" in your own words.
- Disclose AI assistance where relevant per [AI_USAGE_POLICY.md](AI_USAGE_POLICY.md).
- Ensure `go build`, `go vet`, and the test suite pass.
