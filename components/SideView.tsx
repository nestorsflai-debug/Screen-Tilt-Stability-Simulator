
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ScreenDimensions } from '../types';
import DimensionLine from './DimensionLine';
import { useScreenGeometry } from '../hooks/useScreenGeometry';

type SideViewProps = {
  dimensions: ScreenDimensions;
  geometry: ReturnType<typeof useScreenGeometry>['sideView'];
  onDimensionChange: <K extends keyof ScreenDimensions>(key: K, value: ScreenDimensions[K]) => void;
  onOffsetChange: (key: string, value: number) => void;
  viewScale: number;
  isStable: boolean;
}

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

const SideView: React.FC<SideViewProps> = ({ dimensions, geometry, onDimensionChange, onOffsetChange, viewScale, isStable }) => {
    const { 
        base, standPolyPoints, panel, backpack, vesaNeck, pivot, thicknessLine1, thicknessLine2, pointA, pointB, floorY,
        screen, combinedCg
    } = geometry;

    // --- State & Refs for interactions ---
    const [isEditingForward, setIsEditingForward] = useState(false);
    const [forwardValue, setForwardValue] = useState(dimensions.tiltForwardAngle.toString());
    const [isEditingBackward, setIsEditingBackward] = useState(false);
    const [backwardValue, setBackwardValue] = useState(dimensions.tiltBackwardAngle.toString());
    const [isEditingStandAngle, setIsEditingStandAngle] = useState(false);
    const [standAngleValue, setStandAngleValue] = useState(dimensions.standBaseAngle.toString());
    
    // Lifting Edit State
    const [isEditingLifting, setIsEditingLifting] = useState(false);
    const [liftingInputValue, setLiftingInputValue] = useState(Math.round(dimensions.liftingOffset).toString());
    const liftingInputRef = useRef<HTMLInputElement>(null);

    // Slider Dragging State (Lifting)
    const [isDraggingAssembly, setIsDraggingAssembly] = useState(false);
    const assemblyDragStartRef = useRef({ clientY: 0, initialOffset: 0 });

    const forwardInputRef = useRef<HTMLInputElement>(null);
    const backwardInputRef = useRef<HTMLInputElement>(null);
    const standAngleInputRef = useRef<HTMLInputElement>(null);

    const [forwardDragOffset, setForwardDragOffset] = useState(0);
    const [isDraggingForward, setIsDraggingForward] = useState(false);
    const forwardDragStartRef = useRef({ clientX: 0, clientY: 0, initialOffset: forwardDragOffset });
    const [backwardDragOffset, setBackwardDragOffset] = useState(0);
    const [isDraggingBackward, setIsDraggingBackward] = useState(false);
    const backwardDragStartRef = useRef({ clientX: 0, clientY: 0, initialOffset: backwardDragOffset });

    useEffect(() => setForwardValue(dimensions.tiltForwardAngle.toString()), [dimensions.tiltForwardAngle]);
    useEffect(() => setBackwardValue(dimensions.tiltBackwardAngle.toString()), [dimensions.tiltBackwardAngle]);
    useEffect(() => setStandAngleValue(dimensions.standBaseAngle.toString()), [dimensions.standBaseAngle]);
    useEffect(() => setLiftingInputValue(Math.round(dimensions.liftingOffset).toString()), [dimensions.liftingOffset]);
    
    useEffect(() => { if (isEditingStandAngle) standAngleInputRef.current?.select(); }, [isEditingStandAngle]);
    useEffect(() => { if (isEditingLifting) { liftingInputRef.current?.focus(); liftingInputRef.current?.select(); } }, [isEditingLifting]);

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
    const handleStandAngleSubmit = () => {
        const numericValue = parseFloat(standAngleValue);
        if (!isNaN(numericValue)) onDimensionChange('standBaseAngle', numericValue);
        setIsEditingStandAngle(false);
    }
    const handleLiftingSubmit = () => {
        const numericValue = parseFloat(liftingInputValue);
        // 限制輸入數值不能小於 0
        if (!isNaN(numericValue)) onDimensionChange('liftingOffset', Math.max(0, numericValue));
        setIsEditingLifting(false);
    }

    // --- Assembly Dragging Logic (Lifting) ---
    const handleAssemblyMouseDown = (e: React.MouseEvent) => {
        if (isEditingLifting) return;
        e.stopPropagation();
        setIsDraggingAssembly(true);
        assemblyDragStartRef.current = {
            clientY: e.clientY,
            initialOffset: dimensions.liftingOffset
        };
        document.body.style.cursor = 'ns-resize';
    };

    const handleForwardMouseDown = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsDraggingForward(true);
        forwardDragStartRef.current = {
            clientX: e.clientX,
            clientY: e.clientY,
            initialOffset: forwardDragOffset
        };
        document.body.style.cursor = 'grabbing';
    };

    const handleBackwardMouseDown = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsDraggingBackward(true);
        backwardDragStartRef.current = {
            clientX: e.clientX,
            clientY: e.clientY,
            initialOffset: backwardDragOffset
        };
        document.body.style.cursor = 'grabbing';
    };

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (isDraggingAssembly) {
                const dy = (assemblyDragStartRef.current.clientY - e.clientY) / viewScale;
                const newOffset = Math.max(0, assemblyDragStartRef.current.initialOffset - dy);
                onDimensionChange('liftingOffset', newOffset);
            }
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
            setIsDraggingAssembly(false);
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
    }, [isDraggingAssembly, isDraggingForward, isDraggingBackward, viewScale, dimensions.tiltForwardAngle, dimensions.tiltBackwardAngle, onDimensionChange]);

    const commonProps = { stroke: "#1A202C", strokeWidth: 0.2, fillOpacity: 0.8 };
    const baseFillColor = isStable ? "#4A5568" : "#7f1d1d";

    const renderStandAngleArc = () => {
        const radius = 60;
        const p2 = standPolyPoints[1]; 
        const p3 = standPolyPoints[2]; 
        const centerX = p2.x;
        const centerY = p2.y;

        const edgeAngleRad = Math.atan2(p3.y - p2.y, p3.x - p2.x);
        const startAngleRad = 0; 
        const endAngleRad = edgeAngleRad;

        const startX = centerX + radius * Math.cos(startAngleRad);
        const startY = centerY + radius * Math.sin(startAngleRad);
        const endX = centerX + radius * Math.cos(endAngleRad);
        const endY = centerY + radius * Math.sin(endAngleRad);
        
        const sweepFlag = '0';
        const d = `M ${startX} ${startY} A ${radius} ${radius} 0 0 ${sweepFlag} ${endX} ${endY}`;
        
        const midAngleRad = (startAngleRad + endAngleRad) / 2;
        const textRadius = radius + 30;
        const textX = centerX + textRadius * Math.cos(midAngleRad);
        const textY = centerY + textRadius * Math.sin(midAngleRad);

        return (
            <g>
                <path d={d} stroke="#3b82f6" strokeWidth="0.8" fill="none" markerEnd="url(#dim-arrow)" />
                <g onClick={() => setIsEditingStandAngle(true)} className="cursor-pointer">
                    <rect x={textX - 30} y={textY - 10} width={60} height={20} fill="transparent" />
                    {!isEditingStandAngle ? (
                        <text x={textX} y={textY} fill="#3b82f6" fontSize="10" fontWeight="bold" textAnchor="middle" alignmentBaseline="middle" className="select-none">
                            {`${dimensions.standBaseAngle}°`}
                        </text>
                    ) : (
                        <foreignObject x={textX - 25} y={textY - 10} width={50} height={20}>
                            {React.createElement('div', { className: "w-full h-full flex justify-center items-center" }, 
                            <input ref={standAngleInputRef} type="number" value={standAngleValue} onChange={(e) => setStandAngleValue(e.target.value)} onBlur={handleStandAngleSubmit} onClick={(e) => e.stopPropagation()} onKeyDown={(e) => { if (e.key === 'Enter') handleStandAngleSubmit(); if (e.key === 'Escape') setIsEditingStandAngle(false); }} className="w-16 p-0.5 text-[10px] bg-white text-gray-800 border border-blue-400 rounded focus:outline-none" />
                            )}
                        </foreignObject>
                    )}
                </g>
            </g>
        );
    };

    const renderAngle = (angle: number, isForward: boolean, isEditing: boolean, setIsEditing: (val: boolean) => void, inputValue: string, setInputValue: (val: string) => void, handleSubmit: () => void, inputRef: React.RefObject<HTMLInputElement>, dragOffset: number, onMouseDown: (e: React.MouseEvent) => void) => {
        const baseRadius = 250;
        const dynamicRadius = Math.max(20, baseRadius + dragOffset);
        const tiltedAngleDeg = isForward ? 90 - angle : 90 + angle;
        const [startAngleDeg, endAngleDeg] = [Math.min(90, tiltedAngleDeg), Math.max(90, tiltedAngleDeg)];
        const startAngleRad = startAngleDeg * Math.PI / 180;
        const endAngleRad = endAngleDeg * Math.PI / 180;
        const startPoint = { x: pivot.x + dynamicRadius * Math.cos(startAngleRad), y: pivot.y + dynamicRadius * Math.sin(startAngleRad) };
        const endPoint = { x: pivot.x + dynamicRadius * Math.cos(endAngleRad), y: pivot.y + dynamicRadius * Math.sin(endAngleRad) };
        const d = `M ${startPoint.x} ${startPoint.y} A ${dynamicRadius} ${dynamicRadius} 0 0 1 ${endPoint.x} ${endPoint.y}`;
        const midAngleRad = (startAngleRad + endAngleRad) / 2;
        const textRadius = dynamicRadius + 10;
        const finalX = pivot.x + textRadius * Math.cos(midAngleRad);
        const finalY = pivot.y + textRadius * Math.sin(midAngleRad);
        const label = isForward ? `B_Tilt` : `A_Tilt`;
        return (
             <g>
                <path d={d} stroke="#3b82f6" strokeWidth="0.5" fill="none" markerStart="url(#dim-arrow)" markerEnd="url(#dim-arrow)" />
                <g onMouseDown={onMouseDown} onClick={() => !isEditing && setIsEditing(true)} className="cursor-grab">
                    <rect x={finalX - 40} y={finalY - 12} width={80} height={24} fill="transparent" />
                    {!isEditing ? (
                        <text x={finalX} y={finalY} fill="#333" fontSize="10" textAnchor="middle" alignmentBaseline="middle" className="select-none">
                            {`${label}: ${angle}°`}
                        </text>
                    ) : (
                        <foreignObject x={finalX - 40} y={finalY - 12} width={80} height={24}>
                            {React.createElement('div', { className: "w-full h-full flex justify-center items-center" }, 
                            <input ref={inputRef} type="number" value={inputValue} onChange={(e) => setInputValue(e.target.value)} onBlur={handleSubmit} onClick={(e) => e.stopPropagation()} onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit(); if (e.key === 'Escape') setIsEditing(false); }} className="w-16 p-1 text-xs bg-white text-gray-800 border border-gray-400 rounded focus:outline-none focus:ring-2 focus:ring-blue-400" />
                            )}
                        </foreignObject>
                    )}
                </g>
            </g>
        )
    }

    const trackPointStart = standPolyPoints[0]; 
    const trackPointEnd = standPolyPoints[3];   
    
    const liftingDisplayValue = Math.round(dimensions.liftingOffset || 0);

    return (
    <g>
      <ArrowDefs />
      <text x={base.x + base.width/2} y={base.y + base.height + 80} textAnchor="middle" fill="#333" fontSize="14" fontWeight="bold">Side View</text>
      
      {/* Base */}
      <rect {...base} fill={baseFillColor} {...commonProps} />
      {/* Stand Body */}
      <polygon points={standPolyPoints.map(p => `${p.x},${p.y}`).join(' ')} fill="#718096" {...commonProps} />
      
      <line 
        x1={trackPointStart.x} y1={trackPointStart.y} 
        x2={trackPointEnd.x} y2={trackPointEnd.y} 
        stroke="#3B82F6" 
        strokeWidth={isDraggingAssembly ? "1.5" : "0.5"} 
        strokeDasharray="4 2"
        opacity={isDraggingAssembly ? "0.8" : "0.3"}
      />

      {/* Auxiliary Lines (Floor reference) */}
      <line x1={base.x - 25} y1={floorY} x2={base.x + base.width + 25} y2={floorY} stroke="#333" strokeWidth="0.5" />

      {/* --- Screen Assembly Group (Dynamic) --- */}
      <g className="screen-assembly-group">
          <polygon points={vesaNeck.polyPoints.map(p => `${p.x},${p.y}`).join(' ')} fill="#E2E8F0" {...commonProps} />
          <rect {...backpack} fill="#1A202C" {...commonProps} />
          <rect {...panel} fill="#2D3748" {...commonProps} />
          
          <g 
            transform={`translate(${trackPointEnd.x + 200}, ${vesaNeck.y + vesaNeck.height/2})`}
            className="group"
          >
              <rect 
                x="-50" y="-12" width="100" height="24" rx="12" 
                fill={isDraggingAssembly ? "#2563EB" : "#3B82F6"} 
                className="shadow-md transition-all duration-150 cursor-ns-resize"
                onMouseDown={handleAssemblyMouseDown}
                onClick={() => !isEditingLifting && setIsEditingLifting(true)}
              />
              
              {!isEditingLifting ? (
                <text 
                    x="0" y="0" textAnchor="middle" alignmentBaseline="middle" fill="white" fontSize="9" fontWeight="bold" 
                    className="select-none pointer-events-none"
                >
                    {`Lifting: ${liftingDisplayValue}`}
                </text>
              ) : (
                <foreignObject x="-40" y="-10" width="80" height="20">
                    <div className="w-full h-full flex items-center justify-center">
                        <input 
                            ref={liftingInputRef}
                            type="number"
                            value={liftingInputValue}
                            onChange={(e) => setLiftingInputValue(e.target.value)}
                            onBlur={handleLiftingSubmit}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') handleLiftingSubmit();
                                if (e.key === 'Escape') setIsEditingLifting(false);
                            }}
                            className="w-full h-5 p-0 text-[10px] text-center bg-white text-gray-800 border-none rounded focus:ring-1 focus:ring-blue-500 outline-none"
                        />
                    </div>
                </foreignObject>
              )}

              <line x1="-215" y1="0" x2="-50" y2="0" stroke="#3B82F6" strokeWidth="0.5" strokeDasharray="2 1" opacity="0.5" />
          </g>

          {/* Screen-specific Aux Lines */}
          <line x1={screen.x} y1={pivot.y} x2={screen.x + screen.width} y2={pivot.y} stroke="#666" strokeWidth="0.5" strokeDasharray="2 2" />
          
          {/* 第一條分線延伸至 base (floorY) */}
          <line x1={thicknessLine1} y1={panel.y - 20} x2={thicknessLine1} y2={floorY} stroke="#666" strokeWidth="0.5" strokeDasharray="2 2" />
          
          <line x1={thicknessLine2} y1={panel.y - 20} x2={thicknessLine2} y2={panel.y + panel.height + 20} stroke="#666" strokeWidth="0.5" strokeDasharray="2 2" />
          
          <circle cx={pivot.x} cy={pivot.y} r="3" fill="#00A0A0" />
          <text x={pivot.x + 8} y={pivot.y + 3} fill="#00A0A0" fontSize="10">Pivot</text>
          <line x1={pivot.x} y1={pivot.y} x2={pointA.x} y2={pointA.y} stroke="#DC2626" strokeWidth="1" strokeDasharray="3 3" />
          <line x1={pivot.x} y1={pivot.y} x2={pointB.x} y2={pointB.y} stroke="#DC2626" strokeWidth="1" strokeDasharray="3 3" />
          <text x={pointA.x} y={pointA.y + 15} fill="#DC2626" fontSize="10" textAnchor="middle">A</text>
          <text x={pointB.x} y={pointB.y + 15} fill="#DC2626" fontSize="10" textAnchor="middle">B</text>

          <path d={`M ${combinedCg.x - 5} ${combinedCg.y} L ${combinedCg.x + 5} ${combinedCg.y} M ${combinedCg.x} ${combinedCg.y - 5} L ${combinedCg.x} ${combinedCg.y + 5}`} stroke="#E53E3E" strokeWidth="1" />
          <circle cx={combinedCg.x} cy={combinedCg.y} r="2.5" fill="none" stroke="#E53E3E" strokeWidth="1"/>
          <text x={combinedCg.x + 8} y={combinedCg.y + 3} fill="#E53E3E" fontSize="10">CG</text>
      </g>

      {renderAngle(dimensions.tiltForwardAngle, true, isEditingForward, setIsEditingForward, forwardValue, setForwardValue, handleForwardSubmit, forwardInputRef, forwardDragOffset, handleForwardMouseDown)}
      {renderAngle(dimensions.tiltBackwardAngle, false, isEditingBackward, setIsEditingBackward, backwardValue, setBackwardValue, handleBackwardSubmit, backwardInputRef, backwardDragOffset, handleBackwardMouseDown)}
      {renderStandAngleArc()}

      <DimensionLine x1={panel.x} y1={panel.y} x2={panel.x + panel.width} y2={panel.y} label="Panel T" value={dimensions.panelThickness} onValueChange={(v) => onDimensionChange('panelThickness', v)} horizontal offset={dimensions.labelOffsets['side_panelThickness']} onOffsetChange={(v) => onOffsetChange('side_panelThickness', v)} viewScale={viewScale} />
      <DimensionLine x1={backpack.x} y1={backpack.y} x2={backpack.x + backpack.width} y2={backpack.y} label="Backpack T" value={dimensions.backpackThickness} onValueChange={(v) => onDimensionChange('backpackThickness', v)} horizontal offset={dimensions.labelOffsets['side_backpackThickness']} onOffsetChange={(v) => onOffsetChange('side_backpackThickness', v)} viewScale={viewScale} />
      <DimensionLine x1={vesaNeck.polyPoints[0].x} y1={vesaNeck.y + vesaNeck.height / 2} x2={vesaNeck.polyPoints[1].x} y2={vesaNeck.y + vesaNeck.height / 2} label="Neck D" value={dimensions.vesaNeckDepth} onValueChange={(v) => onDimensionChange('vesaNeckDepth', v)} horizontal offset={dimensions.labelOffsets['side_neckDepth']} onOffsetChange={(v) => onOffsetChange('side_neckDepth', v)} viewScale={viewScale} />
      
      <DimensionLine x1={standPolyPoints[0].x} y1={base.y + base.height} x2={standPolyPoints[1].x} y2={base.y + base.height} label="Stand D" value={dimensions.standDepth} onValueChange={(v) => onDimensionChange('standDepth', v)} horizontal offset={dimensions.labelOffsets['side_standDepth']} onOffsetChange={(v) => onOffsetChange('side_standDepth', v)} viewScale={viewScale} />
      <DimensionLine x1={base.x} y1={base.y + base.height} x2={standPolyPoints[0].x} y2={base.y + base.height} label="Front Offset" value={dimensions.standFrontOffset} onValueChange={(v) => onDimensionChange('standFrontOffset', v)} horizontal offset={dimensions.labelOffsets['side_frontOffset']} onOffsetChange={(v) => onOffsetChange('side_frontOffset', v)} viewScale={viewScale} />

      <DimensionLine x1={base.x} y1={base.y + base.height} x2={base.x + base.width} y2={base.y + base.height} label="Base Depth" value={dimensions.baseDepth} onValueChange={(v) => onDimensionChange('baseDepth', v)} horizontal offset={dimensions.labelOffsets['side_baseDepth']} onOffsetChange={(v) => onOffsetChange('side_baseDepth', v)} viewScale={viewScale} />
      <DimensionLine x1={panel.x} y1={backpack.y} x2={panel.x} y2={backpack.y + backpack.height} label="Backpack H" value={dimensions.backpackHeight} onValueChange={(v) => onDimensionChange('backpackHeight', v)} offset={dimensions.labelOffsets['side_backpackHeight']} onOffsetChange={(v) => onOffsetChange('side_backpackHeight', v)} viewScale={viewScale} />
      <DimensionLine x1={standPolyPoints[3].x} y1={vesaNeck.polyPoints[0].y} x2={standPolyPoints[3].x} y2={vesaNeck.polyPoints[3].y} label="Neck H" value={dimensions.vesaNeckHeight} onValueChange={(v) => onDimensionChange('vesaNeckHeight', v)} offset={dimensions.labelOffsets['side_neckHeight']} onOffsetChange={(v) => onOffsetChange('side_neckHeight', v)} viewScale={viewScale} />
      <DimensionLine x1={standPolyPoints[1].x} y1={standPolyPoints[2].y} x2={standPolyPoints[1].x} y2={standPolyPoints[1].y} label="Stand H" value={dimensions.standHeight} onValueChange={(v) => onDimensionChange('standHeight', v)} offset={dimensions.labelOffsets['side_standHeight']} onOffsetChange={(v) => onOffsetChange('side_standHeight', v)} viewScale={viewScale} />
      
      <DimensionLine 
        x1={standPolyPoints[3].x} y1={standPolyPoints[3].y - dimensions.standToNeckGap} 
        x2={standPolyPoints[3].x} y2={standPolyPoints[3].y} 
        label="Gap" value={parseFloat(dimensions.standToNeckGap.toFixed(2))} 
        onValueChange={(v) => onDimensionChange('standToNeckGap', v)} 
        offset={dimensions.labelOffsets['side_gap']} onOffsetChange={(v) => onOffsetChange('side_gap', v)} viewScale={viewScale} 
      />
      
      <DimensionLine x1={standPolyPoints[1].x} y1={base.y} x2={standPolyPoints[1].x} y2={base.y + base.height} label="Base H" value={dimensions.baseHeight} onValueChange={(v) => onDimensionChange('baseHeight', v)} offset={dimensions.labelOffsets['side_baseHeight']} onOffsetChange={(v) => onOffsetChange('side_baseHeight', v)} viewScale={viewScale} />
    </g>
  );
};
export default SideView;
