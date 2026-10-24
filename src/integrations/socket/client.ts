import { io, type Socket } from 'socket.io-client';
import catalog from '@/data/catalog.json';

export const SOCKET_REQUEST_TIMEOUT = 15_000;
const VISITOR_TOKEN_KEY = 'kdcow_socket_visitor_token_v1';
const ADMIN_TOKEN_KEY = 'kdcow_socket_admin_token_v1';

type SocketErrorShape = {
  message: string;
  code?: string;
  status?: number;
};

export type SocketAck<T = unknown> = {
  data: T | null;
  error: SocketErrorShape | null;
};

type RequestOptions = {
  mutation?: boolean;
};

type LifecycleStatus = 'connect' | 'reconnect' | 'disconnect' | 'auth';
type LifecycleListener = (status: LifecycleStatus) => void;
type RealtimeListener = (change: RealtimeChange) => void;

export type RealtimeChange = {
  subscriptionId?: string;
  payload: {
    eventType: string;
    table: string;
    new: Record<string, unknown> | null;
    old: Record<string, unknown> | null;
  };
};

export type PostgresChangesPayload = {
  eventType: string;
  schema: 'public';
  table: string;
  new: Record<string, unknown> | null;
  old: Record<string, unknown> | null;
};

type RealtimeHandler = {
  id: string;
  table: string;
  event: '*' | 'INSERT' | 'UPDATE' | 'DELETE';
  filter?: string;
  callback: (payload: PostgresChangesPayload) => void;
};

type RealtimeChannel = {
  __socketChannel: true;
  __handlers: RealtimeHandler[];
  __active: boolean;
  __unsubscribed: boolean;
  on: (event: string, config: Record<string, unknown>, callback: (payload: PostgresChangesPayload) => void) => RealtimeChannel;
  subscribe: (callback?: (status: string, error?: SocketErrorShape | null) => void) => RealtimeChannel;
  unsubscribe: () => Promise<'ok'>;
};

const lifecycleListeners = new Set<LifecycleListener>();
const realtimeListeners = new Set<RealtimeListener>();
const activeHandlers = new Map<string, RealtimeHandler>();
let hasConnected = false;
let subscriptionSequence = 0;

const canUseStorage = () => typeof window !== 'undefined';

const readStorage = (storage: Storage, key: string): string | null => {
  try {
    return storage.getItem(key);
  } catch {
    return null;
  }
};

const writeStorage = (storage: Storage, key: string, value: string | null) => {
  try {
    if (value === null) storage.removeItem(key);
    else storage.setItem(key, value);
  } catch {
    // Storage may be disabled or unavailable; the socket still operates in memory.
  }
};

const getVisitorToken = () => canUseStorage() ? readStorage(window.localStorage, VISITOR_TOKEN_KEY) : null;
const getAdminToken = () => canUseStorage() ? readStorage(window.sessionStorage, ADMIN_TOKEN_KEY) : null;

const makeHandshake = () => {
  const auth: { token?: string; visitorToken?: string } = {};
  const token = getAdminToken();
  const visitorToken = getVisitorToken();
  if (token) auth.token = token;
  if (visitorToken) auth.visitorToken = visitorToken;
  return auth;
};

const socketUrl: string | undefined = (import.meta.env.VITE_SOCKET_URL as string) || 'https://sejel-server-zygy.onrender.com';

export const socket: Socket = io(socketUrl, {
  path: '/socket.io',
  auth: makeHandshake(),
  autoConnect: false,
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 500,
  reconnectionDelayMax: 5_000,
  timeout: SOCKET_REQUEST_TIMEOUT,
});

const setSocketAuth = () => {
  socket.auth = makeHandshake();
};

const errorShape = (error: unknown, fallback = 'Socket request failed'): SocketErrorShape => {
  if (error && typeof error === 'object') {
    const source = error as Record<string, unknown>;
    return {
      message: typeof source.message === 'string' ? source.message : fallback,
      ...(typeof source.code === 'string' ? { code: source.code } : {}),
      ...(typeof source.status === 'number' ? { status: source.status } : {}),
    };
  }
  return { message: typeof error === 'string' ? error : fallback };
};

export const toSocketError = (error: unknown): Error & SocketErrorShape => {
  const shape = errorShape(error);
  const result = new Error(shape.message) as Error & SocketErrorShape;
  Object.assign(result, shape);
  return result;
};

