import { NextRequest, NextResponse } from "next/server";
import { logger } from "./logger";

export type ApiHandler = (
  req: NextRequest,
  context: any
) => Promise<NextResponse> | NextResponse;

/**
 * Wrapper (Higher-Order Function) para capturar logs de rotas da API no Next.js (App Router).
 * No Next.js App Router, o middleware global (Edge) não consegue capturar o status_code
 * final ou a latência real do route handler. Por isso, usamos este wrapper.
 */
export function withLogging(handler: ApiHandler): ApiHandler {
  return async (req: NextRequest, context: any) => {
    const start = Date.now();
    const method = req.method;
    const path = req.nextUrl.pathname;

    try {
      const response = await handler(req, context);
      const latency = Date.now() - start;

      logger.info({
        event: "api_request",
        method,
        path,
        status: response.status,
        latency: `${latency}ms`,
      });

      return response;
    } catch (error) {
      const latency = Date.now() - start;

      logger.error({
        event: "api_request",
        method,
        path,
        status: 500,
        latency: `${latency}ms`,
        error: error instanceof Error ? error.message : String(error),
      });

      // Repassar o erro para ser tratado pelo Next.js (ou retornar um NextResponse.json com erro)
      throw error;
    }
  };
}
