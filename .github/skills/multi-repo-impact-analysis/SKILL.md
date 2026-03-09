```skill
---
name: multi-repo-impact-analysis
description: 'Perform cross-repository feature impact analysis using the GitHub MCP server. Use when asked to analyze feature impact, estimate effort across repos, do multi-repo analysis, assess change impact, find affected repositories, generate impact reports, or evaluate a feature request across a codebase split into multiple repositories. Supports microservice architectures, monorepo-adjacent setups, and any multi-repo project structure.'
---

# Multi-Repo Feature Impact Analysis

Analyze the impact of a proposed feature across multiple related GitHub repositories. Produces a detailed report covering affected repos, code changes required, effort estimates, risk assessment, and implementation recommendations.

## When to Use This Skill

- User asks to "analyze feature impact" or "impact analysis" across repos
- User wants to understand which repos are affected by a proposed feature
- User needs effort estimates for a cross-cutting feature
- User asks about "multi-repo analysis" or "cross-repo changes"
- User wants to assess risk of a change spanning multiple services
- User asks "which repos will this feature impact?"
- User requests a detailed breakdown of work across repositories
- User wants to plan a feature that touches multiple microservices

## Prerequisites

- **GitHub MCP server** must be configured and available (tools prefixed with `mcp_github_`)
- User should have access to the relevant GitHub repositories
- A clear description of the proposed feature from the user

## Step-by-Step Workflow

### Phase 1: Discover Related Repositories

1. **Identify the current repo context** — check the workspace for `package.json`, `go.mod`, `pom.xml`, or similar dependency manifests to determine the current repo name and its dependencies.

2. **Get the authenticated user** — call `mcp_github_get_me` to determine the user/org context.

3. **Search for related repos** — use `mcp_github_search_repositories` with keywords derived from the current repo name (e.g., if the repo is `tracker-api-gateway`, search for `tracker` under the same owner). Also inspect dependency files for cross-repo references (e.g., `"@tracker/common": "file:../tracker-common-lib"` indicates a sibling repo).

4. **Build the repo inventory** — compile a list of all related repositories with:
   - Repo name and URL
   - Language / framework
   - Role in the system (gateway, service, frontend, shared lib, etc.)

### Phase 2: Analyze Each Repository

For each discovered repo:

5. **Fetch the repo structure** — use `mcp_github_get_file_contents` with an empty path to list root files and directories.

6. **Read key files** — fetch and analyze:
   - Entry points (`index.js`, `main.go`, `app.py`, `Program.cs`, etc.)
   - Dependency manifests (`package.json`, `go.mod`, `requirements.txt`, etc.)
   - API route definitions and controllers
   - Shared models or schemas
   - Database schemas or migrations
   - Configuration files

7. **Map the architecture** — understand:
   - What each repo is responsible for
   - How repos communicate (HTTP, message queues, shared DBs, etc.)
   - Which data models are shared
   - Where the data relevant to the feature lives

### Phase 3: Assess Feature Impact

8. **Classify impact per repo** using this scale:
   - **HIGH** — New endpoints, new dependencies, significant logic changes, new integrations
   - **MEDIUM** — Shared model/utility changes, configuration updates, moderate additions
   - **LOW** — Minor adjustments, validation only, optional enhancements
   - **NONE** — No changes required

9. **For each impacted repo, document:**
   - **What changes** — specific files, endpoints, models, or modules affected
   - **Why it's impacted** — the dependency chain or data flow that connects it to the feature
   - **New dependencies** — any new packages, services, or APIs required
   - **Risks** — breaking changes, backwards compatibility, data migration needs

### Phase 4: Effort Estimation

10. **Estimate effort per repo** considering:
    - Lines of code / number of files to change
    - Complexity of integration (new external API vs. internal refactor)
    - Testing requirements (unit, integration, E2E)
    - Infrastructure changes (new env vars, secrets, deployments)

    Use T-shirt sizing:
    | Size | Description | Approximate Time |
    |------|-------------|-----------------|
    | **XS** | Config change, 1-2 files | < 1 hour |
    | **S** | Small feature addition, 3-5 files | 2-4 hours |
    | **M** | New endpoint + logic, 5-10 files | 1-2 days |
    | **L** | New integration + multiple endpoints | 3-5 days |
    | **XL** | New service or major architectural change | 1-2 weeks |

### Phase 5: Generate the Report

11. **Produce a structured impact report** containing:

    #### a. Architecture Diagram
    An ASCII or text-based diagram showing the system architecture and how repos relate.

    #### b. Impact Summary Matrix
    A table with columns: Repository | Impact Level | Changes Required | Effort Estimate

    #### c. Detailed Per-Repo Analysis
    For each impacted repo:
    - Current state (what it does today)
    - Required changes (specific endpoints, files, models)
    - New dependencies
    - Risks and considerations

    #### d. Architecture Decisions
    Key decisions the team needs to make (e.g., sync vs async, where to place new logic, auth approach).

    #### e. Implementation Order
    Recommended sequence for making changes (usually: shared lib → backend services → gateway → frontend).

    #### f. Total Effort Summary
    Aggregate effort across all repos.

## Handling Additional User Queries

After the initial analysis, the user may ask follow-up questions such as:

- **"What about testing?"** — Expand the report with testing strategy per repo (unit tests, integration tests, contract tests between services).
- **"Can you go deeper on repo X?"** — Fetch more files from that specific repo and provide file-level change details.
- **"What about deployment?"** — Add deployment impact: CI/CD pipeline changes, deployment order dependencies, rollback strategy.
- **"Show me the data flow"** — Trace the data flow for the feature from frontend → gateway → services → database → external systems.
- **"Compare approach A vs B"** — Evaluate alternative implementations with pros/cons for each affected repo.

## Report Template

Use this structure for the final output:

```markdown
## Feature Impact Analysis: [Feature Name]

### System Architecture
[ASCII diagram of repos and their relationships]

### Impact Summary

| Repository | Impact | Changes | Effort | Risk |
|-----------|--------|---------|--------|------|
| repo-name | HIGH/MED/LOW/NONE | Brief description | T-shirt size | HIGH/MED/LOW |

### Detailed Analysis

#### [repo-name] — [IMPACT LEVEL]
**Role:** What this repo does
**Current State:** Relevant current functionality
**Changes Needed:**
- Change 1 (file/endpoint affected)
- Change 2
**New Dependencies:** list or "None"
**Risks:** list or "None"
**Effort:** T-shirt size with justification

[Repeat for each repo]

### Architecture Decisions
1. Decision 1 — options and recommendation
2. Decision 2 — options and recommendation

### Recommended Implementation Order
1. First repo to change (and why)
2. Second repo
3. ...

### Total Effort Estimate
- Development: X days
- Testing: X days
- Total: X days
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Can't find related repos | Try broader search terms; check dependency files for cross-repo references; ask user for the org/owner name |
| Repo access denied | Verify the user has read access to all repos; check GitHub token permissions |
| Too many repos returned | Filter by naming convention, topic, or ask user which repos belong to the project |
| Feature scope unclear | Ask the user clarifying questions before starting analysis |
| Large repo, can't read all files | Focus on entry points, route definitions, and dependency manifests first |

## References

- [GitHub MCP Server tools](references/github-mcp-tools.md) — Available GitHub MCP tools and their usage
- [Impact Analysis Workflow](references/workflow.md) — Detailed workflow steps and examples
```
