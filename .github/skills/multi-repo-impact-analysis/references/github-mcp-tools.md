# GitHub MCP Tools Reference

Quick reference for the GitHub MCP server tools used by this skill.

## Discovery Tools

| Tool | Purpose | Key Parameters |
|------|---------|---------------|
| `mcp_github_get_me` | Get authenticated user info | None |
| `mcp_github_search_repositories` | Find repos by keyword | `query`, `minimal_output` |
| `mcp_github_list_branches` | List branches for a repo | `owner`, `repo` |

## File Reading Tools

| Tool | Purpose | Key Parameters |
|------|---------|---------------|
| `mcp_github_get_file_contents` | Read file or list directory | `owner`, `repo`, `path` |

## Issue and PR Tools (for tracking)

| Tool | Purpose | Key Parameters |
|------|---------|---------------|
| `mcp_github_search_issues` | Search issues across repos | `query` |
| `mcp_github_list_issues` | List issues for a repo | `owner`, `repo`, `state` |
| `mcp_github_create_issue` | Create tracking issue | `owner`, `repo`, `title`, `body` |

## Usage Patterns

### Finding related repos
```
mcp_github_search_repositories(query="<keyword> user:<owner>")
```

### Reading repo structure
```
mcp_github_get_file_contents(owner="<owner>", repo="<repo>", path="")
```

### Reading a specific file
```
mcp_github_get_file_contents(owner="<owner>", repo="<repo>", path="src/index.js")
```

### Searching for code patterns
```
mcp_github_search_code(query="<pattern> repo:<owner>/<repo>")
```
