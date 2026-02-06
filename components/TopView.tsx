
import React, { useState, useRef, useEffect } from 'react';
import { Point, ScreenDimensions } from '../types';
import DimensionLine from './DimensionLine';
import { useScreenGeometry } from '../hooks/useScreenGeometry';

type TopViewProps = {
  dimensions: ScreenDimensions;
  geometry: ReturnType<typeof useScreenGeometry>['topView'];
  sideViewPoints: { A: Point, B: Point, standCenterX: number };
  onDimensionChange: <K extends keyof ScreenDimensions>(key: K, value: ScreenDimensions[K]) => void;
  onOffsetChange: (key: string, value: number) => void;
  viewScale: number;
  isStable: boolean;
}

const ArrowDefs = () => (
    <defs>
        <marker 
            id="dim-arrow-top" 
            viewBox="0 -5 10 10"
            refX="10" 
            refY="0"
            markerWidth="6" 
            markerHeight="6" 
            orient="auto-start-reverse"
        >
            <path d="M0,-5L10,0L0,5" fill="#3b82f6" />
        </marker>
    </defs>
);

const TopView: React.FC<TopViewProps> = ({ dimensions, geometry, sideViewPoints, onDimensionChange, onOffsetChange, viewScale, isStable }) => {
    const { base, standBottom, standTop, standBodyPoints, panel, backpack, vesaNeck, pivot, y_A, y_B } = geometry;

    const [isEditingSwivel, setIsEditingSwivel] = useState(false);
    const [swivelValue, setSwivelValue] = useState(dimensions.swivelAngle.toString());
    const swivelInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => setSwivelValue(dimensions.swivelAngle.toString()), [dimensions.swivelAngle]);
    useEffect(() => { 
        if (isEditingSwivel) {
            swivelInputRef.current?.focus(); 
            swivelInputRef.current?.select(); 
        }
    }, [isEditingSwivel]);

    const handleSwivelSubmit = () => {
        const numericValue = parseFloat(swivelValue);
        if (!isNaN(numericValue)) onDimensionChange('swivelAngle', Math.max(0, Math.min(180, numericValue)));
        setIsEditingSwivel(false);
    };

    const commonProps = { stroke: "#1A202C", strokeWidth: 0.2, fillOpacity: 0.8 };
    const baseFillColor = isStable ? "#4A5568" : "#7f1d1d";

    // 計算圖形底部的最大 Y 座標
    const graphicBottomY = Math.max(base.y + base.height, panel.y + panel.height);
    const yTopLimit = Math.min(base.y, standBottom.y, panel.y) - 50;
    // 輔助線延伸至圖形底部下方 50mm
    const yBottomLimit = graphicBottomY + 50;
    
    const circleRadius = Math.abs(y_A - y_B) / 2;
    const circleCenterY = (y_A + y_B) / 2;

    const SwivelGuide = ({ angle, isPrimary }: { angle: number, isPrimary: boolean }) => (
        <g transform={`rotate(${angle}, ${pivot.x}, ${pivot.y})`}>
            <circle cx={pivot.x} cy={circleCenterY} r={circleRadius} fill="none" stroke={isPrimary ? "#E53E3E" : "#FCA5A5"} strokeWidth={1.5} strokeDasharray={isPrimary ? "4 4" : "3 3"} />
            <line x1={pivot.x} y1={yTopLimit} x2={pivot.x} y2={yBottomLimit} stroke={isPrimary ? "#E53E3E" : "#FCA5A5"} strokeWidth={1.5} strokeDasharray={isPrimary ? "4 4" : "3 3"} />
        </g>
    );

    const renderSwivelAngleArc = () => {
        const radius = 150; 
        const startAngleDeg = 90; 
        const endAngleDeg = 90 + dimensions.swivelAngle;
        
        const startRad = startAngleDeg * Math.PI / 180;
        const endRad = endAngleDeg * Math.PI / 180;
        
        const x1 = pivot.x + radius * Math.cos(startRad);
        const y1 = pivot.y + radius * Math.sin(startRad);
        const x2 = pivot.x + radius * Math.cos(endRad);
        const y2 = pivot.y + radius * Math.sin(endRad);
        
        const d = `M ${x1} ${y1} A ${radius} ${radius} 0 0 1 ${x2} ${y2}`;
        
        const midAngleDeg = (startAngleDeg + endAngleDeg) / 2;
        const textRadius = radius + 25;
        const tx = pivot.x + textRadius * Math.cos(midAngleDeg * Math.PI / 180);
        const ty = pivot.y + textRadius * Math.sin(midAngleDeg * Math.PI / 180);

        return (
            <g>
                <line x1={pivot.x} y1={pivot.y + 20} x2={pivot.x} y2={pivot.y + radius + 20} stroke="#3b82f6" strokeWidth="0.5" strokeDasharray="3 3" />
                <path d={d} stroke="#3b82f6" strokeWidth="1.5" fill="none" markerStart="url(#dim-arrow-top)" markerEnd="url(#dim-arrow-top)" />
                <g onClick={() => !isEditingSwivel && setIsEditingSwivel(true)} className="cursor-pointer group">
                    <rect x={tx - 45} y={ty - 12} width={90} height={24} fill="transparent" />
                    {!isEditingSwivel ? (
                        <text x={tx} y={ty} fill="#3b82f6" fontSize="12" fontWeight="bold" textAnchor="middle" alignmentBaseline="middle" className="select-none group-hover:fill-blue-600">
                            {`Swivel: ${dimensions.swivelAngle.toFixed(1)}°`}
                        </text>
                    ) : (
                        <foreignObject x={tx - 40} y={ty - 12} width={80} height={24}>
                            {React.createElement('div', { className: "w-full h-full flex justify-center items-center" }, 
                                <input 
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
                                    className="w-20 p-0.5 text-xs text-center bg-white text-gray-800 border border-blue-400 rounded shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500" 
                                />
                            )}
                        </foreignObject>
                    )}
                </g>
            </g>
        );
    };

    return (
    <g>
      <ArrowDefs />
      {/* 文字標籤位置設定為圖形底部下方 50mm */}
      <text x={base.x + base.width/2} y={graphicBottomY + 50} textAnchor="middle" fill="#333" fontSize="14" fontWeight="bold">Top View</text>
      
      {/* Base Footprint */}
      <rect {...base} fill={baseFillColor} {...commonProps} />
      
      {/* Stand Body (Projected column volume) */}
      <polygon 
        points={standBodyPoints.map(p => `${p.x},${p.y}`).join(' ')} 
        fill="#718096" 
        fillOpacity="0.3"
        stroke="#4A5568"
        strokeWidth="0.2"
      />

      {/* Stand Bottom Surface (Footprint on base) */}
      <rect {...standBottom} fill="#A0AEC0" {...commonProps} strokeDasharray="2 1" fillOpacity="0.5" />
      
      {/* Screen Assembly */}
      <rect {...panel} fill="#2D3748" {...commonProps}/>
      <rect {...backpack} fill="#1A202C" {...commonProps}/>
      <rect {...vesaNeck} fill="#E2E8F0" {...commonProps}/>

      {/* Stand Top Surface (Connection to neck) - 移至螢幕組件之後以確保在最上層 */}
      <rect {...standTop} fill="#718096" {...commonProps} />
      
      <SwivelGuide angle={0} isPrimary={true} />
      <SwivelGuide angle={dimensions.swivelAngle} isPrimary={false} />
      <SwivelGuide angle={-dimensions.swivelAngle} isPrimary={false} />

      {renderSwivelAngleArc()}

      <circle cx={pivot.x} cy={pivot.y} r="3" fill="#00A0A0" />
      <circle cx={pivot.x} cy={y_B} r="3" fill="#991B1B" />
      <text x={pivot.x + 8} y={y_B + 5} fill="#991B1B" fontSize="15" fontWeight="bold">B</text>
      <circle cx={pivot.x} cy={y_A} r="3" fill="#991B1B" />
      <text x={pivot.x + 8} y={y_A + 5} fill="#991B1B" fontSize="15" fontWeight="bold">A</text>

      <DimensionLine x1={base.x} y1={base.y} x2={base.x + base.width} y2={base.y} label="Base W" value={dimensions.baseWidth} onValueChange={(v) => onDimensionChange('baseWidth', v)} horizontal offset={dimensions.labelOffsets['top_baseWidth']} onOffsetChange={(v) => onOffsetChange('top_baseWidth', v)} viewScale={viewScale} />
      <DimensionLine x1={base.x} y1={base.y} x2={base.x} y2={base.y + base.height} label="Base D" value={dimensions.baseDepth} onValueChange={(v) => onDimensionChange('baseDepth', v)} offset={dimensions.labelOffsets['top_baseDepth']} onOffsetChange={(v) => onOffsetChange('top_baseDepth', v)} viewScale={viewScale} />
      
      {/* 修正後的 Pivot Offset 標註：y1 改為支架底面後緣 (standBottom.y)，使其視覺線段長度與數值一致 */}
      <DimensionLine x1={pivot.x} y1={standBottom.y} x2={pivot.x} y2={pivot.y} label="Pivot Offset" value={dimensions.swivelPivotOffset} onValueChange={(v) => onDimensionChange('swivelPivotOffset', v)} offset={dimensions.labelOffsets['top_pivotOffset']} onOffsetChange={(v) => onOffsetChange('top_pivotOffset', v)} viewScale={viewScale} />
    </g>
  );
};
export default TopView;
