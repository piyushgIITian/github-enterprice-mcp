import { getGitHubApi } from '../utils/github-api.js';
import { tryCatchAsync } from '../utils/error-handling.js';
import { McpError, ErrorCode } from '@modelcontextprotocol/sdk/types.js';
import {
  ListPullRequestsSchema,
  GetPullRequestSchema,
  CreatePullRequestSchema,
  CreatePullRequestReviewSchema,
  MergePullRequestSchema,
  GetPullRequestFilesSchema,
  GetPullRequestStatusSchema,
  UpdatePullRequestBranchSchema,
  GetPullRequestCommentsSchema,
  GetPullRequestReviewsSchema,
} from '../utils/validation.js';

/**
 * List pull requests in a GitHub repository
 */
export async function listPullRequests(args: unknown): Promise<any> {
  const { owner, repo, state, head, base, sort, direction, per_page, page } = ListPullRequestsSchema.parse(args);
  const github = getGitHubApi();

  return tryCatchAsync(async () => {
    const { data } = await github.getOctokit().pulls.list({
      owner,
      repo,
      state,
      head,
      base,
      sort,
      direction,
      per_page,
      page,
    });

    return data.map((pr) => ({
      id: pr.id,
      number: pr.number,
      title: pr.title,
      state: pr.state,
      locked: pr.locked,
      user: pr.user ? {
        login: pr.user.login,
        id: pr.user.id,
        type: pr.user.type,
      } : null,
      created_at: pr.created_at,
      updated_at: pr.updated_at,
      closed_at: pr.closed_at,
      merged_at: pr.merged_at,
      merge_commit_sha: pr.merge_commit_sha,
      draft: pr.draft,
      head: {
        ref: pr.head.ref,
        sha: pr.head.sha,
        repo: pr.head.repo ? {
          name: pr.head.repo.name,
          full_name: pr.head.repo.full_name,
          owner: {
            login: pr.head.repo.owner.login,
          },
        } : null,
      },
      base: {
        ref: pr.base.ref,
        sha: pr.base.sha,
        repo: pr.base.repo ? {
          name: pr.base.repo.name,
          full_name: pr.base.repo.full_name,
          owner: {
            login: pr.base.repo.owner.login,
          },
        } : null,
      },
      body: pr.body,
      url: pr.html_url,
    }));
  }, 'Failed to list pull requests');
}

/**
 * Get a specific pull request in a GitHub repository
 */
export async function getPullRequest(args: unknown): Promise<any> {
  const { owner, repo, pull_number } = GetPullRequestSchema.parse(args);
  const github = getGitHubApi();

  return tryCatchAsync(async () => {
    const { data } = await github.getOctokit().pulls.get({
      owner,
      repo,
      pull_number,
    });

    return {
      id: data.id,
      number: data.number,
      title: data.title,
      state: data.state,
      locked: data.locked,
      user: data.user ? {
        login: data.user.login,
        id: data.user.id,
        type: data.user.type,
      } : null,
      created_at: data.created_at,
      updated_at: data.updated_at,
      closed_at: data.closed_at,
      merged_at: data.merged_at,
      merge_commit_sha: data.merge_commit_sha,
      draft: data.draft,
      head: {
        ref: data.head.ref,
        sha: data.head.sha,
        repo: data.head.repo ? {
          name: data.head.repo.name,
          full_name: data.head.repo.full_name,
          owner: {
            login: data.head.repo.owner.login,
          },
        } : null,
      },
      base: {
        ref: data.base.ref,
        sha: data.base.sha,
        repo: data.base.repo ? {
          name: data.base.repo.name,
          full_name: data.base.repo.full_name,
          owner: {
            login: data.base.repo.owner.login,
          },
        } : null,
      },
      body: data.body,
      url: data.html_url,
      mergeable: data.mergeable,
      mergeable_state: data.mergeable_state,
      merged: data.merged,
      merged_by: data.merged_by ? {
        login: data.merged_by.login,
        id: data.merged_by.id,
      } : null,
      comments: data.comments,
      review_comments: data.review_comments,
      commits: data.commits,
      additions: data.additions,
      deletions: data.deletions,
      changed_files: data.changed_files,
    };
  }, 'Failed to get pull request');
}

/**
 * Create a new pull request in a GitHub repository
 */
export async function createPullRequest(args: unknown): Promise<any> {
  const { owner, repo, title, head, base, body, draft, maintainer_can_modify } = CreatePullRequestSchema.parse(args);
  const github = getGitHubApi();

  return tryCatchAsync(async () => {
    const { data } = await github.getOctokit().pulls.create({
      owner,
      repo,
      title,
      head,
      base,
      body,
      draft,
      maintainer_can_modify,
    });

    return {
      id: data.id,
      number: data.number,
      title: data.title,
      state: data.state,
      user: data.user ? {
        login: data.user.login,
        id: data.user.id,
      } : null,
      created_at: data.created_at,
      updated_at: data.updated_at,
      head: {
        ref: data.head.ref,
        sha: data.head.sha,
        repo: data.head.repo ? {
          name: data.head.repo.name,
          full_name: data.head.repo.full_name,
        } : null,
      },
      base: {
        ref: data.base.ref,
        sha: data.base.sha,
        repo: data.base.repo ? {
          name: data.base.repo.name,
          full_name: data.base.repo.full_name,
        } : null,
      },
      body: data.body,
      draft: data.draft,
      url: data.html_url,
    };
  }, 'Failed to create pull request');
}

