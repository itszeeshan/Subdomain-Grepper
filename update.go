package main

import (
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"os/exec"
	"strings"
	"time"
)

const (
	// modulePath is used with `go install` to self-update to the latest release.
	modulePath = "github.com/itszeeshan/subdomainx/v2"
	// latestReleaseAPI returns the latest GitHub release for version comparison.
	latestReleaseAPI = "https://api.github.com/repos/itszeeshan/subdomainx/releases/latest"
)

// runUpdate checks GitHub for the latest release and, if a newer version is
// available, reinstalls SubdomainX via `go install`.
func runUpdate() {
	fmt.Printf("🔍 Current version: v%s\n", Version)
	fmt.Println("📡 Checking for updates...")

	latest, err := latestVersion()
	if err != nil {
		fmt.Printf("⚠️  Could not determine the latest version: %v\n", err)
		fmt.Println("💡 Updating to the latest published release anyway...")
	} else {
		fmt.Printf("📦 Latest version: v%s\n", latest)
		if normalizeVersion(latest) == normalizeVersion(Version) {
			fmt.Println("✅ You are already on the latest version.")
			return
		}
		fmt.Printf("⬆️  Updating from v%s to v%s...\n", Version, latest)
	}

	if err := goInstallLatest(); err != nil {
		fmt.Printf("❌ Update failed: %v\n", err)
		fmt.Println("💡 Make sure Go is installed and $(go env GOPATH)/bin is on your PATH.")
		fmt.Println("   You can also update manually:")
		fmt.Printf("   go install %s@latest\n", modulePath)
		os.Exit(1)
	}

	fmt.Println("✅ SubdomainX updated successfully. Run `subdomainx --version` to confirm.")
}

// latestVersion queries the GitHub API for the latest release tag.
func latestVersion() (string, error) {
	client := &http.Client{Timeout: 15 * time.Second}
	req, err := http.NewRequest(http.MethodGet, latestReleaseAPI, nil)
	if err != nil {
		return "", err
	}
	req.Header.Set("Accept", "application/vnd.github+json")

	resp, err := client.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("GitHub API returned status %d", resp.StatusCode)
	}

	var release struct {
		TagName string `json:"tag_name"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&release); err != nil {
		return "", err
	}
	if release.TagName == "" {
		return "", fmt.Errorf("no release tag found")
	}
	return normalizeVersion(release.TagName), nil
}

// goInstallLatest runs `go install <module>@latest`.
func goInstallLatest() error {
	cmd := exec.Command("go", "install", modulePath+"@latest")
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	return cmd.Run()
}

// normalizeVersion strips a leading "v" so versions can be compared.
func normalizeVersion(v string) string {
	return strings.TrimPrefix(strings.TrimSpace(v), "v")
}
