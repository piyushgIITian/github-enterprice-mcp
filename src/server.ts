import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  McpError,
  ErrorCode,
} from '@modelcontextprotocol/sdk/types.js';
import { validateEnvVariables } from './utils/error-handling.js';
import { safeJsonParse } from './utils/error-handling.js';

// Import all tools
import {
  searchRepositories,
  createRepository,
  updateRepository,
  deleteRepository,
  createBranch,
  listCommits,
  listWorkflows,
  listWorkflowRuns,
  triggerWorkflow,
} from './tools/repository.js';

import {
  createOrUpdateFile,
  pushFiles,
  getFileContents,
  forkRepository,
  getPullRequestFiles,
} from './tools/files.js';

import {
  listIssues,
  getIssue,
  createIssue,
  updateIssue,
  addIssueComment,
  searchIssues as searchIssuesAndPRs,
} from './tools/issues.js';

import {
  listPullRequests,
  getPullRequest,
  createPullRequest,
  createPullRequestReview,
  mergePullRequest,
  getPullRequestStatus,
  updatePullRequestBranch,
  getPullRequestComments,
  getPullRequestReviews,
} from './tools/pull-requests.js';

import {
  searchCode,
  searchIssues,
  searchUsers,
  getLicenseInfo,
  getEnterpriseStats,
} from './tools/search.js';

/**
 * GitHub Enterprise MCP Server
 */
export class GitHubEnterpriseServer {
  private server: Server;

