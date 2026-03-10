/**
 * AriaQuant API Client — connects React frontend to Laravel backend
 *
 * Replaces localStorage persistence with real API calls.
 * Falls back to localStorage when backend is unavailable (offline mode).
 */

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

// ─── Token Management ───
let authToken: string | null = localStorage.getItem('aria-api-token');

export function setToken(token: string | null) {
  authToken = token;
  if (token) {
    localStorage.setItem('aria-api-token', token);
  } else {
    localStorage.removeItem('aria-api-token');
  }
}

export function getToken(): string | null {
  return authToken;
}

// ─── Base Fetch ───
async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  if (res.status === 401) {
    setToken(null);
    window.dispatchEvent(new CustomEvent('auth:logout'));
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(body.message || `API error ${res.status}`);
  }

  return res.json();
}

// ─── Auth ───
export const auth = {
  async register(data: { name: string; email: string; password: string; password_confirmation: string }) {
    const res = await apiFetch<{ user: ApiUser; token: string }>('/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    setToken(res.token);
    return res;
  },

  async login(data: { email: string; password: string }) {
    const res = await apiFetch<{ user: ApiUser; token: string }>('/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    setToken(res.token);
    return res;
  },

  async logout() {
    try {
      await apiFetch('/logout', { method: 'POST' });
    } finally {
      setToken(null);
    }
  },

  async me() {
    return apiFetch<{ user: ApiUser }>('/me');
  },

  async updateProfile(data: Partial<{ name: string; avatar: string; theme: string }>) {
    return apiFetch<{ user: ApiUser }>('/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async forgotPassword(email: string) {
    return apiFetch<{ message: string }>('/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  async resetPassword(data: { token: string; email: string; password: string; password_confirmation: string }) {
    return apiFetch<{ message: string }>('/reset-password', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async resendVerification() {
    return apiFetch<{ message: string }>('/email/resend', { method: 'POST' });
  },
};

// ─── Portfolio ───
export const portfolio = {
  async get() {
    return apiFetch<{ holdings: ApiHolding[]; cash: number }>('/portfolio');
  },

  async sync(holdings: { symbol: string; quantity: number; avg_cost: number }[], cash: number) {
    return apiFetch<{ message: string }>('/portfolio/sync', {
      method: 'POST',
      body: JSON.stringify({ holdings, cash }),
    });
  },

  async updateHolding(symbol: string, quantity: number, avg_cost: number) {
    return apiFetch<{ holding: ApiHolding }>('/portfolio/holding', {
      method: 'PUT',
      body: JSON.stringify({ symbol, quantity, avg_cost }),
    });
  },
};

// ─── Watchlists ───
export const watchlists = {
  async list() {
    return apiFetch<{ watchlists: ApiWatchlist[] }>('/watchlists');
  },

  async create(name: string, category = 'stocks', symbols: string[] = []) {
    return apiFetch<{ watchlist: ApiWatchlist }>('/watchlists', {
      method: 'POST',
      body: JSON.stringify({ name, category, symbols }),
    });
  },

  async update(id: number, data: { name?: string; symbols?: string[] }) {
    return apiFetch<{ watchlist: ApiWatchlist }>(`/watchlists/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async destroy(id: number) {
    return apiFetch<{ message: string }>(`/watchlists/${id}`, { method: 'DELETE' });
  },

  async addSymbol(id: number, symbol: string) {
    return apiFetch<{ watchlist: ApiWatchlist }>(`/watchlists/${id}/symbols`, {
      method: 'POST',
      body: JSON.stringify({ symbol }),
    });
  },

  async removeSymbol(id: number, symbol: string) {
    return apiFetch<{ watchlist: ApiWatchlist }>(`/watchlists/${id}/symbols/${symbol}`, {
      method: 'DELETE',
    });
  },
};

// ─── Orders ───
export const orders = {
  async list() {
    return apiFetch<{ orders: ApiOrder[] }>('/orders');
  },

  async create(order: CreateOrderPayload) {
    return apiFetch<{ order: ApiOrder }>('/orders', {
      method: 'POST',
      body: JSON.stringify(order),
    });
  },

  async cancel(id: number) {
    return apiFetch<{ order: ApiOrder }>(`/orders/${id}/cancel`, { method: 'POST' });
  },

  async trades() {
    return apiFetch<{ trades: ApiTrade[] }>('/trades');
  },
};

// ─── Alerts ───
export const alerts = {
  async list() {
    return apiFetch<{ alerts: ApiAlert[] }>('/alerts');
  },

  async create(alert: CreateAlertPayload) {
    return apiFetch<{ alert: ApiAlert }>('/alerts', {
      method: 'POST',
      body: JSON.stringify(alert),
    });
  },

  async update(id: number, data: Partial<CreateAlertPayload & { status: string }>) {
    return apiFetch<{ alert: ApiAlert }>(`/alerts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async destroy(id: number) {
    return apiFetch<{ message: string }>(`/alerts/${id}`, { method: 'DELETE' });
  },

  async history() {
    return apiFetch<{ history: ApiAlertHistory[] }>('/alerts/history');
  },
};

// ─── Workflows ───
export const workflows = {
  async list() {
    return apiFetch<{ workflows: ApiWorkflow[] }>('/workflows');
  },

  async create(data: { name: string; trigger_alert_id: number; conditions: unknown[]; actions: unknown[] }) {
    return apiFetch<{ workflow: ApiWorkflow }>('/workflows', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async destroy(id: number) {
    return apiFetch<{ message: string }>(`/workflows/${id}`, { method: 'DELETE' });
  },
};

// ─── Strategies ───
export const strategies = {
  async list() {
    return apiFetch<{ strategies: ApiStrategy[] }>('/strategies');
  },

  async create(data: CreateStrategyPayload) {
    return apiFetch<{ strategy: ApiStrategy }>('/strategies', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async update(id: number, data: Partial<CreateStrategyPayload>) {
    return apiFetch<{ strategy: ApiStrategy }>(`/strategies/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async destroy(id: number) {
    return apiFetch<{ message: string }>(`/strategies/${id}`, { method: 'DELETE' });
  },
};

// ─── Journal ───
export const journal = {
  async list() {
    return apiFetch<{ entries: ApiJournalEntry[] }>('/journal');
  },

  async save(entry: { entry_date: string; notes?: string; trades_data?: unknown[]; mood?: number; lessons?: string }) {
    return apiFetch<{ entry: ApiJournalEntry }>('/journal', {
      method: 'POST',
      body: JSON.stringify(entry),
    });
  },

  async destroy(id: number) {
    return apiFetch<{ message: string }>(`/journal/${id}`, { method: 'DELETE' });
  },
};

// ─── Settings ───
export const settings = {
  async get() {
    return apiFetch<{ settings: Record<string, unknown>; configured_providers: string[] }>('/settings');
  },

  async update(data: Record<string, unknown>) {
    return apiFetch<{ message: string }>('/settings', {
      method: 'PUT',
      body: JSON.stringify({ settings: data }),
    });
  },

  async getCredential(provider: string) {
    return apiFetch<{ credentials: Record<string, unknown> | null }>(`/credentials/${provider}`);
  },

  async saveCredential(provider: string, credentials: Record<string, unknown>) {
    return apiFetch<{ message: string }>('/credentials', {
      method: 'POST',
      body: JSON.stringify({ provider, credentials }),
    });
  },

  async deleteCredential(provider: string) {
    return apiFetch<{ message: string }>(`/credentials/${provider}`, { method: 'DELETE' });
  },
};

// ─── Notifications ───
export const notifications = {
  async list() {
    return apiFetch<{ notifications: ApiNotification[]; unread_count: number }>('/notifications');
  },

  async markRead(ids: number[]) {
    return apiFetch<{ message: string }>('/notifications/read', {
      method: 'POST',
      body: JSON.stringify({ ids }),
    });
  },

  async markAllRead() {
    return apiFetch<{ message: string }>('/notifications/read-all', { method: 'POST' });
  },
};

// ─── Market Data (public) ───
export const market = {
  async fearGreed() {
    return apiFetch<FearGreedResponse>('/market/fear-greed');
  },

  async ipos() {
    return apiFetch<{ ipos: ApiIpo[] }>('/market/ipos');
  },
};

// ─── Types ───
export interface ApiUser {
  id: number;
  name: string;
  email: string;
  avatar: string | null;
  plan: 'free' | 'pro' | 'enterprise';
  theme: string;
  email_verified: boolean;
  joined_at: string;
}

export interface ApiHolding {
  id: number;
  symbol: string;
  quantity: number;
  avg_cost: number;
}

export interface ApiWatchlist {
  id: number;
  name: string;
  category: string;
  items: { id: number; symbol: string; sort_order: number }[];
}

export interface ApiOrder {
  id: number;
  symbol: string;
  side: 'BUY' | 'SELL';
  type: string;
  quantity: number;
  limit_price: number | null;
  stop_price: number | null;
  tif: string;
  status: string;
  filled_qty: number;
  filled_price: number;
  pnl: number | null;
  filled_at: string | null;
  created_at: string;
}

export interface ApiTrade {
  id: number;
  order_id: number | null;
  symbol: string;
  side: 'BUY' | 'SELL';
  quantity: number;
  price: number;
  total: number;
  created_at: string;
}

export interface ApiAlert {
  id: number;
  name: string;
  category: string;
  status: string;
  config: Record<string, unknown>;
  recurring: boolean;
  cooldown_ms: number;
  trigger_count: number;
  triggered_at: string | null;
  expires_at: string | null;
  created_at: string;
}

export interface ApiAlertHistory {
  id: number;
  alert_id: number;
  message: string;
  alert?: { id: number; name: string; category: string };
  created_at: string;
}

export interface ApiWorkflow {
  id: number;
  name: string;
  enabled: boolean;
  trigger_alert_id: number;
  conditions: unknown[];
  actions: unknown[];
  trigger_count: number;
  last_triggered_at: string | null;
  trigger_alert?: { id: number; name: string };
}

export interface ApiStrategy {
  id: number;
  name: string;
  entry_conditions: unknown[];
  exit_conditions: unknown[];
  stop_loss: string | null;
  take_profit: string | null;
  position_size: string | null;
}

export interface ApiJournalEntry {
  id: number;
  entry_date: string;
  notes: string | null;
  trades_data: unknown[] | null;
  mood: number | null;
  lessons: string | null;
}

export interface ApiNotification {
  id: number;
  type: string;
  title: string;
  message: string;
  read: boolean;
  created_at: string;
}

export interface ApiIpo {
  symbol: string;
  name: string;
  date: string | null;
  exchange: string | null;
  price_range: string;
  shares: number | null;
  status: string;
}

export interface FearGreedResponse {
  score: number;
  label: string;
  components: Record<string, { value: number; score: number; label: string }>;
  updated_at: string;
}

interface CreateOrderPayload {
  symbol: string;
  side: 'BUY' | 'SELL';
  type: string;
  quantity: number;
  limit_price?: number;
  stop_price?: number;
  trail_amount?: number;
  trail_percent?: number;
  bracket_take_profit?: number;
  bracket_stop_loss?: number;
  tif?: string;
}

interface CreateAlertPayload {
  name: string;
  category: string;
  config: Record<string, unknown>;
  recurring?: boolean;
  cooldown_ms?: number;
  expires_at?: string;
}

interface CreateStrategyPayload {
  name: string;
  entry_conditions: unknown[];
  exit_conditions: unknown[];
  stop_loss?: string;
  take_profit?: string;
  position_size?: string;
}

// Default export for convenience
const api = { auth, portfolio, watchlists, orders, alerts, workflows, strategies, journal, settings, notifications, market };
export default api;
