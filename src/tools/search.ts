import { getGitHubApi } from '../utils/github-api.js';
import { tryCatchAsync } from '../utils/error-handling.js';
import { McpError, ErrorCode } from '@modelcontextprotocol/sdk/types.js';
import {
  SearchCodeSchema,
  SearchIssuesSchema,
  SearchUsersSchema,
} from '../utils/validation.js';

/**
 * Search for code across GitHub repositories
 */
export async function searchCode(args: unknown): Promise<any> {
  const { q, order, page, per_page } = SearchCodeSchema.parse(args);
  const github = getGitHubApi();

  return tryCatchAsync(async () => {
    const { data } = await github.getOctokit().search.code({
      q,
      order,
      page,
      per_page,
    });

    return {
      total_count: data.total_count,
      incomplete_results: data.incomplete_results,
      items: data.items.map((item) => ({
        name: item.name,
        path: item.path,
        sha: item.sha,
        url: item.html_url,
        repository: item.repository ? {
          name: item.repository.name,
          full_name: item.repository.full_name,
          owner: {
            login: item.repository.owner.login,
          },
        } : null,
        score: item.score,
      })),
    };
  }, 'Failed to search code');
}

/**
 * Search for issues and pull requests across GitHub repositories
 */
export async function searchIssues(args: unknown): Promise<any> {
  const { q, sort, order, page, per_page } = SearchIssuesSchema.parse(args);
  const github = getGitHubApi();

  return tryCatchAsync(async () => {
    const { data } = await github.getOctokit().search.issuesAndPullRequests({
      q,
      sort: sort as any,
      order,
      page,
      per_page,
    });

    return {
      total_count: data.total_count,
      incomplete_results: data.incomplete_results,
      items: data.items.map((item) => ({
        id: item.id,
        number: item.number,
        title: item.title,
        state: item.state,
        locked: item.locked,
        repository: item.repository ? {
          name: item.repository.name,
          full_name: item.repository.full_name,
          owner: {
            login: item.repository.owner.login,
          },
        } : null,
        user: item.user ? {
          login: item.user.login,
          id: item.user.id,
        } : null,
        labels: item.labels?.map((label) => 
          typeof label === 'string' ? label : {
            name: label.name,
            color: label.color,
          }
        ),
        comments: item.comments,
        created_at: item.created_at,
        updated_at: item.updated_at,
        closed_at: item.closed_at,
        body: item.body,
        url: item.html_url,
        pull_request: item.pull_request ? {
          url: item.pull_request.html_url,
        } : null,
        score: item.score,
      })),
    };
  }, 'Failed to search issues');
}

/**
 * Search for users on GitHub
 */
export async function searchUsers(args: unknown): Promise<any> {
  const { q, sort, order, page, per_page } = SearchUsersSchema.parse(args);
  const github = getGitHubApi();

  return tryCatchAsync(async () => {
    const { data } = await github.getOctokit().search.users({
      q,
      sort: sort as any,
      order,
      page,
      per_page,
    });

    return {
      total_count: data.total_count,
      incomplete_results: data.incomplete_results,
      items: data.items.map((user) => ({
        login: user.login,
        id: user.id,
        avatar_url: user.avatar_url,
        html_url: user.html_url,
        type: user.type,
        site_admin: user.site_admin,
        score: user.score,
      })),
    };
  }, 'Failed to search users');
}

/**
 * Get license information
 */
export async function getLicenseInfo(): Promise<any> {
  const github = getGitHubApi();

  return tryCatchAsync(async () => {
    const { data } = await github.getOctokit().licenses.getAllCommonlyUsed();

    return data.map((license) => ({
      key: license.key,
      name: license.name,
      spdx_id: license.spdx_id,
      url: license.url,
      node_id: license.node_id,
    }));
  }, 'Failed to get license information');
}

/**
 * Get GitHub Enterprise stats
 */
export async function getEnterpriseStats(): Promise<any> {
  const github = getGitHubApi();
  const baseUrl = process.env.GITHUB_API_URL;

  // This function is only available for GitHub Enterprise
  if (!baseUrl) {
    return {
      error: 'This function is only available for GitHub Enterprise',
    };
  }

  return tryCatchAsync(async () => {
    try {
      // Try to get enterprise stats
      const { data } = await github.getOctokit().request('GET /enterprise/stats/all');
      return data;
    } catch (error) {
      // If not available, return basic information
      return {
        message: 'Enterprise stats not available or insufficient permissions',
        api_url: baseUrl,
      };
    }
  }, 'Failed to get enterprise stats');
}