const isConnectionFailure = (error: SocketErrorShape | null) => Boolean(
  error && (
    error.code === 'SOCKET_OFFLINE' ||
    error.code === 'SOCKET_TIMEOUT' ||
    error.code === 'SOCKET_DISCONNECTED' ||
    error.code === 'NETWORK_ERROR'
  ),
);

const disconnectedAck = (message = 'The realtime service is not connected'): SocketAck<null> => ({
  data: null,
  error: { message, code: 'SOCKET_OFFLINE', status: 503 },
});

const normalizeAck = <T>(value: unknown): SocketAck<T> => {
  if (value && typeof value === 'object' && ('data' in value || 'error' in value)) {
    const source = value as { data?: T | null; error?: unknown };
    return {
      data: source.data === undefined ? null : source.data,
      error: source.error ? errorShape(source.error) : null,
    };
  }
  return { data: (value === undefined ? null : value) as T | null, error: null };
};

const ensureConnected = (): Promise<boolean> => {
  if (socket.connected) return Promise.resolve(true);

  if (!socket.active) {
    setSocketAuth();
    socket.connect();
  }

  return new Promise((resolve) => {
    let settled = false;
    const finish = (connected: boolean) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timeout);
      socket.off('connect', onConnect);
      socket.off('connect_error', onError);
      resolve(connected);
    };
    const onConnect = () => finish(true);
    const onError = () => finish(false);
    const timeout = window.setTimeout(() => finish(false), SOCKET_REQUEST_TIMEOUT);
    socket.once('connect', onConnect);
    socket.once('connect_error', onError);
  });
};

/**
 * Emit one acknowledged request. Mutations never wait for or buffer a disconnected socket.
 * Reads may establish the automatic connection once; transport errors are returned as a
 * contract-shaped acknowledgement so callers can choose the catalog fallback.
 */
export const request = async <T = unknown>(
  event: string,
  payload: Record<string, unknown> = {},
  options: RequestOptions = {},
): Promise<SocketAck<T>> => {
  const mutation = options.mutation === true;
  if (!socket.connected) {
    if (mutation) return disconnectedAck('The realtime service is offline; the change was not submitted.') as SocketAck<T>;
    const connected = await ensureConnected();
    if (!connected) return disconnectedAck() as SocketAck<T>;
  }

  return new Promise<SocketAck<T>>((resolve) => {
    let settled = false;
    const finish = (ack: SocketAck<T>) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timer);
      resolve(ack);
    };
    const timer = window.setTimeout(() => finish({
      data: null,
      error: { message: 'The realtime request timed out.', code: 'SOCKET_TIMEOUT', status: 504 },
    }), SOCKET_REQUEST_TIMEOUT);

    try {
      // Emit only on the currently connected socket; no automatic write retries.
      socket.timeout(SOCKET_REQUEST_TIMEOUT).emit(event, payload, (error: Error | null, ack: unknown) => {
        if (error) finish({ data: null, error: { message: 'The realtime request timed out.', code: 'SOCKET_TIMEOUT', status: 504 } });
        else finish(normalizeAck<T>(ack));
      });
    } catch (error) {
      finish({ data: null, error: errorShape(error, 'Unable to send realtime request.') });
    }
  });
};

export const isSocketConnected = () => socket.connected;

export const subscribeSocketLifecycle = (listener: LifecycleListener) => {
  lifecycleListeners.add(listener);
  return () => lifecycleListeners.delete(listener);
};

export const subscribeRealtimeChanges = (listener: RealtimeListener) => {
  realtimeListeners.add(listener);
  return () => realtimeListeners.delete(listener);
};

const notifyLifecycle = (status: LifecycleStatus) => {
  lifecycleListeners.forEach((listener) => {
    try { listener(status); } catch (error) { console.warn('Socket lifecycle listener failed', error); }
  });
};

const notifyRealtime = (change: RealtimeChange) => {
  realtimeListeners.forEach((listener) => {
    try { listener(change); } catch (error) { console.warn('Realtime listener failed', error); }
  });
};

const subscribeRealtimeHandler = (handler: RealtimeHandler) => {
  if (!socket.connected || !handler) return;
  void request('realtime:subscribe', {
    subscriptionId: handler.id,
    table: handler.table,
    event: handler.event,
    ...(handler.filter ? { filter: handler.filter } : {}),
  }, { mutation: true }).then((ack) => {
    if (ack.error) console.warn('Realtime subscription failed', ack.error);
  });
};

