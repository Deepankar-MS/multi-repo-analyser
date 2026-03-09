# Impact Analysis Workflow — Detailed Guide

Step-by-step reference for performing multi-repo feature impact analysis.

## 1. Context Gathering

Before analyzing, collect:

- **Feature description** — what the user wants to build
- **Current repo** — the workspace the user is in
- **Owner/org** — GitHub user or organization owning the repos

### Identifying the repo family

Look for naming conventions:
- Prefix-based: `tracker-api-gateway`, `tracker-frontend`, `tracker-task-service`
- Org-scoped: all repos under an org
- Dependency-linked: `"@myorg/shared": "file:../shared-lib"` in package.json

### Cross-repo dependency signals

| File | What to look for |
|------|-----------------|
| `package.json` | `file:../` references, scoped packages (`@org/`) |
| `go.mod` | `replace` directives pointing to local paths |
| `docker-compose.yml` | Service definitions linking multiple repos |
| `pom.xml` | Module references in multi-module Maven projects |
| `.env` / config files | Service URLs (e.g., `http://localhost:3001`) |

## 2. Architecture Mapping

### Service communication patterns to identify

| Pattern | How to detect |
|---------|--------------|
| HTTP/REST | `fetch()`, `axios`, `http.request()` calls to other service ports |
| gRPC | `.proto` files, gRPC client/server setup |
| Message Queue | RabbitMQ/Kafka/SQS client imports and publish/subscribe code |
| Shared Database | Same DB connection strings across services |
| Shared Library | Common dependency imported by multiple services |

### Drawing the architecture

Map repos into layers:
```
[Frontend] → [API Gateway] → [Service A]
                           → [Service B]
                           → [Service C]
                    all → [Shared Lib]
```

## 3. Impact Classification

### HIGH impact indicators
- The repo owns the primary data for the feature
- New external integrations (APIs, databases, file systems)
- New endpoints that don't exist yet
- Schema/model changes that propagate to other repos
- New authentication or authorization flows

### MEDIUM impact indicators
- Shared utility or model additions
- Configuration changes that other repos consume
- Adding new exports to a library
- Proxy/routing updates in a gateway

### LOW impact indicators
- The repo is only used for validation (e.g., "does this project exist?")
- Optional enhancements (e.g., adding a timestamp field)
- No functional change, only information consumers

### NONE indicators
- The repo serves a completely orthogonal purpose
- No data flow connects it to the feature

## 4. Effort Estimation Guidelines

### Factors to consider

| Factor | Multiplier |
|--------|-----------|
| New external API integration | 2-3x base estimate |
| Auth/security requirements | 1.5-2x |
| Database migration needed | 1.5x |
| Breaking API changes | 2x (coordination overhead) |
| New UI components | 1.3x |
| Existing patterns to follow | 0.8x (faster) |

### Testing overhead

| Test Type | Overhead |
|-----------|---------|
| Unit tests | +20-30% of dev time |
| Integration tests | +30-50% |
| E2E / cross-service tests | +50-100% |

## 5. Risk Assessment

### Common risks in multi-repo features

1. **Deployment ordering** — services must be deployed in correct sequence
2. **Breaking changes** — API contract changes between services
3. **Shared library versioning** — updating the lib may break consumers
4. **Environment configuration** — new secrets/env vars across all services
5. **Data migration** — schema changes requiring backfill
6. **External API rate limits** — third-party APIs may throttle bulk operations

## 6. Example: Feature Impact for "Export Tasks to SharePoint"

### Repos discovered
- `tracker-api-gateway` — API gateway, JWT auth
- `tracker-task-service` — Task CRUD, SQLite database
- `tracker-project-service` — Project CRUD
- `tracker-board-service` — Kanban board aggregation
- `tracker-frontend` — React UI
- `tracker-common-lib` — Shared models and utilities

### Impact result
| Repo | Impact | Reason |
|------|--------|--------|
| tracker-task-service | HIGH | Owns task data, needs export endpoint + SharePoint upload |
| tracker-api-gateway | HIGH | New route proxying, possibly async job support |
| tracker-frontend | HIGH | Export button, SharePoint folder input, status feedback |
| tracker-common-lib | MEDIUM | Shared text formatter utility |
| tracker-project-service | LOW | Only validates project exists (already does this) |
| tracker-board-service | NONE | Unrelated to export functionality |
