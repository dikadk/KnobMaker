import { EventHandler } from "@create-figma-plugin/utilities";

export interface CreateKnobHandler extends EventHandler {
  name: "CREATE_KNOB";
  handler: (frames: number, degrees: number) => void;
}

export interface CloseHandler extends EventHandler {
  name: "CLOSE";
  handler: () => void;
}
