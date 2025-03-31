import { Octokit } from '@octokit/rest';
import { McpError, ErrorCode } from '@modelcontextprotocol/sdk/types.js';

/**
 * GitHub API client wrapper
 */
export class GitHubApi {
  private octokit: Octokit;
  private baseUrl?: string;

  /**
   * Create a new GitHub API client
   * @param token GitHub Personal Access Token
   * @param baseUrl Optional base URL for GitHub Enterprise
   */
  constructor(token: string, baseUrl?: string) {
    if (!token) {
      throw new McpError(
        ErrorCode.ConfigurationError,
        'GitHub Personal Access Token is required'
      );
    }

    this.baseUrl = baseUrl;
    this.octokit = new Octokit({
      auth: token,
      ...(baseUrl ? { baseUrl } : {}),
    });
  }

  /**
   * Get the Octokit instance
   */
  getOctokit(): Octokit {
    return this.octokit;
  }

  /**
   * Check if a branch exists in a repository
   */
  async branchExists(owner: string, repo: string, branch: string): Promise<boolean> {
    try {
      await this.octokit.git.getRef({
        owner,
        repo,
        ref: `heads/${branch}`,
      });
      return true;
    } catch (error: any) {
      if (error.status === 404) {
        return false;
      }
      throw this.handleApiError(error);
    }
  }

  /**
   * Create a new branch in a repository
   */
  async createBranch(
    owner: string,
    repo: string,
    branch: string,
    fromBranch?: string
  ): Promise<any> {
    try {
      // Get the SHA of the latest commit on the default branch
      const defaultBranch = fromBranch || (await this.getDefaultBranch(owner, repo));
      const { data: refData } = await this.octokit.git.getRef({
        owner,
        repo,
        ref: `heads/${defaultBranch}`,
      });

      // Create a new branch from the default branch
      const { data } = await this.octokit.git.createRef({
        owner,
        repo,
        ref: `refs/heads/${branch}`,
        sha: refData.object.sha,
      });

      return data;
    } catch (error: any) {
      throw this.handleApiError(error);
    }
  }

  /**
   * Get the default branch of a repository
   */
  async getDefaultBranch(owner: string, repo: string): Promise<string> {
    try {
      const { data } = await this.octokit.repos.get({
        owner,
        repo,
      });
      return data.default_branch;
    } catch (error: any) {
      throw this.handleApiError(error);
    }
  }

  /**
   * Handle GitHub API errors
   */
  handleApiError(error: any): Error {
    if (error instanceof McpError) {
      return error;
    }

    const status = error.status || 500;
    const message = error.message || 'Unknown GitHub API error';
    const response = error.response?.data?.message || '';

    // Map HTTP status codes to MCP error codes
    let errorCode: ErrorCode;
    switch (status) {
      case 400:
        errorCode = ErrorCode.InvalidParams;
        break;
      case 401:
        errorCode = ErrorCode.Unauthorized;
        break;
      case 403:
        errorCode = ErrorCode.Forbidden;
        break;
      case 404:
        errorCode = ErrorCode.NotFound;
        break;
      case 422:
        errorCode = ErrorCode.InvalidParams;
        break;
      default:
        errorCode = ErrorCode.InternalError;
    }

    return new McpError(
      errorCode,
      `GitHub API Error: ${message}${response ? ` - ${response}` : ''}`
    );
  }
}

// Create a singleton instance
let githubApiInstance: GitHubApi | null = null;

/**
 * Get the GitHub API instance
 */
export function getGitHubApi(): GitHubApi {
  if (!githubApiInstance) {
    const token = process.env.GITHUB_PERSONAL_ACCESS_TOKEN;
    const baseUrl = process.env.GITHUB_API_URL;
    
    if (!token) {
      throw new McpError(
        ErrorCode.ConfigurationError,
        'GITHUB_PERSONAL_ACCESS_TOKEN environment variable is required'
      );
    }
    
    githubApiInstance = new GitHubApi(token, baseUrl);
  }
  
  return githubApiInstance;
}
