# SubdomainX Vision: AI-Orchestrated Vulnerability Automation

## Purpose

SubdomainX today is a strong **recon** engine — it enumerates subdomains across 20+
sources, resolves live hosts, fingerprints them (httpx), and scans ports (smap).

This document describes the next phase: extending SubdomainX from *recon* into an
**AI-orchestrated vulnerability discovery pipeline**, where the automation handles the
noisy, high-volume, low-judgment work and the human operator's time is reserved for the
findings a machine can't reason about.

**This is a vision document, not a spec.** No implementation is committed by writing it.

---

## Guiding Principle

> Automate the stages that are mechanical. Reserve human attention for the stages that
> require judgment.

Concretely:

- **Tools do the scanning** — sending payloads, fuzzing parameters, watching
  out-of-band (OOB) callbacks, diffing HTTP responses at scale.
- **AI does the judgment layer** — deciding what to test, choosing which scanners to
  run, filtering false positives, chaining findings, and writing them up.
- **The human does the real stuff** — deep manual testing, business-logic bugs, and
  exploit validation on the shortlist the pipeline surfaces.

---

## The Pipeline Shape

Current flow:

```
enumerate → resolve → httpx (fingerprint) → port scan → report
```

Target flow:

```
enumerate → resolve → httpx (fingerprint)
    → AI triage        (rank hosts, pick scanners per host)
    → URL/param harvest (gau, waybackurls, katana)
    → per-vuln scanners (nuclei, dalfox, crlfuzz, subzy, ...)
    → AI finding triage (real vs false-positive, exploit narrative)
    → dedup / report
```

---

## What Is Automatable (per vuln class)

| Vuln class            | Automatable? | Tooling                                | Notes |
|-----------------------|--------------|----------------------------------------|-------|
| URL/param harvesting  | Fully        | `gau`, `waybackurls`, `katana`, `gospider` | Foundation for everything below |
| Reflected XSS         | High         | `dalfox`, `kxss`                        | Feed param URLs from harvest stage |
| Blind XSS             | Setup once   | `dalfox --blind` + collector           | Needs a callback URL (XSS Hunter / interactsh) |
| CRLF injection        | Fully        | `crlfuzz`                               | Clean to automate, low false-positive |
| SSRF                  | Partial      | `interactsh` + param fuzzing            | OOB *detection* automatable; exploitation is manual |
| Open redirect         | High         | `oralyzer`, `dalfox`                    | Often bundled with SSRF hunting |
| Subdomain takeover    | Fully        | `subzy`, `nuclei`                       | Cheap win; reuses the existing subdomain list |
| Known CVEs / misconfig| Fully        | `nuclei` + templates                    | Highest ROI single integration |
| CSRF                  | Mostly manual| —                                       | Needs auth-state + business-logic reasoning; scanners produce high false-positive noise |

**Honest boundaries:** CSRF and the *exploitation* half of SSRF are where automation
produces noise rather than signal. Automate detection and OOB confirmation only; keep
validation manual.

### Highest-leverage integrations

1. **`nuclei`** — the closest thing to "automate everything." Templates cover
   takeovers, exposures, CVEs, misconfigs, and many injection classes.
2. **`interactsh` (OOB server)** — the shared backbone for blind XSS, SSRF, and blind
   CRLF. One self-hosted collector; every blind-payload scanner reports back to it.

---

## The Role of AI

### What AI is bad at

Being the scanner. An LLM cannot send thousands of fuzzing payloads, watch OOB
callbacks, or diff responses at scale. Pointing a model at a host and asking it to
"find XSS" produces hallucinations, missed bugs, and high per-host cost.

### What AI is good at

The judgment layer *around* the scanners — precisely the work that is currently manual:

| Stage                                          | Best handled by |
|------------------------------------------------|-----------------|
| Send payloads, fuzz params, OOB detection      | Tools |
| Decide which subdomains deserve deep testing   | AI |
| Pick which scanners/templates to run per target| AI |
| Read scanner output, separate real from FP     | AI |
| Chain findings into an exploit narrative        | AI |
| Write up the report                             | AI |

### Architecture: AI as orchestrator, tools as hands

```
subdomainx recon
    → AI triage:  "these 12 of 400 hosts look interesting (admin panel,
                   staging, old framework, exposed API) — prioritize them"
    → AI scanner selection per host:
                  "WordPress → nuclei wp templates; reflected params → dalfox"
    → tools run, produce raw output
    → AI finding triage:
                  "this XSS is real; this one is a WAF echo — ignore"
    → AI writes the finding
```

### Design rules for the AI layer

1. **Fan-out, not serial.** Triage all subdomains at once, then batch-scan. Reuse the
   existing `WorkerPool`. Avoid the "check one by one" trap — it's slow and expensive.
2. **AI runs on the fingerprint, not the live host.** Feed the model the httpx output
   already collected (title, tech, status, headers), not the live site. Tiny, cheap,
   and sufficient for triage.
3. **AI re-enters only twice per host, max.** Once for triage, once for finding
   analysis. Not a live conversation per subdomain.

### Model selection

- **Haiku 4.5** for high-volume triage — cheap, fast, good enough to rank hosts and
  pick scanners. Batch the calls.
- **Opus 4.8** for final finding analysis, false-positive filtering, and exploit
  chaining — where judgment matters.

---

## How It Fits SubdomainX's Architecture

The existing design already provides the right foundations:

- **Self-registering enumerators** (`RegisterEnumerator()` in `internal/enumerator/`) —
  the same pattern applies to a new `internal/scanner/vuln/` package with one file per
  scanner.
- **`WorkerPool`** (`utils.NewWorkerPool`) — for fan-out scanning and batched AI triage.
- **Checkpointing** (`saveCheckpoint` in `run.go`) — resumable vuln stages for free.
- **Output formatters** (`internal/output/`) — findings flow into existing json/txt/
  html/csv/burp/nessus/zap reporters.
- **`HTTPResult`** (`internal/types/`) — already carries title/tech/status per host, the
  ideal compact input for AI triage.

### Preferred design: orchestrator mode

SubdomainX shells out to battle-tested scanners (`nuclei`, `dalfox`, `crlfuzz`,
`subzy`) against the live-host list, following the existing enumerator pattern. This
reuses all current plumbing and avoids reimplementing scanners in Go.

Reimplementing scanners natively is explicitly a non-goal — the external tools are
mature and maintained.

### Candidate integration points

- **`--vuln`** — enable the vulnerability stage after recon.
- **`--oob-server <url>`** — interactsh/collector endpoint for blind payloads.
- **`--blind-xss-url <url>`** — callback for blind XSS.
- **`--ai-triage`** — after httpx, rank hosts and suggest scanners via Claude.
- **`--ai-report`** — after scanners run, filter false positives and draft findings.

The vuln stage hooks into `executeScanPipeline` in `run.go`, between the fingerprint
and report stages.

---

## Non-Goals

- Reimplementing scanners natively in Go.
- Using an LLM as the primary detection engine.
- Fully automated CSRF detection (high false-positive rate; kept manual).
- Automated exploitation of SSRF or other bugs requiring business-logic reasoning.

---

## Summary

SubdomainX becomes a recon-to-triage pipeline: proven tools do the scanning at scale,
AI does the prioritization and interpretation, and the operator spends their time only
on the shortlist of validated, high-value targets.
