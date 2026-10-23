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
