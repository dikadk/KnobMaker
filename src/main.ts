import { once, on, showUI } from "@create-figma-plugin/utilities";

import {
  CloseHandler,
  CreateRotaryKnobHandler,
  CreateLinearKnobHandler,
  CREATE_ROTARY_KNOB,
  CREATE_LINEAR_KNOB,
  Direction,
} from "./types";

function rotateAroundCenter(
  node: ComponentNode,
  centerNode: SceneNode,
  angleInDegrees: number,
  reverseDirection: boolean
) {
  // Calculate the center point of the target component
  const centerX = centerNode.x + centerNode.width / 2;
  const centerY = centerNode.y + centerNode.height / 2;

  //console.log("centerX:" + centerX);
  //console.log("centerY:" + centerY);
  console.log("angleInDegrees:" + angleInDegrees);

  // Calculate the relative position of the node to rotate
  const relativeX = node.x - centerX;
  const relativeY = node.y - centerY;

  // Convert the angle to radians
  const angleInRadians = (angleInDegrees * Math.PI) / 180;
  const currentRotationInRadians = (node.rotation * Math.PI) / 180;

  // Adjust the relative position based on the current rotation of the node
  const adjustedRelativeX =
    relativeX * Math.cos(currentRotationInRadians) +
    relativeY * Math.sin(currentRotationInRadians);
  const adjustedRelativeY =
    -relativeX * Math.sin(currentRotationInRadians) +
    relativeY * Math.cos(currentRotationInRadians);

  // Rotate the adjusted relative position by the desired angle
  const rotatedRelativeX =
    adjustedRelativeX * Math.cos(angleInRadians) -
    adjustedRelativeY * Math.sin(angleInRadians);
  const rotatedRelativeY =
    adjustedRelativeX * Math.sin(angleInRadians) +
    adjustedRelativeY * Math.cos(angleInRadians);

  // Calculate the new position of the node
  const newX = centerX + rotatedRelativeX;
  const newY = centerY + rotatedRelativeY;

  // Update the position and rotation of the node
  node.x = newX;
  node.y = newY;
  node.rotation = (node.rotation - angleInDegrees) % 360;
}

function resizeFrameToFitContents(frameNode: FrameNode) {
  if (frameNode.children.length === 0) return;

  // Calculate the bounding box of the children
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const child of frameNode.children) {
    const childX = child.x;
    const childY = child.y;
    const childWidth = child.width;
    const childHeight = child.height;

    minX = Math.min(minX, childX);
    minY = Math.min(minY, childY);
    maxX = Math.max(maxX, childX + childWidth);
    maxY = Math.max(maxY, childY + childHeight);
  }

  // Calculate the new size of the frame
  const newWidth = maxX - minX;
  const newHeight = maxY - minY;

  // Resize the frame
  frameNode.resize(newWidth, newHeight);

  // Move the children inside the frame
  for (const child of frameNode.children) {
    child.x -= minX;
    child.y -= minY;
  }
}

function isRotatingPointer(node: SceneNode) {
  return (
    node.name.toLowerCase().includes("pointer") ||
    node.name.toLowerCase().includes("knob") ||
    node.name.toLowerCase().includes("thumb")
  );
}

function isCenterComponent(node: SceneNode) {
  return (
    node.name.toLowerCase().includes("center") ||
    node.name.toLowerCase().includes("track") ||
    node.name.toLowerCase().includes("bar") ||
    node.name.toLowerCase().includes("bg")
  );
}

function moveThumb(
  node: ComponentNode,
  centerNode: SceneNode,
  direction: string,
  frameNum: number,
  frames: number
) {
  const frame = node.parent as FrameNode;
  const isHorizontal = direction === Direction.Horizontal.toString();
  const startOffset = isHorizontal
    ? node.x + node.width / 2
    : node.y + node.height / 2;

  const endOffset = isHorizontal
    ? frame.width - node.x - node.width / 2
    : frame.height - node.y - node.height / 2;

  const reverseDirection = startOffset > endOffset;
  const offset = reverseDirection ? endOffset : startOffset;

  const distancePerFrame = isHorizontal
    ? (frame.width - offset * 2) / (frames - 1)
    : (frame.height - offset * 2) / (frames - 1);
  const distance = frameNum * distancePerFrame;
  console.log("offset:" + offset);
  console.log("node.x:" + node.x);
  console.log("node.height:" + node.height);
  console.log("distancePerFrame:" + distancePerFrame);
  console.log("frame.height:" + frame.height);

  const reverseMultiplier = reverseDirection ? -1 : 1;
  if (direction === Direction.Horizontal.toString()) {
    node.x += distance * reverseMultiplier;
  } else {
    node.y += distance * reverseMultiplier;
  }
}

