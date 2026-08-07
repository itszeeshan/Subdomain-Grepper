package server

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"time"

	"github.com/itszeeshan/subdomainx/v2/internal/config"
	"github.com/itszeeshan/subdomainx/v2/internal/tui"
	"github.com/itszeeshan/subdomainx/v2/internal/utils"
)

const version = "2.1.0"

func (s *Server) handleHealth(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, HealthResponse{
		Status:  "ok",
		Version: version,
		Uptime:  time.Since(s.startTime).Round(time.Second).String(),
	})
}

func (s *Server) handleCreateScan(w http.ResponseWriter, r *http.Request) {
	var req ScanRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, ErrorResponse{Error: "invalid request body", Details: err.Error()})
		return
	}

	if req.Domain == "" {
		writeJSON(w, http.StatusBadRequest, ErrorResponse{Error: "domain is required"})
		return
	}

	// Build Config from request
	cfg := &config.Config{
		OutputDir:      s.outputDir,
		OutputFormat:   "json",
		UniqueName:     fmt.Sprintf("api_%s_%d", req.Domain, time.Now().Unix()),
		Threads:        withDefault(req.Threads, 10),
		Retries:        withDefault(req.Retries, 3),
		Timeout:        withDefault(req.Timeout, 30),
		RateLimit:      withDefault(req.RateLimit, 100),
		MaxHTTPTargets: 1000,
		Tools:          make(map[string]bool),
		Filters:        make(map[string]string),
		Screenshot:     req.Options.Screenshot,
		TechDetect:     req.Options.TechDetect,
		Takeover:       req.Options.Takeover,
	}

	if req.Format != "" {
		cfg.OutputFormat = req.Format
	}

	// Apply tool selection
	if len(req.Tools) > 0 {
		for _, t := range req.Tools {
			cfg.Tools[t] = true
		}
	} else {
		// Default tools when none specified
		cfg.Tools["subfinder"] = true
		cfg.Tools["crtsh"] = true
	}

	if req.Options.Httpx {
		cfg.Tools["httpx"] = true
	}
	if req.Options.Smap {
		cfg.Tools["smap"] = true
	}
	if cfg.Screenshot || cfg.TechDetect {
		cfg.Tools["httpx"] = true
	}

	// Create temp wildcard file with the domain
	tmpFile, err := os.CreateTemp("", "subdomainx-api-*.txt")
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, ErrorResponse{Error: "failed to create temp file"})
		return
	}
	if _, err := tmpFile.WriteString(req.Domain + "\n"); err != nil {
		_ = tmpFile.Close()
		_ = os.Remove(tmpFile.Name())
		writeJSON(w, http.StatusInternalServerError, ErrorResponse{Error: "failed to write domain"})
		return
	}
	_ = tmpFile.Close()
	cfg.WildcardFile = tmpFile.Name()

	// Create output directory
	if err := os.MkdirAll(cfg.OutputDir, 0755); err != nil {
		_ = os.Remove(tmpFile.Name())
		writeJSON(w, http.StatusInternalServerError, ErrorResponse{Error: "failed to create output directory"})
		return
	}

	// Create scan job
	scanID := fmt.Sprintf("scan_%d", time.Now().UnixNano())
	// Detach from request context so scan outlives the HTTP request
	ctx, cancel := context.WithCancel(context.WithoutCancel(r.Context()))

	job := &ScanJob{
		ID:        scanID,
		Status:    StatusQueued,
		Domain:    req.Domain,
		Tools:     req.Tools,
		StartedAt: time.Now(),
		cancel:    cancel,
	}
	s.store.Create(job)

	// Create event sink and checkpoint
	sink := NewAPIEventSink(job)
	configMap := map[string]interface{}{
		"threads":   cfg.Threads,
		"retries":   cfg.Retries,
		"timeout":   cfg.Timeout,
		"rateLimit": cfg.RateLimit,
	}
	checkpoint := utils.CreateCheckpoint(cfg.UniqueName, req.Domain, cfg.WildcardFile, configMap)

	// Launch scan in background goroutine
	scanFunc := tui.GetScanFunc()
	if scanFunc == nil {
		writeJSON(w, http.StatusInternalServerError, ErrorResponse{Error: "scan function not registered"})
		return
	}

	go func() {
		defer func() {
			_ = os.Remove(tmpFile.Name())
			cancel()
		}()

		_ = ctx // keep ctx reference for future cancellation support
		err := scanFunc(cfg, checkpoint, "", []string{req.Domain}, s.outputDir, sink)
		if err != nil {
			sink.ScanComplete(err)
		}
	}()

	writeJSON(w, http.StatusAccepted, ScanResponse{
		ID:      scanID,
		Status:  StatusQueued,
		Message: fmt.Sprintf("scan queued for %s", req.Domain),
	})
}

func (s *Server) handleGetScan(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	job := s.store.Get(id)
	if job == nil {
		writeJSON(w, http.StatusNotFound, ErrorResponse{Error: "scan not found"})
		return
	}

	job.mu.RLock()
	defer job.mu.RUnlock()

	writeJSON(w, http.StatusOK, job)
}

func (s *Server) handleListScans(w http.ResponseWriter, r *http.Request) {
	items := s.store.List()
	writeJSON(w, http.StatusOK, items)
}

func (s *Server) handleDeleteScan(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	if err := s.store.Delete(id); err != nil {
		writeJSON(w, http.StatusNotFound, ErrorResponse{Error: err.Error()})
		return
	}
	writeJSON(w, http.StatusOK, map[string]string{"status": "cancelled", "id": id})
}

// writeJSON marshals v to JSON and writes it with the given status code.
func writeJSON(w http.ResponseWriter, status int, v interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(v)
}

func withDefault(val, def int) int {
	if val <= 0 {
		return def
	}
	return val
}
