
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ScreenDimensions } from '../types';
import DimensionLine from './DimensionLine';
import { useScreenGeometry } from '../hooks/useScreenGeometry';

type SideViewProps = {
  dimensions: ScreenDimensions;
  geometry: ReturnType<typeof useScreenGeometry>['sideView'];
  onDimensionChange: <K extends keyof ScreenDimensions>(key: K, value: ScreenDimensions[K]) => void;
  viewScale: number;
  isStable: boolean;
}

// Helper component for SVG marker definition
const ArrowDefs = () => (
    <defs>
        <marker 
            id="dim-arrow" 
            viewBox="0 -5 10 10"
            refX="5" 
            refY="0"
            markerWidth="6" 
            markerHeight="6" 
            orient="auto"
        >
            <path d="M0,-5L10,0L0,5" fill="#3b82f6" />
        </marker>
    </defs>
);


const SideView: React.FC<SideViewProps> = ({ dimensions, geometry, onDimensionChange, viewScale, isStable }) => {
    const { 
        base, stand, panel, backpack, vesaNeck, pivot, thicknessLine1, thicknessLine2, pointA, pointB, floorY,
        screen, combinedCg
    } = geometry;

    // State for editing tilt values
    const [isEditingForward, setIsEditingForward] = useState(false);
    const [forwardValue, setForwardValue] = useState(dimensions.tiltForwardAngle.toString());
    const [isEditingBackward, setIsEditingBackward] = useState(false);
    const [backwardValue, setBackwardValue] = useState(dimensions.tiltBackwardAngle.toString());
    const forwardInputRef = useRef<HTMLInputElement>(null);
    const backwardInputRef = useRef<HTMLInputElement>(null);

    // State for dragging tilt labels radially
    const [forwardDragOffset, setForwardDragOffset] = useState(0);
    const [isDraggingForward, setIsDraggingForward] = useState(false);
    const forwardDragStartRef = useRef({ clientX: 0, clientY: 0, initialOffset: 0 });
    
    const [backwardDragOffset, setBackwardDragOffset] = useState(0);
    const [isDraggingBackward, setIsDraggingBackward] = useState(false);
    const backwardDragStartRef = useRef({ clientX: 0, clientY: 0, initialOffset: 0 });


    useEffect(() => setForwardValue(dimensions.tiltForwardAngle.toString()), [dimensions.tiltForwardAngle]);
    useEffect(() => setBackwardValue(dimensions.tiltBackwardAngle.toString()), [dimensions.tiltBackwardAngle]);
    useEffect(() => { if (isEditingForward) forwardInputRef.current?.select(); }, [isEditingForward]);
    useEffect(() => { if (isEditingBackward) backwardInputRef.current?.select(); }, [isEditingBackward]);

    const handleForwardSubmit = () => {
        const numericValue = parseFloat(forwardValue);
        if (!isNaN(numericValue)) onDimensionChange('tiltForwardAngle', numericValue);
        setIsEditingForward(false);
    }
     const handleBackwardSubmit = () => {
        const numericValue = parseFloat(backwardValue);
        if (!isNaN(numericValue)) onDimensionChange('tiltBackwardAngle', numericValue);
        setIsEditingBackward(false);
    }

    const handleForwardMouseDown = useCallback((e: React.MouseEvent) => {
      if (isEditingForward) return;
      e.stopPropagation();
      setIsDraggingForward(true);
      forwardDragStartRef.current = {
          clientX: e.clientX,
          clientY: e.clientY,
          initialOffset: forwardDragOffset,
      };
      document.body.style.cursor = 'grabbing';
    }, [isEditingForward, forwardDragOffset]);

    const handleBackwardMouseDown = useCallback((e: React.MouseEvent) => {
        if (isEditingBackward) return;
        e.stopPropagation();
        setIsDraggingBackward(true);
        backwardDragStartRef.current = {
            clientX: e.clientX,
            clientY: e.clientY,
            initialOffset: backwardDragOffset,
        };
        document.body.style.cursor = 'grabbing';
    }, [isEditingBackward, backwardDragOffset]);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (isDraggingForward) {
                const dragStart = forwardDragStartRef.current;
                const midAngle = (90 + (90 - dimensions.tiltForwardAngle)) / 2 * (Math.PI / 180);
                const normVec = { x: Math.cos(midAngle), y: Math.sin(midAngle) };
                const mouseDelta = { x: (e.clientX - dragStart.clientX) / viewScale, y: (e.clientY - dragStart.clientY) / viewScale };
                const projectedLength = (mouseDelta.x * normVec.x) + (mouseDelta.y * normVec.y);
                setForwardDragOffset(dragStart.initialOffset + projectedLength);
            }
             if (isDraggingBackward) {
                const dragStart = backwardDragStartRef.current;
                const midAngle = (90 + (90 + dimensions.tiltBackwardAngle)) / 2 * (Math.PI / 180);
                const normVec = { x: Math.cos(midAngle), y: Math.sin(midAngle) };
                const mouseDelta = { x: (e.clientX - dragStart.clientX) / viewScale, y: (e.clientY - dragStart.clientY) / viewScale };
                const projectedLength = (mouseDelta.x * normVec.x) + (mouseDelta.y * normVec.y);
                setBackwardDragOffset(dragStart.initialOffset + projectedLength);
            }
        };

        const handleMouseUp = () => {
            setIsDraggingForward(false);
            setIsDraggingBackward(false);
            document.body.style.cursor = 'default';
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDraggingForward, isDraggingBackward, viewScale, dimensions.tiltForwardAngle, dimensions.tiltBackwardAngle]);


    const commonProps = {
      stroke: "#1A202C",
      strokeWidth: 0.2,
      fillOpacity: 0.8
    };
    
    const baseFillColor = isStable ? "#4A5568" : "#7f1d1d";

    const renderAngle = (
      angle: number, 
      isForward: boolean,
      isEditing: boolean, 
      setIsEditing: (val: boolean) => void, 
      inputValue: string,
      setInputValue: (val: string) => void,
      handleSubmit: () => void,
      inputRef: React.RefObject<HTMLInputElement>,
      dragOffset: number,
      onMouseDown: (e: React.MouseEvent) => void
    ) => {
        const baseRadius = 250;
        const dynamicRadius = baseRadius + dragOffset;
        const finalRadius = Math.max(20, dynamicRadius);

        const referenceAngleDeg = 90;
        const tiltedAngleDeg = isForward ? 90 - angle : 90 + angle;

        const [startAngleDeg, endAngleDeg] = [
            Math.min(referenceAngleDeg, tiltedAngleDeg),
            Math.max(referenceAngleDeg, tiltedAngleDeg)
        ];

        const startAngleRad = startAngleDeg * Math.PI / 180;
        const endAngleRad = endAngleDeg * Math.PI / 180;

        const startPoint = {
            x: pivot.x + finalRadius * Math.cos(startAngleRad),
            y: pivot.y + finalRadius * Math.sin(startAngleRad)
        };
        const endPoint = {
            x: pivot.x + finalRadius * Math.cos(endAngleRad),
            y: pivot.y + finalRadius * Math.sin(endAngleRad)
        };

        const largeArcFlag = '0';
        const sweepFlag = '1';
        const d = `M ${startPoint.x} ${startPoint.y} A ${finalRadius} ${finalRadius} 0 ${largeArcFlag} ${sweepFlag} ${endPoint.x} ${endPoint.y}`;

        const midAngleRad = (startAngleRad + endAngleRad) / 2;
        const textRadius = finalRadius + 10;
        const finalX = pivot.x + textRadius * Math.cos(midAngleRad);
        const finalY = pivot.y + textRadius * Math.sin(midAngleRad);
        
        const label = isForward ? `B_Tilt` : `A_Tilt`;
        const fullText = `${label}: ${angle}°`;

        return (
             <g>
                <path 
                    d={d} 
                    stroke="#3b82f6" 
                    strokeWidth="0.5" 
                    fill="none"
                    markerStart="url(#dim-arrow)"
                    markerEnd="url(#dim-arrow)"
                />
                <g 
                    onMouseDown={onMouseDown}
                    onClick={() => !isEditing && setIsEditing(true)}
                    className="cursor-grab"
                >
                    <rect x={finalX - 40} y={finalY - 12} width={80} height={24} fill="transparent" />
                    {!isEditing ? (
                        <text
                            x={finalX}
                            y={finalY}
                            fill="#333"
                            fontSize="10"
                            textAnchor="middle"
                            alignmentBaseline="middle"
                            className="select-none"
                        >
                            {fullText}
                        </text>
                    ) : (
                        <foreignObject x={finalX - 40} y={finalY - 12} width={80} height={24}>
                            {React.createElement('div', {
                                xmlns: "http://www.w3.org/1999/xhtml",
                                className: "w-full h-full flex justify-center items-center"
                            }, <input
                                ref={inputRef}
                                type="number"
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                onBlur={handleSubmit}
                                onClick={(e) => e.stopPropagation()}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleSubmit();
                                    if (e.key === 'Escape') setIsEditing(false);
                                }}
                                className="w-16 p-1 text-xs bg-white text-gray-800 border border-blue-400 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
                            />)}
                        </foreignObject>
                    )}
                </g>
            </g>
        )
    }

    return (
    <g>
      <ArrowDefs />
      <text x={base.x + base.width/2} y={base.y + base.height + 80} textAnchor="middle" fill="#333" fontSize="14" fontWeight="bold">Side View</text>
      {/* Base */}
      <rect {...base} fill={baseFillColor} {...commonProps} />
      {/* Stand */}
      <rect {...stand} fill="#718096" {...commonProps} />
      {/* Screen Panel */}
      <rect {...panel} fill="#2D3748" {...commonProps} />
      {/* Screen Backpack */}
      <rect {...backpack} fill="#1A202C" {...commonProps} />
       {/* Vesa Neck */}
      <rect {...vesaNeck} fill="#A0AEC0" {...commonProps}/>


      {/* Stability visuals */}
      <line x1={screen.x} y1={pivot.y} x2={screen.x + screen.width} y2={pivot.y} stroke="#666" strokeWidth="0.5" strokeDasharray="2 2" />
      {/* Reference line extended to base */}
      <line x1={thicknessLine1} y1={panel.y - 20} x2={thicknessLine1} y2={floorY} stroke="#666" strokeWidth="0.5" strokeDasharray="2 2" />
      <line x1={thicknessLine2} y1={panel.y - 20} x2={thicknessLine2} y2={panel.y + panel.height + 20} stroke="#666" strokeWidth="0.5" strokeDasharray="2 2" />
      
      <circle cx={pivot.x} cy={pivot.y} r="3" fill="#00A0A0" />
      <text x={pivot.x + 8} y={pivot.y + 3} fill="#00A0A0" fontSize="10">Pivot</text>
      
      <line x1={pivot.x} y1={pivot.y} x2={pointA.x} y2={pointA.y} stroke="#DC2626" strokeWidth="1" strokeDasharray="3 3" />
      <line x1={pivot.x} y1={pivot.y} x2={pointB.x} y2={pointB.y} stroke="#DC2626" strokeWidth="1" strokeDasharray="3 3" />

      <text x={pointA.x} y={pointA.y + 15} fill="#DC2626" fontSize="10" textAnchor="middle">A</text>
      <text x={pointB.x} y={pointB.y + 15} fill="#DC2626" fontSize="10" textAnchor="middle">B</text>

      {/* Center of Gravity */}
      <path d={`M ${combinedCg.x - 5} ${combinedCg.y} L ${combinedCg.x + 5} ${combinedCg.y} M ${combinedCg.x} ${combinedCg.y - 5} L ${combinedCg.x} ${combinedCg.y + 5}`} stroke="#E53E3E" strokeWidth="1" />
      <circle cx={combinedCg.x} cy={combinedCg.y} r="2.5" fill="none" stroke="#E53E3E" strokeWidth="1"/>
      <text x={combinedCg.x + 8} y={combinedCg.y + 3} fill="#E53E3E" fontSize="10">CG</text>

      {/* Ground Line */}
      <line x1={base.x - 25} y1={floorY} x2={base.x + base.width + 25} y2={floorY} stroke="#333" strokeWidth="0.5" />
    
      {/* --- Dimension Lines & Arcs (Rendered on top) --- */}
      {renderAngle(dimensions.tiltForwardAngle, true, isEditingForward, setIsEditingForward, forwardValue, setForwardValue, handleForwardSubmit, forwardInputRef, forwardDragOffset, handleForwardMouseDown)}
      {renderAngle(dimensions.tiltBackwardAngle, false, isEditingBackward, setIsEditingBackward, backwardValue, setBackwardValue, handleBackwardSubmit, backwardInputRef, backwardDragOffset, handleBackwardMouseDown)}

      {/* Horizontal */}
      <DimensionLine
        x1={panel.x} y1={panel.y} x2={panel.x + panel.width} y2={panel.y}
        label="Panel T" value={dimensions.panelThickness}
        onValueChange={(v) => onDimensionChange('panelThickness', v)}
        horizontal
        offset={-180} viewScale={viewScale}
      />
      <DimensionLine
        x1={backpack.x} y1={backpack.y} x2={backpack.x + backpack.width} y2={backpack.y}
        label="Backpack T" value={dimensions.backpackThickness}
        onValueChange={(v) => onDimensionChange('backpackThickness', v)}
        horizontal
        offset={-180} viewScale={viewScale}
      />
       <DimensionLine
        x1={vesaNeck.x} y1={vesaNeck.y + vesaNeck.height / 2} x2={vesaNeck.x + vesaNeck.width} y2={vesaNeck.y + vesaNeck.height / 2}
        label="Neck D" value={dimensions.vesaNeckDepth}
        onValueChange={(v) => onDimensionChange('vesaNeckDepth', v)}
        horizontal
        offset={-180} viewScale={viewScale}
      />
       <DimensionLine
        x1={stand.x} y1={base.y + base.height} x2={stand.x + stand.width} y2={base.y + base.height}
        label="Stand D" value={dimensions.standDepth}
        onValueChange={(v) => onDimensionChange('standDepth', v)}
        horizontal
        offset={40} viewScale={viewScale}
      />
       <DimensionLine
        x1={base.x} y1={base.y + base.height} x2={base.x + base.width} y2={base.y + base.height}
        label="Base Depth" value={dimensions.baseDepth}
        onValueChange={(v) => onDimensionChange('baseDepth', v)}
        horizontal
        offset={50} viewScale={viewScale}
      />
      <DimensionLine
        x1={base.x} y1={base.y + base.height} x2={stand.x} y2={base.y + base.height}
        label="Front Offset" 
        value={dimensions.standFrontOffset}
        onValueChange={(v) => onDimensionChange('standFrontOffset', v)}
        horizontal
        offset={40} viewScale={viewScale}
      />

      {/* Vertical */}
       <DimensionLine
        x1={panel.x} y1={backpack.y} x2={panel.x} y2={backpack.y + backpack.height}
        label="Backpack H" value={dimensions.backpackHeight}
        onValueChange={(v) => onDimensionChange('backpackHeight', v)}
        offset={-60} viewScale={viewScale}
      />
      <DimensionLine
        x1={stand.x + stand.width} y1={vesaNeck.y} x2={stand.x + stand.width} y2={vesaNeck.y + vesaNeck.height}
        label="Neck H" value={dimensions.vesaNeckHeight}
        onValueChange={(v) => onDimensionChange('vesaNeckHeight', v)}
        offset={60} viewScale={viewScale}
      />
       <DimensionLine
        x1={stand.x + stand.width} y1={stand.y} x2={stand.x + stand.width} y2={stand.y+stand.height}
        label="Stand H" value={dimensions.standHeight}
        onValueChange={(v) => onDimensionChange('standHeight', v)}
        offset={110} viewScale={viewScale}
      />
      <DimensionLine
        x1={stand.x + stand.width} y1={vesaNeck.y} x2={stand.x + stand.width} y2={stand.y}
        label="Stand/Neck Gap" value={dimensions.standToNeckGap}
        onValueChange={(v) => onDimensionChange('standToNeckGap', v)}
        offset={60} viewScale={viewScale}
      />
       <DimensionLine
        x1={stand.x + stand.width} y1={base.y} x2={stand.x + stand.width} y2={base.y + base.height}
        label="Base H" value={dimensions.baseHeight}
        onValueChange={(v) => onDimensionChange('baseHeight', v)}
        offset={100} viewScale={viewScale}
      />
    </g>
  );
};
export default SideView;
