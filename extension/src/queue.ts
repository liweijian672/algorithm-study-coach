import type { ParsedProblem, SubmitEvent } from "./types";

function hash(text: string): string {
  let result = 0;
  for (let i = 0; i < text.length; i += 1) {
    result = (result * 31 + text.charCodeAt(i)) >>> 0;
  }
  return result.toString(16);
}

export function eventKey(
  problem: ParsedProblem,
  code: string,
  status: string,
  submittedAt: string,
): string {
  return [
    problem.platform,
    problem.source_id,
    status,
    hash(code),
    submittedAt,
  ].join(":");
}

export class EventQueue {
  constructor(
    private read: () => SubmitEvent[],
    private write: (items: SubmitEvent[]) => void,
  ) {}

  push(event: SubmitEvent): void {
    const items = this.read();
    this.write([...items, event]);
  }

  async flush(send: (event: SubmitEvent) => Promise<void>): Promise<void> {
    const items = this.read();
    const remaining: SubmitEvent[] = [];
    for (const event of items) {
      try {
        await send(event);
      } catch {
        remaining.push(event);
      }
    }
    this.write(remaining);
  }
}

