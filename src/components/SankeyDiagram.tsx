import { useEffect, useRef, useState, useCallback } from 'react';
import { CategoryData, FinanceStats } from '@/types/finance';

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

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

const SankeyDiagram = ({ categories, stats }: SankeyDiagramProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);
  const [nodeBounds, setNodeBounds] = useState<NodeBounds[]>([]);
  const [isHovering, setIsHovering] = useState(false);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = container.getBoundingClientRect();
    const width = rect.width;
    const height = Math.max(400, categories.length * 60 + 100);

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, width, height);

    const isMobile = width < 480;
    const leftMargin = isMobile ? 80 : 120;
    const rightMargin = isMobile ? 120 : 180;
    const nodeWidth = 24;
    const minNodeHeight = 30;
    const nodePadding = 35;
    const cornerRadius = 6;

    const incomeNodeHeight = height * 0.7;
    const incomeNodeY = (height - incomeNodeHeight) / 2;
    const incomeNodeX = leftMargin;

    const bounds: NodeBounds[] = [];

    // Draw income node
    ctx.fillStyle = '#0a0a0a';
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
    ctx.fillStyle = '#0a0a0a';
    ctx.font = 'bold 14px Inter, system-ui, sans-serif';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.fillText('Income', incomeNodeX - 12, incomeNodeY + incomeNodeHeight / 2 - 10);
    ctx.font = '12px Inter, system-ui, sans-serif';
    ctx.fillStyle = '#666666';
    ctx.fillText(formatCurrency(stats.totalSpent), incomeNodeX - 12, incomeNodeY + incomeNodeHeight / 2 + 10);

    // Calculate category node positions
    const totalCategoryHeight = categories.reduce((sum, cat) => {
      const proportion = cat.total / stats.totalSpent;
      return sum + Math.max(minNodeHeight, proportion * incomeNodeHeight);
    }, 0) + (categories.length - 1) * nodePadding;

    const startY = (height - totalCategoryHeight) / 2;
    const categoryNodeX = width - rightMargin - nodeWidth;

    let currentY = startY;
    const categoryNodes: { y: number; height: number; category: CategoryData }[] = [];

    for (const category of categories) {
      const proportion = category.total / stats.totalSpent;
      const nodeHeight = Math.max(minNodeHeight, proportion * incomeNodeHeight);

      categoryNodes.push({
        y: currentY,
        height: nodeHeight,
        category
      });

      currentY += nodeHeight + nodePadding;
    }

    // Draw flows (Bezier curves)
    let incomeFlowY = incomeNodeY;

    for (const node of categoryNodes) {
      const flowHeight = (node.category.total / stats.totalSpent) * incomeNodeHeight;
      
      // Parse color and create semi-transparent version
      const colorMatch = node.category.color.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/);
      let fillColor = 'rgba(100, 100, 100, 0.3)';
      
      if (colorMatch) {
        const [, h, s, l] = colorMatch;
        fillColor = `hsla(${h}, ${s}%, ${l}%, 0.5)`;
      }

      ctx.fillStyle = fillColor;
      ctx.beginPath();
      
      // Start at income node
      const startX = incomeNodeX + nodeWidth;
      const startY1 = incomeFlowY;
      const startY2 = incomeFlowY + flowHeight;
      
      // End at category node
      const endX = categoryNodeX;
      const endY1 = node.y;
      const endY2 = node.y + node.height;
      
      // Control points for bezier
      const cpX1 = startX + (endX - startX) * 0.4;
      const cpX2 = startX + (endX - startX) * 0.6;

      // Draw filled bezier path
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
      let nodeColor = '#0a0a0a';
      
      if (colorMatch) {
        const [, h] = colorMatch;
        nodeColor = `hsl(${h}, 50%, 40%)`;
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

      // Draw labels
      const labelX = categoryNodeX + nodeWidth + 12;
      const isCompact = node.height < 35;

      if (isCompact) {
        ctx.fillStyle = '#0a0a0a';
        ctx.font = '12px Inter, system-ui, sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        const compactLabel = `${node.category.name} ${formatCurrency(node.category.total)}`;
        ctx.fillText(compactLabel, labelX, node.y + node.height / 2);
      } else {
        const centerY = node.y + node.height / 2;
        
        ctx.fillStyle = '#0a0a0a';
        ctx.font = 'bold 13px Inter, system-ui, sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(node.category.name, labelX, centerY - 10);
        
        ctx.font = '12px Inter, system-ui, sans-serif';
        ctx.fillStyle = '#666666';
        ctx.fillText(
          `${formatCurrency(node.category.total)} (${node.category.percentage.toFixed(1)}%)`,
          labelX,
          centerY + 10
        );
      }
    }

    setNodeBounds(bounds);
  }, [categories, stats]);

  useEffect(() => {
    draw();

    let resizeTimeout: ReturnType<typeof setTimeout>;
    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(draw, 250);
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
        x >= node.x &&
        x <= node.x + node.width &&
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
          amount: formatCurrency(stats.totalSpent)
        });
      } else if (foundNode.category) {
        setTooltip({
          x: e.clientX,
          y: e.clientY,
          label: foundNode.category.name,
          amount: formatCurrency(foundNode.category.total),
          percentage: `${foundNode.category.percentage.toFixed(1)}%`
        });
      }
    } else {
      setIsHovering(false);
      setTooltip(null);
    }
  }, [nodeBounds, stats.totalSpent]);

  const handleMouseLeave = useCallback(() => {
    setIsHovering(false);
    setTooltip(null);
  }, []);

  return (
    <div className="mb-10">
      <h2 className="text-xl font-bold mb-4">Spending Flow</h2>
      <div 
        ref={containerRef} 
        className="relative bg-card rounded-xl border border-border p-4 overflow-hidden"
      >
        <canvas
          ref={canvasRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          style={{ cursor: isHovering ? 'pointer' : 'default' }}
        />
        
        {tooltip && (
          <div
            className="fixed z-50 px-3 py-2 bg-foreground text-background text-sm rounded-lg shadow-lg pointer-events-none"
            style={{
              left: tooltip.x + 12,
              top: tooltip.y + 12
            }}
          >
            <p className="font-semibold">{tooltip.label}</p>
            <p>{tooltip.amount}</p>
            {tooltip.percentage && (
              <p className="text-background/70">{tooltip.percentage}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SankeyDiagram;
