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

    #### g. Change Summary by Repository
    For each repository where changes have been made, document:
    - **Repository name and path**
    - **Files modified** — list of files changed with brief description of each change
    - **Type of changes** — new features, bug fixes, refactoring, configuration updates
    - **Commit summary** — what was done and why

    #### h. Cross-Repository Dependencies
    Identify and document dependencies between repositories:
    - **Upstream dependencies** — which repos this repo depends on
    - **Downstream dependencies** — which repos depend on this repo
    - **Impact propagation** — if changes in one repo require updates in dependent repos
    - **Dependency version requirements** — specific versions needed for compatibility
    - **Breaking changes** — flag any changes that may break dependent repositories

### Phase 6: Automated Report Generation

Execute these scripts to automatically generate Change Summary and Dependency reports:

#### Script 1: Generate Change Summary by Repository

```bash
#!/bin/bash
# Generate Change Summary Report from git history

echo "## 📝 Change Summary by Repository"
echo ""
echo "| Repository | Files Changed | Last Commit | Author |"
echo "|-----------|---------------|-------------|--------|"

for proj in $(jq -r '.projects[].name' projects.json); do
  if [ -d "$proj" ]; then
    cd "$proj"
    
    # Get last commit info
    LAST_COMMIT=$(git log -1 --pretty=format:"%s" 2>/dev/null || echo "No commits")
    AUTHOR=$(git log -1 --pretty=format:"%an" 2>/dev/null || echo "N/A")
    FILES_CHANGED=$(git diff --name-only HEAD~1 2>/dev/null | wc -l || echo "0")
    
    echo "| $proj | $FILES_CHANGED | $LAST_COMMIT | $AUTHOR |"
    cd ..
  fi
done

echo ""
echo "### Detailed Changes per Repository"
echo ""

for proj in $(jq -r '.projects[].name' projects.json); do
  if [ -d "$proj" ]; then
    cd "$proj"
    
    echo "#### $proj"
    echo "**Recent Commits:**"
    git log --oneline -5 2>/dev/null | while read line; do
      echo "- $line"
    done
    
    echo ""
    echo "**Files Modified (last commit):**"
    git diff --name-only HEAD~1 2>/dev/null | while read file; do
      echo "- \`$file\`"
    done
    
    echo ""
    cd ..
  fi
done
```

#### Script 2: Generate Cross-Repository Dependencies Report

```bash
#!/bin/bash
# Generate Cross-Repository Dependencies Report

echo "## 🔗 Cross-Repository Dependencies"
echo ""
echo "| Repository | Depends On | Depended By | Version |"
echo "|-----------|------------|-------------|---------|"

# Build dependency map from projects.json
PROJECTS=$(jq -r '.projects[].name' projects.json)

for proj in $PROJECTS; do
  # Get direct dependencies from projects.json
  DEPS=$(jq -r --arg p "$proj" '.projects[] | select(.name==$p) | .dependencies | join(", ")' projects.json)
  [ -z "$DEPS" ] && DEPS="None (base)"
  
  # Find who depends on this project
  DEPENDED_BY=$(jq -r --arg p "$proj" '.projects[] | select(.dependencies | index($p)) | .name' projects.json | tr '\n' ', ' | sed 's/,$//')
  [ -z "$DEPENDED_BY" ] && DEPENDED_BY="None"
  
  # Get version from pyproject.toml if exists
  VERSION="1.0.0"
  if [ -f "$proj/pyproject.toml" ]; then
    VERSION=$(grep -E "^version\s*=" "$proj/pyproject.toml" | head -1 | sed 's/.*"\(.*\)".*/\1/' || echo "1.0.0")
  fi
  
  echo "| $proj | $DEPS | $DEPENDED_BY | $VERSION |"
done

echo ""
echo "### Dependency Chain Visualization"
echo ""
echo "\`\`\`"

# Generate ASCII dependency tree
jq -r '.projects[] | "\(.name): \(.dependencies | join(" → "))"' projects.json | while read line; do
  NAME=$(echo "$line" | cut -d: -f1)
  DEPS=$(echo "$line" | cut -d: -f2 | xargs)
  if [ -z "$DEPS" ]; then
    echo "$NAME (base project)"
  else
    echo "$NAME ← $DEPS"
  fi
done

echo "\`\`\`"
echo ""
echo "### Impact Propagation Notes"
echo ""

for proj in $PROJECTS; do
  DEPENDED_BY=$(jq -r --arg p "$proj" '.projects[] | select(.dependencies | index($p)) | .name' projects.json | tr '\n' ', ' | sed 's/,$//')
  if [ -n "$DEPENDED_BY" ]; then
    echo "- ⚠️ Changes to **$proj** will impact: $DEPENDED_BY"
  fi
done
```