/**
 * Create a review on a pull request
 */
export async function createPullRequestReview(args: unknown): Promise<any> {
  const { owner, repo, pull_number, body, event, commit_id, comments } = CreatePullRequestReviewSchema.parse(args);
  const github = getGitHubApi();

  return tryCatchAsync(async () => {
    const { data } = await github.getOctokit().pulls.createReview({
      owner,
      repo,
      pull_number,
      body,
      event,
      commit_id,
      comments,
    });

    return {
      id: data.id,
      user: data.user ? {
        login: data.user.login,
        id: data.user.id,
      } : null,
      body: data.body,
      state: data.state,
      commit_id: data.commit_id,
      submitted_at: data.submitted_at,
      url: data.html_url,
    };
  }, 'Failed to create pull request review');
}

/**
 * Merge a pull request
 */
export async function mergePullRequest(args: unknown): Promise<any> {
  const { owner, repo, pull_number, commit_title, commit_message, merge_method } = MergePullRequestSchema.parse(args);
  const github = getGitHubApi();

  return tryCatchAsync(async () => {
    const { data } = await github.getOctokit().pulls.merge({
      owner,
      repo,
      pull_number,
      commit_title,
      commit_message,
      merge_method,
    });

    return {
      merged: data.merged,
      message: data.message,
      sha: data.sha,
    };
  }, 'Failed to merge pull request');
}

/**
 * Get the list of files changed in a pull request
 */
export async function getPullRequestFiles(args: unknown): Promise<any> {
  const { owner, repo, pull_number } = GetPullRequestFilesSchema.parse(args);
  const github = getGitHubApi();

  return tryCatchAsync(async () => {
    const { data } = await github.getOctokit().pulls.listFiles({
      owner,
      repo,
      pull_number,
    });

    return data.map((file) => ({
      sha: file.sha,
      filename: file.filename,
      status: file.status,
      additions: file.additions,
      deletions: file.deletions,
      changes: file.changes,
      blob_url: file.blob_url,
      raw_url: file.raw_url,
      contents_url: file.contents_url,
      patch: file.patch,
    }));
  }, 'Failed to get pull request files');
}

/**
 * Get the combined status of all status checks for a pull request
 */
export async function getPullRequestStatus(args: unknown): Promise<any> {
  const { owner, repo, pull_number } = GetPullRequestStatusSchema.parse(args);
  const github = getGitHubApi();

  return tryCatchAsync(async () => {
    // First get the pull request to get the head SHA
    const { data: pr } = await github.getOctokit().pulls.get({
      owner,
      repo,
      pull_number,
    });

    // Then get the combined status for the head SHA
    const { data } = await github.getOctokit().repos.getCombinedStatusForRef({
      owner,
      repo,
      ref: pr.head.sha,
    });

    return {
      state: data.state,
      statuses: data.statuses.map((status) => ({
        context: status.context,
        state: status.state,
        description: status.description,
        target_url: status.target_url,
        created_at: status.created_at,
        updated_at: status.updated_at,
      })),
      sha: data.sha,
      total_count: data.total_count,
      repository: {
        name: data.repository.name,
        full_name: data.repository.full_name,
        owner: {
          login: data.repository.owner.login,
        },
      },
    };
  }, 'Failed to get pull request status');
}

/**
 * Update a pull request branch with the latest changes from the base branch
 */
export async function updatePullRequestBranch(args: unknown): Promise<any> {
  const { owner, repo, pull_number, expected_head_sha } = UpdatePullRequestBranchSchema.parse(args);
  const github = getGitHubApi();

  return tryCatchAsync(async () => {
    const { data } = await github.getOctokit().pulls.updateBranch({
      owner,
      repo,
      pull_number,
      expected_head_sha,
    });

    return {
      message: data.message,
      url: data.url,
    };
  }, 'Failed to update pull request branch');
}

/**
 * Get the review comments on a pull request
 */
export async function getPullRequestComments(args: unknown): Promise<any> {
  const { owner, repo, pull_number } = GetPullRequestCommentsSchema.parse(args);
  const github = getGitHubApi();

  return tryCatchAsync(async () => {
    const { data } = await github.getOctokit().pulls.listReviewComments({
      owner,
      repo,
      pull_number,
    });

    return data.map((comment) => ({
      id: comment.id,
      user: comment.user ? {
        login: comment.user.login,
        id: comment.user.id,
      } : null,
      body: comment.body,
      created_at: comment.created_at,
      updated_at: comment.updated_at,
      path: comment.path,
      position: comment.position,
      commit_id: comment.commit_id,
      url: comment.html_url,
    }));
  }, 'Failed to get pull request comments');
}

/**
 * Get the reviews on a pull request
 */
export async function getPullRequestReviews(args: unknown): Promise<any> {
  const { owner, repo, pull_number } = GetPullRequestReviewsSchema.parse(args);
  const github = getGitHubApi();

  return tryCatchAsync(async () => {
    const { data } = await github.getOctokit().pulls.listReviews({
      owner,
      repo,
      pull_number,
    });

    return data.map((review) => ({
      id: review.id,
      user: review.user ? {
        login: review.user.login,
        id: review.user.id,
      } : null,
      body: review.body,
      state: review.state,
      commit_id: review.commit_id,
      submitted_at: review.submitted_at,
      url: review.html_url,
    }));
  }, 'Failed to get pull request reviews');
}
