package sysmon

import (
	"bufio"
	"bytes"
	"fmt"
	"os/exec"
	"sort"
	"strconv"
	"strings"
	"syscall"
)

// SystemStats holds current system resource usage.
type SystemStats struct {
	CPUUsage    float64 `json:"cpuUsage"`    // percentage 0-100
	MemTotal    uint64  `json:"memTotal"`    // bytes
	MemUsed     uint64  `json:"memUsed"`     // bytes
	MemPercent  float64 `json:"memPercent"`  // percentage
	DiskTotal   uint64  `json:"diskTotal"`   // bytes
	DiskUsed    uint64  `json:"diskUsed"`    // bytes
	DiskPercent float64 `json:"diskPercent"` // percentage
}

// GetSystemStats collects CPU, memory, and disk stats on macOS.
func GetSystemStats() (*SystemStats, error) {
	stats := &SystemStats{}

	if err := fillCPU(stats); err != nil {
		return nil, fmt.Errorf("cpu: %w", err)
	}
	if err := fillMemory(stats); err != nil {
		return nil, fmt.Errorf("memory: %w", err)
	}
	if err := fillDisk(stats); err != nil {
		return nil, fmt.Errorf("disk: %w", err)
	}

	return stats, nil
}

// fillCPU parses `top -l 1 -n 0 -s 0` output for the "CPU usage" line.
// Example line: "CPU usage: 3.33% user, 8.33% sys, 88.33% idle"
func fillCPU(s *SystemStats) error {
	out, err := exec.Command("top", "-l", "1", "-n", "0", "-s", "0").Output()
	if err != nil {
		return err
	}

	scanner := bufio.NewScanner(bytes.NewReader(out))
	for scanner.Scan() {
		line := scanner.Text()
		if !strings.HasPrefix(line, "CPU usage:") {
			continue
		}
		// Parse idle percentage and derive usage.
		// Format: "CPU usage: X% user, Y% sys, Z% idle"
		parts := strings.Split(line, ",")
		for _, part := range parts {
			part = strings.TrimSpace(part)
			if strings.HasSuffix(part, "% idle") {
				idleStr := strings.TrimSuffix(part, "% idle")
				idleStr = strings.TrimSpace(idleStr)
				idle, err := strconv.ParseFloat(idleStr, 64)
				if err != nil {
					return fmt.Errorf("parse idle: %w", err)
				}
				s.CPUUsage = 100.0 - idle
				return nil
			}
		}
		return fmt.Errorf("could not find idle in CPU line: %q", line)
	}
	return fmt.Errorf("CPU usage line not found in top output")
}

// fillMemory reads total RAM via sysctl and free/inactive pages via vm_stat.
func fillMemory(s *SystemStats) error {
	// Total physical memory via `sysctl -n hw.memsize`.
	out, err := exec.Command("sysctl", "-n", "hw.memsize").Output()
	if err != nil {
		return fmt.Errorf("sysctl hw.memsize: %w", err)
	}
	total, err := strconv.ParseUint(strings.TrimSpace(string(out)), 10, 64)
	if err != nil {
		return fmt.Errorf("parse hw.memsize: %w", err)
	}

	// Parse vm_stat for page counts.
	var vmOut []byte
	vmOut, err = exec.Command("vm_stat").Output()
	if err != nil {
		return fmt.Errorf("vm_stat: %w", err)
	}

	pages := parseVmStat(string(vmOut))

	// Page size (usually 4096 on Intel, 16384 on Apple Silicon).
	pageSize := uint64(syscall.Getpagesize())

	freePages := pages["Pages free"]
	inactivePages := pages["Pages inactive"]
	speculativePages := pages["Pages speculative"]

	// Available ≈ free + inactive + speculative (mirrors Activity Monitor logic).
	availableBytes := (freePages + inactivePages + speculativePages) * pageSize
	used := total - availableBytes
	if used > total {
		used = total
	}

	s.MemTotal = total
	s.MemUsed = used
	if total > 0 {
		s.MemPercent = float64(used) / float64(total) * 100.0
	}
	return nil
}

