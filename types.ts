
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
  liftingOffset: number; // 新增：相對於初始 Gap 的位移量
  standWidth: number;
  standDepth: number;
  standFrontOffset: number; // Distance from front of stand to front of base
  baseWidth: number;
  baseDepth: number;
  baseHeight: number;
  tiltForwardAngle: number;
  tiltBackwardAngle: number;
  swivelAngle: number;
  swivelPivotOffset: number; // Distance from rear edge of stand to swivel center
  standBaseAngle: number; // Angle between the base and the stand column (90 is vertical)
  labelOffsets: Record<string, number>;
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
