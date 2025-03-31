import { z } from 'zod';

// Common schemas
export const OwnerRepoSchema = z.object({
  owner: z.string().min(1, 'Repository owner is required'),
  repo: z.string().min(1, 'Repository name is required'),
});

export const PaginationSchema = z.object({
  page: z.number().optional(),
  perPage: z.number().min(1).max(100).optional(),
});

// File operations schemas
export const CreateOrUpdateFileSchema = OwnerRepoSchema.extend({
  path: z.string().min(1, 'File path is required'),
  content: z.string().min(1, 'File content is required'),
  message: z.string().min(1, 'Commit message is required'),
  branch: z.string().min(1, 'Branch name is required'),
  sha: z.string().optional(),
});

export const PushFilesSchema = OwnerRepoSchema.extend({
  branch: z.string().min(1, 'Branch name is required'),
  files: z.array(
    z.object({
      path: z.string().min(1, 'File path is required'),
      content: z.string().min(1, 'File content is required'),
    })
  ).min(1, 'At least one file is required'),
  message: z.string().min(1, 'Commit message is required'),
});

export const GetFileContentsSchema = OwnerRepoSchema.extend({
  path: z.string().min(1, 'File path is required'),
  branch: z.string().optional(),
});

// Repository schemas
export const SearchRepositoriesSchema = z.object({
  query: z.string().min(1, 'Search query is required'),
  page: z.number().optional(),
  perPage: z.number().min(1).max(100).optional(),
});

export const CreateRepositorySchema = z.object({
  name: z.string().min(1, 'Repository name is required'),
  description: z.string().optional(),
  private: z.boolean().optional(),
  autoInit: z.boolean().optional(),
  org: z.string().optional(),
});

export const UpdateRepositorySchema = OwnerRepoSchema.extend({
  description: z.string().optional(),
  private: z.boolean().optional(),
  default_branch: z.string().optional(),
  has_issues: z.boolean().optional(),
  has_projects: z.boolean().optional(),
  has_wiki: z.boolean().optional(),
  archived: z.boolean().optional(),
});

export const DeleteRepositorySchema = OwnerRepoSchema.extend({
  confirm: z.boolean().refine(val => val === true, {
    message: 'You must confirm deletion by setting confirm to true',
  }),
});

// Branch schemas
export const CreateBranchSchema = OwnerRepoSchema.extend({
  branch: z.string().min(1, 'Branch name is required'),
  from_branch: z.string().optional(),
});

// Issue schemas
export const ListIssuesSchema = OwnerRepoSchema.extend({
  state: z.enum(['open', 'closed', 'all']).optional(),
  labels: z.array(z.string()).optional(),
  sort: z.enum(['created', 'updated', 'comments']).optional(),
  direction: z.enum(['asc', 'desc']).optional(),
  since: z.string().optional(),
  page: z.number().optional(),
  per_page: z.number().optional(),
});

export const GetIssueSchema = OwnerRepoSchema.extend({
  issue_number: z.number().int().positive(),
});

export const CreateIssueSchema = OwnerRepoSchema.extend({
  title: z.string().min(1, 'Issue title is required'),
  body: z.string().optional(),
  assignees: z.array(z.string()).optional(),
  milestone: z.number().optional(),
  labels: z.array(z.string()).optional(),
});

export const UpdateIssueSchema = OwnerRepoSchema.extend({
  issue_number: z.number().int().positive(),
  title: z.string().optional(),
  body: z.string().optional(),
  assignees: z.array(z.string()).optional(),
  milestone: z.number().optional(),
  labels: z.array(z.string()).optional(),
  state: z.enum(['open', 'closed']).optional(),
});

export const AddIssueCommentSchema = OwnerRepoSchema.extend({
  issue_number: z.number().int().positive(),
  body: z.string().min(1, 'Comment body is required'),
});

// Pull request schemas
export const ListPullRequestsSchema = OwnerRepoSchema.extend({
  state: z.enum(['open', 'closed', 'all']).optional(),
  head: z.string().optional(),
  base: z.string().optional(),
  sort: z.enum(['created', 'updated', 'popularity', 'long-running']).optional(),
  direction: z.enum(['asc', 'desc']).optional(),
  per_page: z.number().optional(),
  page: z.number().optional(),
});

