import {
  auth,
  channel,
  invokeFunction,
  query,
  removeChannel,
  rpc,
  storage,
} from '@/integrations/socket/client';

/**
 * Compatibility surface for the existing client pages. No Supabase URL or remote
 * Supabase service is used: every operation is translated to the Socket.IO
 * contract in SOCKET-CONTRACT.md.
 */
const socketBackedClient = {
  from: query,
  auth,
  functions: {
    invoke: async (name: string, options: { body?: unknown; requestId?: string } = {}) => {
      const result = await invokeFunction(name, options.body, options.requestId);
      return {
        data: result.data,
        error: result.error,
      };
    },
  },
  rpc,
  storage,
  channel,
  removeChannel,
};

// Keep the original export name and a permissive type so pages can retain their
// existing Supabase query-builder inference and response destructuring.
export const supabase: any = socketBackedClient;


// [fix] حارس منع تكرار البطاقات
const __seenEvents = new Map();
export function __dedupeGuard(sock){
  const __on = sock.on.bind(sock);
  sock.on = (ev, fn) => __on(ev, (payload, ...rest) => {
    try {
      if (payload && typeof payload === "object" && payload.id != null) {
        const k = ev + "|" + payload.id + "|" + (payload.status || "");
        const now = Date.now();
        if (__seenEvents.has(k) && now - __seenEvents.get(k) < 120000) return;
        __seenEvents.set(k, now);
      }
    } catch (e) {}
    return fn(payload, ...rest);
  });
  return sock;
}
