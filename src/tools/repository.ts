import { getGitHubApi } from '../utils/github-api.js';
import { tryCatchAsync } from '../utils/error-handling.js';
import {
  SearchRepositoriesSchema,
  CreateRepositorySchema,
  UpdateRepositorySchema,
  DeleteRepositorySchema,
  CreateBranchSchema,
  ListCommitsSchema,
  ListWorkflowsSchema,
  ListWorkflowRunsSchema,
  TriggerWorkflowSchema,
} from '../utils/validation.js';
import { McpError, ErrorCode } from '@modelcontextprotocol/sdk/types.js';

/**
 * Search for GitHub repositories
 */
export async function searchRepositories(args: unknown): Promise<any> {
  const { query, page, perPage } = SearchRepositoriesSchema.parse(args);
  const github = getGitHubApi();

  return tryCatchAsync(async () => {
    const { data } = await github.getOctokit().search.repos({
      q: query,
      page,
      per_page: perPage,
    });

    return {
      total_count: data.total_count,
      incomplete_results: data.incomplete_results,
      items: data.items.map((repo) => ({
        id: repo.id,
        name: repo.name,
        full_name: repo.full_name,
        owner: repo.owner ? {
          login: repo.owner.login,
          id: repo.owner.id,
          type: repo.owner.type,
        } : null,
        private: repo.private,
        description: repo.description,
        fork: repo.fork,
        created_at: repo.created_at,
        updated_at: repo.updated_at,
        pushed_at: repo.pushed_at,
        homepage: repo.homepage,
        size: repo.size,
        stargazers_count: repo.stargazers_count,
        watchers_count: repo.watchers_count,
        language: repo.language,
        forks_count: repo.forks_count,
        open_issues_count: repo.open_issues_count,
        default_branch: repo.default_branch,
        url: repo.html_url,
      })),
    };
  }, 'Failed to search repositories');
}

/**
 * Create a new GitHub repository
 */
export async function createRepository(args: unknown): Promise<any> {
  const { name, description, private: isPrivate, autoInit, org } = CreateRepositorySchema.parse(args);
  const github = getGitHubApi();

  return tryCatchAsync(async () => {
    let data;

    if (org) {
      // Create repository in an organization
      const response = await github.getOctokit().repos.createInOrg({
        org,
        name,
        description,
        private: isPrivate,
        auto_init: autoInit,
      });
      data = response.data;
    } else {
      // Create repository for the authenticated user
      const response = await github.getOctokit().repos.createForAuthenticatedUser({
        name,
        description,
        private: isPrivate,
        auto_init: autoInit,
      });
      data = response.data;
    }

    return {
      id: data.id,
      name: data.name,
      full_name: data.full_name,
      private: data.private,
      description: data.description,
      html_url: data.html_url,
      clone_url: data.clone_url,
      ssh_url: data.ssh_url,
      created_at: data.created_at,
      updated_at: data.updated_at,
      default_branch: data.default_branch,
    };
  }, 'Failed to create repository');
}

/**
 * Update an existing GitHub repository
 */
export async function updateRepository(args: unknown): Promise<any> {
  const {
    owner,
    repo,
    description,
    private: isPrivate,
    default_branch,
    has_issues,
    has_projects,
    has_wiki,
    archived,
  } = UpdateRepositorySchema.parse(args);
  const github = getGitHubApi();

  return tryCatchAsync(async () => {
    const { data } = await github.getOctokit().repos.update({
      owner,
      repo,
      description,
      private: isPrivate,
      default_branch,
      has_issues,
      has_projects,
      has_wiki,
      archived,
    });

    return {
      id: data.id,
      name: data.name,
      full_name: data.full_name,
      private: data.private,
      description: data.description,
      html_url: data.html_url,
      default_branch: data.default_branch,
      has_issues: data.has_issues,
      has_projects: data.has_projects,
      has_wiki: data.has_wiki,
      archived: data.archived,
      updated_at: data.updated_at,
    };
  }, 'Failed to update repository');
}

/**
 * Delete a GitHub repository
 */
export async function deleteRepository(args: unknown): Promise<any> {
  const { owner, repo, confirm } = DeleteRepositorySchema.parse(args);
  
  if (!confirm) {
    throw new McpError(
      ErrorCode.InvalidParams,
      'You must confirm deletion by setting confirm to true'
    );
  }
  
  const github = getGitHubApi();

  return tryCatchAsync(async () => {
    await github.getOctokit().repos.delete({
      owner,
      repo,
    });

    return {
      success: true,
      message: `Repository ${owner}/${repo} has been deleted`,
    };
  }, 'Failed to delete repository');
}

/**
 * Create a new branch in a GitHub repository
 */
