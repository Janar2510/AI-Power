/**
 * JSON-RPC shapes used by the web client (incremental TypeScript migration, Phase 485).
 * Implementation remains in services/rpc.js until migrated.
 */

export type JsonRpcId = string | number | null;

export interface JsonRpcRequest {
  jsonrpc: "2.0";
  method: string;
  params?: unknown;
  id?: JsonRpcId;
}

export interface JsonRpcResponse<T = unknown> {
  jsonrpc: "2.0";
  id?: JsonRpcId;
  result?: T;
  error?: { code: number; message: string; data?: unknown };
}

export interface RpcCallOptions {
  /** @deprecated use explicit model/method via jsonrpc service */
  silent?: boolean;
}
