import { getGitHubApi } from '../utils/github-api.js';
import { tryCatchAsync, base64ToUtf8, utf8ToBase64 } from '../utils/error-handling.js';
import {
  CreateOrUpdateFileSchema,
  PushFilesSchema,
  GetFileContentsSchema,
} from '../utils/validation.js';
import { McpError, ErrorCode } from '@modelcontextprotocol/sdk/types.js';

/**
 * Create or update a file in a GitHub repository
 */
export async function createOrUpdateFile(args: unknown): Promise<any> {
  const { owner, repo, path, content, message, branch, sha } = CreateOrUpdateFileSchema.parse(args);
  const github = getGitHubApi();

  return tryCatchAsync(async () => {
    // Check if branch exists, create it if it doesn't
    const branchExists = await github.branchExists(owner, repo, branch);
    if (!branchExists) {
      await github.createBranch(owner, repo, branch);
    }

    // Create or update the file
    const { data } = await github.getOctokit().repos.createOrUpdateFileContents({
      owner,
      repo,
      path,
      message,
      content: utf8ToBase64(content),
      branch,
      sha,
    });

    return {
      content: {
        name: data.content?.name,
        path: data.content?.path,
        sha: data.content?.sha,
        size: data.content?.size,
        url: data.content?.html_url,
      },
      commit: {
        sha: data.commit.sha,
        url: data.commit.html_url,
        message: data.commit.message,
        author: data.commit.author,
        committer: data.commit.committer,
      },
    };
  }, 'Failed to create or update file');
}

/**
 * Push multiple files to a GitHub repository in a single commit
 */
export async function pushFiles(args: unknown): Promise<any> {
  const { owner, repo, branch, files, message } = PushFilesSchema.parse(args);
  const github = getGitHubApi();

  return tryCatchAsync(async () => {
    // Check if branch exists, create it if it doesn't
    const branchExists = await github.branchExists(owner, repo, branch);
    if (!branchExists) {
      await github.createBranch(owner, repo, branch);
    }

    // Get the latest commit SHA on the branch
    const { data: refData } = await github.getOctokit().git.getRef({
      owner,
      repo,
      ref: `heads/${branch}`,
    });
    const latestCommitSha = refData.object.sha;

    // Get the commit to get the tree SHA
    const { data: commitData } = await github.getOctokit().git.getCommit({
      owner,
      repo,
      commit_sha: latestCommitSha,
    });
    const baseTreeSha = commitData.tree.sha;

    // Create a new tree with the files
    const tree = await Promise.all(
      files.map(async (file) => {
        // Check if file exists to get its SHA
        let fileSha;
        try {
          const { data: existingFile } = await github.getOctokit().repos.getContent({
            owner,
            repo,
            path: file.path,
            ref: branch,
          });
          
          if (!Array.isArray(existingFile)) {
            fileSha = existingFile.sha;
          }
        } catch (error: any) {
          // File doesn't exist, which is fine for new files
          if (error.status !== 404) {
            throw error;
          }
        }

        return {
          path: file.path,
          mode: '100644' as '100644', // Regular file
          type: 'blob' as 'blob',
          content: file.content,
        };
      })
    );

    // Create a new tree
    const { data: newTree } = await github.getOctokit().git.createTree({
      owner,
      repo,
      base_tree: baseTreeSha,
      tree,
    });

    // Create a new commit
    const { data: newCommit } = await github.getOctokit().git.createCommit({
      owner,
      repo,
      message,
      tree: newTree.sha,
      parents: [latestCommitSha],
    });

    // Update the reference
    const { data: updatedRef } = await github.getOctokit().git.updateRef({
      owner,
      repo,
      ref: `heads/${branch}`,
      sha: newCommit.sha,
    });

    return {
      success: true,
      branch,
      commit: {
        sha: newCommit.sha,
        message,
        url: `https://github.com/${owner}/${repo}/commit/${newCommit.sha}`,
      },
      files: files.map((file) => file.path),
    };
  }, 'Failed to push files');
}

/**
 * Get the contents of a file or directory from a GitHub repository
 */
export async function getFileContents(args: unknown): Promise<any> {
  const { owner, repo, path, branch } = GetFileContentsSchema.parse(args);
  const github = getGitHubApi();

  return tryCatchAsync(async () => {
    const { data } = await github.getOctokit().repos.getContent({
      owner,
      repo,
      path,
      ref: branch,
    });

    // Handle directory listing
    if (Array.isArray(data)) {
      return data.map((item) => ({
        name: item.name,
        path: item.path,
        sha: item.sha,
        size: item.size,
        type: item.type,
        url: item.html_url,
        download_url: item.download_url,
      }));
    }

    // Handle file content
    if (data.type === 'file') {
      return {
        name: data.name,
        path: data.path,
        sha: data.sha,
        size: data.size,
        type: data.type,
        url: data.html_url,
        content: data.content ? base64ToUtf8(data.content) : null,
        encoding: data.encoding,
      };
    }

    // Handle submodule or symlink
    return {
      name: data.name,
      path: data.path,
      sha: data.sha,
      size: data.size,
      type: data.type,
      url: data.html_url,
    };
  }, 'Failed to get file contents');
}

/**
 * Fork a GitHub repository
 */
export async function forkRepository(args: unknown): Promise<any> {
  const { owner, repo, organization } = args as { owner: string; repo: string; organization?: string };
  const github = getGitHubApi();

  return tryCatchAsync(async () => {
    const { data } = await github.getOctokit().repos.createFork({
      owner,
      repo,
      organization,
    });

    return {
      id: data.id,
      name: data.name,
      full_name: data.full_name,
      owner: {
        login: data.owner.login,
        id: data.owner.id,
        type: data.owner.type,
      },
      private: data.private,
      html_url: data.html_url,
      description: data.description,
      fork: data.fork,
      created_at: data.created_at,
      updated_at: data.updated_at,
      pushed_at: data.pushed_at,
      default_branch: data.default_branch,
      parent: data.parent ? {
        name: data.parent.name,
        full_name: data.parent.full_name,
        owner: {
          login: data.parent.owner.login,
        },
      } : null,
      source: data.source ? {
        name: data.source.name,
        full_name: data.source.full_name,
        owner: {
          login: data.source.owner.login,
        },
      } : null,
    };
  }, 'Failed to fork repository');
}

/**
 * Get pull request files
 */
export async function getPullRequestFiles(args: unknown): Promise<any> {
  const { owner, repo, pull_number } = args as { owner: string; repo: string; pull_number: number };
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
