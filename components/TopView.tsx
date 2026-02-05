import React, { useState, useRef, useEffect, useCallback } from 'react';
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

// Helper component for SVG marker definition (consistent with SideView)
const ArrowDefs = () => (
    <defs>
        <marker 
            id="dim-arrow-top" 
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

const TopView: React.FC<TopViewProps> = ({ dimensions, geometry, sideViewPoints, onDimensionChange, viewScale, isStable }) => {
    const { base, stand, panel, backpack, vesaNeck, pivot } = geometry;

    // State for editing swivel angle
    const [isEditingSwivel, setIsEditingSwivel] = useState(false);
    const [swivelValue, setSwivelValue] = useState(dimensions.swivelAngle.toString());
    const swivelInputRef = useRef<HTMLInputElement>(null);

    // State for dragging swivel label radially
    const [swivelDragOffset, setSwivelDragOffset] = useState(0);
    const [isDraggingSwivel, setIsDraggingSwivel] = useState(false);
    const swivelDragStartRef = useRef({ clientX: 0, clientY: 0, initialOffset: 0 });

    useEffect(() => setSwivelValue(dimensions.swivelAngle.toString()), [dimensions.swivelAngle]);
    useEffect(() => { if (isEditingSwivel) swivelInputRef.current?.select(); }, [isEditingSwivel]);

    const handleSwivelSubmit = () => {
        const numericValue = parseFloat(swivelValue);
        if (!isNaN(numericValue)) onDimensionChange('swivelAngle', numericValue);
        setIsEditingSwivel(false);
    };

    const handleSwivelMouseDown = useCallback((e: React.MouseEvent) => {
        if (isEditingSwivel) return;
        e.stopPropagation();
        setIsDraggingSwivel(true);
        swivelDragStartRef.current = {
            clientX: e.clientX,
            clientY: e.clientY,
            initialOffset: swivelDragOffset,
        };
        document.body.style.cursor = 'grabbing';
    }, [isEditingSwivel, swivelDragOffset]);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (isDraggingSwivel) {
                const dragStart = swivelDragStartRef.current;
                // Vertical down is 90 deg. We calculate vector at mid-angle of swivel.
                const midAngle = (90 + (90 + dimensions.swivelAngle)) / 2 * (Math.PI / 180);
                const normVec = { x: Math.cos(midAngle), y: Math.sin(midAngle) };
                const mouseDelta = { x: (e.clientX - dragStart.clientX) / viewScale, y: (e.clientY - dragStart.clientY) / viewScale };
                const projectedLength = (mouseDelta.x * normVec.x) + (mouseDelta.y * normVec.y);
                setSwivelDragOffset(dragStart.initialOffset + projectedLength);
            }
        };

        const handleMouseUp = () => {
            setIsDraggingSwivel(false);
            document.body.style.cursor = 'default';
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDraggingSwivel, viewScale, dimensions.swivelAngle]);

    const commonProps = {
      stroke: "#1A202C",
      strokeWidth: 0.2,
      fillOpacity: 0.8
    };
    
    const baseFillColor = isStable ? "#4A5568" : "#7f1d1d";

    const standCenterY_TopView = stand.y + stand.height / 2;
    const y_A = standCenterY_TopView - (sideViewPoints.A.x - sideViewPoints.standCenterX);
    const y_B = standCenterY_TopView - (sideViewPoints.B.x - sideViewPoints.standCenterX);

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

    const renderSwivelDimension = () => {
        const baseRadius = 180;
        const dynamicRadius = baseRadius + swivelDragOffset;
        const finalRadius = Math.max(30, dynamicRadius);

        // Vertical down is 90 deg
        const startAngleDeg = 90;
        const endAngleDeg = 90 + dimensions.swivelAngle;

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

        const largeArcFlag = Math.abs(dimensions.swivelAngle) > 180 ? '1' : '0';
        const sweepFlag = dimensions.swivelAngle >= 0 ? '1' : '0';
        const d = `M ${startPoint.x} ${startPoint.y} A ${finalRadius} ${finalRadius} 0 ${largeArcFlag} ${sweepFlag} ${endPoint.x} ${endPoint.y}`;

        const midAngleRad = (startAngleRad + endAngleRad) / 2;
        const textRadius = finalRadius + 15;
        const textX = pivot.x + textRadius * Math.cos(midAngleRad);
        const textY = pivot.y + textRadius * Math.sin(midAngleRad);

        return (
            <g>
                <path 
                    d={d} 
                    stroke="#3b82f6" 
                    strokeWidth="0.8" 
                    fill="none"
                    markerStart="url(#dim-arrow-top)"
                    markerEnd="url(#dim-arrow-top)"
                />
                <g 
                    onMouseDown={handleSwivelMouseDown}
                    onClick={() => !isEditingSwivel && setIsEditingSwivel(true)}
                    className="cursor-grab"
                >
                    <rect x={textX - 45} y={textY - 12} width={90} height={24} fill="transparent" />
                    {!isEditingSwivel ? (
                        <text
                            x={textX}
                            y={textY}
                            fill="#3b82f6"
                            fontSize="10"
                            fontWeight="bold"
                            textAnchor="middle"
                            alignmentBaseline="middle"
                            className="select-none"
                        >
                            {`Swivel: ${dimensions.swivelAngle}°`}
                        </text>
                    ) : (
                        <foreignObject x={textX - 40} y={textY - 12} width={80} height={24}>
                            {React.createElement('div', {
                                xmlns: "http://www.w3.org/1999/xhtml",
                                className: "w-full h-full flex justify-center items-center"
                            }, <input
                                ref={swivelInputRef}
                                type="number"
                                value={swivelValue}
                                onChange={(e) => setSwivelValue(e.target.value)}
                                onBlur={handleSwivelSubmit}
                                onClick={(e) => e.stopPropagation()}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleSwivelSubmit();
                                    if (e.key === 'Escape') setIsEditingSwivel(false);
                                }}
                                className="w-16 p-1 text-xs bg-white text-gray-800 border border-blue-400 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
                            />)}
                        </foreignObject>
                    )}
                </g>
            </g>
        );
    };

    return (
    <g>
      <ArrowDefs />
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
      <SwivelGuide angle={dimensions.swivelAngle} isPrimary={false} />
      <SwivelGuide angle={-dimensions.swivelAngle} isPrimary={false} />

      {/* Swivel Dimension Arc */}
      {renderSwivelDimension()}

      {/* Pivot point */}
      <circle cx={pivot.x} cy={pivot.y} r="3" fill="#00A0A0" />
      
      {/* Projected A and B points */}
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