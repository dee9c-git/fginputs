export class Action {
  direction: [number, number];
  buttons: Set<number>;

  constructor(direction?: [number, number] | null, buttons?: Set<number> | null) {
    this.direction = direction ?? [0, 0];
    this.buttons = buttons ?? new Set<number>();
  }

  equals(other: Action): boolean {
    return (
      this.direction[0] === other.direction[0] &&
      this.direction[1] === other.direction[1] &&
      this.buttonsEqual(other.buttons)
    );
  }

  private buttonsEqual(other: Set<number>): boolean {
    if (this.buttons.size !== other.size) return false;
    for (const btn of this.buttons) {
      if (!other.has(btn)) return false;
    }
    return true;
  }
}

export class SingleMove {
  action: Action;
  minFrames: number;
  maxFrames: number;

  constructor(action: Action, minFrames: number = 1, maxFrames: number = 60) {
    this.action = action;
    this.minFrames = minFrames;
    this.maxFrames = maxFrames;
  }
}

export class Move {
  sequence: SingleMove[];
  trigger: Action;
  buffer: number;

  constructor(sequence: SingleMove[], trigger: Action, buffer: number) {
    this.sequence = sequence;
    this.trigger = trigger;
    this.buffer = buffer;
  }
}

export interface Drill {
  name: string;
  move: Move;
  count: number;
}
