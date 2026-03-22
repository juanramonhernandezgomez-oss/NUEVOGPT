import { createRecord, deleteRecord, readCollection } from '@/lib/localStore';

const WATCHLIST_KEY = 'investpro_watchlist';
const HISTORY_KEY = 'investpro_analysis_history';

function sortRecords(records, order = '-created_date') {
  const sorted = [...records];
  const desc = order.startsWith('-');
  const key = desc ? order.slice(1) : order;
  sorted.sort((a, b) => {
    const left = a[key] ?? '';
    const right = b[key] ?? '';
    return desc ? String(right).localeCompare(String(left)) : String(left).localeCompare(String(right));
  });
  return sorted;
}

export const localDb = {
  auth: {
    isAuthenticated: async () => true,
    me: async () => ({ id: 'local-user', email: 'demo@local.dev', full_name: 'Demo User' }),
    logout: () => {},
    redirectToLogin: () => {},
  },
  entities: {
    Watchlist: {
      list: async (order = '-created_date') => sortRecords(readCollection(WATCHLIST_KEY, []), order),
      create: async (data) => createRecord(WATCHLIST_KEY, data),
      delete: async (id) => deleteRecord(WATCHLIST_KEY, id),
    },
    AnalysisHistory: {
      list: async (order = '-created_date', limit = 50) => sortRecords(readCollection(HISTORY_KEY, []), order).slice(0, limit),
      create: async (data) => createRecord(HISTORY_KEY, data),
      delete: async (id) => deleteRecord(HISTORY_KEY, id),
    },
  },
};

export default localDb;
