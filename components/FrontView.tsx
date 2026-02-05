import React from 'react';
import { ScreenDimensions } from '../types';
import DimensionLine from './DimensionLine';
import { useScreenGeometry } from '../hooks/useScreenGeometry';

type FrontViewProps = {
  dimensions: ScreenDimensions;
  geometry: ReturnType<typeof useScreenGeometry>['frontView'];
  onDimensionChange: <K extends keyof ScreenDimensions>(key: K, value: ScreenDimensions[K]) => void;
  viewScale: number;
  isStable: boolean;
}

const FrontView: React.FC<FrontViewProps> = ({ dimensions, geometry, onDimensionChange, viewScale, isStable }) => {
    const { base, stand, panel, backpack, vesaNeck, floorY, combinedCg } = geometry;

     const commonProps = {
      stroke: "#1A202C",
      strokeWidth: 0.2,
      fillOpacity: 0.8
    };
    
    const baseFillColor = isStable ? "#4A5568" : "#7f1d1d";

    return (
    <g>
        <text x={base.x + base.width/2} y={base.y + base.height + 80} textAnchor="middle" fill="#333" fontSize="14" fontWeight="bold">Front View</text>
      {/* Base */}
      <rect {...base} fill={baseFillColor} {...commonProps}/>
      {/* Stand */}
      <rect {...stand} fill="#718096" {...commonProps}/>
       {/* Backpack - drawn behind panel */}
      <rect {...backpack} fill="#1A202C" {...commonProps}/>
      {/* Vesa Neck */}
      <rect {...vesaNeck} fill="#A0AEC0" {...commonProps}/>
      {/* Panel (Screen) */}
      <rect {...panel} fill="#2D3748" {...commonProps} />
      
      {/* Center of Gravity */}
      <path d={`M ${combinedCg.x - 5} ${combinedCg.y} L ${combinedCg.x + 5} ${combinedCg.y} M ${combinedCg.x} ${combinedCg.y - 5} L ${combinedCg.x} ${combinedCg.y + 5}`} stroke="#E53E3E" strokeWidth="1" />
      <circle cx={combinedCg.x} cy={combinedCg.y} r="2.5" fill="none" stroke="#E53E3E" strokeWidth="1"/>

      {/* Ground Line */}
      <line x1={base.x - 25} y1={floorY} x2={base.x + base.width + 25} y2={floorY} stroke="#333" strokeWidth="0.5" />
    
     {/* Dimension Lines */}
      <DimensionLine
        x1={panel.x} y1={panel.y} x2={panel.x + panel.width} y2={panel.y}
        label="Screen W" value={dimensions.screenWidth}
        onValueChange={(v) => onDimensionChange('screenWidth', v)}
        horizontal
        offset={-180}
        viewScale={viewScale}
      />
      <DimensionLine
        x1={backpack.x} y1={backpack.y} x2={backpack.x + backpack.width} y2={backpack.y}
        label="Backpack W" value={dimensions.backpackWidth}
        onValueChange={(v) => onDimensionChange('backpackWidth', v)}
        horizontal
        offset={-220}
        viewScale={viewScale}
      />
      <DimensionLine
        x1={panel.x + panel.width} y1={panel.y} x2={panel.x + panel.width} y2={panel.y + panel.height}
        label="Panel H" value={dimensions.panelHeight}
        onValueChange={(v) => onDimensionChange('panelHeight', v)}
        offset={120}
        viewScale={viewScale}
      />
       <DimensionLine
        x1={base.x} y1={base.y + base.height} x2={base.x + base.width} y2={base.y + base.height}
        label="Base W" value={dimensions.baseWidth}
        onValueChange={(v) => onDimensionChange('baseWidth', v)}
        horizontal
        offset={50}
        viewScale={viewScale}
      />
       <DimensionLine
        x1={stand.x} y1={stand.y} x2={stand.x + stand.width} y2={stand.y}
        label="Stand W" value={dimensions.standWidth}
        onValueChange={(v) => onDimensionChange('standWidth', v)}
        horizontal
        offset={-300}
        viewScale={viewScale}
      />
      <DimensionLine
        x1={vesaNeck.x} y1={vesaNeck.y} x2={vesaNeck.x + vesaNeck.width} y2={vesaNeck.y}
        label="Neck W" value={dimensions.vesaNeckWidth}
        onValueChange={(v) => onDimensionChange('vesaNeckWidth', v)}
        horizontal
        offset={-300}
        viewScale={viewScale}
      />
      {/* Backpack H rendered last to be on top */}
      <DimensionLine
        x1={backpack.x + backpack.width} y1={backpack.y} x2={backpack.x + backpack.width} y2={backpack.y + backpack.height}
        label="Backpack H" value={dimensions.backpackHeight}
        onValueChange={(v) => onDimensionChange('backpackHeight', v)}
        offset={185}
        viewScale={viewScale}
      />
    </g>
  );
};
export default FrontView;