package output

import (
	_ "embed"
	"encoding/base64"
	"encoding/json"
	"html/template"
	"os"
	"path/filepath"
	"sort"
	"strconv"
	"strings"
	"time"

	"github.com/itszeeshan/subdomainx/v2/internal/config"
	"github.com/itszeeshan/subdomainx/v2/internal/diff"
	"github.com/itszeeshan/subdomainx/v2/internal/types"
)

//go:embed templates/report.html
var reportTemplateStr string

// The report's CSS and JS live in separate files for maintainability and are
// composed into report.html as named templates ("styles" and "script") at
// render time, so the output remains a single self-contained HTML file.
//
//go:embed templates/report.css
var reportCSS string

//go:embed templates/report.js
var reportJS string

//go:embed templates/logo.png
var logoPNG []byte

const itemsPerPage = 50

// statEntry is a name/count pair for source and domain breakdown charts.
type statEntry struct {
	Name  string `json:"name"`
	Count int    `json:"count"`
}

// reportData holds all values injected into the HTML report template.
type reportData struct {
	ScanID         string
	GeneratedAt    string
	WildcardFile   string
	Threads        int
	Retries        int
	Timeout        int
	RateLimit      int
	SubdomainCount int
	HTTPCount      int
	PortCount      int
	UniqueSources  int
	UniqueDomains  int
	Subdomains     template.JS // safe JSON array
	HTTPResults    template.JS // safe JSON array
	PortResults    template.JS // safe JSON array
	DomainStats    template.JS // [{name, count}]
	SourceStats    template.JS // [{name, count}]
	ItemsPerPage   int
	// Screenshot data
	ScreenshotCount int
	Screenshots     template.JS // [{url, filename, subdomain}]
	HasScreenshots  bool
	// Diff data
	DiffData template.JS // null or full diff object
	HasDiff  bool
	// Chart data
	StatusStats template.JS // [{name, count}]
	TechStats   template.JS // [{name, count}]
	// Wayback data
	WaybackData  template.JS // [{subdomain, domain, urls}]
	WaybackCount int
	HasWayback   bool
	// Takeover data
	TakeoverData  template.JS // [{subdomain, cname, risk, service, evidence}]
	TakeoverCount int
	HasTakeover   bool
	// Logo
	LogoDataURI template.URL // base64 data URI or empty
}

// WriteHTML renders the embedded report template with the scan results and
// writes it to filename.
func WriteHTML(filename string, cfg *config.Config, results *types.ScanResults, diffResult *diff.DiffResult) error {
	tmpl := template.New("report")
	if _, err := tmpl.New("styles").Parse(reportCSS); err != nil {
		return err
	}
	if _, err := tmpl.New("script").Parse(reportJS); err != nil {
		return err
	}
	if _, err := tmpl.Parse(reportTemplateStr); err != nil {
		return err
	}

	domainStats, sourcesStats := computeStats(results.Subdomains)
	screenshots := buildScreenshotData(cfg, results.HTTP)
	statusStats := buildStatusStats(results.HTTP)
	techStats := buildTechStats(results.HTTP)

	var diffData template.JS = "null"
	hasDiff := false
	if diffResult != nil {
		hasDiff = true
		diffData = marshalJS(diffResult)
	}

	// Count total wayback URLs
	waybackCount := 0
	for _, w := range results.Wayback {
		waybackCount += len(w.URLs)
	}

	// Load logo as base64 data URI
	logoDataURI := loadLogoDataURI()

	data := reportData{
		ScanID:          cfg.UniqueName,
		GeneratedAt:     time.Now().Format("January 2, 2006 at 15:04:05"),
		WildcardFile:    cfg.WildcardFile,
		Threads:         cfg.Threads,
		Retries:         cfg.Retries,
		Timeout:         cfg.Timeout,
		RateLimit:       cfg.RateLimit,
		SubdomainCount:  len(results.Subdomains),
		HTTPCount:       len(results.HTTP),
		PortCount:       len(results.Ports),
		UniqueSources:   len(sourcesStats),
		UniqueDomains:   len(domainStats),
		Subdomains:      buildSubdomainRows(results.Subdomains),
		HTTPResults:     buildHTTPRows(results.HTTP),
		PortResults:     buildPortRows(results.Ports),
		DomainStats:     marshalJS(domainStats),
		SourceStats:     marshalJS(sourcesStats),
		ItemsPerPage:    itemsPerPage,
		ScreenshotCount: len(screenshots),
		Screenshots:     marshalJS(screenshots),
		HasScreenshots:  len(screenshots) > 0,
		DiffData:        diffData,
		HasDiff:         hasDiff,
		StatusStats:     marshalJS(statusStats),
		TechStats:       marshalJS(techStats),
		WaybackData:     marshalJS(results.Wayback),
		WaybackCount:    waybackCount,
		HasWayback:      len(results.Wayback) > 0,
		TakeoverData:    marshalJS(results.Takeover),
		TakeoverCount:   len(results.Takeover),
		HasTakeover:     len(results.Takeover) > 0,
		LogoDataURI:     logoDataURI,
	}

	file, err := os.Create(filename)
	if err != nil {
		return err
	}
	defer func() { _ = file.Close() }()

	return tmpl.Execute(file, data)
}

