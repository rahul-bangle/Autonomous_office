import { PRIORITY_ORDER } from './constants';
import { hasSupabaseConfig } from './supabaseClient';

export const DEFAULT_MODEL = 'groq/llama-3.3-70b-versatile';

export const DEFAULT_SKILLS = [
  { id: 'Research', name: 'Research', description: 'Structured market and competitor research.' },
  { id: 'Analysis', name: 'Analysis', description: 'Synthesis and trend interpretation.' },
  { id: 'Strategy', name: 'Strategy', description: 'Frameworks, prioritization, and tradeoffs.' },
  { id: 'Validation', name: 'Validation', description: 'Evidence checks and build/no-build thinking.' },
  { id: 'Web Search', name: 'Web Search', description: 'Fresh web lookups for PM workflows.' },
  { id: 'PRD Drafting', name: 'PRD Drafting', description: 'Structured requirement writing.' },
];

export const PM_AGENTS = [
  {
    id: 'scout',
    name: 'Scout',
    role: 'Market Researcher',
    goal: 'Track market shifts, competitor launches, and customer signals.',
    desc: 'Daily PM intelligence across competitors, industry moves, and user signals.',
    color: '#ff6b6b',
    priority: 'High',
    zone: 'workspace',
    skills: ['Research', 'Web Search'],
    tools: ['Browser', 'Intel Feed'],
    provider: 'groq',
    model: DEFAULT_MODEL,
    system_prompt: '',
    is_active: true,
    is_seeded: true,
  },
  {
    id: 'analyst',
    name: 'Analyst',
    role: 'Data Analyst',
    goal: 'Turn raw inputs into clear PM metrics and insight.',
    desc: 'Crunches patterns, trends, and PM-relevant signals into usable summaries.',
    color: '#60a5fa',
    priority: 'High',
    zone: 'workspace',
    skills: ['Analysis', 'Validation'],
    tools: ['Sheets', 'Dashboard'],
    provider: 'groq',
    model: DEFAULT_MODEL,
    system_prompt: '',
    is_active: true,
    is_seeded: true,
  },
  {
    id: 'strategist',
    name: 'Strategist',
    role: 'Product Strategist',
    goal: 'Frame decisions, prioritize, and shape PM direction.',
    desc: 'Applies PM frameworks and turns research into decisions.',
    color: '#4ecdc4',
    priority: 'High',
    zone: 'workspace',
    skills: ['Strategy', 'Analysis'],
    tools: ['Whiteboard', 'Frameworks'],
    provider: 'groq',
    model: DEFAULT_MODEL,
    system_prompt: '',
    is_active: true,
    is_seeded: true,
  },
  {
    id: 'critic',
    name: 'Critic',
    role: 'Devil’s Advocate',
    goal: 'Challenge assumptions and pressure-test PM thinking.',
    desc: 'Surfaces risks, blind spots, and weak assumptions before decisions ship.',
    color: '#a78bfa',
    priority: 'High',
    zone: 'workspace',
    skills: ['Validation', 'Strategy'],
    tools: ['Review Board'],
    provider: 'groq',
    model: DEFAULT_MODEL,
    system_prompt: '',
    is_active: true,
    is_seeded: true,
  },
  {
    id: 'chief',
    name: 'Chief',
    role: 'Executive',
    goal: 'Approve PM direction and deliver final synthesis.',
    desc: 'Final PM synthesis, recommendation, and executive call.',
    color: '#fb923c',
    priority: 'Critical',
    zone: 'ceoCabin',
    skills: ['Strategy', 'PRD Drafting'],
    tools: ['Dashboard', 'Decision Log'],
    provider: 'groq',
    model: DEFAULT_MODEL,
    system_prompt: '',
    is_active: true,
    is_seeded: true,
  },
];

export const PM_TASKS = [
  {
    id: 'task-intel',
    title: 'Review AI PM competitor updates',
    description: 'Collect the latest competitor shipping signals for PM tooling.',
    status: 'To Do',
    priority: 'High',
    assignee_agent_id: 'scout',
    module: 'intel',
    source_type: 'manual',
    source_ref: null,
  },
  {
    id: 'task-sizing',
    title: 'Size workflow automation opportunity',
    description: 'Estimate whether PM automation deserves deeper validation.',
    status: 'In Progress',
    priority: 'Critical',
    assignee_agent_id: 'analyst',
    module: 'research',
    source_type: 'idea',
    source_ref: 'idea-ai-automation',
  },
  {
    id: 'task-prd',
    title: 'Outline PM Edition shell PRD',
    description: 'Translate the shell direction into a structured spec.',
    status: 'Done',
    priority: 'High',
    assignee_agent_id: 'strategist',
    module: 'prd',
    source_type: 'manual',
    source_ref: null,
  },
];