#### Script 3: Combined Report Generator (Full Execution)

```bash
#!/bin/bash
# Combined script to generate full impact report

echo "# 📊 Multi-Repository Impact Report"
echo "Generated: $(date)"
echo ""

# Read projects.json config
OWNER=$(jq -r '.github_owner' projects.json)
echo "**Organization:** $OWNER"
echo ""

# === SECTION: Change Summary ===
echo "---"
echo "## 📝 Change Summary by Repository"
echo ""
echo "| Repository | Files Changed | Change Type | Last Commit |"
echo "|-----------|---------------|-------------|-------------|"

for proj in $(jq -r '.projects[].name' projects.json); do
  if [ -d "$proj" ]; then
    cd "$proj"
    FILES=$(git diff --name-only HEAD~1 2>/dev/null | wc -l || echo "0")
    COMMIT=$(git log -1 --pretty=format:"%s" 2>/dev/null | head -c 50 || echo "N/A")
    
    # Detect change type from commit message
    if echo "$COMMIT" | grep -qi "feat"; then
      TYPE="Feature"
    elif echo "$COMMIT" | grep -qi "fix"; then
      TYPE="Bugfix"
    elif echo "$COMMIT" | grep -qi "refactor"; then
      TYPE="Refactor"
    else
      TYPE="Update"
    fi
    
    echo "| $proj | $FILES | $TYPE | $COMMIT |"
    cd ..
  fi
done

echo ""

# === SECTION: Cross-Repository Dependencies ===
echo "---"
echo "## 🔗 Cross-Repository Dependencies"
echo ""
echo "| Repository | Depends On | Depended By | Breaking Changes |"
echo "|-----------|------------|-------------|------------------|"

for proj in $(jq -r '.projects[].name' projects.json); do
  DEPS=$(jq -r --arg p "$proj" '.projects[] | select(.name==$p) | .dependencies | join(", ")' projects.json)
  [ -z "$DEPS" ] && DEPS="None"
  
  DEPENDED_BY=$(jq -r --arg p "$proj" '.projects[] | select(.dependencies | index($p)) | .name' projects.json | tr '\n' ', ' | sed 's/,$//')
  [ -z "$DEPENDED_BY" ] && DEPENDED_BY="None"
  
  echo "| $proj | $DEPS | $DEPENDED_BY | No |"
done

echo ""
echo "### Dependency Notes"
for proj in $(jq -r '.projects[].name' projects.json); do
  DEPENDED_BY=$(jq -r --arg p "$proj" '.projects[] | select(.dependencies | index($p)) | .name' projects.json | tr '\n' ', ' | sed 's/,$//')
  if [ -n "$DEPENDED_BY" ]; then
    echo "- **$proj** is required by: $DEPENDED_BY"
  fi
done

echo ""
echo "✅ Report generation complete!"
```

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

### Change Summary by Repository

| Repository | Files Changed | Change Type | Description |
|-----------|---------------|-------------|-------------|
| repo-name | file1.ts, file2.ts | Feature/Bugfix/Refactor | Brief description of changes |

#### [repo-name]
**Files Modified:**
- `path/to/file.ts` — Description of change
- `path/to/another-file.ts` — Description of change

**Change Summary:** Detailed summary of what was done and why

### Cross-Repository Dependencies

| Repository | Depends On | Depended By | Breaking Changes |
|-----------|------------|-------------|------------------|
| repo-name | repo-a, repo-b | repo-c | Yes/No |

**Dependency Notes:**
- [repo-name] requires [dependency-repo] version X.X.X or higher
- Changes in [repo-a] will require updates in [repo-b] and [repo-c]
- [Breaking change description if any]

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
