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

// Simplified core agent network
const networkNodes = {
  // === CORE WORKFLOW AGENTS ===
  'agent-016': {
    id: 'agent-016',
    name: 'Document Ingestion',
    icon: '📥',
    type: NODE_TYPES.AGENT,
    category: 'Ingestion',
    description: 'Receives and classifies documents',
    calls: ['agent-017', 'agent-002'],
    position: { x: 200, y: 250 }
  },
  'agent-017': {
    id: 'agent-017',
    name: 'Data Extraction',
    icon: '🔍',
    type: NODE_TYPES.AGENT,
    category: 'Ingestion',
    description: 'Extracts structured data from documents',
    calls: ['agent-002', 'agent-011'],
    position: { x: 200, y: 450 }
  },

  // === VALIDATION AGENTS ===
  'agent-001': {
    id: 'agent-001',
    name: 'Document Request',
    icon: '📄',
    type: NODE_TYPES.AGENT,
    category: 'Communication',
    description: 'Requests missing documents',
    calls: ['agent-005'],
    position: { x: 500, y: 350 }
  },
  'agent-002': {
    id: 'agent-002',
    name: 'Income Verification',
    icon: '💰',
    type: NODE_TYPES.AGENT,
    category: 'Analysis',
    description: 'Verifies income across documents',
    calls: ['agent-011', 'agent-015'],
    position: { x: 500, y: 200 }
  },
  'agent-003': {
    id: 'agent-003',
    name: 'Employment Verification',
    icon: '💼',
    type: NODE_TYPES.AGENT,
    category: 'Verification',
    description: 'Verifies employer information',
    calls: ['agent-015'],
    position: { x: 500, y: 500 }
  },
  'agent-004': {
    id: 'agent-004',
    name: 'Date Validation',
    icon: '📅',
    type: NODE_TYPES.AGENT,
    category: 'Compliance',
    description: 'Validates document dates',
    calls: ['agent-001'],
    position: { x: 200, y: 350 }
  },

  // === ANALYSIS AGENTS ===
  'agent-009': {
    id: 'agent-009',
    name: 'Fraud Detection',
    icon: '🛡️',
    type: NODE_TYPES.AGENT,
    category: 'Risk',
    description: 'Detects potential fraud',
    calls: ['agent-005'],
    position: { x: 800, y: 500 }
  },
  'agent-011': {
    id: 'agent-011',
    name: 'Calculation Verifier',
    icon: '🧮',
    type: NODE_TYPES.AGENT,
    category: 'Analysis',
    description: 'Verifies calculations',
    calls: ['agent-009'],
    position: { x: 800, y: 200 }
  },

  // === RECONCILIATION AGENTS ===
  'agent-006': {
    id: 'agent-006',
    name: 'Property Matcher',
    icon: '🏠',
    type: NODE_TYPES.AGENT,
    category: 'Verification',
    description: 'Matches property details',
    calls: ['agent-005'],
    position: { x: 1100, y: 500 }
  },
  'agent-007': {
    id: 'agent-007',
    name: 'Name Reconciliation',
    icon: '👤',
    type: NODE_TYPES.AGENT,
    category: 'Verification',
    description: 'Reconciles name variations',
    calls: ['agent-005'],
    position: { x: 1100, y: 300 }
  },
  'agent-015': {
    id: 'agent-015',
    name: 'Consistency Checker',
    icon: '🔗',
    type: NODE_TYPES.AGENT,
    category: 'Verification',
    description: 'Ensures data consistency',
    calls: ['agent-007', 'agent-006'],
    position: { x: 1100, y: 200 }
  },
  'agent-019': {
    id: 'agent-019',
    name: 'Compliance Validator',
    icon: '✅',
    type: NODE_TYPES.AGENT,
    category: 'Compliance',
    description: 'Validates compliance',
    calls: ['agent-005'],
    position: { x: 800, y: 350 }
  },

  // === OUTPUT AGENTS ===
  'agent-005': {
    id: 'agent-005',
    name: 'Condition Generator',
    icon: '📋',
    type: NODE_TYPES.AGENT,
    category: 'Workflow',
    description: 'Generates loan conditions',
    calls: [],
    position: { x: 1400, y: 350 }
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

  // Removed excessive animations for cleaner professional look

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

      {/* Simplified Legend */}
      <div className="flow-legend">
        <h4>Agent Network</h4>
        <div className="legend-section">
          <div className="legend-subtitle">Categories</div>
          <div className="legend-items">
            <div className="legend-item">
              <div className="legend-color" style={{ background: '#6366f1' }}></div>
              <span>Ingestion</span>
            </div>
            <div className="legend-item">
              <div className="legend-color" style={{ background: '#8b5cf6' }}></div>
              <span>Analysis</span>
            </div>
            <div className="legend-item">
              <div className="legend-color" style={{ background: '#10b981' }}></div>
              <span>Verification</span>
            </div>
            <div className="legend-item">
              <div className="legend-color" style={{ background: '#ef4444' }}></div>
              <span>Risk</span>
            </div>
            <div className="legend-item">
              <div className="legend-color" style={{ background: '#06b6d4' }}></div>
              <span>Compliance</span>
            </div>
            <div className="legend-item">
              <div className="legend-color" style={{ background: '#f59e0b' }}></div>
              <span>Workflow</span>
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

          {/* Draw connections - simplified */}
          {connections.map((conn, index) => {
            const fromNode = networkNodes[conn.from];
            const toNode = networkNodes[conn.to];

            if (!fromNode || !toNode) return null;

            const isHovered = hoveredNode === conn.from || hoveredNode === conn.to;
            const isSelected = selectedNode === conn.from || selectedNode === conn.to;

            // Calculate connection line
            const startX = fromNode.position.x + 80;
            const startY = fromNode.position.y + 40;
            const endX = toNode.position.x;
            const endY = toNode.position.y + 40;

            // Create straight or slightly curved path
            const midX = (startX + endX) / 2;
            const curve = Math.abs(endX - startX) * 0.15;
            const pathD = `M ${startX} ${startY} Q ${midX} ${startY - curve}, ${endX} ${endY}`;

            return (
              <g key={`${conn.from}-${conn.to}-${index}`}>
                <path
                  d={pathD}
                  fill="none"
                  stroke={
                    isHovered || isSelected ? '#3b82f6' :
                    conn.type === 'primary' ? '#667eea' :
                    '#cbd5e1'
                  }
                  strokeWidth={isHovered || isSelected ? 2.5 : 1.5}
                  markerEnd={`url(#arrowhead-${isHovered || isSelected ? 'hover' : conn.type})`}
                  className="connection-line"
                  opacity={isHovered || isSelected ? 0.9 : 0.5}
                />
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