export const GetPullRequestSchema = OwnerRepoSchema.extend({
  pull_number: z.number().int().positive(),
});

export const CreatePullRequestSchema = OwnerRepoSchema.extend({
  title: z.string().min(1, 'Pull request title is required'),
  head: z.string().min(1, 'Head branch is required'),
  base: z.string().min(1, 'Base branch is required'),
  body: z.string().optional(),
  draft: z.boolean().optional(),
  maintainer_can_modify: z.boolean().optional(),
});

export const CreatePullRequestReviewSchema = OwnerRepoSchema.extend({
  pull_number: z.number().int().positive(),
  body: z.string().min(1, 'Review body is required'),
  event: z.enum(['APPROVE', 'REQUEST_CHANGES', 'COMMENT']),
  commit_id: z.string().optional(),
  comments: z
    .array(
      z.object({
        path: z.string().min(1, 'File path is required'),
        position: z.number().int().positive(),
        body: z.string().min(1, 'Comment body is required'),
      })
    )
    .optional(),
});

export const MergePullRequestSchema = OwnerRepoSchema.extend({
  pull_number: z.number().int().positive(),
  commit_title: z.string().optional(),
  commit_message: z.string().optional(),
  merge_method: z.enum(['merge', 'squash', 'rebase']).optional(),
});

export const GetPullRequestFilesSchema = OwnerRepoSchema.extend({
  pull_number: z.number().int().positive(),
});

export const GetPullRequestStatusSchema = OwnerRepoSchema.extend({
  pull_number: z.number().int().positive(),
});

export const UpdatePullRequestBranchSchema = OwnerRepoSchema.extend({
  pull_number: z.number().int().positive(),
  expected_head_sha: z.string().optional(),
});

export const GetPullRequestCommentsSchema = OwnerRepoSchema.extend({
  pull_number: z.number().int().positive(),
});

export const GetPullRequestReviewsSchema = OwnerRepoSchema.extend({
  pull_number: z.number().int().positive(),
});

// Search schemas
export const SearchCodeSchema = z.object({
  q: z.string().min(1, 'Search query is required'),
  order: z.enum(['asc', 'desc']).optional(),
  page: z.number().min(1).optional(),
  per_page: z.number().min(1).max(100).optional(),
});

export const SearchIssuesSchema = z.object({
  q: z.string().min(1, 'Search query is required'),
  sort: z
    .enum([
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
    ])
    .optional(),
  order: z.enum(['asc', 'desc']).optional(),
  page: z.number().min(1).optional(),
  per_page: z.number().min(1).max(100).optional(),
});

export const SearchUsersSchema = z.object({
  q: z.string().min(1, 'Search query is required'),
  sort: z.enum(['followers', 'repositories', 'joined']).optional(),
  order: z.enum(['asc', 'desc']).optional(),
  page: z.number().min(1).optional(),
  per_page: z.number().min(1).max(100).optional(),
});

// Commits schema
export const ListCommitsSchema = OwnerRepoSchema.extend({
  sha: z.string().optional(),
  page: z.number().optional(),
  perPage: z.number().optional(),
});

// Workflow schemas
export const ListWorkflowsSchema = OwnerRepoSchema.extend({
  page: z.number().int().optional(),
  perPage: z.number().int().optional(),
});

export const ListWorkflowRunsSchema = OwnerRepoSchema.extend({
  workflow_id: z.union([z.string(), z.number()]).optional(),
  branch: z.string().optional(),
  status: z
    .enum([
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
    ])
    .optional(),
  page: z.number().int().optional(),
  perPage: z.number().int().optional(),
});

export const TriggerWorkflowSchema = OwnerRepoSchema.extend({
  workflow_id: z.union([z.string(), z.number()]),
  ref: z.string().min(1, 'Git reference is required'),
  inputs: z.record(z.string()).optional(),
});
