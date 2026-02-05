import { useMemo } from 'react';
import { ScreenDimensions, Point, Rect } from '../types';

const calculateIntersection = (pivot: Point, angleDeg: number, floorY: number): Point => {
  if (pivot.y >= floorY) return { x: pivot.x, y: floorY };
  
  const angleRad = angleDeg * (Math.PI / 180);
  const deltaY = floorY - pivot.y;
  // Corrected tangent calculation for SVG coordinate system.
  // angle=0 is vertical down, positive angle tilts right.
  const deltaX = deltaY * Math.tan(angleRad);

  return { x: pivot.x + deltaX, y: floorY };
};


export const useScreenGeometry = (dims: ScreenDimensions) => {
  return useMemo(() => {
    const {
      screenWidth, panelHeight, backpackHeight, backpackWidth,
      panelThickness, backpackThickness,
      vesaNeckHeight, vesaNeckDepth, vesaNeckWidth,
      standHeight, standToNeckGap, standWidth, standDepth, standFrontOffset,
      baseWidth, baseDepth, baseHeight,
      tiltForwardAngle, tiltBackwardAngle,
      swivelAngle,
    } = dims;

    const totalScreenThickness = panelThickness + backpackThickness;

    // --- Layout Positions ---
    const viewGap = 250;
    const topPadding = 150;
    const outerPadding = 100;
    
    const panelAssemblyHeight = Math.max(panelHeight, backpackHeight);
    const totalAssemblyHeight = baseHeight + standHeight + standToNeckGap - (vesaNeckHeight / 2) + (panelAssemblyHeight / 2);
    const maxViewHeight = totalAssemblyHeight;


    const totalAssemblyDepth = Math.max(baseDepth, standDepth + vesaNeckDepth + totalScreenThickness);
    const sideViewWidth = standDepth + vesaNeckDepth + totalScreenThickness;
    const topViewDrawingHeight = Math.max(baseDepth, standDepth + vesaNeckDepth + totalScreenThickness);

    const topViewOrigin = { x: 0 + sideViewWidth + viewGap, y: topPadding };
    const floorY = topViewOrigin.y + topViewDrawingHeight + viewGap + maxViewHeight;
    const sideViewOrigin = { x: 0, y: floorY };
    const frontViewOrigin = { x: 0 + sideViewWidth + viewGap, y: floorY };


    // --- Side View Calculations (Left is Front, Right is Rear) ---
    const sv = (() => {
      // Assemble from rear to front (right to left)
      const standRearX = sideViewOrigin.x + sideViewWidth;
      const standFrontX = standRearX - standDepth;
      
      const baseFrontX = standFrontX - standFrontOffset;
      
      const base = { x: baseFrontX, y: floorY - baseHeight, width: baseDepth, height: baseHeight };
      const stand = { x: standFrontX, y: base.y - standHeight, width: standDepth, height: standHeight };
      
      const vesaNeck = { x: stand.x - vesaNeckDepth, y: stand.y - standToNeckGap, width: vesaNeckDepth, height: vesaNeckHeight };
      
      const neckCenterY = vesaNeck.y + vesaNeck.height / 2;
      const backpackY = neckCenterY - backpackHeight / 2;
      const backpack = { x: vesaNeck.x - backpackThickness, y: backpackY, width: backpackThickness, height: backpackHeight };
      
      const panelY = backpack.y + (backpackHeight / 2) - (panelHeight / 2);
      const panel = { x: backpack.x - panelThickness, y: panelY, width: panelThickness, height: panelHeight };
      
      const screen = { x: panel.x, y: Math.min(panel.y, backpack.y), width: totalScreenThickness, height: Math.max(panel.y + panel.height, backpack.y + backpack.height) - Math.min(panel.y, backpack.y) };
      
      const pivot = {
        x: panel.x + totalScreenThickness / 3,
        y: panel.y + panel.height / 2,
      };

      const thicknessLine1 = panel.x + totalScreenThickness / 3;
      const thicknessLine2 = panel.x + (2 * totalScreenThickness) / 3;

      const pointA = calculateIntersection(pivot, -tiltBackwardAngle, floorY);
      const pointB = calculateIntersection(pivot, tiltForwardAngle, floorY);
      
      const components = [
        { rect: panel, width3d: screenWidth },
        { rect: backpack, width3d: backpackWidth },
        { rect: vesaNeck, width3d: vesaNeckWidth },
        { rect: stand, width3d: standWidth },
        { rect: base, width3d: baseWidth }
      ];

      let totalVolume = 0;
      let weightedCgX = 0;
      let weightedCgY = 0;

      components.forEach(({ rect, width3d }) => {
        const volume = rect.width * rect.height * width3d;
        const cgX = rect.x + rect.width / 2;
        const cgY = rect.y + rect.height / 2;
        
        totalVolume += volume;
        weightedCgX += cgX * volume;
        weightedCgY += cgY * volume;
      });

      const combinedCg = {
        x: totalVolume > 0 ? weightedCgX / totalVolume : 0,
        y: totalVolume > 0 ? weightedCgY / totalVolume : 0,
      };

      return {
        origin: sideViewOrigin, floorY, base, stand, screen, panel, backpack, vesaNeck,
        pivot, thicknessLine1, thicknessLine2, pointA, pointB,
        combinedCg
      };
    })();


    // --- Front View Calculations ---
    const fv = (() => {
        const centerX = frontViewOrigin.x + screenWidth/2;
        const base = {x: centerX - baseWidth/2, y: sv.base.y, width: baseWidth, height: baseHeight};
        const stand = {x: centerX - standWidth/2, y: sv.stand.y, width: standWidth, height: standHeight};
        const vesaNeck = { x: centerX - vesaNeckWidth / 2, y: sv.vesaNeck.y, width: vesaNeckWidth, height: vesaNeckHeight };
        const backpack = { x: centerX - backpackWidth/2, y: sv.backpack.y, width: backpackWidth, height: backpackHeight };
        const panel = {x: frontViewOrigin.x, y: sv.panel.y, width: screenWidth, height: panelHeight};

         const components = [
            { rect: panel, depth3d: panelThickness },
            { rect: backpack, depth3d: backpackThickness },
            { rect: vesaNeck, depth3d: vesaNeckDepth },
            { rect: stand, depth3d: standDepth },
            { rect: base, depth3d: baseDepth }
        ];

        let totalVolume = 0;
        let weightedCgX = 0;
        let weightedCgY = 0;

        components.forEach(({ rect, depth3d }) => {
            const volume = rect.width * rect.height * depth3d;
            const cgX = rect.x + rect.width / 2;
            const cgY = rect.y + rect.height / 2;
            
            totalVolume += volume;
            weightedCgX += cgX * volume;
            weightedCgY += cgY * volume;
        });

        const combinedCg = {
            x: totalVolume > 0 ? weightedCgX / totalVolume : 0,
            y: totalVolume > 0 ? weightedCgY / totalVolume : 0,
        };

        return { origin: frontViewOrigin, floorY, centerX, base, stand, panel, backpack, vesaNeck, combinedCg };
    })();

    // --- Top View Calculations ---
    const tv = (() => {
        const centerX = topViewOrigin.x + screenWidth / 2;
        const standY = topViewOrigin.y;

        const standFrontY = standY + standDepth;
        const baseFrontY = standFrontY + standFrontOffset;
        const baseY = baseFrontY - baseDepth;

        const base = { x: centerX - baseWidth / 2, y: baseY, width: baseWidth, height: baseDepth };
        const stand = { x: centerX - standWidth / 2, y: standY, width: standWidth, height: standDepth };
        const vesaNeck = { x: centerX - vesaNeckWidth / 2, y: stand.y + stand.height, width: vesaNeckWidth, height: vesaNeckDepth };
        const backpack = { x: centerX - backpackWidth / 2, y: vesaNeck.y + vesaNeck.height, width: backpackWidth, height: backpackThickness };
        const panel = { x: topViewOrigin.x, y: backpack.y + backpack.height, width: screenWidth, height: panelThickness };

        const pivot = { x: centerX, y: stand.y + stand.height / 2 };
        
        // --- Stability Calculation with Dynamic Swivel Angle ---
        const standCenterX_SideView = sv.stand.x + sv.stand.width / 2;
        const y_A = pivot.y - (sv.pointA.x - standCenterX_SideView);
        const y_B = pivot.y - (sv.pointB.x - standCenterX_SideView);

        const circleRadius = Math.abs(y_A - y_B) / 2;
        const circleCenterY = (y_A + y_B) / 2;

        const isCircleInRect = (circle: {cx: number, cy: number, r: number}, rect: Rect) => {
            return (
                rect.x <= circle.cx - circle.r &&
                rect.x + rect.width >= circle.cx + circle.r &&
                rect.y <= circle.cy - circle.r &&
                rect.y + rect.height >= circle.cy + circle.r
            );
        };

        const P = pivot;
        const C = { cx: P.x, cy: circleCenterY };
        const r = circleRadius;
        
        // Use dynamic swivel angle for stability check
        const angleRadSwivel = Math.abs(swivelAngle) * (Math.PI / 180);

        const getRotatedCenter = (angleRad: number) => {
            const sinA = Math.sin(angleRad);
            const cosA = Math.cos(angleRad);
            // Rotates point C around point P
            const cx_rotated = P.x + (C.cx - P.x) * cosA - (C.cy - P.y) * sinA;
            const cy_rotated = P.y + (C.cx - P.x) * sinA + (C.cy - P.y) * cosA;
            return { cx: cx_rotated, cy: cy_rotated };
        };

        const center0 = C;
        const centerPlusSwivel = getRotatedCenter(angleRadSwivel);
        const centerMinusSwivel = getRotatedCenter(-angleRadSwivel);

        // A screen is considered stable if the projection circle is fully within the base 
        // at neutral, positive swivel, and negative swivel positions.
        const isStable = 
            isCircleInRect({ ...center0, r }, base) &&
            isCircleInRect({ ...centerPlusSwivel, r }, base) &&
            isCircleInRect({ ...centerMinusSwivel, r }, base);

        return {
            origin: topViewOrigin, centerX, base, stand, panel, backpack, vesaNeck,
            isStable,
            pivot
        };
    })();
    
    // --- ViewBox Calculation ---
    const allElements = [
        fv.base, fv.stand, fv.panel, fv.backpack, fv.vesaNeck,
        sv.base, sv.stand, sv.panel, sv.backpack, sv.vesaNeck, {x: sv.pointA.x, y: sv.floorY, width: 0, height: 0}, {x: sv.pointB.x, y: sv.floorY, width: 0, height: 0},
        tv.base, tv.stand, tv.panel, tv.backpack, tv.vesaNeck
    ];

    const minX = Math.min(...allElements.map(el => el.x)) - outerPadding;
    const minY = Math.min(...allElements.map(el => el.y)) - outerPadding;
    const maxX = Math.max(...allElements.map(el => el.x + el.width)) + outerPadding;
    const maxY = Math.max(...allElements.map(el => el.y + el.height)) + outerPadding;

    const viewBox = `${minX} ${minY} ${maxX - minX} ${maxY - minY}`;

    return {
      sideView: sv,
      frontView: fv,
      topView: tv,
      sideViewPoints: { A: sv.pointA, B: sv.pointB, standCenterX: sv.stand.x + sv.stand.width / 2 },
      isStable: tv.isStable,
      viewBox,
    };
  }, [dims]);
};