const resubscribeAll = () => {
  activeHandlers.forEach(subscribeRealtimeHandler);
};

socket.on('session:visitor', (payload: { token?: string } | string) => {
  const token = typeof payload === 'string' ? payload : payload?.token;
  if (!token) return;
  if (canUseStorage()) writeStorage(window.localStorage, VISITOR_TOKEN_KEY, token);
  setSocketAuth();
});

// Accept an optional explicit server-side auth refresh event without ever inventing a token.
socket.on('auth:updated', (payload: { access_token?: string; token?: string; session?: { access_token?: string } } = {}) => {
  const token = payload.access_token || payload.token || payload.session?.access_token;
  if (token && canUseStorage()) writeStorage(window.sessionStorage, ADMIN_TOKEN_KEY, token);
  setSocketAuth();
  notifyLifecycle('auth');
  resubscribeAll();
});

socket.on('realtime:change', (change: RealtimeChange) => {
  if (!change?.payload?.table) return;
  notifyRealtime(change);
  const handler = change.subscriptionId ? activeHandlers.get(change.subscriptionId) : undefined;
  if (!handler) return;
  const payload = change.payload;
  handler.callback({
    eventType: payload.eventType,
    schema: 'public',
    table: payload.table,
    new: payload.new ?? null,
    old: payload.old ?? null,
  });
});

socket.on('connect', () => {
  const status: LifecycleStatus = hasConnected ? 'reconnect' : 'connect';
  hasConnected = true;
  setSocketAuth();
  notifyLifecycle(status);
  resubscribeAll();
});

socket.on('disconnect', () => notifyLifecycle('disconnect'));

export const channel = (name: string): RealtimeChannel => {
  const channelHandlers: RealtimeHandler[] = [];
  let active = false;
  let unsubscribed = false;
  const channelObject = {} as RealtimeChannel;

  channelObject.__socketChannel = true;
  channelObject.__handlers = channelHandlers;
  channelObject.__active = false;
  channelObject.__unsubscribed = false;
  channelObject.on = (event, config, callback) => {
    if (event !== 'postgres_changes' || unsubscribed) return channelObject;
    const rawEvent = String(config?.event || '*').toUpperCase();
    const subscriptionEvent = rawEvent === 'INSERT' || rawEvent === 'UPDATE' || rawEvent === 'DELETE' ? rawEvent : '*';
    const table = String(config?.table || '*');
    const id = `${name}:${++subscriptionSequence}:${createOpaqueId()}`;
    const handler: RealtimeHandler = {
      id,
      table,
      event: subscriptionEvent,
      filter: typeof config?.filter === 'string' ? config.filter : undefined,
      callback,
    };
    channelHandlers.push(handler);
    if (active) {
      activeHandlers.set(handler.id, handler);
      subscribeRealtimeHandler(handler);
    }
    return channelObject;
  };
  channelObject.subscribe = (callback) => {
    if (unsubscribed) return channelObject;
    active = true;
    channelObject.__active = true;
    channelHandlers.forEach((handler) => {
      activeHandlers.set(handler.id, handler);
      subscribeRealtimeHandler(handler);
    });
    if (!socket.connected) {
      void ensureConnected();
    }
    if (callback) callback('SUBSCRIBED', null);
    return channelObject;
  };
  channelObject.unsubscribe = async () => {
    if (unsubscribed) return 'ok';
    unsubscribed = true;
    channelObject.__unsubscribed = true;
    channelObject.__active = false;
    const handlers = channelHandlers.splice(0, channelHandlers.length);
    handlers.forEach((handler) => {
      activeHandlers.delete(handler.id);
      if (socket.connected) {
        void request('realtime:unsubscribe', { subscriptionId: handler.id }, { mutation: true });
      }
    });
    return 'ok';
  };

  return channelObject;
};

export const removeChannel = async (value: RealtimeChannel) => {
  if (value?.unsubscribe) return value.unsubscribe();
  return 'ok' as const;
};

const createOpaqueId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
};

const catalogTables = new Set(['products', 'categories', 'product_images']);

type QueryState = {
  table: string;
  operation: 'select' | 'insert' | 'update' | 'delete';
  select?: string;
  filters: { column: string; op: 'eq' | 'in'; value: unknown }[];
  orders: { column: string; ascending: boolean }[];
  limit?: number;
  single?: 'single' | 'maybe';
  payload?: unknown;
  or?: string;
};