export default function () {
  on<CreateRotaryKnobHandler>(
    "CREATE_ROTARY_KNOB",
    function (
      frames: number,
      startAngle: number,
      endAngle: number,
      frameStartAngle: number,
      reverseDirection: boolean,
      isHorizontalOutput: boolean
    ) {
      //get selection first and check if it's a frame
      const selection = figma.currentPage.selection[0];
      //console.log("CreateRotaryKnobHandler");

      //console.log("startAngle", startAngle);
      //console.log("endAngle", endAngle);
      //console.log("frameAngle", frameStartAngle);
      if (selection.type != "FRAME") {
        figma.notify("Please select a Frame");
        //figma.closePlugin();
        return;
      }
      const frame = selection as FrameNode;

      if (frame.children.length === 0) {
        figma.notify("Please make sure the frame has children");
        //figma.closePlugin();
        return;
      }

      let frameRotationPointer = frame.findChild((node) =>
        isRotatingPointer(node)
      );

      let frameCenterComponent = frame.findChild((node) =>
        isCenterComponent(node)
      );

      if (!frameRotationPointer || !frameCenterComponent) {
        figma.notify(
          "Please make sure the frame has a Rotating pointer and a Center component"
        );
        //figma.closePlugin();
        return;
      }

      let knobFrame = figma.createFrame();
      knobFrame.name = frame.name + " - filmstrip";
      knobFrame.backgrounds = [
        { color: { r: 0, g: 0, b: 0 }, type: "SOLID", opacity: 0 },
      ];
      knobFrame.x = frame.x + frame.width + 50;
      knobFrame.y = frame.y;
      knobFrame.resizeWithoutConstraints(frame.width, frame.height * frames);

      const degrees = 360 - startAngle + endAngle;
      const degreePerFrame = degrees / (frames - 1);
      console.log("degrees:" + degrees);
      console.log("degreePerFrame:" + degreePerFrame);

      for (let i = 0; i < frames; i++) {
        let cl = frame.clone();
        cl.name = i + " frame";
        if (isHorizontalOutput) cl.x = i * frame.width;
        else cl.y = i * frame.height;

        let rotationPointer = cl.findChild((node) => isRotatingPointer(node));

        let centerComponent = cl.findChild((node) => isCenterComponent(node));

        if (rotationPointer && centerComponent) {
          let rt = rotationPointer as ComponentNode;
          let initialRotation = startAngle - frameStartAngle;
          if (i === 0) {
            let initialRotation = startAngle - frameStartAngle;
            if (initialRotation < 0) initialRotation = initialRotation + 360;

            rotateAroundCenter(
              rt,
              centerComponent,
              initialRotation,
              reverseDirection
            );
            //console.log("initialRotation:" + initialRotation);
            //console.log("startAngle:" + startAngle);
            //console.log("frameStartAngle:" + startAngle);
          } else {
            rotateAroundCenter(
              rt,
              centerComponent,
              initialRotation + degreePerFrame * i,
              reverseDirection
            );
            //console.log("degreePerFrame:" + degreePerFrame * i);
          }
          knobFrame.appendChild(cl);
        } else {
          break;
        }
      }
      resizeFrameToFitContents(knobFrame);

      if (knobFrame.children.length > 0) {
        figma.currentPage.appendChild(knobFrame);
        figma.viewport.scrollAndZoomIntoView([knobFrame]);
      }
      //figma.closePlugin();
    }
  );
  on<CreateLinearKnobHandler>(
    "CREATE_LINEAR_KNOB",
    function (
      frames: number,
      direction: string,
      reverseDirection: boolean,
      isHorizontalOutput: boolean
    ) {
      console.log("CreateLinearKnobHandler");
      //get selection first and check if it's a frame
      const selection = figma.currentPage.selection[0];
      if (selection.type != "FRAME") {
        figma.notify("Please select a Frame");
        figma.closePlugin();
        return;
      }
      const frame = selection as FrameNode;

      if (frame.children.length === 0) {
        figma.notify("Please make sure the frame has children");
        //figma.closePlugin();
        return;
      }

      let frameRotationPointer = frame.findChild((node) =>
        isRotatingPointer(node)
      );

      let frameCenterComponent = frame.findChild((node) =>
        isCenterComponent(node)
      );

      if (!frameRotationPointer || !frameCenterComponent) {
        figma.notify(
          "Please make sure the frame has a Rotating pointer and a Center component"
        );
        figma.closePlugin();
        return;
      }

      let knobFrame = figma.createFrame();
      knobFrame.name = frame.name + " - filmstrip";
      knobFrame.backgrounds = [
        { color: { r: 0, g: 0, b: 0 }, type: "SOLID", opacity: 0 },
      ];
      knobFrame.x = frame.x + frame.width + frame.width * 2;
      knobFrame.y = frame.y;
      knobFrame.resizeWithoutConstraints(frame.width, frame.height * frames);

      for (let i = 0; i < frames; i++) {
        let cl = frame.clone();
        cl.name = "";
        if (isHorizontalOutput) cl.x = i * frame.width;
        else cl.y = i * frame.height;

        let rotationPointer = cl.findChild((node) => isRotatingPointer(node));
        let centerComponent = cl.findChild((node) => isCenterComponent(node));

        if (rotationPointer && centerComponent) {
          let rt = rotationPointer as ComponentNode;
          moveThumb(rt, centerComponent, direction, i, frames);

          knobFrame.appendChild(cl);
        } else {
          break;
        }
      }
      resizeFrameToFitContents(knobFrame);

      if (knobFrame.children.length > 0) {
        figma.currentPage.appendChild(knobFrame);
        //figma.viewport.scrollAndZoomIntoView([knobFrame]);
      }
      //figma.closePlugin();
    }
  );

  once<CloseHandler>("CLOSE", function () {
    figma.closePlugin();
  });
  showUI({
    height: 580,
    width: 250,
  });
}
