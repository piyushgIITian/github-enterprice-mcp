/**
 * This is a minimal implementation of the MCP SDK stdio transport for the GitHub Enterprise MCP server.
 * In a real-world scenario, you would use the actual @modelcontextprotocol/sdk package.
 */

export class StdioServerTransport {
  constructor() {
    this.onRequest = null;
    
    // Set up stdin/stdout handling
    process.stdin.on('data', (data) => {
      try {
        const request = JSON.parse(data.toString());
        if (this.onRequest) {
          this.onRequest(request)
            .then((result) => {
              const response = {
                jsonrpc: '2.0',
                id: request.id,
                result,
              };
              process.stdout.write(JSON.stringify(response) + '\n');
            })
            .catch((error) => {
              const response = {
                jsonrpc: '2.0',
                id: request.id,
                error: {
                  code: error.code || -32603, // Internal error
                  message: error.message || 'Unknown error',
                },
              };
              process.stdout.write(JSON.stringify(response) + '\n');
            });
        }
      } catch (error) {
        console.error('Error processing request:', error);
      }
    });
  }
}
