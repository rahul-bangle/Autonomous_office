// ─── OFFICE OS EVENT BUS ──────────────────────────────────────────────────────
// Singleton pub/sub bus. Import and use anywhere — no direct component wiring.
//
// Supported events:
//   agent.added      payload: { agent }
//   agent.removed    payload: { agentId }
//   agent.updated    payload: { agentId, updates }
//   agent.moved      payload: { agentId, x, y, zone }
//   task.started     payload: { userMessage, agentSequence }
//   task.assigned    payload: { userMessage, agents, result, totalTokens }
//   meeting.start    payload: {}
//   meeting.end      payload: {}

const VALID_EVENTS = new Set([
  'agent.added',
  'agent.removed',
  'agent.moved',
  'agent.updated',
  'task.started',
  'task.assigned',
  'meeting.start',
  'meeting.end',
]);

class EventBus {
  constructor() {
    this._listeners = {}; // eventName → Set<fn>
  }

  /**
   * Register a listener for an event.
   * Returns an unsubscribe function for easy cleanup in useEffect.
   */
  on(event, fn) {
    if (!VALID_EVENTS.has(event)) {
      console.warn(`[EventBus] Unknown event: "${event}". Supported: ${[...VALID_EVENTS].join(', ')}`);
    }
    if (!this._listeners[event]) this._listeners[event] = new Set();
    this._listeners[event].add(fn);
    return () => this.off(event, fn); // unsubscribe handle
  }

  /** Remove a specific listener. */
  off(event, fn) {
    this._listeners[event]?.delete(fn);
  }

  /**
   * Emit an event with an optional payload.
   * All registered listeners are called synchronously.
   */
  emit(event, payload = {}) {
    if (!VALID_EVENTS.has(event)) {
      console.warn(`[EventBus] Emitting unknown event: "${event}"`);
    }
    console.debug(`[EventBus] → ${event}`, payload);
    this._listeners[event]?.forEach(fn => {
      try { fn(payload); }
      catch (err) { console.error(`[EventBus] Listener error on "${event}":`, err); }
    });
  }

  /** Clear all listeners (useful for testing). */
  clear(event) {
    if (event) delete this._listeners[event];
    else this._listeners = {};
  }
}

// Export single shared instance
const bus = new EventBus();
export default bus;
