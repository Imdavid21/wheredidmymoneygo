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
  const [isHovering, setIsHovering] = useState(false);
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
    const minHeight = 300;
    const perCategoryHeight = 50;
    const padding = 80;
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
    const leftMargin = isMobile ? 16 : 24;
    const rightMargin = isMobile ? 16 : 24;
    const labelLeftWidth = isMobile ? 60 : 80;
    const labelRightWidth = isMobile ? 80 : 120;
    const nodeWidth = isMobile ? 8 : 12;
    const minNodeHeight = 24;
    const nodePadding = isMobile ? 8 : 12;
    const cornerRadius = 2;
    const verticalPadding = 40;

    const flowAreaLeft = leftMargin + labelLeftWidth;
    const flowAreaRight = width - rightMargin - labelRightWidth;
    const incomeNodeX = flowAreaLeft;
    const categoryNodeX = flowAreaRight - nodeWidth;

    // Calculate total height needed for categories
    const availableHeight = height - (verticalPadding * 2);
    const totalPaddingHeight = (categories.length - 1) * nodePadding;
    const nodeAreaHeight = availableHeight - totalPaddingHeight;

    // Calculate category node heights
    const categoryNodes: { y: number; height: number; category: CategoryData }[] = [];
    let currentY = verticalPadding;

    for (const category of categories) {
      const proportion = category.total / stats.totalSpent;
      const nodeHeight = Math.max(minNodeHeight, proportion * nodeAreaHeight);
      
      categoryNodes.push({
        y: currentY,
        height: nodeHeight,
        category
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

    // Draw income node
    ctx.fillStyle = 'hsl(0, 0%, 15%)';
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

    // Draw income label
    ctx.fillStyle = 'hsl(0, 0%, 15%)';
    ctx.font = `500 ${isMobile ? 11 : 12}px Inter, system-ui, sans-serif`;
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.fillText('Income', incomeNodeX - 8, incomeNodeY + incomeNodeHeight / 2 - 8);
    
    ctx.font = `400 ${isMobile ? 10 : 11}px Inter, system-ui, sans-serif`;
    ctx.fillStyle = 'hsl(0, 0%, 50%)';
    ctx.fillText(formatCurrency(stats.totalSpent), incomeNodeX - 8, incomeNodeY + incomeNodeHeight / 2 + 8);

    // Draw flows
    let incomeFlowY = incomeNodeY;

    for (const node of categoryNodes) {
      const flowHeight = (node.category.total / stats.totalSpent) * incomeNodeHeight;
      
      const colorMatch = node.category.color.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/);
      let fillColor = 'hsla(0, 0%, 50%, 0.15)';
      
      if (colorMatch) {
        const [, h, s] = colorMatch;
        fillColor = `hsla(${h}, ${s}%, 55%, 0.25)`;
      }

      ctx.fillStyle = fillColor;
      ctx.beginPath();
      
      const startX = incomeNodeX + nodeWidth;
      const startY1 = incomeFlowY;
      const startY2 = incomeFlowY + flowHeight;
      
      const endX = categoryNodeX;
      const endY1 = node.y;
      const endY2 = node.y + node.height;
      
      const cpX1 = startX + (endX - startX) * 0.5;
      const cpX2 = startX + (endX - startX) * 0.5;

      ctx.moveTo(startX, startY1);
      ctx.bezierCurveTo(cpX1, startY1, cpX2, endY1, endX, endY1);
      ctx.lineTo(endX, endY2);
      ctx.bezierCurveTo(cpX2, endY2, cpX1, startY2, startX, startY2);
      ctx.closePath();
      ctx.fill();

      incomeFlowY += flowHeight;
    }

    // Draw category nodes and labels
    for (const node of categoryNodes) {
      const colorMatch = node.category.color.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/);
      let nodeColor = 'hsl(0, 0%, 30%)';
      
      if (colorMatch) {
        const [, h] = colorMatch;
        nodeColor = `hsl(${h}, 45%, 45%)`;
      }

      ctx.fillStyle = nodeColor;
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
      const labelX = categoryNodeX + nodeWidth + 8;
      const centerY = node.y + node.height / 2;

      // Truncate name if needed
      const maxNameLength = isMobile ? 12 : 18;
      let displayName = node.category.name;
      if (displayName.length > maxNameLength) {
        displayName = displayName.substring(0, maxNameLength - 2) + '..';
      }

      ctx.fillStyle = 'hsl(0, 0%, 15%)';
      ctx.font = `500 ${isMobile ? 10 : 11}px Inter, system-ui, sans-serif`;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      
      if (node.height < 35) {
        // Single line for small nodes
        ctx.fillText(`${displayName} ${formatCurrency(node.category.total)}`, labelX, centerY);
      } else {
        ctx.fillText(displayName, labelX, centerY - 7);
        ctx.font = `400 ${isMobile ? 9 : 10}px Inter, system-ui, sans-serif`;
        ctx.fillStyle = 'hsl(0, 0%, 50%)';
        ctx.fillText(`${formatCurrency(node.category.total)} · ${node.category.percentage.toFixed(0)}%`, labelX, centerY + 8);
      }
    }

    setNodeBounds(bounds);
  }, [categories, stats, calculateHeight, formatCurrency]);

  useEffect(() => {
    draw();

    let resizeTimeout: ReturnType<typeof setTimeout>;
    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(draw, 150);
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

    for (const node of nodeBounds) {
      if (
        x >= node.x - 10 &&
        x <= node.x + node.width + 10 &&
        y >= node.y &&
        y <= node.y + node.height
      ) {
        foundNode = node;
        break;
      }
    }

    if (foundNode) {
      setIsHovering(true);
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
      setIsHovering(false);
      setTooltip(null);
    }
  }, [nodeBounds, stats.totalSpent, formatCurrencyFull]);

  const handleMouseLeave = useCallback(() => {
    setIsHovering(false);
    setTooltip(null);
  }, []);

  return (
    <div className="mb-6 md:mb-8">
      <div className="flex items-center justify-between mb-2 md:mb-3">
        <h2 className="text-xs md:text-sm font-medium">Flow</h2>
        <span className="text-[10px] md:text-xs text-muted-foreground">{categories.length} categories</span>
      </div>
      <div 
        ref={containerRef} 
        className="relative rounded-lg border border-border bg-card overflow-hidden"
      >
        <canvas
          ref={canvasRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          className={cn("w-full", isHovering && "cursor-pointer")}
          style={{ height: dimensions.height || calculateHeight() }}
        />
        
        {tooltip && (
          <div
            className="fixed z-50 px-2.5 py-1.5 bg-foreground text-background text-xs rounded shadow-lg pointer-events-none"
            style={{
              left: Math.min(tooltip.x + 12, window.innerWidth - 150),
              top: tooltip.y + 12
            }}
          >
            <p className="font-medium">{tooltip.label}</p>
            <p className="text-background/80">{tooltip.amount}</p>
            {tooltip.percentage && (
              <p className="text-background/60">{tooltip.percentage}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SankeyDiagram;
