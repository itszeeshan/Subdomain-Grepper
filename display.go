package main

import "fmt"

func showBanner() {
	fmt.Print(`
  ____        _         _                       _       __  __
 / ___| _   _| |__   __| | ___  _ __ ___   __ _(_)_ __  \ \/ /
 \___ \| | | | '_ \ / _' |/ _ \| '_ ' _ \ / _' | | '_ \  \  /
  ___) | |_| | |_) | (_| | (_) | | | | | | (_| | | | | | /  \
 |____/ \__,_|_.__/ \__,_|\___/|_| |_| |_|\__,_|_|_| |_|/_/\_\

        🔍 All-in-one Subdomain Enumeration Tool
        📧 https://github.com/itszeeshan/subdomainx
`)
}

func showUsage() {
	fmt.Println(`SubdomainX - All-in-one Subdomain Enumeration Tool

USAGE:
    subdomainx <domain> [OPTIONS]                    # Single domain scan
    subdomainx --wildcard <domains_file> [OPTIONS]   # Multiple domains scan
    subdomainx update                                # Update to the latest version
    subdomainx serve [OPTIONS]                       # Run as a REST API server

REQUIRED (choose one):
    <domain>              Target domain for single domain scan
    --wildcard FILE       Path to file containing target domains (one per line)

OPTIONS:
    --version              Show version information
    --help                 Show this help message
    --check-tools          Check availability of enumeration tools
    --install-tools        Show installation instructions for missing tools
    update                 Update SubdomainX to the latest version

    # Output Options
    --name NAME            Unique name for output files (default: scan)
    --format FORMAT        Output format: json, txt, html, zap, burp, nessus, csv (default: json)
    --output DIR           Output directory (default: output)

    # Performance Options
    --threads N            Number of concurrent threads (default: 10)
    --retries N            Number of retry attempts (default: 3)
    --timeout N            Timeout in seconds (default: 30)
    --rate-limit N         Rate limit per second (default: 100)
    --wordlist FILE        Custom wordlist file for brute-forcing
    --max-http-targets N   Maximum subdomains to scan with httpx (default: 1000)
    --resume SCAN_ID       Resume scan from checkpoint (scan ID)
    --list-checkpoints     List available checkpoints

    # Filter Options
    --status-codes CODES   Filter by HTTP status codes (e.g., '200,301,302')
    --ports PORTS          Filter by ports (e.g., '80,443,8080')

    # Tool Selection (use specific tools, otherwise all available)
    --subfinder            Use subfinder tool
    --amass                Use amass tool
    --findomain            Use findomain tool
    --assetfinder          Use assetfinder tool
    --sublist3r            Use sublist3r tool
    --knockpy              Use knockpy tool
    --dnsrecon             Use dnsrecon tool
    --fierce               Use fierce tool
    --massdns              Use massdns tool
    --altdns               Use altdns tool
    --securitytrails       Use SecurityTrails API
    --virustotal           Use VirusTotal API
    --censys               Use Censys API
    --crtsh                Use crt.sh Certificate Transparency API
    --urlscan              Use URLScan.io API
    --hackertarget         Use HackerTarget API
    --waybackurls          Use waybackurls tool
    --linkheader           Use Link Header enumeration
    --httpx                Use httpx for HTTP scanning
    --smap                 Use smap for port scanning

    # Screenshot Options
    --screenshot               Capture screenshots of HTTP-alive subdomains (requires Chrome/Chromium)
    --screenshot-dir DIR       Directory for screenshots (default: {output}/screenshots)
    --screenshot-timeout N     Timeout per page in seconds (default: 10)
    --screenshot-resolution WxH  Viewport resolution (default: 1280x720)

    # Diff/Monitoring Options
    --diff                 Compare results against the most recent previous scan
    --baseline FILE        Compare results against a specific baseline file

    # Notification Options
    --notify CHANNELS      Send notifications (comma-separated: slack,discord,telegram,email)
                           Credentials via environment variables:
                             SUBDOMAINX_SLACK_WEBHOOK
                             SUBDOMAINX_DISCORD_WEBHOOK
                             SUBDOMAINX_TELEGRAM_TOKEN + SUBDOMAINX_TELEGRAM_CHAT_ID
                             SUBDOMAINX_SMTP_HOST, _PORT, _USER, _PASS, SUBDOMAINX_NOTIFY_EMAIL

    # Configuration
    --config FILE          Use custom configuration file (optional)
    --verbose              Enable verbose output

EXAMPLES:
    # Single domain scan with all available tools
    subdomainx example.com

    # Single domain with specific tools
    subdomainx example.com --subfinder --amass --httpx

    # Multiple domains scan
    subdomainx --wildcard domains.txt

    # Multiple domains with specific tools
    subdomainx --wildcard domains.txt --amass --subfinder --httpx

    # Generate HTML report for single domain
    subdomainx example.com --format html --name my_scan

    # High-performance scan
    subdomainx example.com --threads 20 --timeout 60

    # Limit HTTP scanning for large subdomain lists
    subdomainx example.com --httpx --max-http-targets 500

    # Custom wordlist scan
    subdomainx --wordlist /path/to/wordlist.txt example.com

    # Resume interrupted scan
    subdomainx --resume my_scan

    # List available checkpoints
    subdomainx --list-checkpoints

    # Check tool availability
    subdomainx --check-tools

    # Get installation help
    subdomainx --install-tools

    # Update to the latest version
    subdomainx update

    # Screenshot all HTTP-alive subdomains
    subdomainx --screenshot example.com

    # Compare against previous scan
    subdomainx --diff example.com

    # Compare against a specific baseline
    subdomainx --diff --baseline results/previous.json example.com

    # Send Slack notification on scan completion
    subdomainx --notify slack example.com

    # Diff + notify (alert on new/removed subdomains)
    subdomainx --diff --notify slack,email example.com

CONFIGURATION:
    The YAML config file is optional. All settings can be specified via CLI flags.
    CLI flags take precedence over config file settings.

For more information, visit: https://github.com/itszeeshan/subdomainx`)
}
