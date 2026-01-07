import { useEffect, useRef, useState, useCallback } from 'react';
import { CategoryData, FinanceStats } from '@/types/finance';
import { cn } from '@/lib/utils';

interface SankeyDiagramProps {
  categories: CategoryData[];
  stats: FinanceStats;
}

interface TooltipData {
  x: number;
  y: number;
  label: string;
  amount: string;
  percentage?: string;
}

interface NodeBounds {
  x: number;
  y: number;
  width: number;
  height: number;
  category?: CategoryData;
  isIncome?: boolean;
}

const SankeyDiagram = ({ categories, stats }: SankeyDiagramProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);
  const [nodeBounds, setNodeBounds] = useState<NodeBounds[]>([]);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  const currency = stats.currency || 'USD';

  const formatCurrency = useCallback((amount: number) => {
    if (amount >= 1000) {
      const formatted = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency,
        minimumFractionDigits: 1,
        maximumFractionDigits: 1
      }).format(amount / 1000);
      return formatted.replace(/\.0$/, '') + 'k';
    }
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }, [currency]);

  const formatCurrencyFull = useCallback((amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  }, [currency]);

  const calculateHeight = useCallback(() => {
    const minHeight = 280;
    const perCategoryHeight = 44;
    const padding = 60;
    return Math.max(minHeight, categories.length * perCategoryHeight + padding);
  }, [categories.length]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = container.getBoundingClientRect();
    const width = rect.width;
    const height = calculateHeight();

    setDimensions({ width, height });

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, width, height);

    const isMobile = width < 500;
    const leftMargin = isMobile ? 12 : 20;
    const rightMargin = isMobile ? 12 : 20;
    const labelLeftWidth = isMobile ? 70 : 90;
    const labelRightWidth = isMobile ? 90 : 130;
    const nodeWidth = isMobile ? 6 : 8;
    const minNodeHeight = 20;
    const nodePadding = isMobile ? 6 : 8;
    const cornerRadius = nodeWidth / 2;
    const verticalPadding = 30;

    const flowAreaLeft = leftMargin + labelLeftWidth;
    const flowAreaRight = width - rightMargin - labelRightWidth;
    const incomeNodeX = flowAreaLeft;
    const categoryNodeX = flowAreaRight - nodeWidth;

    // Calculate total height needed for categories
    const availableHeight = height - (verticalPadding * 2);
    const totalPaddingHeight = (categories.length - 1) * nodePadding;
    const nodeAreaHeight = availableHeight - totalPaddingHeight;

    // Calculate category node heights
    const categoryNodes: { y: number; height: number; category: CategoryData; index: number }[] = [];
    let currentY = verticalPadding;

    for (let i = 0; i < categories.length; i++) {
      const category = categories[i];
      const proportion = category.total / stats.totalSpent;
      const nodeHeight = Math.max(minNodeHeight, proportion * nodeAreaHeight);
      
      categoryNodes.push({
        y: currentY,
        height: nodeHeight,
        category,
        index: i
      });
      
      currentY += nodeHeight + nodePadding;
    }

    // Recalculate to fit within bounds
    const totalNodeHeight = categoryNodes.reduce((sum, n) => sum + n.height, 0) + totalPaddingHeight;
    const scale = totalNodeHeight > availableHeight ? availableHeight / totalNodeHeight : 1;
    
    currentY = verticalPadding;
    for (const node of categoryNodes) {
      node.y = currentY;
      node.height = node.height * scale;
      currentY += node.height + nodePadding * scale;
    }

    const actualTotalHeight = currentY - nodePadding * scale - verticalPadding;
    const incomeNodeHeight = actualTotalHeight;
    const incomeNodeY = verticalPadding;

    const bounds: NodeBounds[] = [];

    // Draw flows first (behind nodes)
    let incomeFlowY = incomeNodeY;

    for (const node of categoryNodes) {
      const flowHeight = (node.category.total / stats.totalSpent) * incomeNodeHeight;
      const isHovered = hoveredIndex === node.index;
      
      // Parse category color
      const colorMatch = node.category.color.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/);
      const hue = colorMatch ? parseInt(colorMatch[1]) : 0;
      
      // Create gradient for flow
      const gradient = ctx.createLinearGradient(incomeNodeX + nodeWidth, 0, categoryNodeX, 0);
      const opacity = isHovered ? 0.4 : 0.18;
      gradient.addColorStop(0, `hsla(${hue}, 40%, 50%, ${opacity})`);
      gradient.addColorStop(0.5, `hsla(${hue}, 35%, 55%, ${opacity * 1.2})`);
      gradient.addColorStop(1, `hsla(${hue}, 45%, 50%, ${opacity})`);

      ctx.fillStyle = gradient;
      ctx.beginPath();
      
      const startX = incomeNodeX + nodeWidth;
      const startY1 = incomeFlowY;
      const startY2 = incomeFlowY + flowHeight;
      
      const endX = categoryNodeX;
      const endY1 = node.y;
      const endY2 = node.y + node.height;
      
      // Smoother bezier curves
      const tension = 0.4;
      const cpX1 = startX + (endX - startX) * tension;
      const cpX2 = endX - (endX - startX) * tension;

      ctx.moveTo(startX, startY1);
      ctx.bezierCurveTo(cpX1, startY1, cpX2, endY1, endX, endY1);
      ctx.lineTo(endX, endY2);
      ctx.bezierCurveTo(cpX2, endY2, cpX1, startY2, startX, startY2);
      ctx.closePath();
      ctx.fill();

      incomeFlowY += flowHeight;
    }

    // Draw source node (left side)
    const sourceGradient = ctx.createLinearGradient(incomeNodeX, incomeNodeY, incomeNodeX, incomeNodeY + incomeNodeHeight);
    sourceGradient.addColorStop(0, 'hsl(0, 0%, 20%)');
    sourceGradient.addColorStop(0.5, 'hsl(0, 0%, 15%)');
    sourceGradient.addColorStop(1, 'hsl(0, 0%, 20%)');
    
    ctx.fillStyle = sourceGradient;
    ctx.beginPath();
    ctx.roundRect(incomeNodeX, incomeNodeY, nodeWidth, incomeNodeHeight, cornerRadius);
    ctx.fill();

    bounds.push({
      x: incomeNodeX,
      y: incomeNodeY,
      width: nodeWidth,
      height: incomeNodeHeight,
      isIncome: true
    });

    // Source label
    ctx.fillStyle = 'hsl(0, 0%, 20%)';
    ctx.font = `600 ${isMobile ? 11 : 13}px Inter, system-ui, sans-serif`;
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.fillText('Spending', incomeNodeX - 10, incomeNodeY + incomeNodeHeight / 2 - 10);
    
    ctx.font = `500 ${isMobile ? 10 : 12}px Inter, system-ui, sans-serif`;
    ctx.fillStyle = 'hsl(0, 0%, 45%)';
    ctx.fillText(formatCurrency(stats.totalSpent), incomeNodeX - 10, incomeNodeY + incomeNodeHeight / 2 + 10);

    // Draw category nodes and labels
    for (const node of categoryNodes) {
      const isHovered = hoveredIndex === node.index;
      const colorMatch = node.category.color.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/);
      const hue = colorMatch ? parseInt(colorMatch[1]) : 0;
      
      // Node gradient
      const nodeGradient = ctx.createLinearGradient(categoryNodeX, node.y, categoryNodeX, node.y + node.height);
      const lightness = isHovered ? 45 : 50;
      nodeGradient.addColorStop(0, `hsl(${hue}, 50%, ${lightness}%)`);
      nodeGradient.addColorStop(0.5, `hsl(${hue}, 45%, ${lightness - 5}%)`);
      nodeGradient.addColorStop(1, `hsl(${hue}, 50%, ${lightness}%)`);

      ctx.fillStyle = nodeGradient;
      ctx.beginPath();
      ctx.roundRect(categoryNodeX, node.y, nodeWidth, node.height, cornerRadius);
      ctx.fill();

      bounds.push({
        x: categoryNodeX,
        y: node.y,
        width: nodeWidth,
        height: node.height,
        category: node.category
      });

      // Labels
      const labelX = categoryNodeX + nodeWidth + 12;
      const centerY = node.y + node.height / 2;

      // Truncate name if needed
      const maxNameLength = isMobile ? 14 : 20;
      let displayName = node.category.name;
      if (displayName.length > maxNameLength) {
        displayName = displayName.substring(0, maxNameLength - 1) + '…';
      }

      const textOpacity = isHovered ? 1 : 0.85;
      
      if (node.height < 32) {
        // Single line for small nodes
        ctx.fillStyle = `hsla(0, 0%, 20%, ${textOpacity})`;
        ctx.font = `500 ${isMobile ? 10 : 11}px Inter, system-ui, sans-serif`;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(`${displayName}  ${formatCurrency(node.category.total)}`, labelX, centerY);
      } else {
        // Two lines
        ctx.fillStyle = `hsla(0, 0%, 15%, ${textOpacity})`;
        ctx.font = `600 ${isMobile ? 10 : 12}px Inter, system-ui, sans-serif`;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(displayName, labelX, centerY - 8);
        
        ctx.font = `500 ${isMobile ? 9 : 11}px Inter, system-ui, sans-serif`;
        ctx.fillStyle = `hsla(0, 0%, 45%, ${textOpacity})`;
        ctx.fillText(`${formatCurrency(node.category.total)}  ·  ${node.category.percentage.toFixed(0)}%`, labelX, centerY + 9);
      }
    }

    setNodeBounds(bounds);
  }, [categories, stats, calculateHeight, formatCurrency, hoveredIndex]);

  useEffect(() => {
    draw();

    let resizeTimeout: ReturnType<typeof setTimeout>;
    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(draw, 100);
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(resizeTimeout);
    };
  }, [draw]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    let foundNode: NodeBounds | null = null;
    let foundIndex: number | null = null;

    for (let i = 0; i < nodeBounds.length; i++) {
      const node = nodeBounds[i];
      if (
        x >= node.x - 15 &&
        x <= node.x + node.width + 15 &&
        y >= node.y - 5 &&
        y <= node.y + node.height + 5
      ) {
        foundNode = node;
        foundIndex = node.isIncome ? null : i - 1; // Account for income node at index 0
        break;
      }
    }

    setHoveredIndex(foundIndex);

    if (foundNode) {
      if (foundNode.isIncome) {
        setTooltip({
          x: e.clientX,
          y: e.clientY,
          label: 'Total Spending',
          amount: formatCurrencyFull(stats.totalSpent)
        });
      } else if (foundNode.category) {
        setTooltip({
          x: e.clientX,
          y: e.clientY,
          label: foundNode.category.name,
          amount: formatCurrencyFull(foundNode.category.total),
          percentage: `${foundNode.category.percentage.toFixed(1)}%`
        });
      }
    } else {
      setTooltip(null);
    }
  }, [nodeBounds, stats.totalSpent, formatCurrencyFull]);

  const handleMouseLeave = useCallback(() => {
    setHoveredIndex(null);
    setTooltip(null);
  }, []);

  return (
    <div className="mb-6 md:mb-8">
      <div className="p-4 md:p-5 rounded-lg border border-border bg-card">
        <div className="flex items-center justify-between mb-3 md:mb-4">
          <p className="text-[10px] md:text-[11px] uppercase tracking-wide text-muted-foreground font-medium">
            Money Flow
          </p>
          <span className="text-[10px] md:text-xs text-muted-foreground">
            {categories.length} categories
          </span>
        </div>
        <div 
          ref={containerRef} 
          className="relative"
        >
          <canvas
            ref={canvasRef}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            className={cn("w-full transition-opacity", hoveredIndex !== null && "cursor-pointer")}
            style={{ height: dimensions.height || calculateHeight() }}
          />
          
          {tooltip && (
            <div
              className="fixed z-50 px-3 py-2 bg-foreground text-background text-xs rounded-md shadow-xl pointer-events-none"
              style={{
                left: Math.min(tooltip.x + 12, window.innerWidth - 160),
                top: tooltip.y + 12
              }}
            >
              <p className="font-semibold">{tooltip.label}</p>
              <p className="text-background/80 mt-0.5">{tooltip.amount}</p>
              {tooltip.percentage && (
                <p className="text-background/60 text-[10px] mt-0.5">{tooltip.percentage} of total</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SankeyDiagram;
