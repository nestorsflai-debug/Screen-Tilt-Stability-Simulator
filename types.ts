
export interface ScreenDimensions {
  screenWidth: number;
  panelHeight: number;
  backpackHeight: number;
  backpackWidth: number;
  panelThickness: number;
  backpackThickness: number;
  vesaNeckHeight: number;
  vesaNeckDepth: number;
  vesaNeckWidth: number;
  standHeight: number;
  standToNeckGap: number;
  standWidth: number;
  standDepth: number;
  standFrontOffset: number; // Distance from front of stand to front of base
  baseWidth: number;
  baseDepth: number;
  baseHeight: number;
  tiltForwardAngle: number;
  tiltBackwardAngle: number;
  swivelAngle: number;
}

export interface Point {
  x: number;
  y: number;
}

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}