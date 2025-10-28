import { useState, useRef, useEffect } from 'react';
import '../styles/AgentFlowDiagram.css';

// Enhanced node types with systems and integrations
const NODE_TYPES = {
  AGENT: 'agent',
  SYSTEM: 'system',
  AI_SERVICE: 'ai_service',
  DATA_SOURCE: 'data_source',
  API: 'api'
};

// Complete network including agents, systems, and integrations
const networkNodes = {
  // === EXTERNAL SYSTEMS ===
  'sys-los': {
    id: 'sys-los',
    name: 'LOS System',
    icon: '🏦',
    type: NODE_TYPES.SYSTEM,
    category: 'External',
    description: 'Loan Origination System - Encompass, Calyx Point',
    calls: ['agent-001', 'agent-016', 'agent-017'],
    position: { x: 50, y: 50 },
    shape: 'hexagon'
  },
  'sys-credit': {
    id: 'sys-credit',
    name: 'Credit Bureau API',
    icon: '📊',
    type: NODE_TYPES.API,
    category: 'External',
    description: 'Equifax, Experian, TransUnion APIs',
    calls: ['agent-002', 'agent-009'],
    position: { x: 50, y: 650 },
    shape: 'hexagon'
  },
  'sys-title': {
    id: 'sys-title',
    name: 'Title Company',
    icon: '📜',
    type: NODE_TYPES.SYSTEM,
    category: 'External',
    description: 'Property title search and verification',
    calls: ['agent-006'],
    position: { x: 1400, y: 50 },
    shape: 'hexagon'
  },

  // === AI SERVICES ===
  'ai-openai': {
    id: 'ai-openai',
    name: 'OpenAI GPT-4',
    icon: '🤖',
    type: NODE_TYPES.AI_SERVICE,
    category: 'AI',
    description: 'Document extraction and analysis',
    calls: ['agent-002', 'agent-007', 'agent-009', 'agent-011', 'agent-016'],
    position: { x: 350, y: 50 },
    shape: 'diamond'
  },
  'ai-vision': {
    id: 'ai-vision',
    name: 'Computer Vision',
    icon: '👁️',
    type: NODE_TYPES.AI_SERVICE,
    category: 'AI',
    description: 'Document fraud detection and OCR',
    calls: ['agent-009', 'agent-013'],
    position: { x: 350, y: 650 },
    shape: 'diamond'
  },
  'ai-vector': {
    id: 'ai-vector',
    name: 'Vector Database',
    icon: '🧠',
    type: NODE_TYPES.DATA_SOURCE,
    category: 'AI',
    description: 'Semantic search and document matching',
    calls: ['agent-010', 'agent-015', 'agent-018'],
    position: { x: 650, y: 50 },
    shape: 'cylinder'
  },

  // === DATA SOURCES ===
  'data-docs': {
    id: 'data-docs',
    name: 'Document Store',
    icon: '💾',
    type: NODE_TYPES.DATA_SOURCE,
    category: 'Data',
    description: 'S3 / Cloud storage for documents',
    calls: ['agent-001', 'agent-003', 'agent-013'],
    position: { x: 650, y: 650 },
    shape: 'cylinder'
  },
  'data-postgres': {
    id: 'data-postgres',
    name: 'PostgreSQL',
    icon: '🗄️',
    type: NODE_TYPES.DATA_SOURCE,
    category: 'Data',
    description: 'Loan data and application information',
    calls: ['agent-002', 'agent-005', 'agent-015'],
    position: { x: 950, y: 650 },
    shape: 'cylinder'
  },
  'data-compliance': {
    id: 'data-compliance',
    name: 'Compliance DB',
    icon: '⚖️',
    type: NODE_TYPES.DATA_SOURCE,
    category: 'Data',
    description: 'Regulatory rules and requirements',
    calls: ['agent-004', 'agent-012', 'agent-019'],
    position: { x: 950, y: 50 },
    shape: 'cylinder'
  },

  // === CORE WORKFLOW AGENTS (Layer 1) ===
  'agent-016': {
    id: 'agent-016',
    name: 'Document Ingestion',
    icon: '📥',
    type: NODE_TYPES.AGENT,
    category: 'Ingestion',
    description: 'Receives and classifies documents from LOS',
    calls: ['agent-001', 'agent-002', 'agent-004'],
    position: { x: 200, y: 200 }
  },
  'agent-017': {
    id: 'agent-017',
    name: 'Data Extraction',
    icon: '🔍',
    type: NODE_TYPES.AGENT,
    category: 'Ingestion',
    description: 'Extracts structured data from documents',
    calls: ['agent-002', 'agent-011', 'agent-015'],
    position: { x: 200, y: 500 }
  },

  // === VALIDATION AGENTS (Layer 2) ===
  'agent-001': {
    id: 'agent-001',
    name: 'Document Request',
    icon: '📄',
    type: NODE_TYPES.AGENT,
    category: 'Communication',
    description: 'Automatically requests missing documents',
    calls: ['agent-010', 'agent-005', 'agent-020'],
    position: { x: 500, y: 350 }
  },
  'agent-002': {
    id: 'agent-002',
    name: 'Income Verification',
    icon: '💰',
    type: NODE_TYPES.AGENT,
    category: 'Analysis',
    description: 'Cross-references income across documents',
    calls: ['agent-011', 'agent-015', 'agent-005'],
    position: { x: 500, y: 200 }
  },
  'agent-003': {
    id: 'agent-003',
    name: 'Employment Verification',
    icon: '💼',
    type: NODE_TYPES.AGENT,
    category: 'Verification',
    description: 'Verifies employer information',
    calls: ['agent-002', 'agent-015'],
    position: { x: 500, y: 500 }
  },
  'agent-004': {
    id: 'agent-004',
    name: 'Date Validation',
    icon: '📅',
    type: NODE_TYPES.AGENT,
    category: 'Compliance',
    description: 'Ensures document recency and date logic',
    calls: ['agent-012', 'agent-001'],
    position: { x: 200, y: 350 }
  },

  // === ANALYSIS AGENTS (Layer 3) ===
  'agent-009': {
    id: 'agent-009',
    name: 'Fraud Detection',
    icon: '🔍',
    type: NODE_TYPES.AGENT,
    category: 'Risk',
    description: 'Detects document tampering and fraud',
    calls: ['agent-013', 'agent-011', 'agent-005', 'agent-020'],
    position: { x: 800, y: 500 }
  },
  'agent-010': {
    id: 'agent-010',
    name: 'Document Predictor',
    icon: '🎯',
    type: NODE_TYPES.AGENT,
    category: 'Analysis',
    description: 'Predicts required documents based on loan type',
    calls: [],
    position: { x: 800, y: 350 }
  },
  'agent-011': {
    id: 'agent-011',
    name: 'Calculation Verifier',
    icon: '🧮',
    type: NODE_TYPES.AGENT,
    category: 'Analysis',
    description: 'Verifies mathematical calculations',
    calls: ['agent-009'],
    position: { x: 800, y: 200 }
  },
  'agent-012': {
    id: 'agent-012',
    name: 'Expiration Tracker',
    icon: '⏰',
    type: NODE_TYPES.AGENT,
    category: 'Compliance',
    description: 'Tracks document expiration dates',
    calls: ['agent-001'],
    position: { x: 500, y: 650 }
  },
  'agent-013': {
    id: 'agent-013',
    name: 'Format Detector',
    icon: '🎨',
    type: NODE_TYPES.AGENT,
    category: 'Risk',
    description: 'Analyzes document formatting for anomalies',
    calls: [],
    position: { x: 1100, y: 650 }
  },
  'agent-018': {
    id: 'agent-018',
    name: 'Pattern Recognition',
    icon: '🧩',
    type: NODE_TYPES.AGENT,
    category: 'Analysis',
    description: 'Identifies patterns across loan applications',
    calls: ['agent-010', 'agent-015'],
    position: { x: 800, y: 50 }
  },

  // === RECONCILIATION AGENTS (Layer 4) ===
  'agent-006': {
    id: 'agent-006',
    name: 'Property Matcher',
    icon: '🏠',
    type: NODE_TYPES.AGENT,
    category: 'Verification',
    description: 'Matches property details across documents',
    calls: [],
    position: { x: 1250, y: 200 }
  },
  'agent-007': {
    id: 'agent-007',
    name: 'Name Reconciliation',
    icon: '👤',
    type: NODE_TYPES.AGENT,
    category: 'Verification',
    description: 'Resolves name variations across documents',
    calls: [],
    position: { x: 1250, y: 500 }
  },
  'agent-015': {
    id: 'agent-015',
    name: 'Consistency Checker',
    icon: '🔗',
    type: NODE_TYPES.AGENT,
    category: 'Verification',
    description: 'Ensures data consistency across sources',
    calls: ['agent-007', 'agent-006', 'agent-005'],
    position: { x: 1100, y: 350 }
  },
  'agent-019': {
    id: 'agent-019',
    name: 'Compliance Validator',
    icon: '✅',
    type: NODE_TYPES.AGENT,
    category: 'Compliance',
    description: 'Validates against regulatory requirements',
    calls: ['agent-005', 'agent-020'],
    position: { x: 1100, y: 200 }
  },

  // === OUTPUT & WORKFLOW AGENTS (Layer 5) ===
  'agent-005': {
    id: 'agent-005',
    name: 'Condition Generator',
    icon: '📋',
    type: NODE_TYPES.AGENT,
    category: 'Workflow',
    description: 'Creates loan conditions from findings',
    calls: ['agent-001', 'agent-020'],
    position: { x: 1100, y: 50 }
  },
  'agent-014': {
    id: 'agent-014',
    name: 'Field Completion',
    icon: '✍️',
    type: NODE_TYPES.AGENT,
    category: 'Workflow',
    description: 'Auto-fills missing application fields',
    calls: [],
    position: { x: 200, y: 650 }
  },
  'agent-020': {
    id: 'agent-020',
    name: 'Alert Manager',
    icon: '🔔',
    type: NODE_TYPES.AGENT,
    category: 'Communication',
    description: 'Manages notifications and alerts',
    calls: [],
    position: { x: 1250, y: 350 }
  }
};

