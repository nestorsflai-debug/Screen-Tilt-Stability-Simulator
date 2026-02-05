import React, { useState, useRef, useEffect, useCallback } from 'react';

interface DimensionLineProps {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  label: string;
  value: number;
  onValueChange?: (value: number) => void;
  offset?: number;
  horizontal?: boolean;
  unit?: string;
  viewScale: number;
  lineColor?: string;
}

const DimensionLine: React.FC<DimensionLineProps> = ({
  x1, y1, x2, y2, label, value, onValueChange, offset = 20, horizontal = false, unit = '', viewScale, lineColor = '#333'
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState(value.toString());
  const inputRef = useRef<HTMLInputElement>(null);

  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0, initialOffset: 0 });

  const isEditable = !!onValueChange;

  useEffect(() => {
    setInputValue(value.toString());
  }, [value]);
  
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);
  
  const handleLabelClick = (e: React.MouseEvent) => {
      if (!isEditable) return;
      // Prevent drag from starting when we want to edit
      e.stopPropagation();
      if (!isEditing) {
          setIsEditing(true);
      }
  };

  const handleSubmit = () => {
    const numericValue = parseFloat(inputValue);
    if (isEditable && !isNaN(numericValue)) {
      onValueChange(numericValue);
    } else {
        setInputValue(value.toString());
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleSubmit();
    else if (e.key === 'Escape') {
      setInputValue(value.toString());
      setIsEditing(false);
    }
  };

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    // Only start drag if not in edit mode and editable
    if (!isEditable || isEditing) return;
    e.stopPropagation();
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      initialOffset: dragOffset,
    };
    document.body.style.cursor = 'grabbing';
  }, [isEditing, dragOffset, isEditable]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const dx = (e.clientX - dragStartRef.current.x) / viewScale;
      const dy = (e.clientY - dragStartRef.current.y) / viewScale;
      const delta = horizontal ? dy : dx;
      setDragOffset(dragStartRef.current.initialOffset + delta);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      document.body.style.cursor = 'default';
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, viewScale]);

  const totalOffset = offset + dragOffset;
  const lineProps = {
    x1: horizontal ? x1 : x1 + totalOffset,
    y1: horizontal ? y1 + totalOffset : y1,
    x2: horizontal ? x2 : x2 + totalOffset,
    y2: horizontal ? y2 + totalOffset : y2,
  };

  const textX = (lineProps.x1 + lineProps.x2) / 2;
  const textY = (lineProps.y1 + lineProps.y2) / 2;
  
  const foreignObjectSize = 100;
  const foreignObjectPos = {
      x: textX - foreignObjectSize / 2,
      y: textY - 15,
  };

  return (
    <g>
        {/* Main dimension line */}
      <line {...lineProps} stroke={lineColor} strokeWidth="0.5" />
      {/* Witness lines */}
      <line x1={x1} y1={y1} x2={lineProps.x1} y2={lineProps.y1} stroke={lineColor} strokeWidth="0.5" strokeDasharray="2 1" />
      <line x1={x2} y1={y2} x2={lineProps.x2} y2={lineProps.y2} stroke={lineColor} strokeWidth="0.5" strokeDasharray="2 1" />
      {/* Ticks */}
      <line x1={lineProps.x1} y1={lineProps.y1 - (horizontal ? 0:3)} x2={lineProps.x1} y2={lineProps.y1 + (horizontal ? 0:3)} stroke={lineColor} strokeWidth="0.5" />
      <line x1={lineProps.x1 - (horizontal ? 3:0)} y1={lineProps.y1} x2={lineProps.x1 + (horizontal ? 3:0)} y2={lineProps.y1} stroke={lineColor} strokeWidth="0.5" />
      <line x1={lineProps.x2} y1={lineProps.y2 - (horizontal ? 0:3)} x2={lineProps.x2} y2={lineProps.y2 + (horizontal ? 0:3)} stroke={lineColor} strokeWidth="0.5" />
      <line x1={lineProps.x2 - (horizontal ? 3:0)} y1={lineProps.y2} x2={lineProps.x2 + (horizontal ? 3:0)} y2={lineProps.y2} stroke={lineColor} strokeWidth="0.5" />

       <g 
        onMouseDown={handleMouseDown}
        onClick={handleLabelClick}
        className={isEditable ? "cursor-grab" : "cursor-default"}
      >
        {/* Transparent background for easier grabbing */}
         <rect x={textX - 40} y={textY - 10} width={80} height={20} fill="transparent" />
        {!isEditing || !isEditable ? (
            <text
            x={textX}
            y={textY}
            fill={lineColor}
            fontSize="10"
            textAnchor="middle"
            alignmentBaseline="middle"
            className="group-hover:font-bold select-none"
            >
            {`${label}: ${value}${unit}`}
            </text>
        ) : (
            <foreignObject x={foreignObjectPos.x} y={foreignObjectPos.y} width={foreignObjectSize} height={30}>
            {
                React.createElement('div', {
                xmlns: "http://www.w3.org/1999/xhtml",
                className: "w-full h-full flex justify-center items-center"
                },
                <input
                ref={inputRef}
                type="number"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onBlur={handleSubmit}
                onKeyDown={handleKeyDown}
                onClick={(e) => e.stopPropagation()}
                className="w-16 p-1 text-xs bg-white text-gray-800 border border-gray-400 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
            )}
            </foreignObject>
        )}
      </g>
    </g>
  );
};

export default DimensionLine;