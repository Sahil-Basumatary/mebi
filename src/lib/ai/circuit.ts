export type CircuitProvider = "google" | "openai" | "anthropic";

type CircuitState = {
  failures: number;
  openUntil: number;
};

const FAILURE_LIMIT = 3;
const OPEN_MS = 10 * 60 * 1000;
const circuits = new Map<CircuitProvider, CircuitState>();

function stateOf(provider: CircuitProvider): CircuitState {
  return circuits.get(provider) ?? { failures: 0, openUntil: 0 };
}

export function isCircuitOpen(provider: CircuitProvider, now = Date.now()): boolean {
  return stateOf(provider).openUntil > now;
}

export function recordProviderSuccess(provider: CircuitProvider): void {
  circuits.set(provider, { failures: 0, openUntil: 0 });
}

export function recordProviderFailure(provider: CircuitProvider, now = Date.now()): CircuitState {
  const current = stateOf(provider);
  const failures = current.failures + 1;
  const next: CircuitState = {
    failures,
    openUntil: failures >= FAILURE_LIMIT ? now + OPEN_MS : 0,
  };
  circuits.set(provider, next);
  return next;
}

export function resetCircuits(): void {
  circuits.clear();
}
