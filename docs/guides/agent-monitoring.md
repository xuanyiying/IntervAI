# Agent Monitoring Setup Guide

## Overview

This guide provides instructions for setting up comprehensive monitoring dashboards for the Agent system using Grafana, Prometheus, and Loki.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Agent API Application                     │
│  (Exposes metrics on /metrics endpoint)                      │
└────────────────────┬────────────────────────────────────────┘
                     │
        ┌────────────┼────────────┐
        │            │            │
        ▼            ▼            ▼
   Prometheus    Loki         Alertmanager
   (Metrics)   (Logs)        (Alerts)
        │            │            │
        └────────────┼────────────┘
                     │
                     ▼
                  Grafana
              (Dashboards)
```

## Prometheus Setup

### Installation

```bash
# Download Prometheus
wget https://github.com/prometheus/prometheus/releases/download/v2.40.0/prometheus-2.40.0.linux-amd64.tar.gz
tar xvfz prometheus-2.40.0.linux-amd64.tar.gz
cd prometheus-2.40.0.linux-amd64

# Create configuration directory
mkdir -p /etc/prometheus
mkdir -p /var/lib/prometheus
```

### Configuration

Create `/etc/prometheus/prometheus.yml`:

```yaml
global:
  scrape_interval: 15s
  evaluation_interval: 15s
  external_labels:
    monitor: 'agent-api-monitor'

alerting:
  alertmanagers:
    - static_configs:
        - targets:
            - localhost:9093

rule_files:
  - '/etc/prometheus/alert_rules.yml'

scrape_configs:
  # Agent API metrics
  - job_name: 'agent-api'
    static_configs:
      - targets: ['localhost:3000']
    metrics_path: '/metrics'
    scrape_interval: 10s

  # Node exporter (system metrics)
  - job_name: 'node'
    static_configs:
      - targets: ['localhost:9100']

  # PostgreSQL exporter
  - job_name: 'postgres'
    static_configs:
      - targets: ['localhost:9187']

  # Redis exporter
  - job_name: 'redis'
    static_configs:
      - targets: ['localhost:9121']

  # Prometheus self-monitoring
  - job_name: 'prometheus'
    static_configs:
      - targets: ['localhost:9090']
```

## Grafana Setup

### Installation

```bash
# Add Grafana repository
sudo apt-get install -y software-properties-common
sudo add-apt-repository "deb https://packages.grafana.com/oss/deb stable main"
sudo apt-get update

# Install Grafana
sudo apt-get install -y grafana-server

# Enable and start
sudo systemctl enable grafana-server
sudo systemctl start grafana-server
```

## Loki Setup

### Installation

```bash
# Download Loki
wget https://github.com/grafana/loki/releases/download/v2.8.0/loki-linux-amd64.zip
unzip loki-linux-amd64.zip
sudo mv loki-linux-amd64 /opt/loki

# Create configuration directory
mkdir -p /etc/loki
```

### Configuration

Create `/etc/loki/loki-config.yml`:

```yaml
auth_enabled: false

ingester:
  chunk_idle_period: 3m
  max_chunk_age: 1h
  max_streams_per_user: 10000
  chunk_retain_period: 1m
```

## Dashboard Configuration

1. Access Grafana at `http://localhost:3000`
2. Default credentials: admin / admin
3. Add Prometheus and Loki as data sources.
4. Import dashboards for Node Exporter, PostgreSQL, and Redis.
5. Create custom dashboards for Agent API metrics using the `/metrics` data.
