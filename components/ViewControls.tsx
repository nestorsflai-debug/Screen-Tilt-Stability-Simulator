
import React from 'react';

interface ViewControlsProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onPan: (dx: number, dy: number) => void;
  onReset: () => void;
}

const ControlButton: React.FC<React.PropsWithChildren<{ onClick: () => void, className?: string, title: string }>> = ({ onClick, children, className = '', title }) => (
    <button
        onClick={onClick}
        title={title}
        className={`w-8 h-8 flex items-center justify-center bg-white bg-opacity-75 text-gray-800 rounded-md shadow-md hover:bg-gray-200 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-blue-400 ${className}`}
    >
        {children}
    </button>
);

const ViewControls: React.FC<ViewControlsProps> = ({ onZoomIn, onZoomOut, onPan, onReset }) => {
    const panAmount = 50;

  return (
    <div className="absolute top-4 right-4 z-10 flex flex-col items-center space-y-2">
        <div className="flex space-x-2">
            <ControlButton onClick={onZoomIn} title="Zoom In">
                <span className="text-lg font-bold">+</span>
            </ControlButton>
            <ControlButton onClick={onZoomOut} title="Zoom Out">
                <span className="text-lg font-bold">-</span>
            </ControlButton>
             <ControlButton onClick={onReset} title="Reset View">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h5M20 20v-5h-5M4 4l16 16" />
                </svg>
            </ControlButton>
        </div>
        <div className="grid grid-cols-3 gap-1 w-24">
            <div />
            <ControlButton onClick={() => onPan(0, panAmount)} title="Pan Up" className="col-start-2">↑</ControlButton>
            <div />
            <ControlButton onClick={() => onPan(panAmount, 0)} title="Pan Left">←</ControlButton>
            <div/>
            <ControlButton onClick={() => onPan(-panAmount, 0)} title="Pan Right">→</ControlButton>
            <div />
            <ControlButton onClick={() => onPan(0, -panAmount)} title="Pan Down" className="col-start-2">↓</ControlButton>
            <div />
        </div>
    </div>
  );
};

export default ViewControls;
