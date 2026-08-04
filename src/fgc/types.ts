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

export class Frames {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }
}

export class SingleMove {
  action: Action;
  frames: Frames;

  constructor(action: Action, frames?: Frames) {
    this.action = action;
    this.frames = frames ?? new Frames(1, 60);
  }
}

export class Move {
  sequences: SingleMove[][];
  triggers: Action[];
  buffer: number;

  constructor(sequences: SingleMove[][], triggers: Action[], buffer: number) {
    this.sequences = sequences;
    this.triggers = triggers;
    this.buffer = buffer;
  }
}

export interface Drill {
  name: string;
  move: Move;
  count: number;
  combo: number;
  missed: boolean;
  attempts: number;
  totalFrames: number;
  lastFrames: number;
  lastMissed: boolean;
}
