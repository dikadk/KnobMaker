import { once, showUI } from "@create-figma-plugin/utilities";

import { CloseHandler, CreateKnobHandler } from "./types";

function rotateAroundCenter(
  node: ComponentNode,
  centerNode: SceneNode,
  angleInDegrees: number
) {
  // Calculate the center point of the target component
  const centerX = centerNode.x + centerNode.width / 2;
  const centerY = centerNode.y + centerNode.height / 2;

  console.log("centerX:" + centerX);
  console.log("centerY:" + centerY);

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
  return node.name.toLowerCase().includes("pointer");
}

function isCenterComponent(node: SceneNode) {
  return node.name.toLowerCase().includes("center");
}

export default function () {
  once<CreateKnobHandler>(
    "CREATE_KNOB",
    function (frames: number, degrees: number) {
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
        figma.closePlugin();
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
      knobFrame.x = frame.x + frame.width + 50;
      knobFrame.y = frame.y;
      knobFrame.resizeWithoutConstraints(frame.width, frame.height * frames);

      const degreePerFrame = degrees / frames;

      for (let i = 0; i < frames; i++) {
        let cl = frame.clone();
        cl.name = "";
        cl.y = i * frame.height;

        let rotationPointer = cl.findChild((node) => isRotatingPointer(node));

        let centerComponent = cl.findChild((node) => isCenterComponent(node));

        if (rotationPointer && centerComponent) {
          let rt = rotationPointer as ComponentNode;
          rotateAroundCenter(rt, centerComponent, degreePerFrame * i);

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
      figma.closePlugin();
    }
  );
  once<CloseHandler>("CLOSE", function () {
    figma.closePlugin();
  });
  showUI({
    height: 480,
    width: 250,
  });
}
