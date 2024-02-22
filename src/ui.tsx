import {
  Button,
  Columns,
  Container,
  Muted,
  render,
  Text,
  RadioButtons,
  RadioButtonsOption,
  TextboxNumeric,
  VerticalSpace,
} from "@create-figma-plugin/ui";
import { emit } from "@create-figma-plugin/utilities";
import { h, JSX } from "preact";
import { useCallback, useEffect, useState } from "preact/hooks";

import {
  CREATE_ROTARY_KNOB,
  CREATE_LINEAR_KNOB,
  CloseHandler,
  CreateLinearKnobHandler,
  CreateRotaryKnobHandler,
  Direction,
} from "./types";
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

const options: Array<RadioButtonsOption> = [
  {
    children: <Text>Horizontal</Text>,
    value: Direction.Horizontal.toString(),
  },
  {
    children: <Text>Vertical</Text>,
    value: Direction.Vertical.toString(),
  },
  {
    children: <Text>Rotary</Text>,
    value: Direction.Rotary.toString(),
  },
];

const outputFramesOptions: Array<RadioButtonsOption> = [
  {
    children: <Text>Horizontal</Text>,
    value: Direction.Horizontal.toString(),
  },
  {
    children: <Text>Vertical</Text>,
    value: Direction.Vertical.toString(),
  },
];

const Row = styled.div`
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
`;

const Navigation = styled.div`
  align-items: center;
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  padding: 10px;
  width: calc(100% - 20px);

  @media (max-width: 768px) {
    flex-direction: column;
  }
`;

function Plugin() {
  const [frames, setFrames] = useState<number | null>(3);
  const [framesString, setFramesString] = useState("3");

  const [frameAngle, setFrameAngle] = useState<number | null>(360);
  const [frameAngleString, setFrameAngleString] = useState("360");

  const [startAngle, setStartAngle] = useState<number | null>(225);
  const [startAngleString, setStartAngleString] = useState("225");

  const [endAngle, setEndAngle] = useState<number | null>(135);
  const [endAngleString, setEndAngleString] = useState("135");

  const [selectedDirection, setSelectedRadio] = useState<string>(
    Direction.Vertical.toString()
  );

  const [reverseDirection, setReverseDirection] = useState<boolean>(false);
  const [isHorizontalOutput, setIsHorizontalOutput] = useState<string>(
    Direction.Horizontal.toString()
  );

  useEffect(() => {
    // Load saved state data
    figma.clientStorage.getAsync("myPluginState").then((data) => {
      if (data) {
        const state = JSON.parse(data);
        setFrames(state.frames);
        setFramesString(state.framesString);

        setFrameAngle(state.frameAngle);
        setFrameAngleString(state.frameAngleString);

        setStartAngle(state.startAngle);
        setStartAngleString(state.startAngleString);

        setEndAngle(state.endAngle);
        setEndAngleString(state.endAngleString);

        setSelectedRadio(state.selectedDirection);
        setReverseDirection(state.reverseDirection);

        setIsHorizontalOutput(state.isHorizontalOutput);
      }
    });
  }, []);

  useEffect(() => {
    // Save state data
    const state = {
      frames,
      framesString,

      frameAngle,
      frameAngleString,

      startAngle,
      startAngleString,

      endAngle,
      endAngleString,

      selectedDirection,
      reverseDirection,

      isHorizontalOutput,
    };
    figma.clientStorage.setAsync("myPluginState", JSON.stringify(state));
  }, [frames, framesString]);

  function handleChange(event: JSX.TargetedEvent<HTMLInputElement>) {
    const newValue = event.currentTarget.value;
    console.log(newValue);
    setSelectedRadio(newValue);
  }

  function handleReverseDirectionCheckbox(
    event: JSX.TargetedEvent<HTMLInputElement>
  ) {
    const newValue = event.currentTarget.checked;
    setReverseDirection(newValue);
  }

  function handleIsHorizontalOutputOptionChange(
    event: JSX.TargetedEvent<HTMLInputElement>
  ) {
    const newValue = event.currentTarget.value;
    setIsHorizontalOutput(newValue);
  }

  const handleCreateRectanglesButtonClick = useCallback(
    function () {
      if (
        frames !== null &&
        startAngle !== null &&
        endAngle !== null &&
        selectedDirection !== null &&
        frameAngle !== null
      ) {
        if (selectedDirection === Direction.Rotary.toString()) {
          emit<CreateRotaryKnobHandler>(
            "CREATE_ROTARY_KNOB",
            frames,
            startAngle,
            endAngle,
            frameAngle,
            reverseDirection,
            isHorizontalOutput === Direction.Horizontal.toString()
          );
        } else {
          emit<CreateLinearKnobHandler>(
            "CREATE_LINEAR_KNOB",
            frames,
            selectedDirection,
            reverseDirection,
            isHorizontalOutput === Direction.Horizontal.toString()
          );
        }
      }
    },
    [
      frames,
      startAngle,
      endAngle,
      frameAngle,
      selectedDirection,
      reverseDirection,
      isHorizontalOutput,
    ]
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
            style={{ width: "100px", height: "100px" }}
          />
        </div>
        <VerticalSpace space="small" />
        <Text>
          <Muted>Knob Type:</Muted>
        </Text>
        <VerticalSpace space="small" />
        <Columns space="extraSmall">
          <RadioButtons
            onChange={handleChange}
            options={options}
            value={selectedDirection}
          />
        </Columns>
        <VerticalSpace space="small" />
        <Text>
          <Muted>Frame Angle:</Muted>
        </Text>
        <VerticalSpace space="extraSmall" />
        <TextboxNumeric
          id={"frameAngle"}
          onNumericValueInput={setFrameAngle}
          onValueInput={setFrameAngleString}
          value={frameAngleString}
          variant="border"
          disabled={selectedDirection !== Direction.Rotary.toString()}
          style={{ backgroundColor: "#430F0C" }}
        />
        <VerticalSpace space="small" />
        <Text>
          <Muted>Start Angle</Muted>
        </Text>
        <VerticalSpace space="extraSmall" />
        <TextboxNumeric
          onNumericValueInput={setStartAngle}
          onValueInput={setStartAngleString}
          value={startAngleString}
          variant="border"
          disabled={selectedDirection !== Direction.Rotary.toString()}
          style={{ backgroundColor: "#430F0C" }}
        />
        <VerticalSpace space="small" />
        <Text>
          <Muted>End Angle</Muted>
        </Text>
        <VerticalSpace space="extraSmall" />
        <TextboxNumeric
          onNumericValueInput={setEndAngle}
          onValueInput={setEndAngleString}
          value={endAngleString}
          variant="border"
          disabled={selectedDirection !== Direction.Rotary.toString()}
          style={{ backgroundColor: "#430F0C" }}
        />
        <VerticalSpace space="small" />
        <Text>
          <Muted>Frames</Muted>
        </Text>
        <VerticalSpace space="extraSmall" />
        <TextboxNumeric
          onNumericValueInput={setFrames}
          onValueInput={setFramesString}
          value={framesString}
          variant="border"
          style={{ backgroundColor: "#430F0C" }}
        />
        <VerticalSpace space="small" />
        <VerticalSpace space="extraSmall" />
        <Text>
          <Muted>Output frames direction:</Muted>
        </Text>
        <VerticalSpace space="small" />
        <Columns space="extraSmall">
          <RadioButtons
            onChange={handleIsHorizontalOutputOptionChange}
            options={outputFramesOptions}
            value={isHorizontalOutput}
          />
        </Columns>

        <VerticalSpace space="large" />
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
