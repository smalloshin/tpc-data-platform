import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';

interface KnowledgeGraphD3Props {
  onConceptClick?: (concept: any) => void;
}

interface GraphNode extends d3.SimulationNodeDatum {
  id: string;
  label: string;
  type: 'concept' | 'keyword' | 'dataset';
  category: string;
  stage?: string;
  color: string;
  size: number;
}

interface GraphLink extends d3.SimulationLinkDatum<GraphNode> {
  source: string | GraphNode;
  target: string | GraphNode;
  type: string;
  stage?: string;
}

const KnowledgeGraphD3 = ({ onConceptClick }: KnowledgeGraphD3Props) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [graphData, setGraphData] = useState<{ nodes: GraphNode[]; links: GraphLink[] } | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'keyword' | 'concept' | 'dataset'>('all');
  const [stageFilter, setStageFilter] = useState<'all' | '第一階段' | '第二階段' | '第三階段'>('all');
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [relatedDatasets, setRelatedDatasets] = useState<GraphNode[]>([]);
  const [stats, setStats] = useState({ nodes: 0, links: 0, concepts: 0, keywords: 0, datasets: 0 });

  // 載入資料
  useEffect(() => {
    fetch('/data/transmission_knowledge_graph.json')
      .then(res => res.json())
      .then(data => {
        setGraphData(data);
        
        // 計算統計資料
        const concepts = data.nodes.filter((n: GraphNode) => n.type === 'concept').length;
        const keywords = data.nodes.filter((n: GraphNode) => n.type === 'keyword').length;
        const datasets = data.nodes.filter((n: GraphNode) => n.type === 'dataset').length;
        
        setStats({
          nodes: data.nodes.length,
          links: data.links.length,
          concepts,
          keywords,
          datasets
        });
      })
      .catch(err => console.error('載入知識圖譜失敗:', err));
  }, []);

  // D3 力導向圖初始化
  useEffect(() => {
    if (!graphData || !svgRef.current) return;

    const width = svgRef.current.clientWidth;
    const height = 600;

    // 清空 SVG
    d3.select(svgRef.current).selectAll('*').remove();

    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height);

    // 添加縮放功能
    const g = svg.append('g');
    
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });

    svg.call(zoom);

    // 複製資料以避免修改原始資料
    const nodes = graphData.nodes.map(d => ({ ...d }));
    const links = graphData.links.map(d => ({ ...d }));

    // 建立力導向模擬
    const simulation = d3.forceSimulation(nodes)
      .force('link', d3.forceLink(links).id((d: any) => d.id).distance(100))
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(30));

    // 繪製連線
    const link = g.append('g')
      .selectAll('line')
      .data(links)
      .enter()
      .append('line')
      .attr('stroke', '#999')
      .attr('stroke-opacity', 0.3)
      .attr('stroke-width', 1);

    // 繪製節點
    const node = g.append('g')
      .selectAll('circle')
      .data(nodes)
      .enter()
      .append('circle')
      .attr('r', (d: GraphNode) => {
        if (d.type === 'concept') return 12;
        if (d.type === 'keyword') return 8;
        return 10;
      })
      .attr('fill', (d: GraphNode) => d.color)
      .attr('stroke', '#fff')
      .attr('stroke-width', 2)
      .style('cursor', 'pointer')
      .call(d3.drag<SVGCircleElement, GraphNode>()
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended) as any)
      .on('click', (event, d) => {
        event.stopPropagation();
        handleNodeClick(d);
      })
      .on('mouseover', function(event, d) {
        d3.select(this).attr('stroke-width', 3);
      })
      .on('mouseout', function(event, d) {
        // 保持選中節點的粗邊框
        const strokeWidth = (selectedNode && d.id === selectedNode.id) ? 4 : 2;
        d3.select(this).attr('stroke-width', strokeWidth);
      });

    // 繪製標籤（僅概念節點）
    const label = g.append('g')
      .selectAll('text')
      .data(nodes.filter((d: GraphNode) => d.type === 'concept'))
      .enter()
      .append('text')
      .text((d: GraphNode) => d.label)
      .attr('font-size', 10)
      .attr('dx', 15)
      .attr('dy', 4)
      .attr('fill', '#333')
      .style('pointer-events', 'none');

    // 更新位置
    simulation.on('tick', () => {
      link
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y);

      node
        .attr('cx', (d: any) => d.x)
        .attr('cy', (d: any) => d.y);

      label
        .attr('x', (d: any) => d.x)
        .attr('y', (d: any) => d.y);
    });

    // 拖曳功能
    function dragstarted(event: any, d: any) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }

    function dragged(event: any, d: any) {
      d.fx = event.x;
      d.fy = event.y;
    }

    function dragended(event: any, d: any) {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }

    // 點擊節點處理
    function handleNodeClick(d: GraphNode) {
      setSelectedNode(d);
      
      // 收集相關資料集
      const datasets: GraphNode[] = [];
      
      if (d.type === 'keyword') {
        // 關鍵字：收集該階段與該關鍵字相關的資料集
        const keywordStage = d.stage;
        const connectedConceptIds = new Set<string>();
        
        // 找到與關鍵字相連的概念
        links.forEach((link: any) => {
          const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
          const targetId = typeof link.target === 'object' ? link.target.id : link.target;
          const sourceNode = nodes.find(n => n.id === sourceId);
          const targetNode = nodes.find(n => n.id === targetId);
          
          if (sourceId === d.id && targetNode?.type === 'concept') {
            connectedConceptIds.add(targetId);
          }
          if (targetId === d.id && sourceNode?.type === 'concept') {
            connectedConceptIds.add(sourceId);
          }
        });
        
        // 找到這些概念相連的資料集（只顯示與關鍵字相同階段的）
        links.forEach((link: any) => {
          const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
          const targetId = typeof link.target === 'object' ? link.target.id : link.target;
          const sourceNode = nodes.find(n => n.id === sourceId);
          const targetNode = nodes.find(n => n.id === targetId);
          
          if (connectedConceptIds.has(sourceId) && targetNode?.type === 'dataset') {
            if (link.stage === keywordStage || !link.stage) {
              if (!datasets.find(ds => ds.id === targetNode.id)) {
                datasets.push(targetNode);
              }
            }
          }
          
          if (connectedConceptIds.has(targetId) && sourceNode?.type === 'dataset') {
            if (link.stage === keywordStage || !link.stage) {
              if (!datasets.find(ds => ds.id === sourceNode.id)) {
                datasets.push(sourceNode);
              }
            }
          }
        });
        
        // 也處理關鍵字直接連到資料集的情況
        links.forEach((link: any) => {
          const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
          const targetId = typeof link.target === 'object' ? link.target.id : link.target;
          const sourceNode = nodes.find(n => n.id === sourceId);
          const targetNode = nodes.find(n => n.id === targetId);
          
          if (sourceId === d.id && targetNode?.type === 'dataset') {
            if (link.stage === keywordStage || !link.stage) {
              if (!datasets.find(ds => ds.id === targetNode.id)) {
                datasets.push(targetNode);
              }
            }
          }
          if (targetId === d.id && sourceNode?.type === 'dataset') {
            if (link.stage === keywordStage || !link.stage) {
              if (!datasets.find(ds => ds.id === sourceNode.id)) {
                datasets.push(sourceNode);
              }
            }
          }
        });
      } else if (d.type === 'dataset') {
        // 資料集：只顯示該資料集自己
        datasets.push(d);
      } else if (d.type === 'concept') {
        // 概念：收集與該概念相連的所有資料集
        links.forEach((link: any) => {
          const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
          const targetId = typeof link.target === 'object' ? link.target.id : link.target;
          const sourceNode = nodes.find(n => n.id === sourceId);
          const targetNode = nodes.find(n => n.id === targetId);
          
          if (sourceId === d.id && targetNode?.type === 'dataset') {
            if (!datasets.find(ds => ds.id === targetNode.id)) {
              datasets.push(targetNode);
            }
          }
          if (targetId === d.id && sourceNode?.type === 'dataset') {
            if (!datasets.find(ds => ds.id === sourceNode.id)) {
              datasets.push(sourceNode);
            }
          }
        });
      }
      
      setRelatedDatasets(datasets);
      
      // 高亮相關節點
      const connectedNodeIds = new Set<string>();
      const highlightedLinks = new Set<string>();
      connectedNodeIds.add(d.id);
      
      if (d.type === 'keyword') {
        // 如果點擊的是關鍵字，需要高亮兩層路徑：關鍵字 → 概念 → 資料集
        // 重要：只顯示與該關鍵字相同階段的資料集
        const connectedConceptIds = new Set<string>();
        const keywordStage = d.stage; // 取得關鍵字的階段
        
        // 第一層：找到與關鍵字相連的概念
        links.forEach((link: any) => {
          const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
          const targetId = typeof link.target === 'object' ? link.target.id : link.target;
          const sourceNode = nodes.find(n => n.id === sourceId);
          const targetNode = nodes.find(n => n.id === targetId);
          
          // 高亮與關鍵字相連的概念
          if (sourceId === d.id && targetNode?.type === 'concept') {
            connectedNodeIds.add(targetId);
            connectedConceptIds.add(targetId);
            highlightedLinks.add(`${sourceId}-${targetId}`);
          }
          if (targetId === d.id && sourceNode?.type === 'concept') {
            connectedNodeIds.add(sourceId);
            connectedConceptIds.add(sourceId);
            highlightedLinks.add(`${sourceId}-${targetId}`);
          }
        });
        
        // 第二層：找到這些概念相連的資料集（只顯示與關鍵字相同階段的）
        links.forEach((link: any) => {
          const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
          const targetId = typeof link.target === 'object' ? link.target.id : link.target;
          const sourceNode = nodes.find(n => n.id === sourceId);
          const targetNode = nodes.find(n => n.id === targetId);
          
          // 如果 source 是我們找到的概念，且 target 是資料集
          if (connectedConceptIds.has(sourceId) && targetNode?.type === 'dataset') {
            // 只顯示與關鍵字階段相同的資料集
            if (link.stage === keywordStage || !link.stage) {
              connectedNodeIds.add(targetId);
              highlightedLinks.add(`${sourceId}-${targetId}`);
            }
          }
          
          // 如果 target 是我們找到的概念，且 source 是資料集
          if (connectedConceptIds.has(targetId) && sourceNode?.type === 'dataset') {
            // 只顯示與關鍵字階段相同的資料集
            if (link.stage === keywordStage || !link.stage) {
              connectedNodeIds.add(sourceId);
              highlightedLinks.add(`${sourceId}-${targetId}`);
            }
          }
        });
        
        // 也要處理關鍵字直接連到資料集的情況（如果有的話）
        links.forEach((link: any) => {
          const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
          const targetId = typeof link.target === 'object' ? link.target.id : link.target;
          const sourceNode = nodes.find(n => n.id === sourceId);
          const targetNode = nodes.find(n => n.id === targetId);
          
          if (sourceId === d.id && targetNode?.type === 'dataset') {
            // 只顯示與關鍵字階段相同的資料集
            if (link.stage === keywordStage || !link.stage) {
              connectedNodeIds.add(targetId);
              highlightedLinks.add(`${sourceId}-${targetId}`);
            }
          }
          if (targetId === d.id && sourceNode?.type === 'dataset') {
            // 只顯示與關鍵字階段相同的資料集
            if (link.stage === keywordStage || !link.stage) {
              connectedNodeIds.add(sourceId);
              highlightedLinks.add(`${sourceId}-${targetId}`);
            }
          }
        });
      } else {
        // 其他節點類型：高亮所有直接相連的節點
        links.forEach((link: any) => {
          const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
          const targetId = typeof link.target === 'object' ? link.target.id : link.target;
          
          if (sourceId === d.id) {
            connectedNodeIds.add(targetId);
            highlightedLinks.add(`${sourceId}-${targetId}`);
          }
          if (targetId === d.id) {
            connectedNodeIds.add(sourceId);
            highlightedLinks.add(`${sourceId}-${targetId}`);
          }
        });
      }

      node.style('opacity', (n: GraphNode) => connectedNodeIds.has(n.id) ? 1 : 0.2);
      node.attr('stroke-width', (n: GraphNode) => n.id === d.id ? 4 : 2);
      node.attr('stroke', (n: GraphNode) => n.id === d.id ? '#ff0000' : '#fff');
      
      link.style('opacity', (l: any) => {
        const sourceId = typeof l.source === 'object' ? l.source.id : l.source;
        const targetId = typeof l.target === 'object' ? l.target.id : l.target;
        const linkKey = `${sourceId}-${targetId}`;
        return highlightedLinks.has(linkKey) ? 0.8 : 0.05;
      });
      link.attr('stroke-width', (l: any) => {
        const sourceId = typeof l.source === 'object' ? l.source.id : l.source;
        const targetId = typeof l.target === 'object' ? l.target.id : l.target;
        const linkKey = `${sourceId}-${targetId}`;
        return highlightedLinks.has(linkKey) ? 3 : 1;
      });
      link.attr('stroke', (l: any) => {
        const sourceId = typeof l.source === 'object' ? l.source.id : l.source;
        const targetId = typeof l.target === 'object' ? l.target.id : l.target;
        const linkKey = `${sourceId}-${targetId}`;
        return highlightedLinks.has(linkKey) ? '#667eea' : '#999';
      });
      
      label.style('opacity', (n: GraphNode) => connectedNodeIds.has(n.id) ? 1 : 0.2);

      // 如果是概念節點，觸發回調
      if (d.type === 'concept' && onConceptClick) {
        onConceptClick(d);
      }
    }

    // 篩選功能
    function applyFilters() {
      const shouldShow = (d: GraphNode) => {
        if (typeFilter !== 'all' && d.type !== typeFilter) return false;
        if (stageFilter !== 'all' && d.stage !== stageFilter) return false;
        if (searchTerm && !d.label.toLowerCase().includes(searchTerm.toLowerCase())) return false;
        return true;
      };

      // 如果有選中的節點，重新應用高亮
      if (selectedNode) {
        handleNodeClick(selectedNode);
        return;
      }

      node.style('opacity', (d: GraphNode) => shouldShow(d) ? 1 : 0.1);
      node.attr('stroke', '#fff');
      node.attr('stroke-width', 2);
      
      link.style('opacity', (l: any) => {
        const source = typeof l.source === 'object' ? l.source : nodes.find(n => n.id === l.source);
        const target = typeof l.target === 'object' ? l.target : nodes.find(n => n.id === l.target);
        return (source && target && shouldShow(source) && shouldShow(target)) ? 0.3 : 0.05;
      });
      link.attr('stroke-width', 1);
      link.attr('stroke', '#999');
      
      label.style('opacity', (d: GraphNode) => shouldShow(d) ? 1 : 0.1);

      // 搜尋高亮
      if (searchTerm) {
        node.attr('stroke', (d: GraphNode) => 
          d.label.toLowerCase().includes(searchTerm.toLowerCase()) ? '#ff0000' : '#fff'
        );
        node.attr('stroke-width', (d: GraphNode) => 
          d.label.toLowerCase().includes(searchTerm.toLowerCase()) ? 3 : 2
        );
      }
    }

    applyFilters();

    // 清理
    return () => {
      simulation.stop();
    };
  }, [graphData, searchTerm, typeFilter, stageFilter, selectedNode, onConceptClick]);

  const handleReset = () => {
    setSearchTerm('');
    setTypeFilter('all');
    setStageFilter('all');
    setSelectedNode(null);
    setRelatedDatasets([]);
    
    // 重新觸發圖表更新以重置高亮狀態
    if (graphData) {
      setGraphData({ ...graphData });
    }
  };

  if (!graphData) {
    return <Card className="p-8"><p className="text-center text-muted-foreground">載入知識圖譜中...</p></Card>;
  }

  return (
    <div className="space-y-4">
      {/* 控制面板 */}
      <Card className="p-4">
        <div className="flex flex-wrap gap-4">
          {/* 搜尋 */}
          <div className="flex-1 min-w-[200px]">
            <Input
              placeholder="搜尋節點..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full"
            />
          </div>

          {/* 類型篩選 */}
          <div className="flex gap-2">
            <Button
              variant={typeFilter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTypeFilter('all')}
            >
              全部
            </Button>
            <Button
              variant={typeFilter === 'keyword' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTypeFilter('keyword')}
            >
              關鍵字
            </Button>
            <Button
              variant={typeFilter === 'concept' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTypeFilter('concept')}
            >
              概念
            </Button>
            <Button
              variant={typeFilter === 'dataset' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTypeFilter('dataset')}
            >
              資料集
            </Button>
          </div>

          {/* 階段篩選 */}
          <div className="flex gap-2">
            <Button
              variant={stageFilter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStageFilter('all')}
            >
              所有階段
            </Button>
            <Button
              variant={stageFilter === '第一階段' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStageFilter('第一階段')}
            >
              第一階段
            </Button>
            <Button
              variant={stageFilter === '第二階段' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStageFilter('第二階段')}
            >
              第二階段
            </Button>
            <Button
              variant={stageFilter === '第三階段' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStageFilter('第三階段')}
            >
              第三階段
            </Button>
          </div>

          <Button variant="secondary" size="sm" onClick={handleReset}>
            重置
          </Button>
        </div>

        {/* 統計資訊 */}
        <div className="flex gap-6 mt-4 pt-4 border-t flex-wrap">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#F5A623]" />
            <span className="text-sm">概念: {stats.concepts}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#4A90E2]" />
            <span className="text-sm">關鍵字: {stats.keywords}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#7ED321]" />
            <span className="text-sm">資料集: {stats.datasets}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">總連線: {stats.links}</span>
          </div>
        </div>
      </Card>

      {/* 圖譜視圖 */}
      <Card className="relative overflow-hidden">
        <svg ref={svgRef} className="w-full" style={{ height: '600px', background: '#fafafa' }} />
        
        {/* 操作說明 */}
        <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm p-3 rounded-lg shadow-lg text-xs max-w-[200px]">
          <h4 className="font-semibold mb-2">操作說明</h4>
          <ul className="space-y-1 text-muted-foreground">
            <li>• 點擊節點查看詳情</li>
            <li>• 拖曳節點調整位置</li>
            <li>• 滾輪縮放圖譜</li>
            <li>• 使用搜尋快速定位</li>
          </ul>
        </div>

        {/* 節點詳細資訊 */}
        {selectedNode && (
          <div className="absolute top-4 left-4 bg-white p-4 rounded-lg shadow-xl max-w-[350px] border-2 border-primary">
            <div className="flex items-start justify-between mb-3">
              <h3 className="font-semibold text-lg">{selectedNode.label}</h3>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={() => {
                  setSelectedNode(null);
                  setRelatedDatasets([]);
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{selectedNode.type === 'concept' ? '概念' : selectedNode.type === 'keyword' ? '關鍵字' : '資料集'}</Badge>
                {selectedNode.stage && <Badge variant="outline">{selectedNode.stage}</Badge>}
              </div>
              <div>
                <span className="text-muted-foreground">類別: </span>
                <span>{selectedNode.category}</span>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* 相關資料集列表 */}
      {relatedDatasets.length > 0 && (
        <Card className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-lg">
              相關資料集 ({relatedDatasets.length})
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setRelatedDatasets([])}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {relatedDatasets.map((dataset) => (
              <div
                key={dataset.id}
                className="p-3 border rounded-lg hover:shadow-md transition-shadow bg-background"
              >
                <div className="space-y-2">
                  <h4 className="font-medium text-sm line-clamp-2">{dataset.label}</h4>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="secondary" className="text-xs">ID: {dataset.id}</Badge>
                    {dataset.stage && <Badge variant="outline" className="text-xs">{dataset.stage}</Badge>}
                  </div>
                  {dataset.category && (
                    <p className="text-xs text-muted-foreground">
                      類別: {dataset.category}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};

export default KnowledgeGraphD3;
