
import { useMemo } from 'react';
import { ScreenDimensions, Point, Rect } from '../types';

const calculateIntersection = (pivot: Point, angleDeg: number, floorY: number): Point => {
  if (pivot.y >= floorY) return { x: pivot.x, y: floorY };
  
  const angleRad = angleDeg * (Math.PI / 180);
  const deltaY = floorY - pivot.y;
  const deltaX = deltaY * Math.tan(angleRad);

  return { x: pivot.x + deltaX, y: floorY };
};


export const useScreenGeometry = (dims: ScreenDimensions) => {
  return useMemo(() => {
    const {
      screenWidth, panelHeight, backpackHeight, backpackWidth,
      panelThickness, backpackThickness,
      vesaNeckHeight, vesaNeckDepth, vesaNeckWidth,
      standHeight, standToNeckGap, liftingOffset, standWidth, standDepth, standFrontOffset,
      baseWidth, baseDepth, baseHeight,
      tiltForwardAngle, tiltBackwardAngle,
      swivelAngle, swivelPivotOffset,
      standBaseAngle,
    } = dims;

    const totalScreenThickness = panelThickness + backpackThickness;

    // --- Layout Positions ---
    const horizontalViewGap = 250; 
    const verticalViewGap = 0;     
    const topPadding = 150;
    const outerPadding = 100;
    
    const panelAssemblyHeight = Math.max(panelHeight, backpackHeight);
    
    // 固定支架投影高度計算
    const standAngleRad = standBaseAngle * (Math.PI / 180);
    const standTopXOffset = standHeight * Math.cos(standAngleRad);
    const standTopYOffset = -standHeight * Math.sin(standAngleRad);

    const sideViewWidthForLayout = 800; 
    const topViewDrawingHeight = Math.max(baseDepth, standDepth + vesaNeckDepth + totalScreenThickness + 200);

    const topViewOrigin = { x: sideViewWidthForLayout + horizontalViewGap, y: topPadding };
    
    const staticAssemblyHeight = baseHeight + standHeight + (panelAssemblyHeight); 
    const floorY = topViewOrigin.y + topViewDrawingHeight + verticalViewGap + staticAssemblyHeight;
    
    const sideViewOrigin = { x: 0, y: floorY };
    const frontViewOrigin = { x: sideViewWidthForLayout + horizontalViewGap, y: floorY };


    // --- Side View Calculations ---
    const sv = (() => {
      const standRearBottomX = sideViewOrigin.x + 600; 
      const standFrontBottomX = standRearBottomX - standDepth;
      
      const baseFrontX = standFrontBottomX - standFrontOffset;
      const baseRect = { x: baseFrontX, y: floorY - baseHeight, width: baseDepth, height: baseHeight };
      
      const p1 = { x: standFrontBottomX, y: baseRect.y };
      const p2 = { x: standRearBottomX, y: baseRect.y };
      const p3 = { x: p2.x + standTopXOffset, y: baseRect.y + standTopYOffset };
      const p4 = { x: p1.x + standTopXOffset, y: baseRect.y + standTopYOffset };
      const standPolyPoints = [p1, p2, p3, p4];

      // 計算最大 Lifting 限制：panel 底部不能低於 base 頂部 (baseRect.y)
      // panelY = (p4.y - standToNeckGap + liftingOffset + vesaNeckHeight / 2) - panelHeight / 2
      // panelY + panelHeight = baseRect.y
      // (p4.y - standToNeckGap + liftingOffset + vesaNeckHeight / 2) + panelHeight / 2 = baseRect.y
      const maxLiftingOffset = baseRect.y - p4.y + standToNeckGap - (vesaNeckHeight / 2) - (panelHeight / 2);

      // 修正後的 Lifting：0 是最高點，增加數值代表向下移動
      const clampedLifting = Math.max(0, Math.min(maxLiftingOffset, liftingOffset || 0));
      const totalPhysicalGap = standToNeckGap - clampedLifting;

      // Neck alignment
      const neckTopY = p4.y - totalPhysicalGap;
      const neckBottomY = neckTopY + vesaNeckHeight;
      
      const dx_dy = (p4.x - p1.x) / (p4.y - p1.y);

      const tr = { x: p4.x + (neckTopY - p4.y) * dx_dy, y: neckTopY }; 
      const br = { x: p4.x + (neckBottomY - p4.y) * dx_dy, y: neckBottomY }; 
      
      const tl_x = tr.x - vesaNeckDepth;
      const tl = { x: tl_x, y: neckTopY }; 
      const bl = { x: tl_x, y: neckBottomY }; 
      const neckPolyPoints = [tl, tr, br, bl];

      const vesaNeck = { 
          x: tl.x, 
          y: neckTopY, 
          width: vesaNeckDepth, 
          height: vesaNeckHeight,
          polyPoints: neckPolyPoints
      };
      
      const neckCenterY = neckTopY + vesaNeckHeight / 2;
      const backpackY = neckCenterY - backpackHeight / 2;
      const backpack = { x: tl.x - backpackThickness, y: backpackY, width: backpackThickness, height: backpackHeight };
      
      const panelY = neckCenterY - panelHeight / 2;
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
      
      const standBoundingRect = {
          x: Math.min(p1.x, p4.x),
          y: p4.y,
          width: standDepth,
          height: Math.abs(standTopYOffset)
      };

      const sVolume = standWidth * standDepth * standHeight;
      const sCgX = (p1.x + p2.x + p3.x + p4.x) / 4;
      const sCgY = (p1.y + p3.y) / 2;

      return {
        origin: sideViewOrigin, floorY, base: baseRect, stand: standBoundingRect, standPolyPoints, screen, panel, backpack, vesaNeck,
        pivot, thicknessLine1, thicknessLine2, pointA, pointB,
        standFrontBottomX, standRearBottomX, sCgX, sCgY, sVolume, totalPhysicalGap, maxLiftingOffset
      };
    })();

    // --- Front View Calculations ---
    const fv = (() => {
        const centerX = frontViewOrigin.x + screenWidth/2;
        const baseRect = {x: centerX - baseWidth/2, y: sv.base.y, width: baseWidth, height: baseHeight};
        const standTopY = sv.vesaNeck.y + sv.totalPhysicalGap;
        const stand = {x: centerX - standWidth/2, y: standTopY, width: standWidth, height: floorY - standTopY - baseHeight};
        const vesaNeck = { x: centerX - vesaNeckWidth / 2, y: sv.vesaNeck.y, width: vesaNeckWidth, height: vesaNeckHeight };
        const backpack = { x: centerX - backpackWidth/2, y: sv.backpack.y, width: backpackWidth, height: backpackHeight };
        const panel = {x: frontViewOrigin.x, y: sv.panel.y, width: screenWidth, height: panelHeight};

        return { origin: frontViewOrigin, floorY, centerX, base: baseRect, stand, panel, backpack, vesaNeck };
    })();

    // --- Top View Calculations ---
    const tv = (() => {
        const centerX = topViewOrigin.x + screenWidth / 2;
        const refY = topViewOrigin.y + 100;

        const mapXtoY = (sideX: number) => refY + (sv.standFrontBottomX - sideX);

        const standFrontBottomY = mapXtoY(sv.standPolyPoints[0].x);
        const standRearBottomY = mapXtoY(sv.standPolyPoints[1].x);
        const standFrontTopY = mapXtoY(sv.standPolyPoints[3].x);
        const standRearTopY = mapXtoY(sv.standPolyPoints[2].x);

        const baseFrontY = standFrontBottomY + standFrontOffset;
        const baseY = baseFrontY - baseDepth;

        const baseRect = { x: centerX - baseWidth / 2, y: baseY, width: baseWidth, height: baseDepth };
        
        const standBottomRect = { 
            x: centerX - standWidth / 2, 
            y: Math.min(standFrontBottomY, standRearBottomY), 
            width: standWidth, 
            height: Math.abs(standFrontBottomY - standRearBottomY) 
        };
        const standTopRect = { 
            x: centerX - standWidth / 2, 
            y: Math.min(standFrontTopY, standRearTopY), 
            width: standWidth, 
            height: Math.abs(standFrontTopY - standRearTopY) 
        };

        const leftX = centerX - standWidth / 2;
        const rightX = centerX + standWidth / 2;
        const standBodyPoints = [
            { x: leftX, y: Math.min(standFrontBottomY, standRearBottomY, standFrontTopY, standRearTopY) },
            { x: rightX, y: Math.min(standFrontBottomY, standRearBottomY, standFrontTopY, standRearTopY) },
            { x: rightX, y: Math.max(standFrontBottomY, standRearBottomY, standFrontTopY, standRearTopY) },
            { x: leftX, y: Math.max(standFrontBottomY, standRearBottomY, standFrontTopY, standRearTopY) }
        ];

        const pivot = { x: centerX, y: standRearBottomY + swivelPivotOffset };
        
        const y_A = pivot.y - (sv.pointA.x - sv.standFrontBottomX - standDepth/2);
        const y_B = pivot.y - (sv.pointB.x - sv.standFrontBottomX - standDepth/2);
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
        const angleRadSwivel = Math.abs(swivelAngle) * (Math.PI / 180);
        const getRotatedCenter = (angleRad: number) => {
            const sinA = Math.sin(angleRad);
            const cosA = Math.cos(angleRad);
            const cx_rotated = pivot.x + (pivot.x - pivot.x) * cosA - (circleCenterY - pivot.y) * sinA;
            const cy_rotated = pivot.y + (pivot.x - pivot.x) * sinA + (circleCenterY - pivot.y) * cosA;
            return { cx: cx_rotated, cy: cy_rotated };
        };
        const isStable = isCircleInRect({ cx: pivot.x, cy: circleCenterY, r: circleRadius }, baseRect) &&
                          isCircleInRect({ ...getRotatedCenter(angleRadSwivel), r: circleRadius }, baseRect) &&
                          isCircleInRect({ ...getRotatedCenter(-angleRadSwivel), r: circleRadius }, baseRect);

        const vesaNeckRearX = sv.vesaNeck.polyPoints[1].x; 
        const vesaNeckBackY = mapXtoY(vesaNeckRearX);
        const vesaNeckRect = { x: centerX - vesaNeckWidth / 2, y: vesaNeckBackY, width: vesaNeckWidth, height: vesaNeckDepth };
        
        const backpackRearX = sv.backpack.x + sv.backpack.width;
        const backpackBackY = mapXtoY(backpackRearX);
        const backpackRect = { x: centerX - backpackWidth / 2, y: backpackBackY, width: backpackWidth, height: backpackThickness };
        
        const panelRearX = sv.panel.x + sv.panel.width;
        const panelBackY = mapXtoY(panelRearX);
        const panelRect = { x: topViewOrigin.x, y: panelBackY, width: screenWidth, height: panelThickness };

        return {
            origin: topViewOrigin, centerX, base: baseRect, 
            standBottom: standBottomRect, standTop: standTopRect, standBodyPoints,
            panel: panelRect, backpack: backpackRect, vesaNeck: vesaNeckRect,
            isStable, pivot, y_A, y_B
        };
    })();
    
    const combinedCg = (() => {
        const components = [
            { rect: sv.panel, width3d: screenWidth },
            { rect: sv.backpack, width3d: backpackWidth },
            { rect: sv.vesaNeck, width3d: vesaNeckWidth },
            { rect: sv.base, width3d: baseWidth }
        ];
        let totalVol = sv.sVolume;
        let wX = sv.sCgX * sv.sVolume;
        let wY = sv.sCgY * sv.sVolume;
        components.forEach(({ rect, width3d }) => {
            const vol = rect.width * rect.height * width3d;
            totalVol += vol;
            wX += (rect.x + rect.width / 2) * vol;
            wY += (rect.y + rect.height / 2) * vol;
        });
        return { x: wX / totalVol, y: wY / totalVol };
    })();

    const padding = outerPadding;
    const minX = Math.min(sv.base.x, fv.base.x, tv.base.x) - padding;
    const maxX = Math.max(sv.base.x + sv.base.width, fv.base.x + fv.base.width, tv.base.x + tv.base.width) + padding + 300; 
    
    const topY = topPadding - padding;
    const bottomY = floorY + padding + 150; 

    return {
      sideView: { ...sv, combinedCg },
      frontView: { ...fv, combinedCg: { x: fv.centerX, y: combinedCg.y } },
      topView: tv,
      sideViewPoints: { A: sv.pointA, B: sv.pointB, standCenterX: (sv.standPolyPoints[0].x + sv.standPolyPoints[1].x) / 2 },
      isStable: tv.isStable,
      viewBox: `${minX} ${topY} ${maxX - minX} ${bottomY - topY}`,
    };
  }, [dims]);
};
