/**
 * Thin typed facade over legacy rpc.js (Phase 485).
 * The bundler / server still loads rpc.js; this file provides types and a re-export hook.
 */
import type { JsonRpcRequest, JsonRpcResponse } from "../types/rpc-contracts";

export type { JsonRpcRequest, JsonRpcResponse };

/** Placeholder: real implementation is window.__ERP_RPC__ from rpc.js at runtime. */
export function getRpcImpl(): unknown {
  if (typeof window !== "undefined" && (window as unknown as { __ERP_RPC__?: unknown }).__ERP_RPC__) {
    return (window as unknown as { __ERP_RPC__: unknown }).__ERP_RPC__;
  }
  return null;
}