const getCatalogRows = (table: string, select?: string): any[] => {
  const source = ((catalog as any)[table] || []) as any[];
  return source.map((row) => {
    if (table !== 'products') return { ...row };
    const category = ((catalog as any).categories || []).find((item: any) => item.id === row.category_id) || null;
    return select?.includes('category:') || select?.includes('categories(') || select === '*' || !select
      ? { ...row, category }
      : { ...row };
  });
};

const getNestedValue = (row: any, key: string) => {
  if (key === 'categories.slug' || key === 'category.slug') return row.category?.slug;
  return key.split('.').reduce((value, part) => value?.[part], row);
};

const applyOfflineOrder = (rows: any[], order: { column: string; ascending: boolean }) => {
  const direction = order.ascending === false ? -1 : 1;
  rows.sort((a, b) => {
    const av = getNestedValue(a, order.column);
    const bv = getNestedValue(b, order.column);
    if (av === bv) return 0;
    if (av === null || av === undefined) return -1 * direction;
    if (bv === null || bv === undefined) return 1 * direction;
    return (av > bv ? 1 : -1) * direction;
  });
};

const applyOfflineOr = (rows: any[], expression?: string) => {
  if (!expression) return rows;
  const clauses = expression.split(',').map((part) => part.trim()).filter(Boolean);
  if (!clauses.length) return rows;
  return rows.filter((row) => clauses.some((clause) => {
    const match = clause.match(/^([^.]*)\.(eq|in|ilike)\.(.*)$/);
    if (!match) return true;
    const [, column, op, raw] = match;
    const value = getNestedValue(row, column);
    if (op === 'eq') return String(value) === raw;
    if (op === 'in') return raw.replace(/[()]/g, '').split(',').includes(String(value));
    const needle = raw.replace(/%/g, '').toLowerCase();
    return String(value ?? '').toLowerCase().includes(needle);
  }));
};

const offlineCatalogQuery = (state: QueryState): SocketAck<any> => {
  if (state.operation !== 'select' || !catalogTables.has(state.table)) {
    return { data: null, error: { message: 'The realtime service is offline; this operation was not submitted.', code: 'SOCKET_OFFLINE', status: 503 } };
  }
  let rows = getCatalogRows(state.table, state.select);
  state.filters.forEach((filter) => {
    rows = rows.filter((row) => {
      const value = getNestedValue(row, filter.column);
      if (filter.op === 'in') return Array.isArray(filter.value) && filter.value.includes(value);
      return value === filter.value;
    });
  });
  rows = applyOfflineOr(rows, state.or);
  // Apply the last order first so earlier order clauses remain primary (stable sort).
  [...state.orders].reverse().forEach((order) => applyOfflineOrder(rows, order));
  if (state.limit !== undefined) rows = rows.slice(0, state.limit);

  if (state.single === 'single') {
    if (rows.length !== 1) {
      return {
        data: null,
        error: { message: rows.length ? 'Multiple rows returned' : 'No rows returned', code: 'PGRST116', status: 406 },
      };
    }
    return { data: rows[0], error: null };
  }
  if (state.single === 'maybe') {
    if (rows.length > 1) return { data: null, error: { message: 'Multiple rows returned', code: 'PGRST116', status: 406 } };
    return { data: rows[0] || null, error: null };
  }
  return { data: rows, error: null };
};

export const query = (table: string) => {
  const state: QueryState = {
    table,
    operation: 'select',
    filters: [],
    orders: [],
  };
  let execution: Promise<SocketAck<any>> | null = null;
  const builder: any = {
    select: (columns = '*') => { state.select = columns; return builder; },
    eq: (column: string, value: unknown) => { state.filters.push({ column, op: 'eq', value }); return builder; },
    in: (column: string, value: unknown[]) => { state.filters.push({ column, op: 'in', value }); return builder; },
    or: (expression: string) => { state.or = expression; return builder; },
    order: (column: string, options: { ascending?: boolean } = {}) => {
      state.orders.push({ column, ascending: options.ascending !== false });
      return builder;
    },
    limit: (value: number) => { state.limit = value; return builder; },
    single: () => { state.single = 'single'; return builder; },
    maybeSingle: () => { state.single = 'maybe'; return builder; },
    insert: (payload: unknown) => { state.operation = 'insert'; state.payload = payload; return builder; },
    update: (payload: unknown) => { state.operation = 'update'; state.payload = payload; return builder; },
    delete: () => { state.operation = 'delete'; return builder; },
    then: (resolve: (value: SocketAck<any>) => unknown, reject?: (reason: unknown) => unknown) => {
      if (!execution) {
        execution = request('data:query', state as unknown as Record<string, unknown>, {
          mutation: state.operation !== 'select',
        }).then((ack) => {
          if (ack.error && isConnectionFailure(ack.error) && state.operation === 'select') {
            return offlineCatalogQuery(state);
          }
          return ack;
        });
      }
      return execution.then(resolve, reject);
    },
  };
  return builder;
};

