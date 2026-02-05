
// Fix: Correctly import useState, useEffect, and useCallback from React.
import React, { useState, useEffect, useCallback } from 'react';
import { ScreenDimensions } from './types';
import { useScreenGeometry } from './hooks/useScreenGeometry';
import SideView from './components/SideView';
import FrontView from './components/FrontView';
import TopView from './components/TopView';
import ViewControls from './components/ViewControls';
import { initialDimensions } from './components/InitialDimensions';

const App: React.FC = () => {
  const [dimensions, setDimensions] = useState<ScreenDimensions>(initialDimensions);
  const [history, setHistory] = useState<ScreenDimensions[]>([initialDimensions]);
  const [historyIndex, setHistoryIndex] = useState(0);
  
  const [viewTransform, setViewTransform] = useState({ scale: 1, tx: 0, ty: 0 });

  const handleUndo = useCallback(() => {
    setHistoryIndex(prevIndex => {
        if (prevIndex > 0) {
            const newIndex = prevIndex - 1;
            setDimensions(history[newIndex]);
            return newIndex;
        }
        return prevIndex;
    });
  }, [history]);

  const handleRedo = useCallback(() => {
    setHistoryIndex(prevIndex => {
        if (prevIndex < history.length - 1) {
            const newIndex = prevIndex + 1;
            setDimensions(history[newIndex]);
            return newIndex;
        }
        return prevIndex;
    });
  }, [history]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        const isUndo = (e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey;
        const isRedo = (e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey));

        if (isUndo) {
            e.preventDefault();
            handleUndo();
        }

        if (isRedo) {
            e.preventDefault();
            handleRedo();
        }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
        window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleUndo, handleRedo]);

  const geometry = useScreenGeometry(dimensions);

  const updateDimensions = (newDimensions: ScreenDimensions) => {
    // Create a new history branch from the current point, discarding old "redo" states.
    const newHistory = history.slice(0, historyIndex + 1);
    
    setHistory([...newHistory, newDimensions]);
    setHistoryIndex(newHistory.length);
    setDimensions(newDimensions);
  };

  const handleDimensionChange = <K extends keyof ScreenDimensions>(
    key: K,
    value: ScreenDimensions[K]
  ) => {
    updateDimensions({ ...dimensions, [key]: value });
  };
  
  const handleReset = () => {
    updateDimensions(initialDimensions);
  };

  const handleZoom = (direction: 'in' | 'out') => {
    setViewTransform(prev => {
        const factor = direction === 'in' ? 1.2 : 1 / 1.2;
        return { ...prev, scale: prev.scale * factor };
    });
  };

  const handlePan = (dx: number, dy: number) => {
      setViewTransform(prev => ({ ...prev, tx: prev.tx + dx, ty: prev.ty + dy }));
  };

  const handleResetView = () => {
      setViewTransform({ scale: 1, tx: 0, ty: 0 });
  };
  
  const [viewBoxMinX, viewBoxMinY, viewBoxWidth, viewBoxHeight] = 
    geometry.viewBox.split(' ').map(Number);
  
  // Make the grid significantly larger than the viewport to handle panning
  const gridExpansionFactor = 10;
  const gridWidth = viewBoxWidth * gridExpansionFactor;
  const gridHeight = viewBoxHeight * gridExpansionFactor;
  const gridX = viewBoxMinX - (gridWidth - viewBoxWidth) / 2;
  const gridY = viewBoxMinY - (gridHeight - viewBoxHeight) / 2;

  return (
    <div className="h-screen bg-gray-200 text-gray-800 font-sans flex flex-col p-4">
        <header className="text-center pb-4">
          <div className="flex justify-center items-center space-x-4">
            <h1 className="text-xl font-bold text-gray-900">Screen Tilt Stability Simulator</h1>
            <button
              onClick={handleReset}
              className="px-3 py-1 text-sm bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 transition"
            >
              Reset to Default
            </button>
          </div>
          <p className="text-sm text-gray-600 mt-1">Click dimension labels to edit. Use Ctrl+Z to Undo.</p>
           <p className={`text-center text-lg font-bold mt-2 ${geometry.isStable ? 'text-green-600' : 'text-red-600'}`}>
             Status: {geometry.isStable ? 'Stable' : 'Unstable'}
           </p>
        </header>
        <main className="flex-grow bg-white rounded-lg shadow-lg relative overflow-hidden">
            <ViewControls 
                onZoomIn={() => handleZoom('in')}
                onZoomOut={() => handleZoom('out')}
                onPan={handlePan}
                onReset={handleResetView}
            />
            <svg
            viewBox={geometry.viewBox}
            className="w-full h-full"
            preserveAspectRatio="xMidYMid meet"
            >
            <defs>
                <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                <path d="M 10 0 L 0 0 0 10" fill="none" stroke="#e9e9e9" strokeWidth="0.5"/>
                </pattern>
            </defs>
            <g transform={`translate(${viewTransform.tx}, ${viewTransform.ty}) scale(${viewTransform.scale})`}>
                <rect 
                x={gridX} 
                y={gridY} 
                width={gridWidth} 
                height={gridHeight} 
                fill="url(#grid)" 
                />
                <FrontView 
                dimensions={dimensions}
                geometry={geometry.frontView}
                onDimensionChange={handleDimensionChange}
                viewScale={viewTransform.scale}
                isStable={geometry.isStable}
                />
                <SideView 
                dimensions={dimensions}
                geometry={geometry.sideView}
                onDimensionChange={handleDimensionChange}
                viewScale={viewTransform.scale}
                isStable={geometry.isStable}
                />
                <TopView
                dimensions={dimensions}
                geometry={geometry.topView}
                sideViewPoints={geometry.sideViewPoints}
                onDimensionChange={handleDimensionChange}
                viewScale={viewTransform.scale}
                isStable={geometry.isStable}
                />
            </g>
            </svg>
        </main>
    </div>
  );
};

export default App;