export const PM_INTEL = [
  {
    id: 'intel-1',
    title: 'AI product suites keep converging on PM copilots',
    summary: 'Vendors are tightening discovery, planning, and execution into one flow. The PM angle is workflow compression, not just note generation.',
    source_name: 'Seeded Intel',
    source_url: '',
    category: 'Market',
    status: 'new',
    confidence: 'High',
    captured_by_agent_id: 'scout',
    raw_snippet: 'PM tooling is shifting toward orchestration and context retention.',
    captured_at: new Date().toISOString(),
  },
  {
    id: 'intel-2',
    title: 'Competitors are using “second brain” positioning aggressively',
    summary: 'Context retention and knowledge grounding are no longer a differentiator on their own. The edge is decision velocity on top of retained context.',
    source_name: 'Seeded Intel',
    source_url: '',
    category: 'Competitors',
    status: 'actionable',
    confidence: 'Medium',
    captured_by_agent_id: 'strategist',
    raw_snippet: 'Most products now promise memory. Few promise decisions.',
    captured_at: new Date().toISOString(),
  },
];

export const IDEA_ITEMS = [
  { id: 'idea-ai-automation', title: 'PM workflow automation scorecard', hypothesis: 'PMs need one place to review opportunity signals daily.', stage: 'exploring' },
  { id: 'idea-briefs', title: 'Weekly product brief generator', hypothesis: 'A concise PM brief can replace scattered status notes.', stage: 'raw' },
];

export const PRD_ITEMS = [
  {
    id: 'prd-shell',
    title: 'PM Edition Command Shell',
    status: 'active',
    owner: 'Chief',
    summary: 'Navigation, module routing, and shell structure for the PM workspace.',
    updated_at: 'Today',
  },
  {
    id: 'prd-intel',
    title: 'Market Intel Feed',
    status: 'draft',
    owner: 'Scout',
    summary: 'Normalized signal feed for competitor moves, market shifts, and PM insight capture.',
    updated_at: 'Today',
  },
];

export const CONNECTIONS = [
  { key: 'supabase', label: 'Supabase', status: hasSupabaseConfig ? 'connected' : 'needs_setup', description: 'Primary persistence layer for PM entities.', last_checked_at: 'local' },
  { key: 'github', label: 'GitHub', status: 'connected', description: 'Codebase source and delivery workflow.', last_checked_at: 'local' },
  { key: 'openrouter', label: 'OpenRouter', status: 'needs_setup', description: 'Optional multi-model routing layer.', last_checked_at: 'local' },
  { key: 'telegram', label: 'Telegram', status: 'needs_setup', description: 'Notification and ops channel.', last_checked_at: 'local' },
  { key: 'pinecone', label: 'Pinecone', status: 'needs_setup', description: 'Future vector memory backend.', last_checked_at: 'local' },
  { key: 'youtube', label: 'YouTube', status: 'needs_setup', description: 'Reserved for future content and analytics ingestion.', last_checked_at: 'local' },
  { key: 'instagram', label: 'Instagram', status: 'needs_setup', description: 'Reserved for future social tracking.', last_checked_at: 'local' },
];

export function safeParse(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

export function normalizeAgent(agent) {
  return {
    created_at: agent.created_at || new Date().toISOString(),
    updated_at: agent.updated_at || new Date().toISOString(),
    provider: agent.provider || 'groq',
    model: agent.model || DEFAULT_MODEL,
    system_prompt: agent.system_prompt || '',
    is_active: agent.is_active !== false,
    is_seeded: Boolean(agent.is_seeded),
    goal: agent.goal || agent.desc || '',
    desc: agent.desc || agent.goal || '',
    skills: agent.skills || [],
    tools: agent.tools || [],
    ...agent,
  };
}

export function normalizeTask(task) {
  return {
    description: task.description || '',
    module: task.module || 'general',
    source_type: task.source_type || 'manual',
    source_ref: task.source_ref || null,
    assignee_agent_id: task.assignee_agent_id || task.assignee || 'unassigned',
    created_at: task.created_at || new Date().toISOString(),
    updated_at: task.updated_at || new Date().toISOString(),
    ...task,
  };
}

export function normalizeIntelItem(item) {
  return {
    source_name: item.source_name || 'Web Search',
    category: item.category || 'Market',
    status: item.status || 'new',
    confidence: item.confidence || 'Medium',
    captured_by_agent_id: item.captured_by_agent_id || 'scout',
    raw_snippet: item.raw_snippet || item.summary || '',
    captured_at: item.captured_at || new Date().toISOString(),
    ...item,
  };
}

export function mergeIntelItems(existingItems, incomingItems) {
  const merged = new Map(existingItems.map((item) => [String(item.id), item]));
  incomingItems.forEach((item) => {
    const current = merged.get(String(item.id));
    merged.set(String(item.id), {
      ...item,
      status: current?.status || item.status || 'new',
    });
  });
  return [...merged.values()].sort((left, right) => new Date(right.captured_at) - new Date(left.captured_at));
}

export function sortAgents(agents) {
  return [...agents].sort((left, right) => (PRIORITY_ORDER[left.priority] ?? 2) - (PRIORITY_ORDER[right.priority] ?? 2));
}
