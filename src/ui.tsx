import {
  Button,
  Columns,
  Container,
  Muted,
  render,
  Text,
  TextboxNumeric,
  VerticalSpace,
} from "@create-figma-plugin/ui";
import { emit } from "@create-figma-plugin/utilities";
import { h } from "preact";
import { useCallback, useState } from "preact/hooks";

import { CloseHandler, CreateKnobHandler } from "./types";
import styled from "styled-components";

import "./styles.css";
import logo from "../assets/logo.png";

// Add the import at the top of your file

const StyledContainer = styled(Container)`
  animation: gradientAnimation 10s ease infinite;
  background: linear-gradient(120deg, #cf362e -10%, #033059 90%);
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
`;

function Plugin() {
  const [frames, setFrames] = useState<number | null>(128);
  const [framesString, setFramesString] = useState("128");

  const [degrees, setDegrees] = useState<number | null>(270);
  const [degreesString, setDegreesString] = useState("270");

  const handleCreateRectanglesButtonClick = useCallback(
    function () {
      console.log("frames", frames);
      console.log("degrees", degrees);
      if (frames !== null && degrees !== null) {
        emit<CreateKnobHandler>("CREATE_KNOB", frames, degrees);
      }
    },
    [frames, degrees]
  );
  const handleCloseButtonClick = useCallback(function () {
    emit<CloseHandler>("CLOSE");
  }, []);
  return (
    <StyledContainer className="animatedGradient" space="medium">
      <div className="vertical-column">
        <div className="logo">
          <img
            src={logo}
            alt="Knob Maker Logo"
            style={{ width: "200px", height: "200px" }}
          />
        </div>
        <VerticalSpace space="large" />
        <Text>
          <Muted>Frames</Muted>
        </Text>
        <VerticalSpace space="small" />
        <TextboxNumeric
          onNumericValueInput={setFrames}
          onValueInput={setFramesString}
          value={framesString}
          variant="border"
          style={{ backgroundColor: "#430F0C" }}
        />
        <VerticalSpace space="large" />
        <Text>
          <Muted>Degrees</Muted>
        </Text>
        <VerticalSpace space="small" />
        <TextboxNumeric
          onNumericValueInput={setDegrees}
          onValueInput={setDegreesString}
          value={degreesString}
          variant="border"
          style={{ backgroundColor: "#430F0C" }}
        />
        <VerticalSpace space="extraLarge" />
        <Columns space="extraSmall">
          <Button
            fullWidth
            onClick={handleCreateRectanglesButtonClick}
            style={{
              backgroundColor: "#eecf2e",
              color: "#000000",
              borderWidth: "0px",
            }}
          >
            Create
          </Button>
          <Button
            fullWidth
            onClick={handleCloseButtonClick}
            secondary
            style={{
              backgroundColor: "#eecf2e",
              color: "#000000",
              borderWidth: "0px",
            }}
          >
            Close
          </Button>
        </Columns>
        <VerticalSpace space="small" />
      </div>
    </StyledContainer>
  );
}

export default render(Plugin);