  constructor() {
    // Validate required environment variables
    validateEnvVariables(['GITHUB_PERSONAL_ACCESS_TOKEN']);

    // Create MCP server
    this.server = new Server(
      {
        name: 'github-enterprise',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    // Set up request handlers
    this.setupRequestHandlers();

    // Set up error handler
    this.server.onerror = (error) => {
      console.error('[GitHub Enterprise MCP Server Error]', error);
    };
  }

  /**
   * Set up request handlers for the MCP server
   */
  private setupRequestHandlers(): void {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        // Repository tools
        {
          name: 'search-repositories',
          description: 'Search for GitHub repositories',
          inputSchema: {
            type: 'object',
            properties: {
              query: {
                type: 'string',
                description: 'Search query (see GitHub search syntax)',
              },
              page: {
                type: 'number',
                description: 'Page number for pagination (default: 1)',
              },
              perPage: {
                type: 'number',
                description: 'Number of results per page (default: 30, max: 100)',
              },
            },
            required: ['query'],
            additionalProperties: false,
          },
        },
        {
          name: 'create-repository',
          description: 'Create a new GitHub repository in your account',
          inputSchema: {
            type: 'object',
            properties: {
              name: {
                type: 'string',
                description: 'Repository name',
              },
              description: {
                type: 'string',
                description: 'Repository description',
              },
              private: {
                type: 'boolean',
                description: 'Whether the repository should be private',
              },
              autoInit: {
                type: 'boolean',
                description: 'Initialize with README.md',
              },
            },
            required: ['name'],
            additionalProperties: false,
          },
        },
        {
          name: 'update-repository',
          description: 'Update an existing GitHub repository',
          inputSchema: {
            type: 'object',
            properties: {
              owner: {
                type: 'string',
                description: 'Repository owner',
              },
              repo: {
                type: 'string',
                description: 'Repository name',
              },
              description: {
                type: 'string',
                description: 'New description',
              },
              private: {
                type: 'boolean',
                description: 'Change privacy setting',
              },
              default_branch: {
                type: 'string',
                description: 'Change default branch',
              },
              has_issues: {
                type: 'boolean',
                description: 'Enable/disable issues',
              },
              has_projects: {
                type: 'boolean',
                description: 'Enable/disable projects',
              },
              has_wiki: {
                type: 'boolean',
                description: 'Enable/disable wiki',
              },
              archived: {
                type: 'boolean',
                description: 'Archive/unarchive repository',
              },
            },
            required: ['owner', 'repo'],
            additionalProperties: false,
          },
        },
        {
          name: 'delete-repository',
          description: 'Delete a GitHub repository',
          inputSchema: {
            type: 'object',
            properties: {
              owner: {
                type: 'string',
                description: 'Repository owner',
              },
              repo: {
                type: 'string',
                description: 'Repository name',
              },
              confirm: {
                type: 'boolean',
                description: 'Confirmation for deletion (must be true)',
              },
            },
            required: ['owner', 'repo', 'confirm'],
            additionalProperties: false,
          },
        },
        {
          name: 'create-branch',
          description: 'Create a new branch in a GitHub repository',
          inputSchema: {
            type: 'object',
            properties: {
              owner: {
                type: 'string',
                description: 'Repository owner',
              },
              repo: {
                type: 'string',
                description: 'Repository name',
              },
              branch: {
                type: 'string',
                description: 'Name for the new branch',
              },
              from_branch: {
                type: 'string',
                description: 'Source branch to create from (defaults to the repository\'s default branch)',
              },
            },
            required: ['owner', 'repo', 'branch'],
            additionalProperties: false,
          },
        },
        {
          name: 'list-commits',
          description: 'Get list of commits of a branch in a GitHub repository',
          inputSchema: {
            type: 'object',
            properties: {
              owner: {
                type: 'string',
              },
              repo: {
                type: 'string',
              },
              sha: {
                type: 'string',
              },
              page: {
                type: 'number',
              },
              perPage: {
                type: 'number',
              },
            },
            required: ['owner', 'repo'],
            additionalProperties: false,
          },
        },
        {
          name: 'list-workflows',
          description: 'List workflows in a GitHub repository',
          inputSchema: {
            type: 'object',
            properties: {
              owner: {
                type: 'string',
                description: 'Repository owner',
              },
              repo: {
                type: 'string',
                description: 'Repository name',
              },
              page: {
                type: 'integer',
                description: 'Page number',
              },
              perPage: {
                type: 'integer',
                description: 'Items per page',
              },
            },
            required: ['owner', 'repo'],
            additionalProperties: false,
          },
        },
        {
          name: 'list-workflow-runs',
          description: 'List workflow runs in a GitHub repository',
          inputSchema: {
            type: 'object',
            properties: {
              owner: {
                type: 'string',
                description: 'Repository owner',
              },
              repo: {
                type: 'string',
                description: 'Repository name',
              },
              workflow_id: {
                type: ['string', 'number'],
                description: 'Workflow ID or file name',
              },
              branch: {
                type: 'string',
                description: 'Filter by branch name',
              },
              status: {
                type: 'string',
                enum: [
                  'completed',
                  'action_required',
                  'cancelled',
                  'failure',
                  'neutral',
                  'skipped',
                  'stale',
                  'success',
                  'timed_out',
                  'in_progress',
                  'queued',
                  'requested',
                  'waiting',
                ],
                description: 'Filter by run status',
              },
              page: {
                type: 'integer',
                description: 'Page number',
              },
              perPage: {
                type: 'integer',
                description: 'Items per page',
              },
            },
            required: ['owner', 'repo'],
            additionalProperties: false,
          },
        },
        {
          name: 'trigger-workflow',
          description: 'Trigger a workflow run in a GitHub repository',
          inputSchema: {
            type: 'object',
            properties: {
              owner: {
                type: 'string',
                description: 'Repository owner',
              },
              repo: {
                type: 'string',
                description: 'Repository name',
              },
              workflow_id: {
                type: ['string', 'number'],
                description: 'Workflow ID or file name',
              },
              ref: {
                type: 'string',
                description: 'Git reference (branch, tag, SHA)',
              },
              inputs: {
                type: 'object',
                description: 'Workflow inputs',
              },
            },
            required: ['owner', 'repo', 'workflow_id', 'ref'],
            additionalProperties: false,
          },
        },
        // File operations tools
        {
          name: 'create-or-update-file',
          description: 'Create or update a single file in a GitHub repository',
          inputSchema: {
            type: 'object',
            properties: {
              owner: {
                type: 'string',
                description: 'Repository owner (username or organization)',
              },
              repo: {
                type: 'string',
                description: 'Repository name',
              },
              path: {
                type: 'string',
                description: 'Path where to create/update the file',
              },
              content: {
                type: 'string',
                description: 'Content of the file',
              },
              message: {
                type: 'string',
                description: 'Commit message',
              },
              branch: {
                type: 'string',
                description: 'Branch to create/update the file in',
              },
              sha: {
                type: 'string',
                description: 'SHA of the file being replaced (required when updating existing files)',
              },
            },
            required: ['owner', 'repo', 'path', 'content', 'message', 'branch'],
            additionalProperties: false,
          },
        },
        {
          name: 'push-files',
          description: 'Push multiple files to a GitHub repository in a single commit',
          inputSchema: {
            type: 'object',
            properties: {
              owner: {
                type: 'string',
                description: 'Repository owner (username or organization)',
              },
              repo: {
                type: 'string',
                description: 'Repository name',
              },
              branch: {
                type: 'string',
                description: 'Branch to push to (e.g., \'main\' or \'master\')',
              },
              files: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    path: {
                      type: 'string',
                    },
                    content: {
                      type: 'string',
                    },
                  },
                  required: ['path', 'content'],
                  additionalProperties: false,
                },
                description: 'Array of files to push',
              },
              message: {
                type: 'string',
                description: 'Commit message',
              },
            },
            required: ['owner', 'repo', 'branch', 'files', 'message'],
            additionalProperties: false,
          },
        },
        {
          name: 'get-file-contents',
          description: 'Get the contents of a file or directory from a GitHub repository',
          inputSchema: {
            type: 'object',
            properties: {
              owner: {
                type: 'string',
                description: 'Repository owner (username or organization)',
              },
              repo: {
                type: 'string',
                description: 'Repository name',
              },
              path: {
                type: 'string',
                description: 'Path to the file or directory',
              },
              branch: {
                type: 'string',
                description: 'Branch to get contents from',
              },
            },
            required: ['owner', 'repo', 'path'],
            additionalProperties: false,
          },
        },
        {
          name: 'fork-repository',
          description: 'Fork a GitHub repository to your account or specified organization',
          inputSchema: {
            type: 'object',
            properties: {
              owner: {
                type: 'string',
                description: 'Repository owner (username or organization)',
              },
              repo: {
                type: 'string',
                description: 'Repository name',
              },
              organization: {
                type: 'string',
                description: 'Optional: organization to fork to (defaults to your personal account)',
              },
            },
            required: ['owner', 'repo'],
            additionalProperties: false,
          },
        },
        // Issue tools
        {
          name: 'list-issues',
          description: 'List and filter repository issues',
          inputSchema: {
            type: 'object',
            properties: {
              owner: {
                type: 'string',
              },
              repo: {
                type: 'string',
              },
              state: {
                type: 'string',
                enum: ['open', 'closed', 'all'],
              },
              labels: {
                type: 'array',
                items: {
                  type: 'string',
                },
              },
              sort: {
                type: 'string',
                enum: ['created', 'updated', 'comments'],
              },
              direction: {
                type: 'string',
                enum: ['asc', 'desc'],
              },
              since: {
                type: 'string',
              },
              page: {
                type: 'number',
              },
              per_page: {
                type: 'number',
              },
            },
            required: ['owner', 'repo'],
            additionalProperties: false,
          },
        },
        {
          name: 'get-issue',
          description: 'Get details of a specific issue in a GitHub repository.',
          inputSchema: {
            type: 'object',
            properties: {
              owner: {
                type: 'string',
              },
              repo: {
                type: 'string',
              },
              issue_number: {
                type: 'number',
              },
            },
            required: ['owner', 'repo', 'issue_number'],
            additionalProperties: false,
          },
        },
        {
          name: 'create-issue',
          description: 'Create a new issue in a GitHub repository',
          inputSchema: {
            type: 'object',
            properties: {
              owner: {
                type: 'string',
              },
              repo: {
                type: 'string',
              },
              title: {
                type: 'string',
              },
              body: {
                type: 'string',
              },
              assignees: {
                type: 'array',
                items: {
                  type: 'string',
                },
              },
              milestone: {
                type: 'number',
              },
              labels: {
                type: 'array',
                items: {
                  type: 'string',
                },
              },
            },
            required: ['owner', 'repo', 'title'],
            additionalProperties: false,
          },
        },
        {
          name: 'update-issue',
          description: 'Update an existing issue in a GitHub repository',
          inputSchema: {
            type: 'object',
            properties: {
              owner: {
                type: 'string',
              },
              repo: {
                type: 'string',
              },
              issue_number: {
                type: 'number',
              },
              title: {
                type: 'string',
              },
              body: {
                type: 'string',
              },
              assignees: {
                type: 'array',
                items: {
                  type: 'string',
                },
              },
              milestone: {
                type: 'number',
              },
              labels: {
                type: 'array',
                items: {
                  type: 'string',
                },
              },
              state: {
                type: 'string',
                enum: ['open', 'closed'],
              },
            },
            required: ['owner', 'repo', 'issue_number'],
            additionalProperties: false,
          },
        },
        {
          name: 'add-issue-comment',
          description: 'Add a comment to an existing issue',
          inputSchema: {
            type: 'object',
            properties: {
              owner: {
                type: 'string',
              },
              repo: {
                type: 'string',
              },
              issue_number: {
                type: 'number',
              },
              body: {
                type: 'string',
              },
            },
            required: ['owner', 'repo', 'issue_number', 'body'],
            additionalProperties: false,
          },
        },
        // Pull request tools
        {
          name: 'list-pull-requests',
          description: 'List and filter repository pull requests',
          inputSchema: {
            type: 'object',
            properties: {
              owner: {
                type: 'string',
                description: 'Repository owner (username or organization)',
              },
              repo: {
                type: 'string',
                description: 'Repository name',
              },
              state: {
                type: 'string',
                enum: ['open', 'closed', 'all'],
                description: 'State of the pull requests to return',
              },
              head: {
                type: 'string',
                description: 'Filter by head user or head organization and branch name',
              },
              base: {
                type: 'string',
                description: 'Filter by base branch name',
              },
              sort: {
                type: 'string',
                enum: ['created', 'updated', 'popularity', 'long-running'],
                description: 'What to sort results by',
              },
              direction: {
                type: 'string',
                enum: ['asc', 'desc'],
                description: 'The direction of the sort',
              },
              per_page: {
                type: 'number',
                description: 'Results per page (max 100)',
              },
              page: {
                type: 'number',
                description: 'Page number of the results',
              },
            },
            required: ['owner', 'repo'],
            additionalProperties: false,
          },
        },
        {
          name: 'get-pull-request',
          description: 'Get details of a specific pull request',
          inputSchema: {
            type: 'object',
            properties: {
              owner: {
                type: 'string',
                description: 'Repository owner (username or organization)',
              },
              repo: {
                type: 'string',
                description: 'Repository name',
              },
              pull_number: {
                type: 'number',
                description: 'Pull request number',
              },
            },
            required: ['owner', 'repo', 'pull_number'],
            additionalProperties: false,
          },
        },
        {
          name: 'create-pull-request',
          description: 'Create a new pull request in a GitHub repository',
          inputSchema: {
            type: 'object',
            properties: {
              owner: {
                type: 'string',
                description: 'Repository owner (username or organization)',
              },
              repo: {
                type: 'string',
                description: 'Repository name',
              },
              title: {
                type: 'string',
                description: 'Pull request title',
              },
              body: {
                type: 'string',
                description: 'Pull request body/description',
              },
              head: {
                type: 'string',
                description: 'The name of the branch where your changes are implemented',
              },
              base: {
                type: 'string',
                description: 'The name of the branch you want the changes pulled into',
              },
              draft: {
                type: 'boolean',
                description: 'Whether to create the pull request as a draft',
              },
              maintainer_can_modify: {
                type: 'boolean',
                description: 'Whether maintainers can modify the pull request',
              },
            },
            required: ['owner', 'repo', 'title', 'head', 'base'],
            additionalProperties: false,
          },
        },
        {
          name: 'create-pull-request-review',
          description: 'Create a review on a pull request',
          inputSchema: {
            type: 'object',
            properties: {
              owner: {
                type: 'string',
                description: 'Repository owner (username or organization)',
              },
              repo: {
                type: 'string',
                description: 'Repository name',
              },
              pull_number: {
                type: 'number',
                description: 'Pull request number',
              },
              commit_id: {
                type: 'string',
                description: 'The SHA of the commit that needs a review',
              },
              body: {
                type: 'string',
                description: 'The body text of the review',
              },
              event: {
                type: 'string',
                enum: ['APPROVE', 'REQUEST_CHANGES', 'COMMENT'],
                description: 'The review action to perform',
              },
              comments: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    path: {
                      type: 'string',
                      description: 'The relative path to the file being commented on',
                    },
                    position: {
                      type: 'number',
                      description: 'The position in the diff where you want to add a review comment',
                    },
                    body: {
                      type: 'string',
                      description: 'Text of the review comment',
                    },
                  },
                  required: ['path', 'position', 'body'],
                  additionalProperties: false,
                },
                description: 'Comments to post as part of the review',
              },
            },
            required: ['owner', 'repo', 'pull_number', 'body', 'event'],
            additionalProperties: false,
          },
        },
        {
          name: 'merge-pull-request',
          description: 'Merge a pull request',
          inputSchema: {
            type: 'object',
            properties: {
              owner: {
                type: 'string',
                description: 'Repository owner (username or organization)',
              },
              repo: {
                type: 'string',
                description: 'Repository name',
              },
              pull_number: {
                type: 'number',
                description: 'Pull request number',
              },
              commit_title: {
                type: 'string',
                description: 'Title for the automatic commit message',
              },
              commit_message: {
                type: 'string',
                description: 'Extra detail to append to automatic commit message',
              },
              merge_method: {
                type: 'string',
                enum: ['merge', 'squash', 'rebase'],
                description: 'Merge method to use',
              },
            },
            required: ['owner', 'repo', 'pull_number'],
            additionalProperties: false,
          },
        },
        {
          name: 'get-pull-request-files',
          description: 'Get the list of files changed in a pull request',
          inputSchema: {
            type: 'object',
            properties: {
              owner: {
                type: 'string',
                description: 'Repository owner (username or organization)',
              },
              repo: {
                type: 'string',
                description: 'Repository name',
              },
              pull_number: {
                type: 'number',
                description: 'Pull request number',
              },
            },
            required: ['owner', 'repo', 'pull_number'],
            additionalProperties: false,
          },
        },
        {
          name: 'get-pull-request-status',
          description: 'Get the combined status of all status checks for a pull request',
          inputSchema: {
            type: 'object',
            properties: {
              owner: {
                type: 'string',
                description: 'Repository owner (username or organization)',
              },
              repo: {
                type: 'string',
                description: 'Repository name',
              },
              pull_number: {
                type: 'number',
                description: 'Pull request number',
              },
            },
            required: ['owner', 'repo', 'pull_number'],
            additionalProperties: false,
          },
        },
        {
          name: 'update-pull-request-branch',
          description: 'Update a pull request branch with the latest changes from the base branch',
          inputSchema: {
            type: 'object',
            properties: {
              owner: {
                type: 'string',
                description: 'Repository owner (username or organization)',
              },
              repo: {
                type: 'string',
                description: 'Repository name',
              },
              pull_number: {
                type: 'number',
                description: 'Pull request number',
              },
              expected_head_sha: {
                type: 'string',
                description: 'The expected SHA of the pull request\'s HEAD ref',
              },
            },
            required: ['owner', 'repo', 'pull_number'],
            additionalProperties: false,
          },
        },
        {
          name: 'get-pull-request-comments',
          description: 'Get the review comments on a pull request',
          inputSchema: {
            type: 'object',
            properties: {
              owner: {
                type: 'string',
                description: 'Repository owner (username or organization)',
              },
              repo: {
                type: 'string',
                description: 'Repository name',
              },
              pull_number: {
                type: 'number',
                description: 'Pull request number',
              },
            },
            required: ['owner', 'repo', 'pull_number'],
            additionalProperties: false,
          },
        },
        {
          name: 'get-pull-request-reviews',
          description: 'Get the reviews on a pull request',
          inputSchema: {
            type: 'object',
            properties: {
              owner: {
                type: 'string',
                description: 'Repository owner (username or organization)',
              },
              repo: {
                type: 'string',
                description: 'Repository name',
              },
              pull_number: {
                type: 'number',
                description: 'Pull request number',
              },
            },
            required: ['owner', 'repo', 'pull_number'],
            additionalProperties: false,
          },
        },
        // Search tools
        {
          name: 'search-code',
          description: 'Search for code across GitHub repositories',
          inputSchema: {
            type: 'object',
            properties: {
              q: {
                type: 'string',
              },
              order: {
                type: 'string',
                enum: ['asc', 'desc'],
              },
              page: {
                type: 'number',
                minimum: 1,
              },
              per_page: {
                type: 'number',
                minimum: 1,
                maximum: 100,
              },
            },
            required: ['q'],
            additionalProperties: false,
          },
        },
        {
          name: 'search-issues',
          description: 'Search for issues and pull requests across GitHub repositories',
          inputSchema: {
            type: 'object',
            properties: {
              q: {
                type: 'string',
              },
              order: {
                type: 'string',
                enum: ['asc', 'desc'],
              },
              page: {
                type: 'number',
                minimum: 1,
              },
              per_page: {
                type: 'number',
                minimum: 1,
                maximum: 100,
              },
              sort: {
                type: 'string',
                enum: [
                  'comments',
                  'reactions',
                  'reactions-+1',
                  'reactions--1',
                  'reactions-smile',
                  'reactions-thinking_face',
                  'reactions-heart',
                  'reactions-tada',
                  'interactions',
                  'created',
                  'updated',
                ],
              },
            },
            required: ['q'],
            additionalProperties: false,
          },
        },
        {
          name: 'search-users',
          description: 'Search for users on GitHub',
          inputSchema: {
            type: 'object',
            properties: {
              q: {
                type: 'string',
              },
              order: {
                type: 'string',
                enum: ['asc', 'desc'],
              },
              page: {
                type: 'number',
                minimum: 1,
              },
              per_page: {
                type: 'number',
                minimum: 1,
                maximum: 100,
              },
              sort: {
                type: 'string',
                enum: ['followers', 'repositories', 'joined'],
              },
            },
            required: ['q'],
            additionalProperties: false,
          },
        },
        {
          name: 'get-license-info',
          description: 'Get information about commonly used licenses on GitHub',
          inputSchema: {
            type: 'object',
            properties: {},
            additionalProperties: false,
          },
        },
        {
          name: 'get-enterprise-stats',
          description: 'Get GitHub Enterprise statistics (only available for GitHub Enterprise)',
          inputSchema: {
            type: 'object',
            properties: {},
            additionalProperties: false,
          },
        },
      ],
    }));

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;
      let parsedArgs;

      try {
        // Parse arguments if they are provided as a string
        if (typeof args === 'string') {
          parsedArgs = safeJsonParse(args);
        } else {
          parsedArgs = args;
        }

        // Call the appropriate tool
        let result;
        switch (name) {
          // Repository tools
          case 'search-repositories':
            result = await searchRepositories(parsedArgs);
            break;
          case 'create-repository':
            result = await createRepository(parsedArgs);
            break;
          case 'update-repository':
            result = await updateRepository(parsedArgs);
            break;
          case 'delete-repository':
            result = await deleteRepository(parsedArgs);
            break;
          case 'create-branch':
            result = await createBranch(parsedArgs);
            break;
          case 'list-commits':
            result = await listCommits(parsedArgs);
            break;
          case 'list-workflows':
            result = await listWorkflows(parsedArgs);
            break;
          case 'list-workflow-runs':
            result = await listWorkflowRuns(parsedArgs);
            break;
          case 'trigger-workflow':
            result = await triggerWorkflow(parsedArgs);
            break;

          // File operations tools
          case 'create-or-update-file':
            result = await createOrUpdateFile(parsedArgs);
            break;
          case 'push-files':
            result = await pushFiles(parsedArgs);
            break;
          case 'get-file-contents':
            result = await getFileContents(parsedArgs);
            break;
          case 'fork-repository':
            result = await forkRepository(parsedArgs);
            break;
          case 'get-pull-request-files':
            result = await getPullRequestFiles(parsedArgs);
            break;

          // Issue tools
          case 'list-issues':
            result = await listIssues(parsedArgs);
            break;
          case 'get-issue':
            result = await getIssue(parsedArgs);
            break;
          case 'create-issue':
            result = await createIssue(parsedArgs);
            break;
          case 'update-issue':
            result = await updateIssue(parsedArgs);
            break;
          case 'add-issue-comment':
            result = await addIssueComment(parsedArgs);
            break;

          // Pull request tools
          case 'list-pull-requests':
            result = await listPullRequests(parsedArgs);
            break;
          case 'get-pull-request':
            result = await getPullRequest(parsedArgs);
            break;
          case 'create-pull-request':
            result = await createPullRequest(parsedArgs);
            break;
          case 'create-pull-request-review':
            result = await createPullRequestReview(parsedArgs);
            break;
          case 'merge-pull-request':
            result = await mergePullRequest(parsedArgs);
            break;
          case 'get-pull-request-status':
            result = await getPullRequestStatus(parsedArgs);
            break;
          case 'update-pull-request-branch':
            result = await updatePullRequestBranch(parsedArgs);
            break;
          case 'get-pull-request-comments':
            result = await getPullRequestComments(parsedArgs);
            break;
          case 'get-pull-request-reviews':
            result = await getPullRequestReviews(parsedArgs);
            break;

          // Search tools
          case 'search-code':
            result = await searchCode(parsedArgs);
            break;
          case 'search-issues':
            result = await searchIssues(parsedArgs);
            break;
          case 'search-users':
            result = await searchUsers(parsedArgs);
            break;
          case 'get-license-info':
            result = await getLicenseInfo();
            break;
          case 'get-enterprise-stats':
            result = await getEnterpriseStats();
            break;

          default:
            throw new McpError(
              ErrorCode.MethodNotFound,
              `Unknown tool: ${name}`
            );
        }

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error: any) {
        // Handle errors
        if (error instanceof McpError) {
          throw error;
        }

        // Convert other errors to MCP errors
        throw new McpError(
          ErrorCode.InternalError,
          `Error executing tool ${name}: ${error.message}`
        );
      }
    });
  }

  /**
   * Start the MCP server
   */
  async run(): Promise<void> {
    try {
      const transport = new StdioServerTransport();
      await this.server.connect(transport);
      console.error('GitHub Enterprise MCP server running on stdio');

      // Handle process termination
      process.on('SIGINT', async () => {
        await this.server.close();
        process.exit(0);
      });
    } catch (error: any) {
      console.error('Failed to start GitHub Enterprise MCP server:', error);
      process.exit(1);
    }
  }
}
