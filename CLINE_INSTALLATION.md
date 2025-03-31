# Installing GitHub Enterprise MCP Server in Cline

This guide will help you install and configure the GitHub Enterprise MCP server in Cline, enabling you to use GitHub API functionality directly through Cline.

## Prerequisites

1. Node.js installed on your system
2. A GitHub Personal Access Token with appropriate permissions
3. Cline installed on your system

## Installation Steps

### 1. Clone the Repository

```bash
git clone https://github.com/piyushgIITian/github-enterprice-mcp.git
cd github-enterprise-mcp
```

### 2. Install Dependencies and Build

```bash
npm install
npm run build
```

This will create a `dist` directory with the compiled JavaScript files.

### 3. Create a GitHub Personal Access Token

1. Go to [GitHub Personal Access Tokens](https://github.com/settings/tokens) (in GitHub Settings > Developer settings)
2. Click "Generate new token"
3. Select which repositories you'd like this token to have access to (Public, All, or Select)
4. Create a token with the `repo` scope ("Full control of private repositories")
   - Alternatively, if working only with public repositories, select only the `public_repo` scope
5. Copy the generated token

### 4. Configure Cline MCP Settings

#### For Cline VS Code Extension

1. Open VS Code
2. Locate the Cline MCP settings file at:
   - Windows: `%APPDATA%\Code\User\globalStorage\saoudrizwan.claude-dev\settings\cline_mcp_settings.json`
   - macOS: `~/Library/Application Support/Code/User/globalStorage/saoudrizwan.claude-dev/settings/cline_mcp_settings.json`
   - Linux: `~/.config/Code/User/globalStorage/saoudrizwan.claude-dev/settings/cline_mcp_settings.json`

3. Add the GitHub Enterprise MCP server configuration to the `mcpServers` object:

```json
{
  "mcpServers": {
    "github-enterprise": {
      "command": "node",
      "args": [
        "/absolute/path/to/github-enterprise-mcp/dist/index.js"
      ],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "your-personal-access-token",
        "GITHUB_API_URL": "https://api.github.com" // For GitHub.com
        // For GitHub Enterprise, use your instance URL, e.g., "https://github.yourdomain.com/api/v3"
      },
      "disabled": false,
      "autoApprove": []
    }
  }
}
```

Replace `/absolute/path/to/github-enterprise-mcp/dist/index.js` with the absolute path to the built index.js file.

#### For Claude Desktop App

1. Locate the Claude Desktop configuration file at:
   - Windows: `%APPDATA%\Claude\claude_desktop_config.json`
   - macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
   - Linux: `~/.config/Claude/claude_desktop_config.json`

2. Add the GitHub Enterprise MCP server configuration to the `mcpServers` object:

```json
{
  "mcpServers": {
    "github-enterprise": {
      "command": "node",
      "args": [
        "/absolute/path/to/github-enterprise-mcp/dist/index.js"
      ],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "your-personal-access-token",
        "GITHUB_API_URL": "https://api.github.com" // For GitHub.com
        // For GitHub Enterprise, use your instance URL, e.g., "https://github.yourdomain.com/api/v3"
      },
      "disabled": false,
      "autoApprove": []
    }
  }
}
```

### 5. Restart Cline

After configuring the MCP settings, restart Cline (VS Code or Claude Desktop) to apply the changes.

## Verification

To verify that the GitHub Enterprise MCP server is properly installed and configured, you can ask Cline to use one of the GitHub tools:

```
Can you search for repositories with the keyword "react" using the GitHub Enterprise MCP server?
```

Cline should be able to use the `search_repositories` tool to search for repositories with the keyword "react".

## Available Tools

The GitHub Enterprise MCP server provides a wide range of tools for interacting with GitHub, including:

- Repository management (create, update, delete)
- File operations (create, update, get contents)
- Issue and pull request management
- Code, issue, and user search
- Branch management
- And more

For a complete list of available tools and their usage, refer to the [README.md](./README.md) file.

## Troubleshooting

If you encounter issues with the GitHub Enterprise MCP server:

1. Check that the path to the index.js file is correct in your MCP settings
2. Verify that your GitHub Personal Access Token has the necessary permissions
3. Ensure that the GitHub API URL is correct for your GitHub instance
4. Check the logs for any error messages

## Additional Configuration Options

### GitHub API Version

You can specify a GitHub API version by adding the `GITHUB_API_VERSION` environment variable:

```json
"env": {
  "GITHUB_PERSONAL_ACCESS_TOKEN": "your-personal-access-token",
  "GITHUB_API_URL": "https://api.github.com",
  "GITHUB_API_VERSION": "2022-11-28"
}
```

### Enterprise Authentication

For GitHub Enterprise instances that use different authentication methods, you may need to provide additional configuration. Refer to the [Octokit documentation](https://github.com/octokit/rest.js) for more information.