// computeStats returns domain and source breakdown sorted by count descending.
func computeStats(subdomains []types.SubdomainResult) ([]statEntry, []statEntry) {
	domainCounts := make(map[string]int)
	sourceCounts := make(map[string]int)

	for _, s := range subdomains {
		parent := extractParent(s.Subdomain)
		domainCounts[parent]++
		for _, src := range strings.Split(s.Source, ",") {
			src = strings.TrimSpace(src)
			if src != "" {
				sourceCounts[src]++
			}
		}
	}

	return toSortedEntries(domainCounts), toSortedEntries(sourceCounts)
}

func toSortedEntries(m map[string]int) []statEntry {
	entries := make([]statEntry, 0, len(m))
	for k, v := range m {
		entries = append(entries, statEntry{Name: k, Count: v})
	}
	sort.Slice(entries, func(i, j int) bool {
		return entries[i].Count > entries[j].Count
	})
	return entries
}

// extractParent returns the registrable domain portion (last two labels) of a
// fully-qualified subdomain name, e.g. "api.palantir.com" → "palantir.com".
func extractParent(subdomain string) string {
	parts := strings.Split(subdomain, ".")
	if len(parts) <= 2 {
		return subdomain
	}
	return strings.Join(parts[len(parts)-2:], ".")
}

// buildSubdomainRows marshals subdomain results to a JSON array safe for
// embedding inside a <script> block.
func buildSubdomainRows(subdomains []types.SubdomainResult) template.JS {
	type row struct {
		Subdomain string `json:"subdomain"`
		Parent    string `json:"parent"`
		Source    string `json:"source"`
		IPs       string `json:"ips"`
	}
	rows := make([]row, 0, len(subdomains))
	for _, s := range subdomains {
		ips := strings.Join(s.IPs, ", ")
		if ips == "" {
			ips = "N/A"
		}
		rows = append(rows, row{
			Subdomain: s.Subdomain,
			Parent:    extractParent(s.Subdomain),
			Source:    s.Source,
			IPs:       ips,
		})
	}
	return marshalJS(rows)
}

// techEntry is a JSON-friendly version of types.Technology for the HTML template.
type techEntry struct {
	Name     string `json:"name"`
	Version  string `json:"version,omitempty"`
	Category string `json:"category"`
}

// buildHTTPRows marshals HTTP results to a JSON array safe for embedding
// inside a <script> block.
func buildHTTPRows(httpResults []types.HTTPResult) template.JS {
	type row struct {
		URL           string      `json:"url"`
		Status        int         `json:"status"`
		StatusClass   string      `json:"statusClass"`
		Title         string      `json:"title"`
		ContentLength int         `json:"contentLength"`
		Technologies  string      `json:"technologies"`
		DetectedTech  []techEntry `json:"detectedTech,omitempty"`
	}
	rows := make([]row, 0, len(httpResults))
	for _, r := range httpResults {
		tech := strings.Join(r.Technologies, ", ")
		if tech == "" {
			tech = "N/A"
		}

		var dt []techEntry
		for _, t := range r.DetectedTech {
			dt = append(dt, techEntry{
				Name:     t.Name,
				Version:  t.Version,
				Category: t.Category,
			})
		}

		rows = append(rows, row{
			URL:           r.URL,
			Status:        r.StatusCode,
			StatusClass:   statusClass(r.StatusCode),
			Title:         r.Title,
			ContentLength: r.ContentLength,
			Technologies:  tech,
			DetectedTech:  dt,
		})
	}
	return marshalJS(rows)
}

