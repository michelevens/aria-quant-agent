# Comprehensive Infrastructure Monitoring & Cloud Migration Plan

**Date:** March 12, 2026
**Author:** Clearstone Group Engineering
**Status:** Planning Phase

---

## Table of Contents

1. [Current Infrastructure Inventory](#part-1-current-infrastructure-inventory)
2. [API Monitoring Plan](#part-2-api-monitoring-plan)
3. [Cloud Provider Analysis](#part-3-cloud-provider-analysis)
4. [Migration Roadmap](#part-4-migration-roadmap)

---

## Part 1: Current Infrastructure Inventory

### Active Railway Deployments (4 Live APIs)

| Project | Railway URL | Database | Builder | Status |
|---------|-------------|----------|---------|--------|
| **ShiftPulse** | `considerate-acceptance-production-edb1.up.railway.app` | PostgreSQL | NIXPACKS (Procfile) | ✅ Active |
| **Caremanagerio** | `caremanagerio-production.up.railway.app` | MySQL | NIXPACKS | ✅ Active |
| **ClinicLink** | `cliniclink-api-production.up.railway.app` | PostgreSQL | NIXPACKS | ✅ Active |
| **ClinicBridge** | `laravel-backend-production-37fb.up.railway.app` | PostgreSQL | Dockerfile | ✅ Active |

### Planned/Development Only

| Project | Database | Status |
|---------|----------|--------|
| **InsureFlow** | PostgreSQL | ⏳ Dev only (railway.toml configured) |
| **Propkay** | MySQL (planned) | 📋 Roadmap phase |
| **EnnHealth** | SQLite | ❌ No Railway config |

### Frontend Deployments (GitHub Pages)

All frontends deploy to GitHub Pages via GitHub Actions:
- ShiftPulse → `michelevens.github.io/ShiftPulse`
- Caremanagerio → `michelevens.github.io/Caremanagerio`
- ClinicLink → `michelevens.github.io/ClinicLink`
- ClinicBridge → `michelevens.github.io/ClinicBridge`
- Propkay → `michelevens.github.io/Propkay`
- mybellacare → `mybellacare.com` (custom domain)
- Aria Quant → `michelevens.github.io/aria-quant-agent`

### Custom Domains

| Domain | Points To | Purpose |
|--------|-----------|---------|
| `mybellacare.com` | GitHub Pages (185.199.108-111.153) | Clearstone Group website |
| `api.cliniclink.health` | Railway (ClinicLink API) | Custom API domain |
| `api.insurons.com` | Railway (planned) | InsureFlow API (future) |

---

## Part 2: API Monitoring Plan

### 2.1 What to Monitor

#### Health & Availability
- **HTTP Status Codes** — Endpoint returns 200 OK
- **Response Time** — Track p50, p95, p99 latency
- **SSL Certificate Expiry** — Alert 30 days before expiration
- **DNS Resolution** — Verify A/CNAME records resolve correctly
- **Uptime SLA** — Target 99.9% (8.7 hours downtime/year)

#### Application Performance
- **API Response Times** — Per-endpoint latency tracking
- **Error Rates** — 4xx and 5xx error percentages
- **Database Connection Pool** — Active/idle connections
- **Memory & CPU Usage** — Container resource utilization
- **Queue Processing** — Job completion rates and lag

#### HIPAA-Specific Monitoring (Healthcare Apps)
- **Audit Log Integrity** — Verify access logs are being written
- **Authentication Failures** — Track failed login attempts (brute force detection)
- **Data Access Patterns** — Unusual bulk data exports
- **Session Management** — Expired sessions, concurrent sessions
- **Encryption Status** — TLS enforcement, data-at-rest encryption verification

### 2.2 Monitoring Endpoints

Each Laravel API should expose these endpoints:

```
GET /api/health          → Basic health check (200 OK)
GET /api/health/deep     → Database + cache + queue check
GET /api/health/metrics  → Prometheus-format metrics
```

### 2.3 Recommended Monitoring Stack

#### Option A: Lightweight (Current Scale — 4 APIs)
| Tool | Purpose | Cost |
|------|---------|------|
| **UptimeRobot** (free tier) | HTTP uptime monitoring, 5-min intervals | Free (50 monitors) |
| **GitHub Actions cron** | Custom health checks (like mybellacare monitor.yml) | Free |
| **Sentry** (free tier) | Error tracking, performance monitoring | Free (5K events/mo) |
| **Laravel Telescope** | Per-app request/query debugging | Free (self-hosted) |

#### Option B: Production-Grade (Recommended for Healthcare)
| Tool | Purpose | Cost |
|------|---------|------|
| **Better Stack (formerly Logtail)** | Uptime + logging + incident management | $24/mo |
| **Sentry** (Team) | Error tracking + performance | $26/mo |
| **Google Cloud Monitoring** | Infrastructure metrics (if migrated to GCP) | Included with GCP |
| **PagerDuty** or **OpsGenie** | Incident alerting + on-call rotation | $9-21/user/mo |

### 2.4 Alert Channels

| Severity | Response Time | Channel |
|----------|---------------|---------|
| **Critical** (site down, data breach) | < 15 min | SMS + Phone call + Slack |
| **High** (degraded performance, high error rate) | < 1 hour | Slack + Email |
| **Medium** (SSL expiring, disk usage > 80%) | < 24 hours | Email |
| **Low** (dependency update, minor anomaly) | Next business day | Email digest |

### 2.5 GitHub Actions Monitoring Workflow

Extend the mybellacare monitor.yml pattern to all APIs:

```yaml
name: API Health Monitor

on:
  schedule:
    - cron: '*/15 * * * *'  # Every 15 minutes
  workflow_dispatch:

jobs:
  monitor:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        include:
          - name: ShiftPulse
            url: https://considerate-acceptance-production-edb1.up.railway.app/api/health
          - name: Caremanagerio
            url: https://caremanagerio-production.up.railway.app/api/health
          - name: ClinicLink
            url: https://cliniclink-api-production.up.railway.app/api/health
          - name: ClinicBridge
            url: https://laravel-backend-production-37fb.up.railway.app/api/health

    steps:
      - name: Check ${{ matrix.name }}
        run: |
          STATUS=$(curl -s -o /dev/null -w "%{http_code}" --max-time 15 "${{ matrix.url }}")
          RESPONSE_TIME=$(curl -s -o /dev/null -w "%{time_total}" --max-time 15 "${{ matrix.url }}")
          echo "${{ matrix.name }}: HTTP $STATUS (${RESPONSE_TIME}s)"
          if [ "$STATUS" != "200" ]; then
            echo "::error::${{ matrix.name }} is DOWN (HTTP $STATUS)"
            exit 1
          fi
```

### 2.6 Incident Response Procedure

1. **Detection** — Automated alert fires
2. **Triage** (< 5 min) — Verify alert is real, check Railway dashboard
3. **Diagnose** (< 15 min) — Check logs (`railway logs`), identify root cause
4. **Mitigate** (< 30 min) — Rollback deploy, restart service, or scale up
5. **Resolve** — Deploy fix, verify recovery
6. **Post-mortem** — Document timeline, root cause, and prevention steps

---

## Part 3: Cloud Provider Analysis

### 3.0 CRITICAL FINDING: HIPAA Compliance Gap

> **⚠️ Railway does NOT sign Business Associate Agreements (BAAs).**
>
> All 4 active Railway APIs handle Protected Health Information (PHI) for healthcare applications. Under HIPAA, any cloud provider handling PHI **must** sign a BAA. This is a **critical compliance gap** that must be addressed.

### 3.1 Provider Comparison

| Criteria | Railway | AWS | Google Cloud | Azure | DigitalOcean | Render | Fly.io |
|----------|---------|-----|-------------|-------|-------------|--------|--------|
| **BAA Available** | ❌ No | ✅ Yes | ✅ Yes | ✅ Yes | ❌ No | ❌ No | ❌ No |
| **HIPAA Eligible** | ❌ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Ease of Use** | ⭐⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ |
| **Laravel Support** | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ |
| **Auto-deploy** | ✅ Git push | ✅ CodePipeline | ✅ Cloud Build | ✅ DevOps | ✅ App Platform | ✅ Git push | ✅ flyctl |
| **Managed DB** | ✅ PostgreSQL/MySQL | ✅ RDS | ✅ Cloud SQL | ✅ Azure DB | ✅ Managed DB | ✅ PostgreSQL | ❌ |
| **Free Tier** | $5/mo credit | 12 months | $300 credit | $200 credit | None | Free tier | $0 (limited) |

### 3.2 Cost Comparison (4 Laravel APIs + Databases)

| Provider | Compute (4 APIs) | Database (4 instances) | Total/Month |
|----------|-------------------|----------------------|-------------|
| **Railway** | $40-80 | $80-160 | **$120-240** |
| **AWS (ECS Fargate + RDS)** | $60-120 | $80-160 | **$140-280** |
| **Google Cloud (Cloud Run + Cloud SQL)** | $30-80 | $92-128 | **$122-208** |
| **Azure (Container Apps + Azure DB)** | $50-100 | $100-200 | **$150-300** |
| **DigitalOcean (App Platform)** | $48-96 | $60-120 | **$108-216** |

### 3.3 Recommendation: Google Cloud Platform (GCP)

**Primary choice for healthcare SaaS hosting.**

#### Why GCP?

1. **HIPAA Compliance** — Signs BAAs, offers HIPAA-eligible services including Cloud Run and Cloud SQL
2. **Cost-Effective** — Cloud Run is pay-per-request (scales to zero), lowest compute cost
3. **Laravel-Friendly** — Cloud Run supports Docker containers natively, similar DX to Railway
4. **Managed PostgreSQL** — Cloud SQL with automatic backups, encryption at rest, and HA options
5. **Auto-scaling** — Cloud Run scales 0→N based on traffic (perfect for variable-load healthcare apps)
6. **Security** — VPC, Cloud IAM, Cloud Audit Logs, encryption by default
7. **$300 Free Credit** — 90-day trial to test migration before committing

#### Proposed GCP Architecture

```
┌─────────────────────────────────────────────────┐
│                  Google Cloud                     │
│                                                   │
│  ┌──────────────┐  ┌──────────────┐              │
│  │  Cloud Run    │  │  Cloud Run    │              │
│  │  ShiftPulse   │  │  ClinicLink   │              │
│  │  API          │  │  API          │              │
│  └──────┬───────┘  └──────┬───────┘              │
│         │                  │                      │
│  ┌──────┴──────────────────┴───────┐             │
│  │       Cloud SQL (PostgreSQL)     │             │
│  │  ┌──────┐ ┌──────┐ ┌──────┐    │             │
│  │  │ shift │ │clinic│ │clinic│    │             │
│  │  │ pulse │ │ link │ │bridge│    │             │
│  │  └──────┘ └──────┘ └──────┘    │             │
│  └─────────────────────────────────┘             │
│                                                   │
│  ┌──────────────┐  ┌──────────────┐              │
│  │  Cloud Run    │  │  Cloud Run    │              │
│  │  ClinicBridge │  │  Caremanagerio│              │
│  │  API          │  │  API (MySQL)  │              │
│  └──────┬───────┘  └──────┬───────┘              │
│         │                  │                      │
│         │          ┌───────┴──────┐               │
│         │          │  Cloud SQL    │               │
│         │          │  (MySQL)      │               │
│         │          └──────────────┘               │
│  ┌──────┴──────────────────────────┐             │
│  │    Cloud Monitoring + Logging    │             │
│  │    Cloud Armor (WAF/DDoS)        │             │
│  │    Secret Manager                │             │
│  └─────────────────────────────────┘             │
│                                                   │
│  ┌─────────────────────────────────┐             │
│  │    Cloud Build (CI/CD)           │             │
│  │    GitHub → Cloud Build → Deploy │             │
│  └─────────────────────────────────┘             │
└─────────────────────────────────────────────────┘
```

#### GCP Services Needed

| Service | Purpose | Estimated Cost |
|---------|---------|---------------|
| **Cloud Run** (4 services) | Container hosting for Laravel APIs | $30-80/mo |
| **Cloud SQL** (PostgreSQL) | ShiftPulse, ClinicLink, ClinicBridge databases | $72-108/mo |
| **Cloud SQL** (MySQL) | Caremanagerio database | $20-30/mo |
| **Cloud Build** | CI/CD pipeline (GitHub trigger) | Free (120 min/day) |
| **Artifact Registry** | Docker image storage | ~$3/mo |
| **Secret Manager** | API keys, DB credentials | ~$1/mo |
| **Cloud Monitoring** | Metrics, alerts, uptime checks | Included |
| **Cloud Armor** | WAF + DDoS protection | $5/mo (basic) |
| **Cloud Audit Logs** | HIPAA audit trail | Included |
| **Total** | | **$131-227/mo** |

---

## Part 4: Migration Roadmap

### 8-Week Migration Plan

#### Phase 1: Foundation (Weeks 1-2)

**Goal:** Set up GCP project and infrastructure

- [ ] Create GCP project with HIPAA Organization Policy
- [ ] Enable BAA signing via Google Cloud console
- [ ] Enable required APIs: Cloud Run, Cloud SQL, Cloud Build, Secret Manager
- [ ] Set up VPC with private service access
- [ ] Configure IAM roles and service accounts
- [ ] Set up Cloud Build GitHub triggers for all 4 repos
- [ ] Create Artifact Registry for Docker images

**Deliverables:**
- GCP project with BAA signed
- CI/CD pipeline connected to GitHub repos
- Docker images building and pushing to Artifact Registry

#### Phase 2: Database Migration (Weeks 3-4)

**Goal:** Migrate all databases from Railway to Cloud SQL

##### PostgreSQL Migration (ShiftPulse, ClinicLink, ClinicBridge)

```bash
# 1. Export from Railway
railway run pg_dump -Fc --no-owner > shiftpulse_backup.dump

# 2. Create Cloud SQL instance
gcloud sql instances create shiftpulse-db \
  --database-version=POSTGRES_15 \
  --tier=db-f1-micro \
  --region=us-east1 \
  --storage-type=SSD \
  --storage-size=10GB \
  --backup-start-time=03:00 \
  --availability-type=zonal

# 3. Import to Cloud SQL
gcloud sql import sql shiftpulse-db gs://bucket/shiftpulse_backup.sql \
  --database=shiftpulse
```

##### MySQL Migration (Caremanagerio)

```bash
# 1. Export from Railway
railway run mysqldump --single-transaction caremanagerio > caremanagerio.sql

# 2. Create Cloud SQL MySQL instance
gcloud sql instances create caremanagerio-db \
  --database-version=MYSQL_8_0 \
  --tier=db-f1-micro \
  --region=us-east1

# 3. Import to Cloud SQL
gcloud sql import sql caremanagerio-db gs://bucket/caremanagerio.sql \
  --database=caremanagerio
```

**Deliverables:**
- All 4 databases migrated to Cloud SQL
- Data integrity verified (row counts, checksums)
- Automated daily backups configured

#### Phase 3: Application Deployment (Weeks 5-6)

**Goal:** Deploy all 4 Laravel APIs to Cloud Run

##### Dockerfile Template (Laravel on Cloud Run)

```dockerfile
FROM php:8.2-fpm-alpine

# Install extensions
RUN docker-php-ext-install pdo pdo_pgsql pdo_mysql opcache

# Install Composer
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /app
COPY . .

RUN composer install --no-dev --optimize-autoloader
RUN php artisan config:cache && php artisan route:cache

EXPOSE 8080
CMD ["php", "artisan", "serve", "--host=0.0.0.0", "--port=8080"]
```

##### Cloud Run Deployment

```bash
# Deploy each service
gcloud run deploy shiftpulse-api \
  --source=./laravel-backend \
  --region=us-east1 \
  --allow-unauthenticated \
  --set-env-vars="APP_ENV=production" \
  --set-secrets="DB_PASSWORD=shiftpulse-db-password:latest" \
  --add-cloudsql-instances=PROJECT:us-east1:shiftpulse-db \
  --min-instances=0 \
  --max-instances=10 \
  --memory=512Mi \
  --cpu=1
```

**Per-service deployment order:**
1. **ClinicBridge** (simplest, already has Dockerfile)
2. **ClinicLink** (has custom domain, needs DNS update)
3. **ShiftPulse** (most critical — powers mybellacare.com widgets)
4. **Caremanagerio** (MySQL, different config)

**Deliverables:**
- All 4 APIs running on Cloud Run
- Environment variables migrated to Secret Manager
- Health check endpoints verified

#### Phase 4: DNS Cutover & Validation (Week 7)

**Goal:** Switch traffic from Railway to GCP

##### Cutover Strategy (Zero-Downtime)

1. **Pre-cutover:** Run both Railway and GCP in parallel for 48 hours
2. **Validation:** Compare API responses between Railway and GCP
3. **DNS Switch:** Update custom domains to point to Cloud Run
4. **Monitor:** Watch error rates and latency for 24 hours
5. **Rollback window:** Keep Railway running for 1 week after cutover

##### DNS Changes

```
# ClinicLink custom domain
api.cliniclink.health → Cloud Run mapping (gcloud run domain-mappings create)

# ShiftPulse API (update widget endpoints)
api.shiftpulse.io → Cloud Run mapping

# Railway URLs in GitHub Actions / .env files
Update all VITE_API_URL references to new Cloud Run URLs
```

**Deliverables:**
- All traffic flowing through GCP
- Custom domains verified with SSL
- Railway kept as warm standby

#### Phase 5: Hardening & Compliance (Week 8)

**Goal:** Production hardening and HIPAA compliance verification

- [ ] Enable Cloud Armor (WAF) on all Cloud Run services
- [ ] Configure VPC connector for Cloud SQL (no public IP)
- [ ] Enable audit logging for all data access
- [ ] Set up alerting policies in Cloud Monitoring
- [ ] Configure uptime checks for all 4 APIs
- [ ] Enable automated vulnerability scanning
- [ ] Document HIPAA compliance controls
- [ ] Decommission Railway services (after 1-week parallel run)

**Deliverables:**
- HIPAA compliance checklist completed
- BAA signed and documented
- All monitoring and alerting active
- Railway decommissioned

---

### Rollback Procedure

If critical issues arise during migration:

1. **Database:** Cloud SQL export → Railway import (< 1 hour)
2. **DNS:** Revert CNAME/A records to Railway URLs (< 5 min propagation)
3. **Code:** Revert environment variable changes in GitHub Actions
4. **Timeline:** Full rollback achievable in < 2 hours

---

### Cost Projection Summary

| Phase | Railway (Current) | GCP (Target) | Savings |
|-------|-------------------|--------------|---------|
| **4 APIs + DBs** | $120-240/mo | $122-208/mo | ~$0-32/mo |
| **Monitoring** | $0 (none) | Included | N/A |
| **WAF/DDoS** | $0 (none) | ~$5/mo | N/A |
| **HIPAA Compliance** | ❌ Not possible | ✅ Included | **Priceless** |
| **Migration Cost** | — | ~$0 (free tier credits) | — |

> **Bottom Line:** Similar monthly cost, but GCP provides HIPAA compliance, better monitoring, auto-scaling to zero, and enterprise-grade security — all critical for healthcare SaaS.

---

### Key Contacts & Resources

| Resource | URL |
|----------|-----|
| GCP HIPAA Compliance Guide | cloud.google.com/security/compliance/hipaa |
| Cloud Run Documentation | cloud.google.com/run/docs |
| Cloud SQL for PostgreSQL | cloud.google.com/sql/docs/postgres |
| Railway Dashboard | railway.app/dashboard |
| GitHub Actions (CI/CD) | github.com/michelevens |

---

*This plan should be reviewed quarterly and updated as infrastructure needs evolve. Priority action: Sign GCP BAA and begin Phase 1 immediately to address the HIPAA compliance gap.*
