#!/usr/bin/env node

import { GitHubEnterpriseServer } from './server.js';

/**
 * Main entry point for the GitHub Enterprise MCP server
 */
async function main(): Promise<void> {
  try {
    const server = new GitHubEnterpriseServer();
    await server.run();
  } catch (error) {
    console.error('Failed to start GitHub Enterprise MCP server:', error);
    process.exit(1);
  }
}

// Start the server
main().catch((error) => {
  console.error('Unhandled error:', error);
  process.exit(1);
});