// Enhanced category colors with gradients
const categoryStyles = {
  'Communication': { color: '#3b82f6', gradient: ['#3b82f6', '#60a5fa'] },
  'Analysis': { color: '#8b5cf6', gradient: ['#8b5cf6', '#a78bfa'] },
  'Verification': { color: '#10b981', gradient: ['#10b981', '#34d399'] },
  'Workflow': { color: '#f59e0b', gradient: ['#f59e0b', '#fbbf24'] },
  'Compliance': { color: '#06b6d4', gradient: ['#06b6d4', '#22d3ee'] },
  'Risk': { color: '#ef4444', gradient: ['#ef4444', '#f87171'] },
  'Ingestion': { color: '#6366f1', gradient: ['#6366f1', '#818cf8'] },
  'External': { color: '#64748b', gradient: ['#64748b', '#94a3b8'] },
  'AI': { color: '#ec4899', gradient: ['#ec4899', '#f472b6'] },
  'Data': { color: '#14b8a6', gradient: ['#14b8a6', '#2dd4bf'] }
};

function AgentFlowDiagram({ agentId, allAgents = false }) {
  const [selectedNode, setSelectedNode] = useState(agentId);
  const [hoveredNode, setHoveredNode] = useState(null);
  const [zoom, setZoom] = useState(0.7);
  const [pan, setPan] = useState({ x: 100, y: 50 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [animatedConnections, setAnimatedConnections] = useState(new Set());
  const canvasRef = useRef(null);
  const containerRef = useRef(null);

  // Animate data flow on mount
  useEffect(() => {
    const interval = setInterval(() => {
      const connections = getConnections();
      if (connections.length > 0) {
        const randomConn = connections[Math.floor(Math.random() * connections.length)];
        const key = `${randomConn.from}-${randomConn.to}`;
        setAnimatedConnections(prev => new Set(prev).add(key));

        setTimeout(() => {
          setAnimatedConnections(prev => {
            const newSet = new Set(prev);
            newSet.delete(key);
            return newSet;
          });
        }, 2000);
      }
    }, 500);

    return () => clearInterval(interval);
  }, [allAgents, agentId]);

  // Get visible nodes based on mode
  const getVisibleNodes = () => {
    if (allAgents) {
      return Object.keys(networkNodes);
    }

    if (!agentId || !networkNodes[agentId]) {
      return [];
    }

    // Show selected node and its connections
    const visible = new Set([agentId]);
    const calls = networkNodes[agentId].calls || [];
    calls.forEach(id => visible.add(id));

    // Also show nodes that call this node
    Object.entries(networkNodes).forEach(([id, node]) => {
      if (node.calls && node.calls.includes(agentId)) {
        visible.add(id);
      }
    });

    return Array.from(visible);
  };

  const visibleNodes = getVisibleNodes();

  // Get all connections to draw
  const getConnections = () => {
    const connections = [];
    visibleNodes.forEach(sourceId => {
      const node = networkNodes[sourceId];
      if (node && node.calls) {
        node.calls.forEach(targetId => {
          if (visibleNodes.includes(targetId)) {
            connections.push({
              from: sourceId,
              to: targetId,
              type: sourceId === agentId || targetId === agentId ? 'primary' : 'secondary',
              sourceType: node.type,
              targetType: networkNodes[targetId]?.type
            });
          }
        });
      }
    });
    return connections;
  };

  const connections = getConnections();

  // Calculate dependency counts
  const getDependencyCounts = (id) => {
    const outgoing = networkNodes[id]?.calls?.length || 0;
    const incoming = Object.values(networkNodes).filter(
      node => node.calls && node.calls.includes(id)
    ).length;
    return { outgoing, incoming };
  };

  // Handle mouse wheel for zoom
  const handleWheel = (e) => {
    e.preventDefault();
    const delta = e.deltaY * -0.001;
    const newZoom = Math.min(Math.max(0.3, zoom + delta), 2);
    setZoom(newZoom);
  };

  // Handle panning
  const handleMouseDown = (e) => {
    if (e.button === 0 && e.target === canvasRef.current) {
      setIsPanning(true);
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleMouseMove = (e) => {
    if (isPanning) {
      setPan({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
  };

  useEffect(() => {
    if (isPanning) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isPanning, panStart]);

  // Reset view
  const resetView = () => {
    setZoom(0.7);
    setPan({ x: 100, y: 50 });
  };

  // Get node shape path
  const getNodeShape = (shape, width, height) => {
    switch (shape) {
      case 'hexagon':
        const hw = width / 2;
        const offset = 20;
        return `M ${offset} ${height/2} L ${hw} 0 L ${width - offset} ${height/2} L ${width - offset} ${height/2} L ${hw} ${height} L ${offset} ${height/2} Z`;
      case 'diamond':
        return `M ${width/2} 0 L ${width} ${height/2} L ${width/2} ${height} L 0 ${height/2} Z`;
      case 'cylinder':
        return `M 0 15 Q 0 0, ${width/2} 0 Q ${width} 0, ${width} 15 L ${width} ${height-15} Q ${width} ${height}, ${width/2} ${height} Q 0 ${height}, 0 ${height-15} Z`;
      default:
        return null;
    }
  };

  return (
    <div className="flow-diagram-container" ref={containerRef}>
      {/* Enhanced Controls */}
      <div className="flow-controls">
        <div className="flow-control-group">
          <button
            className="flow-control-btn"
            onClick={() => setZoom(Math.min(2, zoom + 0.1))}
            title="Zoom In"
          >
            🔍+
          </button>
          <span className="zoom-level">{Math.round(zoom * 100)}%</span>
          <button
            className="flow-control-btn"
            onClick={() => setZoom(Math.max(0.3, zoom - 0.1))}
            title="Zoom Out"
          >
            🔍-
          </button>
        </div>
        <button
          className="flow-control-btn"
          onClick={resetView}
          title="Reset View"
        >
          ⟲ Reset
        </button>
        <div className="node-count">
          {visibleNodes.length} nodes • {connections.length} connections
        </div>
      </div>

      {/* Enhanced Legend */}
      <div className="flow-legend enhanced">
        <h4>🎨 Network Legend</h4>
        <div className="legend-section">
          <div className="legend-subtitle">Node Types</div>
          <div className="legend-items">
            <div className="legend-item">
              <div className="legend-shape circle"></div>
              <span>Agents</span>
            </div>
            <div className="legend-item">
              <div className="legend-shape hexagon"></div>
              <span>Systems</span>
            </div>
            <div className="legend-item">
              <div className="legend-shape diamond"></div>
              <span>AI Services</span>
            </div>
            <div className="legend-item">
              <div className="legend-shape cylinder"></div>
              <span>Data Sources</span>
            </div>
          </div>
        </div>
        <div className="legend-section">
          <div className="legend-subtitle">Categories</div>
          <div className="legend-items">
            {Object.entries(categoryStyles).map(([category, style]) => (
              <div key={category} className="legend-item">
                <div
                  className="legend-color"
                  style={{
                    background: `linear-gradient(135deg, ${style.gradient[0]}, ${style.gradient[1]})`
                  }}
                ></div>
                <span className="legend-label">{category}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="legend-section">
          <div className="legend-subtitle">Connection Lines</div>
          <div className="legend-items">
            <div className="legend-item">
              <div className="legend-line primary"></div>
              <span>Primary Flow</span>
            </div>
            <div className="legend-item">
              <div className="legend-line secondary"></div>
              <span>Secondary Flow</span>
            </div>
            <div className="legend-item">
              <div className="legend-line hover"></div>
              <span>Selected/Hovered</span>
            </div>
            <div className="legend-item">
              <div className="legend-line animated"></div>
              <span>Active Data Flow</span>
            </div>
          </div>
        </div>
        <div className="legend-section">
          <div className="legend-subtitle">Controls</div>
          <div className="legend-items">
            <div className="legend-item">
              <span className="legend-icon">🖱️</span>
              <span>Drag to pan</span>
            </div>
            <div className="legend-item">
              <span className="legend-icon">🔍</span>
              <span>Scroll to zoom</span>
            </div>
            <div className="legend-item">
              <span className="legend-icon">👆</span>
              <span>Click nodes to select</span>
            </div>
          </div>
        </div>
      </div>

      {/* Canvas */}
      <div
        className="flow-canvas enhanced"
        ref={canvasRef}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        style={{ cursor: isPanning ? 'grabbing' : 'grab' }}
      >
        <svg
          className="flow-svg"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: '0 0'
          }}
        >
          <defs>
            {/* Gradient definitions for nodes */}
            {Object.entries(categoryStyles).map(([category, style]) => (
              <linearGradient key={`gradient-${category}`} id={`gradient-${category}`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={style.gradient[0]} />
                <stop offset="100%" stopColor={style.gradient[1]} />
              </linearGradient>
            ))}

            {/* Glow filters */}
            <filter id="glow">
              <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>

            <filter id="strong-glow">
              <feGaussianBlur stdDeviation="6" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>

            {/* Arrow markers with gradients */}
            <marker
              id="arrowhead-primary"
              markerWidth="12"
              markerHeight="12"
              refX="10"
              refY="4"
              orient="auto"
            >
              <path d="M0,0 L0,8 L10,4 z" fill="#667eea" />
            </marker>
            <marker
              id="arrowhead-secondary"
              markerWidth="12"
              markerHeight="12"
              refX="10"
              refY="4"
              orient="auto"
            >
              <path d="M0,0 L0,8 L10,4 z" fill="#cbd5e1" />
            </marker>
            <marker
              id="arrowhead-hover"
              markerWidth="12"
              markerHeight="12"
              refX="10"
              refY="4"
              orient="auto"
            >
              <path d="M0,0 L0,8 L10,4 z" fill="#f59e0b" />
            </marker>
            <marker
              id="arrowhead-animated"
              markerWidth="12"
              markerHeight="12"
              refX="10"
              refY="4"
              orient="auto"
            >
              <path d="M0,0 L0,8 L10,4 z" fill="#10b981" />
            </marker>
          </defs>

          {/* Draw connections */}
          {connections.map((conn, index) => {
            const fromNode = networkNodes[conn.from];
            const toNode = networkNodes[conn.to];

            if (!fromNode || !toNode) return null;

            const isHovered = hoveredNode === conn.from || hoveredNode === conn.to;
            const isSelected = selectedNode === conn.from || selectedNode === conn.to;
            const connKey = `${conn.from}-${conn.to}`;
            const isAnimated = animatedConnections.has(connKey);

            // Calculate connection line based on node shapes
            const startX = fromNode.position.x + (fromNode.shape ? 90 : 80);
            const startY = fromNode.position.y + 40;
            const endX = toNode.position.x - (toNode.shape ? 10 : 0);
            const endY = toNode.position.y + 40;

            // Create curved path
            const midX = (startX + endX) / 2;
            const curve = Math.abs(endX - startX) * 0.3;
            const pathD = `M ${startX} ${startY} Q ${midX} ${startY - curve}, ${endX} ${endY}`;

            return (
              <g key={`${conn.from}-${conn.to}-${index}`}>
                {/* Connection glow */}
                {(isHovered || isSelected || isAnimated) && (
                  <path
                    d={pathD}
                    fill="none"
                    stroke={isAnimated ? '#10b981' : '#f59e0b'}
                    strokeWidth={8}
                    opacity={0.3}
                    filter="url(#glow)"
                  />
                )}

                {/* Main connection line */}
                <path
                  d={pathD}
                  fill="none"
                  stroke={
                    isAnimated ? '#10b981' :
                    isHovered || isSelected ? '#f59e0b' :
                    conn.type === 'primary' ? '#667eea' :
                    '#cbd5e1'
                  }
                  strokeWidth={isAnimated ? 4 : isHovered || isSelected ? 3 : 2}
                  markerEnd={`url(#arrowhead-${
                    isAnimated ? 'animated' :
                    isHovered || isSelected ? 'hover' :
                    conn.type
                  })`}
                  className={`connection-line ${isAnimated ? 'animated-flow' : ''}`}
                  opacity={isHovered || isSelected || isAnimated ? 1 : 0.6}
                  strokeDasharray={isAnimated ? "5,5" : "none"}
                />

                {/* Data flow particles */}
                {isAnimated && (
                  <circle r="4" fill="#10b981" filter="url(#glow)">
                    <animateMotion
                      dur="2s"
                      repeatCount="1"
                      path={pathD}
                    />
                  </circle>
                )}
              </g>
            );
          })}

          {/* Draw nodes */}
          {visibleNodes.map(id => {
            const node = networkNodes[id];
            if (!node) return null;

            const deps = getDependencyCounts(id);
            const isSelected = id === selectedNode;
            const isHovered = id === hoveredNode;
            const style = categoryStyles[node.category] || categoryStyles['External'];
            const isSystem = node.type !== NODE_TYPES.AGENT;

            const width = isSystem ? 180 : 160;
            const height = 80;

            return (
              <g
                key={id}
                transform={`translate(${node.position.x}, ${node.position.y})`}
                className={`agent-node ${node.type}`}
                onMouseEnter={() => setHoveredNode(id)}
                onMouseLeave={() => setHoveredNode(null)}
                onClick={() => setSelectedNode(id)}
                style={{ cursor: 'pointer' }}
              >
                {/* Node glow effect */}
                {(isSelected || isHovered) && (
                  <>
                    {node.shape ? (
                      <path
                        d={getNodeShape(node.shape, width, height)}
                        fill={`url(#gradient-${node.category})`}
                        opacity={0.3}
                        filter="url(#strong-glow)"
                      />
                    ) : (
                      <rect
                        x="-5"
                        y="-5"
                        width={width + 10}
                        height={height + 10}
                        rx="12"
                        fill={`url(#gradient-${node.category})`}
                        opacity={0.3}
                        filter="url(#strong-glow)"
                      />
                    )}
                  </>
                )}

                {/* Node background */}
                {node.shape ? (
                  <path
                    d={getNodeShape(node.shape, width, height)}
                    fill="white"
                    stroke={isSelected ? style.gradient[0] : isHovered ? '#f59e0b' : style.color}
                    strokeWidth={isSelected ? 4 : isHovered ? 3 : 2}
                    filter={isSelected || isHovered ? 'url(#glow)' : 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))'}
                  />
                ) : (
                  <rect
                    x="0"
                    y="0"
                    width={width}
                    height={height}
                    rx="12"
                    fill="white"
                    stroke={isSelected ? style.gradient[0] : isHovered ? '#f59e0b' : style.color}
                    strokeWidth={isSelected ? 4 : isHovered ? 3 : 2}
                    filter={isSelected || isHovered ? 'url(#glow)' : 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))'}
                  />
                )}

                {/* Category gradient bar */}
                <rect
                  x="0"
                  y="0"
                  width={width}
                  height="10"
                  rx="12"
                  fill={`url(#gradient-${node.category})`}
                />

                {/* Type badge */}
                {isSystem && (
                  <rect
                    x={width - 60}
                    y="15"
                    width="55"
                    height="18"
                    rx="9"
                    fill={style.gradient[1]}
                    opacity={0.2}
                  />
                )}
                {isSystem && (
                  <text
                    x={width - 32}
                    y="28"
                    fontSize="9"
                    fontWeight="600"
                    fill={style.color}
                    textAnchor="middle"
                  >
                    {node.type === NODE_TYPES.AI_SERVICE ? 'AI' :
                     node.type === NODE_TYPES.DATA_SOURCE ? 'DATA' :
                     node.type === NODE_TYPES.API ? 'API' : 'SYS'}
                  </text>
                )}

                {/* Icon with enhanced size for systems */}
                <text
                  x="20"
                  y={isSystem ? 50 : 45}
                  fontSize={isSystem ? "32" : "28"}
                  textAnchor="middle"
                >
                  {node.icon}
                </text>

                {/* Name */}
                <text
                  x={isSystem ? 55 : 50}
                  y="38"
                  fontSize={isSystem ? "13" : "12"}
                  fontWeight="700"
                  fill="#111827"
                >
                  {node.name}
                </text>

                {/* Dependency counts for agents */}
                {!isSystem && (
                  <g transform="translate(50, 55)">
                    <text fontSize="10" fill="#6b7280" fontWeight="500">
                      ↗ {deps.outgoing} • ↙ {deps.incoming}
                    </text>
                  </g>
                )}

                {/* Description for systems */}
                {isSystem && (
                  <text
                    x="55"
                    y="55"
                    fontSize="9"
                    fill="#6b7280"
                    fontWeight="400"
                  >
                    {node.description.substring(0, 25)}...
                  </text>
                )}

                {/* Activity indicator */}
                {isSelected && (
                  <circle
                    cx={width - 10}
                    cy="15"
                    r="6"
                    fill="#10b981"
                    className="pulse-animation"
                  />
                )}

                {/* Connection indicator */}
                {deps.outgoing > 0 && (
                  <text
                    x={width - 15}
                    y={height - 10}
                    fontSize="12"
                    fill={style.color}
                    fontWeight="600"
                  >
                    →
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {/* Enhanced Info Panel */}
      {selectedNode && networkNodes[selectedNode] && (
        <div className="flow-info-panel enhanced">
          <div className="info-panel-header" style={{
            background: `linear-gradient(135deg, ${categoryStyles[networkNodes[selectedNode].category].gradient[0]}, ${categoryStyles[networkNodes[selectedNode].category].gradient[1]})`
          }}>
            <span className="info-panel-icon">{networkNodes[selectedNode].icon}</span>
            <div>
              <h3>{networkNodes[selectedNode].name}</h3>
              <span className="node-type-badge">{networkNodes[selectedNode].type.replace('_', ' ')}</span>
            </div>
          </div>
          <div className="info-panel-body">
            <div className="info-section">
              <label>Description</label>
              <p className="description-text">{networkNodes[selectedNode].description}</p>
            </div>

            <div className="info-section">
              <label>Category</label>
              <div
                className="category-badge enhanced"
                style={{
                  background: `linear-gradient(135deg, ${categoryStyles[networkNodes[selectedNode].category].gradient[0]}, ${categoryStyles[networkNodes[selectedNode].category].gradient[1]})`
                }}
              >
                {networkNodes[selectedNode].category}
              </div>
            </div>

            <div className="info-section">
              <label>Connections ({networkNodes[selectedNode].calls.length})</label>
              {networkNodes[selectedNode].calls.length > 0 ? (
                <div className="dependency-list">
                  {networkNodes[selectedNode].calls.map(targetId => {
                    const target = networkNodes[targetId];
                    return target ? (
                      <div
                        key={targetId}
                        className="dependency-item enhanced"
                        onClick={() => setSelectedNode(targetId)}
                        style={{
                          borderLeft: `3px solid ${categoryStyles[target.category].color}`
                        }}
                      >
                        <span className="dep-icon">{target.icon}</span>
                        <div>
                          <span className="dep-name">{target.name}</span>
                          <span className="dep-type">{target.type.replace('_', ' ')}</span>
                        </div>
                      </div>
                    ) : null;
                  })}
                </div>
              ) : (
                <div className="no-dependencies">Terminal node - no outgoing calls</div>
              )}
            </div>

            <div className="info-section">
              <label>Incoming Connections</label>
              {(() => {
                const callers = Object.entries(networkNodes)
                  .filter(([id, node]) => node.calls && node.calls.includes(selectedNode))
                  .map(([id]) => id);

                return callers.length > 0 ? (
                  <div className="dependency-list">
                    {callers.map(callerId => {
                      const caller = networkNodes[callerId];
                      return (
                        <div
                          key={callerId}
                          className="dependency-item enhanced"
                          onClick={() => setSelectedNode(callerId)}
                          style={{
                            borderLeft: `3px solid ${categoryStyles[caller.category].color}`
                          }}
                        >
                          <span className="dep-icon">{caller.icon}</span>
                          <div>
                            <span className="dep-name">{caller.name}</span>
                            <span className="dep-type">{caller.type.replace('_', ' ')}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="no-dependencies">Source node - no incoming calls</div>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Instructions */}
      <div className="flow-instructions enhanced">
        <div className="instruction-item">🖱️ Drag to pan</div>
        <div className="instruction-item">🔍 Scroll to zoom</div>
        <div className="instruction-item">👆 Click for details</div>
        <div className="instruction-item">💫 Watch data flow</div>
      </div>
    </div>
  );
}

export default AgentFlowDiagram;
