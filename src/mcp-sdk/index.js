/**
 * This is a minimal implementation of the MCP SDK for the GitHub Enterprise MCP server.
 * In a real-world scenario, you would use the actual @modelcontextprotocol/sdk package.
 */

export class Server {
  constructor(info, options) {
    this.info = info;
    this.options = options;
    this.handlers = new Map();
  }

  onerror = (error) => {
    console.error('Server error:', error);
  };

  setRequestHandler(schema, handler) {
    const schemaId = schema.id || schema.name || 'unknown';
    this.handlers.set(schemaId, handler);
  }

  async connect(transport) {
    this.transport = transport;
    console.error(`MCP Server ${this.info.name} v${this.info.version} connected`);
    
    // Set up transport
    if (this.transport) {
      this.transport.onRequest = async (request) => {
        try {
          // Find handler for method
          const handler = this.handlers.get(request.method) || this.handlers.get('unknown');
          if (!handler) {
            throw new McpError(ErrorCode.MethodNotFound, `Method not found: ${request.method}`);
          }
          
          // Call handler
          const result = await handler({ params: request.params });
          return result;
        } catch (error) {
          this.onerror(error);
          throw error;
        }
      };
    }
  }

  async close() {
    console.error(`MCP Server ${this.info.name} v${this.info.version} closed`);
  }
}

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
                  code: error.code || ErrorCode.InternalError,
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

export const ErrorCode = {
  ParseError: -32700,
  InvalidRequest: -32600,
  MethodNotFound: -32601,
  InvalidParams: -32602,
  InternalError: -32603,
  ConfigurationError: -32000,
  Unauthorized: -32001,
  Forbidden: -32003,
  NotFound: -32004,
};

export class McpError extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
    this.name = 'McpError';
  }
}

// Schema constants
export const CallToolRequestSchema = { id: 'call_tool' };
export const ListToolsRequestSchema = { id: 'list_tools' };
export const ListResourcesRequestSchema = { id: 'list_resources' };
export const ListResourceTemplatesRequestSchema = { id: 'list_resource_templates' };
export const ReadResourceRequestSchema = { id: 'read_resource' };
