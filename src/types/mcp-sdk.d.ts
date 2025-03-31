declare module '@modelcontextprotocol/sdk/server/index.js' {
  export class Server {
    constructor(
      info: { name: string; version: string },
      options: { capabilities: { tools: Record<string, unknown> } }
    );
    
    onerror: (error: any) => void;
    
    setRequestHandler<T>(schema: any, handler: (request: any) => Promise<T>): void;
    
    connect(transport: any): Promise<void>;
    
    close(): Promise<void>;
  }
}

declare module '@modelcontextprotocol/sdk/server/stdio.js' {
  export class StdioServerTransport {
    constructor();
  }
}

declare module '@modelcontextprotocol/sdk/types.js' {
  export enum ErrorCode {
    ParseError = -32700,
    InvalidRequest = -32600,
    MethodNotFound = -32601,
    InvalidParams = -32602,
    InternalError = -32603,
    ConfigurationError = -32000,
    Unauthorized = -32001,
    Forbidden = -32003,
    NotFound = -32004,
  }
  
  export class McpError extends Error {
    constructor(code: ErrorCode, message: string);
    code: ErrorCode;
  }
  
  export const CallToolRequestSchema: any;
  export const ListToolsRequestSchema: any;
  export const ListResourcesRequestSchema: any;
  export const ListResourceTemplatesRequestSchema: any;
  export const ReadResourceRequestSchema: any;
}
