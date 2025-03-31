/**
 * This is a minimal implementation of the MCP SDK types for the GitHub Enterprise MCP server.
 * In a real-world scenario, you would use the actual @modelcontextprotocol/sdk package.
 */

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
