import { getGitHubApi } from '../utils/github-api.js';
import { tryCatchAsync } from '../utils/error-handling.js';
import { McpError, ErrorCode } from '@modelcontextprotocol/sdk/types.js';
import {
  ListIssuesSchema,
  GetIssueSchema,
  CreateIssueSchema,
  UpdateIssueSchema,
  AddIssueCommentSchema,
} from '../utils/validation.js';

/**
 * List issues in a GitHub repository
 */
export async function listIssues(args: unknown): Promise<any> {
  const { owner, repo, state, labels, sort, direction, since, page, per_page } = ListIssuesSchema.parse(args);
  const github = getGitHubApi();

  return tryCatchAsync(async () => {
    const { data } = await github.getOctokit().issues.listForRepo({
      owner,
      repo,
      state,
      labels: labels?.join(','),
      sort,
      direction,
      since,
      page,
      per_page,
    });

    return data.map((issue) => ({
      id: issue.id,
      number: issue.number,
      title: issue.title,
      state: issue.state,
      locked: issue.locked,
      assignees: issue.assignees?.map((assignee) => ({
        login: assignee.login,
        id: assignee.id,
        type: assignee.type,
      })),
      user: issue.user ? {
        login: issue.user.login,
        id: issue.user.id,
        type: issue.user.type,
      } : null,
      labels: issue.labels?.map((label) => 
        typeof label === 'string' ? label : {
          name: label.name,
          color: label.color,
          description: label.description,
        }
      ),
      milestone: issue.milestone ? {
        id: issue.milestone.id,
        number: issue.milestone.number,
        title: issue.milestone.title,
        description: issue.milestone.description,
        state: issue.milestone.state,
      } : null,
      comments: issue.comments,
      created_at: issue.created_at,
      updated_at: issue.updated_at,
      closed_at: issue.closed_at,
      body: issue.body,
      url: issue.html_url,
      pull_request: issue.pull_request ? {
        url: issue.pull_request.html_url,
      } : null,
    }));
  }, 'Failed to list issues');
}

/**
 * Get a specific issue in a GitHub repository
 */
export async function getIssue(args: unknown): Promise<any> {
  const { owner, repo, issue_number } = GetIssueSchema.parse(args);
  const github = getGitHubApi();

  return tryCatchAsync(async () => {
    const { data } = await github.getOctokit().issues.get({
      owner,
      repo,
      issue_number,
    });

    return {
      id: data.id,
      number: data.number,
      title: data.title,
      state: data.state,
      locked: data.locked,
      assignees: data.assignees?.map((assignee) => ({
        login: assignee.login,
        id: assignee.id,
        type: assignee.type,
      })),
      user: data.user ? {
        login: data.user.login,
        id: data.user.id,
        type: data.user.type,
      } : null,
      labels: data.labels?.map((label) => 
        typeof label === 'string' ? label : {
          name: label.name,
          color: label.color,
          description: label.description,
        }
      ),
      milestone: data.milestone ? {
        id: data.milestone.id,
        number: data.milestone.number,
        title: data.milestone.title,
        description: data.milestone.description,
        state: data.milestone.state,
      } : null,
      comments: data.comments,
      created_at: data.created_at,
      updated_at: data.updated_at,
      closed_at: data.closed_at,
      body: data.body,
      url: data.html_url,
      pull_request: data.pull_request ? {
        url: data.pull_request.html_url,
      } : null,
    };
  }, 'Failed to get issue');
}

/**
 * Create a new issue in a GitHub repository
 */
export async function createIssue(args: unknown): Promise<any> {
  const { owner, repo, title, body, assignees, milestone, labels } = CreateIssueSchema.parse(args);
  const github = getGitHubApi();

  return tryCatchAsync(async () => {
    const { data } = await github.getOctokit().issues.create({
      owner,
      repo,
      title,
      body,
      assignees,
      milestone,
      labels,
    });

    return {
      id: data.id,
      number: data.number,
      title: data.title,
      state: data.state,
      assignees: data.assignees?.map((assignee) => ({
        login: assignee.login,
        id: assignee.id,
      })),
      user: data.user ? {
        login: data.user.login,
        id: data.user.id,
      } : null,
      labels: data.labels?.map((label) => 
        typeof label === 'string' ? label : {
          name: label.name,
          color: label.color,
        }
      ),
      milestone: data.milestone ? {
        number: data.milestone.number,
        title: data.milestone.title,
      } : null,
      created_at: data.created_at,
      updated_at: data.updated_at,
      body: data.body,
      url: data.html_url,
    };
  }, 'Failed to create issue');
}

/**
 * Update an existing issue in a GitHub repository
 */
export async function updateIssue(args: unknown): Promise<any> {
  const { owner, repo, issue_number, title, body, assignees, milestone, labels, state } = UpdateIssueSchema.parse(args);
  const github = getGitHubApi();

  return tryCatchAsync(async () => {
    const { data } = await github.getOctokit().issues.update({
      owner,
      repo,
      issue_number,
      title,
      body,
      assignees,
      milestone,
      labels,
      state,
    });

    return {
      id: data.id,
      number: data.number,
      title: data.title,
      state: data.state,
      assignees: data.assignees?.map((assignee) => ({
        login: assignee.login,
        id: assignee.id,
      })),
      labels: data.labels?.map((label) => 
        typeof label === 'string' ? label : {
          name: label.name,
          color: label.color,
        }
      ),
      milestone: data.milestone ? {
        number: data.milestone.number,
        title: data.milestone.title,
      } : null,
      updated_at: data.updated_at,
      body: data.body,
      url: data.html_url,
    };
  }, 'Failed to update issue');
}

/**
 * Add a comment to an issue in a GitHub repository
 */
export async function addIssueComment(args: unknown): Promise<any> {
  const { owner, repo, issue_number, body } = AddIssueCommentSchema.parse(args);
  const github = getGitHubApi();

  return tryCatchAsync(async () => {
    const { data } = await github.getOctokit().issues.createComment({
      owner,
      repo,
      issue_number,
      body,
    });

    return {
      id: data.id,
      user: data.user ? {
        login: data.user.login,
        id: data.user.id,
      } : null,
      created_at: data.created_at,
      updated_at: data.updated_at,
      body: data.body,
      url: data.html_url,
    };
  }, 'Failed to add issue comment');
}

/**
 * Search for issues and pull requests across GitHub repositories
 */
export async function searchIssues(args: unknown): Promise<any> {
  const { q, sort, order, page, per_page } = args as { 
    q: string; 
    sort?: string; 
    order?: 'asc' | 'desc'; 
    page?: number; 
    per_page?: number;
  };
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
      })),
    };
  }, 'Failed to search issues');
}
