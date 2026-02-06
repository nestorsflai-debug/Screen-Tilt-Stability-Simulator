
import { ScreenDimensions } from '../types';

export const initialDimensions: ScreenDimensions = {
  screenWidth: 718,
  panelHeight: 412.63,
  backpackHeight: 288,
  backpackWidth: 437,
  panelThickness: 7,
  backpackThickness: 61,
  vesaNeckHeight: 29.4,
  vesaNeckDepth: 15,
  vesaNeckWidth: 40,
  standHeight: 300,
  standToNeckGap: -15, // Gap 初始設定值
  liftingOffset: 0,    // Lifting 初始數值為 0
  standWidth: 50,
  standDepth: 50,
  standFrontOffset: 150, // Distance from front of stand to front of base
  baseWidth: 220,
  baseDepth: 243.5,
  baseHeight: 5,
  tiltForwardAngle: 15,
  tiltBackwardAngle: 15,
  swivelAngle: 45,
  swivelPivotOffset: 25, // Centered in a 50mm deep stand by default
  standBaseAngle: 90,
  labelOffsets: {
    'front_screenWidth': -180,
    'front_backpackWidth': -220,
    'front_panelHeight': 120,
    'front_baseWidth': 50,
    'front_standWidth': -300,
    'front_neckWidth': -300,
    'front_backpackHeight': 185,
    'side_panelThickness': -180,
    'side_backpackThickness': -180,
    'side_neckDepth': -180,
    'side_standDepth': 30, // Updated from 40 to 30
    'side_baseDepth': 50,
    'side_frontOffset': 30, // Updated from 40 to 30
    'side_backpackHeight': -60,
    'side_neckHeight': 60,
    'side_standHeight': 110,
    'side_gap': 60,
    'side_baseHeight': 100,
    'top_baseWidth': -60,
    'top_baseDepth': -150,
    'top_pivotOffset': -150
  }
};