// buildPortRows marshals port scan results to a JSON array safe for embedding
// inside a <script> block.
func buildPortRows(portResults []types.PortResult) template.JS {
	type row struct {
		Host     string `json:"host"`
		IP       string `json:"ip"`
		Port     int    `json:"port"`
		Protocol string `json:"protocol"`
		State    string `json:"state"`
		Service  string `json:"service"`
		Version  string `json:"version"`
	}
	rows := make([]row, 0, len(portResults))
	for _, pr := range portResults {
		for _, p := range pr.Ports {
			rows = append(rows, row{
				Host:     pr.Host,
				IP:       pr.IP,
				Port:     p.Number,
				Protocol: p.Protocol,
				State:    p.State,
				Service:  p.Service,
				Version:  p.Version,
			})
		}
	}
	return marshalJS(rows)
}

// marshalJS marshals v to JSON and returns it as template.JS, escaping any
// "</script>" sequence to prevent breaking out of the enclosing script block.
func marshalJS(v any) template.JS {
	b, _ := json.Marshal(v)
	safe := strings.ReplaceAll(string(b), "</script>", `<\/script>`)
	return template.JS(safe)
}

func statusClass(code int) string {
	return "status-" + strconv.Itoa(code)
}

type screenshotEntry struct {
	URL       string `json:"url"`
	Filename  string `json:"filename"`
	Subdomain string `json:"subdomain"`
}

// buildScreenshotData scans the screenshot directory and matches files to HTTP results.
func buildScreenshotData(cfg *config.Config, httpResults []types.HTTPResult) []screenshotEntry {
	if !cfg.Screenshot || cfg.ScreenshotDir == "" {
		return nil
	}

	files, err := filepath.Glob(filepath.Join(cfg.ScreenshotDir, "*.png"))
	if err != nil || len(files) == 0 {
		return nil
	}

	// Build a set of screenshot filenames for quick lookup
	fileSet := make(map[string]bool, len(files))
	for _, f := range files {
		fileSet[filepath.Base(f)] = true
	}

	var entries []screenshotEntry
	seen := make(map[string]bool)
	for _, h := range httpResults {
		// Extract hostname from URL
		host := h.URL
		for _, prefix := range []string{"https://", "http://"} {
			host = strings.TrimPrefix(host, prefix)
		}
		host = strings.TrimRight(host, "/")
		if strings.Contains(host, ":") {
			host = strings.Split(host, ":")[0]
		}

		fname := host + ".png"
		if fileSet[fname] && !seen[fname] {
			seen[fname] = true
			entries = append(entries, screenshotEntry{
				URL:       h.URL,
				Filename:  "screenshots/" + fname,
				Subdomain: host,
			})
		}
	}
	return entries
}

// buildStatusStats counts HTTP status codes into buckets.
func buildStatusStats(httpResults []types.HTTPResult) []statEntry {
	counts := make(map[string]int)
	for _, h := range httpResults {
		var bucket string
		switch {
		case h.StatusCode >= 200 && h.StatusCode < 300:
			bucket = "2xx Success"
		case h.StatusCode >= 300 && h.StatusCode < 400:
			bucket = "3xx Redirect"
		case h.StatusCode >= 400 && h.StatusCode < 500:
			bucket = "4xx Client Error"
		case h.StatusCode >= 500:
			bucket = "5xx Server Error"
		default:
			bucket = "Other"
		}
		counts[bucket]++
	}
	return toSortedEntries(counts)
}

// buildTechStats counts technology occurrences across HTTP results,
// merging both the basic Technologies strings and structured DetectedTech.
func buildTechStats(httpResults []types.HTTPResult) []statEntry {
	counts := make(map[string]int)
	for _, h := range httpResults {
		seen := make(map[string]bool)
		for _, t := range h.Technologies {
			t = strings.TrimSpace(t)
			if t != "" && !seen[strings.ToLower(t)] {
				seen[strings.ToLower(t)] = true
				counts[t]++
			}
		}
		for _, dt := range h.DetectedTech {
			if !seen[strings.ToLower(dt.Name)] {
				seen[strings.ToLower(dt.Name)] = true
				counts[dt.Name]++
			}
		}
	}
	entries := toSortedEntries(counts)
	if len(entries) > 10 {
		entries = entries[:10]
	}
	return entries
}

// loadLogoDataURI returns the embedded logo as a base64 data URI.
func loadLogoDataURI() template.URL {
	if len(logoPNG) == 0 {
		return ""
	}
	encoded := base64.StdEncoding.EncodeToString(logoPNG)
	return template.URL("data:image/png;base64," + encoded)
}
