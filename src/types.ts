import { EventHandler } from "@create-figma-plugin/utilities";

export let CREATE_ROTARY_KNOB = "CREATE_ROTARY_KNOB";
export let CREATE_LINEAR_KNOB = "CREATE_LINEAR_KNOB";

export enum Direction {
  Horizontal = 0,
  Vertical,
  Rotary,
}

export interface CreateRotaryKnobHandler extends EventHandler {
  name: "CREATE_ROTARY_KNOB";
  handler: (
    frames: number,
    startAngle: number,
    endAngle: number,
    frameStartAngle: number
  ) => void;
}

export interface CreateLinearKnobHandler extends EventHandler {
  name: "CREATE_LINEAR_KNOB";
  handler: (frames: number, direction: string) => void;
}

export interface CloseHandler extends EventHandler {
  name: "CLOSE";
  handler: () => void;
}
