import React, { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { KnowledgeGraphNode, KnowledgeGraphEdge } from '@shared/schema';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, ZoomIn, ZoomOut, RotateCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ForceGraphNode {
  id: number;
  type: string;
  content: string;
  x?: number;
  y?: number;
  radius?: number;
}

interface ForceGraphLink {
  source: ForceGraphNode;
  target: ForceGraphNode;
  relationship: string;
  weight: number;
}

interface KnowledgeGraphViewerProps {
  documentId?: number;
  nodeType?: string;
  width?: number;
  height?: number;
}

export default function KnowledgeGraphViewer({ 
  documentId, 
  nodeType,
  width = 800,
  height = 600
}: KnowledgeGraphViewerProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [nodes, setNodes] = useState<ForceGraphNode[]>([]);
  const [links, setLinks] = useState<ForceGraphLink[]>([]);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [simulation, setSimulation] = useState<any>(null);
  const { toast } = useToast();

  // Fetch knowledge graph nodes
  const { data: graphNodes, isLoading: isLoadingNodes } = useQuery<KnowledgeGraphNode[]>({
    queryKey: ['/api/knowledge-graph/nodes', { documentId, nodeType }],
    enabled: true,
  });

  // Fetch knowledge graph edges
  const { data: graphEdges, isLoading: isLoadingEdges } = useQuery<KnowledgeGraphEdge[]>({
    queryKey: ['/api/knowledge-graph/edges'],
    enabled: !!graphNodes && graphNodes.length > 0,
  });

  useEffect(() => {
    if (!graphNodes || !graphEdges) return;

    try {
      // Convert nodes to force graph format
      const forceNodes: ForceGraphNode[] = graphNodes.map(node => ({
        id: node.id,
        type: node.nodeType,
        content: node.content,
        radius: getNodeRadius(node.nodeType),
      }));

      // Create a map for quick node lookup
      const nodeMap = new Map<number, ForceGraphNode>();
      forceNodes.forEach(node => nodeMap.set(node.id, node));

      // Convert edges to force graph links
      const forceLinks: ForceGraphLink[] = graphEdges
        .filter(edge => 
          nodeMap.has(edge.sourceNodeId) && 
          nodeMap.has(edge.targetNodeId)
        )
        .map(edge => ({
          source: nodeMap.get(edge.sourceNodeId)!,
          target: nodeMap.get(edge.targetNodeId)!,
          relationship: edge.relationship,
          weight: edge.weight || 1,
        }));

      setNodes(forceNodes);
      setLinks(forceLinks);

      // Initialize force simulation
      if (forceNodes.length > 0) {
        initializeForceSimulation(forceNodes, forceLinks);
      }
    } catch (error) {
      console.error("Error processing knowledge graph data:", error);
      toast({
        title: "Error",
        description: "Failed to process knowledge graph data",
        variant: "destructive",
      });
    }
  }, [graphNodes, graphEdges]);

  const getNodeRadius = (nodeType: string): number => {
    switch (nodeType) {
      case 'concept': return 15;
      case 'competency': return 18;
      case 'regulation': return 14;
      case 'lesson': return 12;
      default: return 10;
    }
  };

  const getNodeColor = (nodeType: string): string => {
    switch (nodeType) {
      case 'concept': return '#4f46e5'; // Indigo
      case 'competency': return '#0ea5e9'; // Sky blue
      case 'regulation': return '#ef4444'; // Red
      case 'lesson': return '#10b981'; // Emerald
      default: return '#9333ea'; // Purple
    }
  };

  const getLinkColor = (relationship: string): string => {
    switch (relationship) {
      case 'prerequisite': return '#ef4444'; // Red
      case 'builds_on': return '#10b981'; // Emerald
      case 'references': return '#9333ea'; // Purple
      default: return '#6b7280'; // Gray
    }
  };

  const initializeForceSimulation = (nodes: ForceGraphNode[], links: ForceGraphLink[]) => {
    // This would typically use D3's force simulation
    // For this implementation, we'll use a simplified approach
    
    // Place nodes in a circle as a starting point
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) * 0.4;
    
    nodes.forEach((node, i) => {
      const angle = (i / nodes.length) * 2 * Math.PI;
      node.x = centerX + radius * Math.cos(angle);
      node.y = centerY + radius * Math.sin(angle);
    });
    
    setNodes([...nodes]);
    
    // Mock simulation object for now
    setSimulation({
      restart: () => {
        // Would restart the force simulation
        console.log("Simulation restarted");
      }
    });
  };

  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 0.2, 3));
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 0.2, 0.5));
  };

  const handleReset = () => {
    setZoomLevel(1);
    if (simulation) {
      simulation.restart();
    }
  };

  if (isLoadingNodes || isLoadingEdges) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Knowledge Graph</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center" style={{ height: `${height}px` }}>
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <span className="ml-2 text-muted-foreground">Loading knowledge graph...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Knowledge Graph</CardTitle>
        <div className="flex space-x-2">
          <Button variant="outline" size="icon" onClick={handleZoomIn}>
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={handleZoomOut}>
            <ZoomOut className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={handleReset}>
            <RotateCw className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="relative border rounded-md overflow-hidden" style={{ width: '100%', height: `${height}px` }}>
          <svg
            ref={svgRef}
            width="100%"
            height="100%"
            viewBox={`0 0 ${width} ${height}`}
            style={{ 
              transform: `scale(${zoomLevel})`,
              transformOrigin: 'center', 
              transition: 'transform 0.2s ease'
            }}
          >
            <g className="links">
              {links.map((link, i) => (
                <line
                  key={`link-${i}`}
                  x1={link.source.x}
                  y1={link.source.y}
                  x2={link.target.x}
                  y2={link.target.y}
                  stroke={getLinkColor(link.relationship)}
                  strokeWidth={link.weight}
                  strokeOpacity={0.6}
                />
              ))}
            </g>
            <g className="nodes">
              {nodes.map(node => (
                <g key={`node-${node.id}`} transform={`translate(${node.x},${node.y})`}>
                  <circle
                    r={node.radius}
                    fill={getNodeColor(node.type)}
                    stroke="#ffffff"
                    strokeWidth={1.5}
                  />
                  <title>{node.content}</title>
                </g>
              ))}
            </g>
          </svg>
          
          {nodes.length === 0 && !isLoadingNodes && (
            <div className="absolute inset-0 flex items-center justify-center">
              <p className="text-muted-foreground">No knowledge graph data available</p>
            </div>
          )}
        </div>
        
        <div className="mt-4 grid grid-cols-5 gap-2">
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: getNodeColor('concept') }}></div>
            <span className="text-xs">Concept</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: getNodeColor('competency') }}></div>
            <span className="text-xs">Competency</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: getNodeColor('regulation') }}></div>
            <span className="text-xs">Regulation</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: getNodeColor('lesson') }}></div>
            <span className="text-xs">Lesson</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: getNodeColor('default') }}></div>
            <span className="text-xs">Other</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}