export const invokeFunction = <T = unknown>(name: string, body: unknown, requestId?: string) => request<T>(
  'data:function',
  { name, body, ...(requestId ? { requestId } : {}) },
  { mutation: name === 'create-order' || name === 'subscription-update' },
);

const fileToBase64 = async (file: Blob): Promise<string> => {
  const bytes = new Uint8Array(await file.arrayBuffer());
  let binary = '';
  const chunkSize = 0x8000;
  for (let offset = 0; offset < bytes.length; offset += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + chunkSize));
  }
  return btoa(binary);
};

export const storage = {
  from: (bucket: string) => ({
    upload: async (path: string, file: Blob, options: { contentType?: string; upsert?: boolean } = {}) => {
      const base64 = await fileToBase64(file);
      return request<{ path: string }>('storage:upload', {
        bucket,
        path,
        base64,
        contentType: options.contentType || file.type || 'application/octet-stream',
        ...(options.upsert !== undefined ? { upsert: options.upsert } : {}),
      }, { mutation: true });
    },
    createSignedUrl: async (path: string, expiresIn: number) => request<{ signedUrl: string }>('storage:signed-url', {
      bucket,
      path,
      expiresIn,
    }),
    getPublicUrl: (path: string) => ({ data: { publicUrl: path } }),
  }),
};

const authListeners = new Set<(event: string, session: any) => void>();

const notifyAuth = (event: string, session: any) => {
  authListeners.forEach((listener) => {
    try { listener(event, session); } catch (error) { console.warn('Auth listener failed', error); }
  });
};

const authSession = async () => {
  const ack = await request<{ user: any; session: any }>('auth:session', {});
  const data = ack.data || { user: null, session: null };
  if (!data.session && canUseStorage()) writeStorage(window.sessionStorage, ADMIN_TOKEN_KEY, null);
  return {
    data: { user: data.user || null, session: data.session || null },
    error: ack.error ? toSocketError(ack.error) : null,
  };
};

export const auth = {
  getUser: async () => {
    const result = await authSession();
    return { data: { user: result.data.user }, error: result.error };
  },
  getSession: authSession,
  signInWithPassword: async ({ email, password }: { email: string; password: string }) => {
    const ack = await request<{ user: any; session: { access_token: string; user: any } }>('auth:login', { email, password }, { mutation: true });
    if (ack.data?.session?.access_token && canUseStorage()) {
      writeStorage(window.sessionStorage, ADMIN_TOKEN_KEY, ack.data.session.access_token);
      setSocketAuth();
      notifyLifecycle('auth');
      resubscribeAll();
      notifyAuth('SIGNED_IN', ack.data.session);
    }
    return {
      data: ack.data || { user: null, session: null },
      error: ack.error ? toSocketError(ack.error) : null,
    };
  },
  signOut: async () => {
    const ack = await request<null>('auth:logout', {}, { mutation: true });
    if (canUseStorage()) writeStorage(window.sessionStorage, ADMIN_TOKEN_KEY, null);
    setSocketAuth();
    notifyAuth('SIGNED_OUT', null);
    notifyLifecycle('auth');
    return { error: ack.error ? toSocketError(ack.error) : null };
  },
  onAuthStateChange: (listener: (event: string, session: any) => void) => {
    authListeners.add(listener);
    void authSession().then((result) => listener('INITIAL_SESSION', result.data.session));
    return { data: { subscription: { unsubscribe: () => authListeners.delete(listener) } } };
  },
};

export const rpc = async <T = unknown>(name: string, args: Record<string, unknown> = {}) => {
  if (name !== 'has_role') {
    return { data: null as T | null, error: toSocketError({ message: `Unsupported RPC: ${name}`, code: 'UNSUPPORTED_RPC', status: 400 }) };
  }
  const ack = await request<T>('auth:role', args);
  return { data: ack.data, error: ack.error ? toSocketError(ack.error) : null };
};

if (typeof window !== 'undefined') {
  setSocketAuth();
  socket.connect();
}
