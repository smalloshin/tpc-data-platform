import { useState, useEffect, useCallback } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Node,
  Edge,
  useNodesState,
  useEdgesState,
  MarkerType,
  Position,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ZoomIn, ZoomOut, Maximize2, Filter } from 'lucide-react';

interface KnowledgeGraphViewerProps {
  onConceptClick?: (concept: any) => void;
}

interface GraphNode {
  id: string;
  label: string;
  type: 'concept' | 'keyword';
  category: string;
  color: string;
  size: number;
}

interface GraphLink {
  source: string;
  target: string;
  type: string;
}

const KnowledgeGraphViewer = ({ onConceptClick }: KnowledgeGraphViewerProps) => {
  const [graphData, setGraphData] = useState<{ nodes: GraphNode[]; links: GraphLink[] } | null>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [viewMode, setViewMode] = useState<'categories' | 'full'>('categories');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [categories, setCategories] = useState<string[]>([]);

  // 載入知識圖譜資料
  useEffect(() => {
    fetch('/data/transmission_knowledge_graph.json')
      .then(res => res.json())
      .then(data => {
        setGraphData(data);
        
        // 提取所有類別
        const uniqueCategories = [...new Set(
          data.nodes
            .filter((n: GraphNode) => n.type === 'concept')
            .map((n: GraphNode) => n.category)
        )] as string[];
        setCategories(uniqueCategories);
      })
      .catch(err => console.error('載入知識圖譜失敗:', err));
  }, []);

  // 生成類別視圖節點
  const generateCategoryNodes = useCallback(() => {
    if (!categories.length) return [];

    const categoryColors: { [key: string]: string } = {
      '設施類型': '#FF6B6B',
      '設備': '#4ECDC4',
      '技術參數': '#45B7D1',
      '運作管理': '#96CEB4',
      '系統': '#FFEAA7',
      '技術': '#DFE6E9',
      '設施': '#74B9FF',
    };

    return categories.map((cat, idx) => {
      const angle = (idx / categories.length) * 2 * Math.PI;
      const radius = 250;
      const x = Math.cos(angle) * radius + 400;
      const y = Math.sin(angle) * radius + 300;

      return {
        id: `cat_${cat}`,
        type: 'default',
        position: { x, y },
        data: { 
          label: cat,
          category: cat,
        },
        style: {
          background: categoryColors[cat] || '#F5A623',
          color: 'white',
          border: '2px solid white',
          borderRadius: '50%',
          width: 120,
          height: 120,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '14px',
          fontWeight: 'bold',
          cursor: 'pointer',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        },
      };
    });
  }, [categories]);

  // 生成完整圖譜視圖
  const generateFullGraphNodes = useCallback(() => {
    if (!graphData) return { nodes: [], edges: [] };

    const filteredNodes = selectedCategory
      ? graphData.nodes.filter(n => 
          n.type === 'concept' && n.category === selectedCategory || 
          n.type === 'keyword'
        )
      : graphData.nodes;

    const nodeIds = new Set(filteredNodes.map(n => n.id));

    // 創建節點
    const flowNodes: Node[] = filteredNodes.map((node, idx) => {
      const isConcept = node.type === 'concept';
      
      return {
        id: node.id,
        type: 'default',
        position: { 
          x: (idx % 8) * 150 + 50, 
          y: Math.floor(idx / 8) * 150 + 50 
        },
        data: { 
          label: node.label,
          nodeData: node,
        },
        style: {
          background: isConcept ? node.color : '#4A90E2',
          color: 'white',
          border: isConcept ? '3px solid white' : '2px solid white',
          borderRadius: isConcept ? '50%' : '8px',
          width: isConcept ? 100 : 80,
          height: isConcept ? 100 : 60,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: isConcept ? '12px' : '10px',
          fontWeight: isConcept ? 'bold' : 'normal',
          padding: '8px',
          textAlign: 'center',
          cursor: 'pointer',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        },
      };
    });

    // 創建連線
    const flowEdges: Edge[] = graphData.links
      .filter(link => nodeIds.has(link.source) && nodeIds.has(link.target))
      .map((link, idx) => ({
        id: `edge-${idx}`,
        source: link.source,
        target: link.target,
        type: 'smoothstep',
        animated: false,
        style: { stroke: '#94A3B8', strokeWidth: 2 },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: '#94A3B8',
        },
      }));

    return { nodes: flowNodes, edges: flowEdges };
  }, [graphData, selectedCategory]);

  // 更新視圖
  useEffect(() => {
    if (viewMode === 'categories') {
      setNodes(generateCategoryNodes());
      setEdges([]);
    } else {
      const { nodes: fullNodes, edges: fullEdges } = generateFullGraphNodes();
      setNodes(fullNodes);
      setEdges(fullEdges);
    }
  }, [viewMode, generateCategoryNodes, generateFullGraphNodes, setNodes, setEdges]);

  const handleNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    if (viewMode === 'categories') {
      // 從類別視圖切換到完整視圖
      const category = node.data.category as string;
      setSelectedCategory(category);
      setViewMode('full');
    } else {
      // 在完整視圖中點擊概念
      const nodeData = node.data.nodeData as GraphNode | undefined;
      if (nodeData?.type === 'concept' && onConceptClick) {
        onConceptClick(nodeData);
      }
    }
  }, [viewMode, onConceptClick]);

  const handleBackToCategories = () => {
    setViewMode('categories');
    setSelectedCategory(null);
  };

  if (!graphData) {
    return (
      <Card className="p-8 text-center">
        <p className="text-muted-foreground">載入知識圖譜中...</p>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      {/* 控制面板 */}
      <div className="p-4 border-b bg-muted/30 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {viewMode === 'full' && (
            <Button variant="outline" size="sm" onClick={handleBackToCategories}>
              ← 返回類別總覽
            </Button>
          )}
          {selectedCategory && (
            <Badge variant="default" className="text-sm">
              {selectedCategory}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            {viewMode === 'categories' ? '類別總覽' : '詳細視圖'}
          </Badge>
          <Badge variant="secondary" className="text-xs">
            {nodes.length} 節點
          </Badge>
        </div>
      </div>

      {/* 圖譜視圖 */}
      <div style={{ height: '600px', width: '100%' }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={handleNodeClick}
          fitView
          attributionPosition="bottom-left"
        >
          <Background />
          <Controls />
          <MiniMap 
            nodeColor={(node) => {
              return node.style?.background as string || '#F5A623';
            }}
            maskColor="rgba(0, 0, 0, 0.1)"
          />
        </ReactFlow>
      </div>

      {/* 說明文字 */}
      <div className="p-4 border-t bg-muted/20">
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          {viewMode === 'categories' ? (
            <>
              <span>💡 點擊任一類別圓圈以探索該類別的概念</span>
              <div className="flex gap-2 ml-auto">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full bg-[#F5A623]" />
                  <span>類別</span>
                </div>
              </div>
            </>
          ) : (
            <>
              <span>💡 點擊概念節點以搜尋相關資料集</span>
              <div className="flex gap-3 ml-auto">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full bg-[#F5A623]" />
                  <span>概念</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded bg-[#4A90E2]" />
                  <span>關鍵字</span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </Card>
  );
};

export default KnowledgeGraphViewer;
