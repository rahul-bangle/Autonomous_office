import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const hasSupabaseConfig = Boolean(supabaseUrl && supabaseKey);

const memoryStore = {};

function readTable(table) {
  if (typeof window === 'undefined') {
    return memoryStore[table] || [];
  }

  try {
    const raw = window.localStorage.getItem(`vo_mock_${table}`);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeTable(table, rows) {
  if (typeof window === 'undefined') {
    memoryStore[table] = rows;
    return;
  }

  try {
    window.localStorage.setItem(`vo_mock_${table}`, JSON.stringify(rows));
  } catch {
    // Ignore storage failures. The fallback must never block the UI.
  }
}

class MockSelectBuilder {
  constructor(table) {
    this.table = table;
    this.filters = [];
    this.orderBy = null;
    this.limitCount = null;
    this.expectSingle = false;
  }

  eq(column, value) {
    this.filters.push({ column, value });
    return this;
  }

  order(column, options = {}) {
    this.orderBy = { column, ascending: options.ascending !== false };
    return this;
  }

  limit(count) {
    this.limitCount = count;
    return this;
  }

  single() {
    this.expectSingle = true;
    return this;
  }

  async execute() {
    let rows = [...readTable(this.table)];

    rows = rows.filter((row) => this.filters.every(({ column, value }) => row?.[column] === value));

    if (this.orderBy) {
      const { column, ascending } = this.orderBy;
      rows.sort((a, b) => {
        const left = a?.[column];
        const right = b?.[column];
        if (left === right) return 0;
        if (left == null) return 1;
        if (right == null) return -1;
        return ascending ? (left > right ? 1 : -1) : (left < right ? 1 : -1);
      });
    }

    if (typeof this.limitCount === 'number') {
      rows = rows.slice(0, this.limitCount);
    }

    return {
      data: this.expectSingle ? rows[0] || null : rows,
      error: null,
    };
  }

  then(resolve, reject) {
    return this.execute().then(resolve, reject);
  }
}

class MockMutationBuilder {
  constructor(table, type, payload) {
    this.table = table;
    this.type = type;
    this.payload = payload;
  }

  async eq(column, value) {
    let rows = [...readTable(this.table)];

    if (this.type === 'update') {
      rows = rows.map((row) => (
        row?.[column] === value
          ? { ...row, ...this.payload, updated_at: this.payload.updated_at || new Date().toISOString() }
          : row
      ));
    }

    if (this.type === 'delete') {
      rows = rows.filter((row) => row?.[column] !== value);
    }

    writeTable(this.table, rows);
    return { data: null, error: null };
  }
}

function normalizeRows(payload) {
  const rows = Array.isArray(payload) ? payload : [payload];
  return rows.map((row) => {
    const now = new Date().toISOString();
    return {
      created_at: row?.created_at || now,
      updated_at: row?.updated_at || now,
      ...row,
    };
  });
}

function createMockSupabase() {
  return {
    from(table) {
      return {
        select() {
          return new MockSelectBuilder(table);
        },
        insert(payload) {
          const rows = [...readTable(table), ...normalizeRows(payload)];
          writeTable(table, rows);
          return Promise.resolve({ data: normalizeRows(payload), error: null });
        },
        upsert(payload) {
          const incomingRows = normalizeRows(payload);
          const existingRows = [...readTable(table)];
          const nextRows = [...existingRows];

          incomingRows.forEach((incomingRow) => {
            const rowIndex = nextRows.findIndex((row) => row?.id === incomingRow?.id);
            if (rowIndex >= 0) {
              nextRows[rowIndex] = {
                ...nextRows[rowIndex],
                ...incomingRow,
                updated_at: incomingRow.updated_at || new Date().toISOString(),
              };
            } else {
              nextRows.push(incomingRow);
            }
          });

          writeTable(table, nextRows);
          return Promise.resolve({ data: incomingRows, error: null });
        },
        update(payload) {
          return new MockMutationBuilder(table, 'update', payload);
        },
        delete() {
          return new MockMutationBuilder(table, 'delete', null);
        },
      };
    },
    auth: {
      getSession: () => Promise.resolve({ data: { session: null }, error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
    },
  };
}

export const supabase = hasSupabaseConfig
  ? createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
  : createMockSupabase();