// parseVmStat extracts numeric page counts from vm_stat output.
func parseVmStat(output string) map[string]uint64 {
	result := make(map[string]uint64)
	scanner := bufio.NewScanner(strings.NewReader(output))
	for scanner.Scan() {
		line := scanner.Text()
		// Lines look like: "Pages free:                          12345."
		idx := strings.LastIndex(line, ":")
		if idx < 0 {
			continue
		}
		key := strings.TrimSpace(line[:idx])
		valStr := strings.TrimSpace(line[idx+1:])
		valStr = strings.TrimSuffix(valStr, ".")
		val, err := strconv.ParseUint(valStr, 10, 64)
		if err != nil {
			continue
		}
		result[key] = val
	}
	return result
}

// ProcessInfo represents a running process with resource usage.
type ProcessInfo struct {
	PID     int     `json:"pid"`
	Name    string  `json:"name"`
	CPU     float64 `json:"cpu"`
	Memory  float64 `json:"memory"`  // percentage
	MemSize string  `json:"memSize"` // human readable
}

// GetTopProcesses returns the top N processes sorted by the given metric ("cpu" or "mem").
func GetTopProcesses(sortBy string, limit int) ([]ProcessInfo, error) {
	// ps -Arco pid,pcpu,pmem,rss,comm — sorted by cpu or mem
	out, err := exec.Command("ps", "-Arco", "pid,pcpu,pmem,rss,comm").Output()
	if err != nil {
		return nil, fmt.Errorf("ps: %w", err)
	}

	var procs []ProcessInfo
	scanner := bufio.NewScanner(bytes.NewReader(out))
	first := true
	for scanner.Scan() {
		if first { first = false; continue } // skip header
		line := strings.TrimSpace(scanner.Text())
		if line == "" { continue }

		fields := strings.Fields(line)
		if len(fields) < 5 { continue }

		pid, _ := strconv.Atoi(fields[0])
		cpu, _ := strconv.ParseFloat(fields[1], 64)
		mem, _ := strconv.ParseFloat(fields[2], 64)
		rss, _ := strconv.ParseUint(fields[3], 10, 64) // in KB
		name := strings.Join(fields[4:], " ")

		memStr := fmt.Sprintf("%.0f MB", float64(rss)/1024.0)
		if rss > 1024*1024 {
			memStr = fmt.Sprintf("%.1f GB", float64(rss)/(1024.0*1024.0))
		}

		procs = append(procs, ProcessInfo{
			PID:     pid,
			Name:    name,
			CPU:     cpu,
			Memory:  mem,
			MemSize: memStr,
		})
	}

	// Sort by requested metric
	if sortBy == "mem" || sortBy == "memory" {
		sortProcessesByMem(procs)
	} else {
		sortProcessesByCPU(procs)
	}

	if limit > 0 && len(procs) > limit {
		procs = procs[:limit]
	}

	return procs, nil
}

func sortProcessesByCPU(procs []ProcessInfo) {
	sort.Slice(procs, func(i, j int) bool { return procs[i].CPU > procs[j].CPU })
}

func sortProcessesByMem(procs []ProcessInfo) {
	sort.Slice(procs, func(i, j int) bool { return procs[i].Memory > procs[j].Memory })
}

// KillProcess sends SIGTERM to a process by PID.
func KillProcess(pid int) error {
	if pid <= 1 {
		return fmt.Errorf("refusing to kill pid %d: protected process", pid)
	}
	cmd := exec.Command("kill", strconv.Itoa(pid))
	return cmd.Run()
}

// ForceKillProcess sends SIGKILL to a process by PID.
func ForceKillProcess(pid int) error {
	if pid <= 1 {
		return fmt.Errorf("refusing to kill pid %d: protected process", pid)
	}
	cmd := exec.Command("kill", "-9", strconv.Itoa(pid))
	return cmd.Run()
}

// fillDisk uses syscall.Statfs on "/" for total/used bytes.
func fillDisk(s *SystemStats) error {
	var stat syscall.Statfs_t
	if err := syscall.Statfs("/", &stat); err != nil {
		return err
	}

	blockSize := uint64(stat.Bsize)
	total := stat.Blocks * blockSize
	free := stat.Bfree * blockSize
	used := total - free

	s.DiskTotal = total
	s.DiskUsed = used
	if total > 0 {
		s.DiskPercent = float64(used) / float64(total) * 100.0
	}
	return nil
}
