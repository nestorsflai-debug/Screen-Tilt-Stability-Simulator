import React from 'react';
import { Point, ScreenDimensions } from '../types';
import DimensionLine from './DimensionLine';
import { useScreenGeometry } from '../hooks/useScreenGeometry';


type TopViewProps = {
  dimensions: ScreenDimensions;
  geometry: ReturnType<typeof useScreenGeometry>['topView'];
  sideViewPoints: { A: Point, B: Point, standCenterX: number };
  onDimensionChange: <K extends keyof ScreenDimensions>(key: K, value: ScreenDimensions[K]) => void;
  viewScale: number;
  isStable: boolean;
}

const TopView: React.FC<TopViewProps> = ({ dimensions, geometry, sideViewPoints, onDimensionChange, viewScale, isStable }) => {
    const { base, stand, panel, backpack, vesaNeck, pivot } = geometry;

    const commonProps = {
      stroke: "#1A202C",
      strokeWidth: 0.2,
      fillOpacity: 0.8
    };
    
    const baseFillColor = isStable ? "#4A5568" : "#7f1d1d";

    // Based on the corrected understanding:
    // A: -tiltBackwardAngle -> smaller X in SideView -> FORWARD point
    // B: +tiltForwardAngle -> larger X in SideView -> REARWARD point
    // We want A (forward) to be at a larger Y value (bottom).
    // We want B (rearward) to be at a smaller Y value (top).
    // The projection mapping should be: (X_side - CenterX_side) -> -(Y_top - CenterY_top)
    const standCenterY_TopView = stand.y + stand.height / 2;
    const y_A = standCenterY_TopView - (sideViewPoints.A.x - sideViewPoints.standCenterX);
    const y_B = standCenterY_TopView - (sideViewPoints.B.x - sideViewPoints.standCenterX);

    // New logic: The circle's diameter is the distance between A and B.
    const circleRadius = Math.abs(y_A - y_B) / 2;
    const circleCenterY = (y_A + y_B) / 2;

    const yTop = Math.min(base.y, stand.y, panel.y) - 10;
    const yBottom = Math.max(base.y + base.height, panel.y + panel.height) + 10;
    
    const SwivelGuide = ({ angle, isPrimary }: { angle: number, isPrimary: boolean }) => (
        <g transform={`rotate(${angle}, ${pivot.x}, ${pivot.y})`}>
            <circle
                cx={pivot.x}
                cy={circleCenterY}
                r={circleRadius}
                fill="none"
                stroke={isPrimary ? "#E53E3E" : "#FCA5A5"}
                strokeWidth={isPrimary ? 1.5 : 1}
                strokeDasharray={isPrimary ? "4 4" : "3 3"}
            />
            <line 
                x1={pivot.x} 
                y1={yTop} 
                x2={pivot.x} 
                y2={yBottom} 
                stroke={isPrimary ? "#E53E3E" : "#FCA5A5"}
                strokeWidth={isPrimary ? 1.5 : 1} 
                strokeDasharray={isPrimary ? "4 4" : "3 3"} 
            />
        </g>
    );

    return (
    <g>
        <text x={base.x + base.width/2} y={Math.max(base.y + base.height, panel.y + panel.height) + 40} textAnchor="middle" fill="#333" fontSize="14" fontWeight="bold">Top View</text>
      
      {/* Base */}
      <rect {...base} fill={baseFillColor} {...commonProps} />
      
      {/* Correct rendering order: from back (bottom layer) to front (top layer) */}
      <rect {...stand} fill="#718096" {...commonProps}/>
      <rect {...vesaNeck} fill="#A0AEC0" {...commonProps}/>
      <rect {...backpack} fill="#1A202C" {...commonProps}/>
      <rect {...panel} fill="#2D3748" {...commonProps}/>
      
      {/* Stability visuals: Centerline and swivel guides */}
      <SwivelGuide angle={0} isPrimary={true} />
      <SwivelGuide angle={45} isPrimary={false} />
      <SwivelGuide angle={-45} isPrimary={false} />

      {/* Pivot point */}
      <circle cx={pivot.x} cy={pivot.y} r="3" fill="#00A0A0" />
      
      {/* Projected A and B points, now correctly oriented */}
      {/* B is rearward (top), A is forward (bottom) */}
      <circle cx={pivot.x} cy={y_B} r="3" fill="#991B1B" />
      <text x={pivot.x + 8} y={y_B + 5} fill="#991B1B" fontSize="15" fontWeight="bold">B</text>
      <circle cx={pivot.x} cy={y_A} r="3" fill="#991B1B" />
      <text x={pivot.x + 8} y={y_A + 5} fill="#991B1B" fontSize="15" fontWeight="bold">A</text>

      {/* Dimension Lines */}
       <DimensionLine
        x1={base.x} y1={base.y} x2={base.x + base.width} y2={base.y}
        label="Base W" value={dimensions.baseWidth}
        onValueChange={(v) => onDimensionChange('baseWidth', v)}
        horizontal
        offset={-60}
        viewScale={viewScale}
      />
       <DimensionLine
        x1={base.x} y1={base.y} x2={base.x} y2={base.y + base.height}
        label="Base D" value={dimensions.baseDepth}
        onValueChange={(v) => onDimensionChange('baseDepth', v)}
        offset={-350}
        viewScale={viewScale}
      />
      <DimensionLine
        x1={base.x + base.width}
        y1={stand.y + stand.height}
        x2={base.x + base.width}
        y2={base.y + base.height}
        label="Front Offset" 
        value={dimensions.standFrontOffset}
        onValueChange={(v) => onDimensionChange('standFrontOffset', v)}
        offset={350}
        viewScale={viewScale}
      />
    </g>
  );
};
export default TopView;