export async function createBranch(args: unknown): Promise<any> {
  const { owner, repo, branch, from_branch } = CreateBranchSchema.parse(args);
  const github = getGitHubApi();

  return tryCatchAsync(async () => {
    // Check if branch already exists
    try {
      await github.getOctokit().git.getRef({
        owner,
        repo,
        ref: `heads/${branch}`,
      });
      
      return {
        success: false,
        message: `Branch '${branch}' already exists in ${owner}/${repo}`,
      };
    } catch (error: any) {
      // If error is not 404 (not found), rethrow it
      if (error.status !== 404) {
        throw error;
      }
    }

    // Get the SHA of the latest commit on the source branch
    const sourceBranch = from_branch || await github.getDefaultBranch(owner, repo);
    const { data: refData } = await github.getOctokit().git.getRef({
      owner,
      repo,
      ref: `heads/${sourceBranch}`,
    });

    // Create a new branch from the source branch
    const { data } = await github.getOctokit().git.createRef({
      owner,
      repo,
      ref: `refs/heads/${branch}`,
      sha: refData.object.sha,
    });

    return {
      success: true,
      ref: data.ref,
      url: data.url,
      object: {
        sha: data.object.sha,
        type: data.object.type,
        url: data.object.url,
      },
      message: `Branch '${branch}' created from '${sourceBranch}' in ${owner}/${repo}`,
    };
  }, 'Failed to create branch');
}

/**
 * List commits in a GitHub repository
 */
export async function listCommits(args: unknown): Promise<any> {
  const { owner, repo, sha, page, perPage } = ListCommitsSchema.parse(args);
  const github = getGitHubApi();

  return tryCatchAsync(async () => {
    const { data } = await github.getOctokit().repos.listCommits({
      owner,
      repo,
      sha,
      page,
      per_page: perPage,
    });

    return data.map((commit) => ({
      sha: commit.sha,
      commit: {
        author: commit.commit.author,
        committer: commit.commit.committer,
        message: commit.commit.message,
      },
      author: commit.author ? {
        login: commit.author.login,
        id: commit.author.id,
        type: commit.author.type,
      } : null,
      committer: commit.committer ? {
        login: commit.committer.login,
        id: commit.committer.id,
        type: commit.committer.type,
      } : null,
      html_url: commit.html_url,
    }));
  }, 'Failed to list commits');
}

/**
 * List workflows in a GitHub repository
 */
export async function listWorkflows(args: unknown): Promise<any> {
  const { owner, repo, page, perPage } = ListWorkflowsSchema.parse(args);
  const github = getGitHubApi();

  return tryCatchAsync(async () => {
    const { data } = await github.getOctokit().actions.listRepoWorkflows({
      owner,
      repo,
      page,
      per_page: perPage,
    });

    return {
      total_count: data.total_count,
      workflows: data.workflows.map((workflow) => ({
        id: workflow.id,
        name: workflow.name,
        path: workflow.path,
        state: workflow.state,
        created_at: workflow.created_at,
        updated_at: workflow.updated_at,
        url: workflow.html_url,
      })),
    };
  }, 'Failed to list workflows');
}

/**
 * List workflow runs in a GitHub repository
 */
export async function listWorkflowRuns(args: unknown): Promise<any> {
  const { owner, repo, workflow_id, branch, status, page, perPage } = ListWorkflowRunsSchema.parse(args);
  const github = getGitHubApi();

  return tryCatchAsync(async () => {
    let data;

    if (workflow_id) {
      // List runs for a specific workflow
      const response = await github.getOctokit().actions.listWorkflowRuns({
        owner,
        repo,
        workflow_id,
        branch,
        status: status as any,
        page,
        per_page: perPage,
      });
      data = response.data;
    } else {
      // List all workflow runs
      const response = await github.getOctokit().actions.listWorkflowRunsForRepo({
        owner,
        repo,
        branch,
        status: status as any,
        page,
        per_page: perPage,
      });
      data = response.data;
    }

    return {
      total_count: data.total_count,
      workflow_runs: data.workflow_runs.map((run) => ({
        id: run.id,
        name: run.name,
        workflow_id: run.workflow_id,
        head_branch: run.head_branch,
        head_sha: run.head_sha,
        run_number: run.run_number,
        event: run.event,
        status: run.status,
        conclusion: run.conclusion,
        created_at: run.created_at,
        updated_at: run.updated_at,
        url: run.html_url,
      })),
    };
  }, 'Failed to list workflow runs');
}

/**
 * Trigger a workflow run in a GitHub repository
 */
export async function triggerWorkflow(args: unknown): Promise<any> {
  const { owner, repo, workflow_id, ref, inputs } = TriggerWorkflowSchema.parse(args);
  const github = getGitHubApi();

  return tryCatchAsync(async () => {
    const { data } = await github.getOctokit().actions.createWorkflowDispatch({
      owner,
      repo,
      workflow_id,
      ref,
      inputs,
    });

    return {
      success: true,
      message: `Workflow dispatch event created for workflow ${workflow_id} on ref ${ref}`,
      data,
    };
  }, 'Failed to trigger workflow');
}
