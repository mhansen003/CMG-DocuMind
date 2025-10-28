import { useState, useRef, useEffect } from 'react';
import '../styles/AgentFlowDiagram.css';

// Agent network connections - defines which agents call which
const agentConnections = {
  'agent-001': {
    name: 'Document Request',
    icon: '📄',
    category: 'Communication',
    calls: ['agent-010', 'agent-005'],
    position: { x: 100, y: 200 }
  },
  'agent-002': {
    name: 'Income Verification',
    icon: '💰',
    category: 'Analysis',
    calls: ['agent-011', 'agent-015', 'agent-005'],
    position: { x: 450, y: 100 }
  },
  'agent-004': {
    name: 'Date Validation',
    icon: '📅',
    category: 'Compliance',
    calls: ['agent-012', 'agent-001'],
    position: { x: 100, y: 400 }
  },
  'agent-005': {
    name: 'Condition Generator',
    icon: '📋',
    category: 'Workflow',
    calls: ['agent-001'],
    position: { x: 800, y: 300 }
  },
  'agent-006': {
    name: 'Property Matcher',
    icon: '🏠',
    category: 'Verification',
    calls: [],
    position: { x: 1100, y: 450 }
  },
  'agent-007': {
    name: 'Name Reconciliation',
    icon: '👤',
    category: 'Verification',
    calls: [],
    position: { x: 1100, y: 150 }
  },
  'agent-009': {
    name: 'Fraud Detection',
    icon: '🔍',
    category: 'Risk',
    calls: ['agent-013', 'agent-011', 'agent-005'],
    position: { x: 450, y: 500 }
  },
  'agent-010': {
    name: 'Document Predictor',
    icon: '🎯',
    category: 'Analysis',
    calls: [],
    position: { x: 450, y: 300 }
  },
  'agent-011': {
    name: 'Calculation Verifier',
    icon: '🧮',
    category: 'Analysis',
    calls: ['agent-009'],
    position: { x: 800, y: 100 }
  },
  'agent-012': {
    name: 'Expiration Tracker',
    icon: '⏰',
    category: 'Compliance',
    calls: [],
    position: { x: 450, y: 600 }
  },
  'agent-013': {
    name: 'Format Detector',
    icon: '🎨',
    category: 'Risk',
    calls: [],
    position: { x: 800, y: 600 }
  },
  'agent-014': {
    name: 'Field Completion',
    icon: '✍️',
    category: 'Workflow',
    calls: [],
    position: { x: 100, y: 600 }
  },
  'agent-015': {
    name: 'Consistency Checker',
    icon: '🔗',
    category: 'Verification',
    calls: ['agent-007', 'agent-006', 'agent-005'],
    position: { x: 800, y: 450 }
  }
};

const categoryColors = {
  'Communication': '#3b82f6',
  'Analysis': '#8b5cf6',
  'Verification': '#10b981',
  'Workflow': '#f59e0b',
  'Compliance': '#06b6d4',
  'Risk': '#ef4444'
};

function AgentFlowDiagram({ agentId, allAgents = false }) {
  const [selectedNode, setSelectedNode] = useState(agentId);
  const [hoveredNode, setHoveredNode] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const canvasRef = useRef(null);
  const containerRef = useRef(null);

  // Get visible agents based on mode
  const getVisibleAgents = () => {
    if (allAgents) {
      return Object.keys(agentConnections);
    }

    if (!agentId || !agentConnections[agentId]) {
      return [];
    }

    // Show selected agent and its connections
    const visible = new Set([agentId]);
    const calls = agentConnections[agentId].calls || [];
    calls.forEach(id => visible.add(id));

    // Also show agents that call this agent
    Object.entries(agentConnections).forEach(([id, agent]) => {
      if (agent.calls.includes(agentId)) {
        visible.add(id);
      }
    });

    return Array.from(visible);
  };

  const visibleAgents = getVisibleAgents();

  // Get all connections to draw
  const getConnections = () => {
    const connections = [];
    visibleAgents.forEach(sourceId => {
      const agent = agentConnections[sourceId];
      if (agent && agent.calls) {
        agent.calls.forEach(targetId => {
          if (visibleAgents.includes(targetId)) {
            connections.push({
              from: sourceId,
              to: targetId,
              type: sourceId === agentId || targetId === agentId ? 'primary' : 'secondary'
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
    const outgoing = agentConnections[id]?.calls?.length || 0;
    const incoming = Object.values(agentConnections).filter(
      agent => agent.calls && agent.calls.includes(id)
    ).length;
    return { outgoing, incoming };
  };

  // Handle mouse wheel for zoom
  const handleWheel = (e) => {
    e.preventDefault();
    const delta = e.deltaY * -0.001;
    const newZoom = Math.min(Math.max(0.5, zoom + delta), 2);
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
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  return (
    <div className="flow-diagram-container" ref={containerRef}>
      {/* Controls */}
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
            onClick={() => setZoom(Math.max(0.5, zoom - 0.1))}
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
      </div>

      {/* Legend */}
      <div className="flow-legend">
        <h4>Legend</h4>
        <div className="legend-items">
          {Object.entries(categoryColors).map(([category, color]) => (
            <div key={category} className="legend-item">
              <div className="legend-color" style={{ backgroundColor: color }}></div>
              <span className="legend-label">{category}</span>
            </div>
          ))}
        </div>
        <div className="legend-info">
          <div className="legend-item">
            <span className="legend-arrow primary-arrow">→</span>
            <span className="legend-label">Direct Call</span>
          </div>
          <div className="legend-item">
            <span className="legend-arrow secondary-arrow">→</span>
            <span className="legend-label">Indirect Call</span>
          </div>
        </div>
      </div>

      {/* Canvas */}
      <div
        className="flow-canvas"
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
            {/* Arrow markers */}
            <marker
              id="arrowhead-primary"
              markerWidth="10"
              markerHeight="10"
              refX="9"
              refY="3"
              orient="auto"
              markerUnits="strokeWidth"
            >
              <path d="M0,0 L0,6 L9,3 z" fill="#667eea" />
            </marker>
            <marker
              id="arrowhead-secondary"
              markerWidth="10"
              markerHeight="10"
              refX="9"
              refY="3"
              orient="auto"
              markerUnits="strokeWidth"
            >
              <path d="M0,0 L0,6 L9,3 z" fill="#cbd5e1" />
            </marker>
            <marker
              id="arrowhead-hover"
              markerWidth="10"
              markerHeight="10"
              refX="9"
              refY="3"
              orient="auto"
              markerUnits="strokeWidth"
            >
              <path d="M0,0 L0,6 L9,3 z" fill="#f59e0b" />
            </marker>
          </defs>

          {/* Draw connections */}
          {connections.map((conn, index) => {
            const fromAgent = agentConnections[conn.from];
            const toAgent = agentConnections[conn.to];

            if (!fromAgent || !toAgent) return null;

            const isHovered = hoveredNode === conn.from || hoveredNode === conn.to;
            const isSelected = selectedNode === conn.from || selectedNode === conn.to;

            // Calculate connection line
            const startX = fromAgent.position.x + 80;
            const startY = fromAgent.position.y + 40;
            const endX = toAgent.position.x;
            const endY = toAgent.position.y + 40;

            // Create curved path
            const midX = (startX + endX) / 2;
            const curve = Math.abs(endX - startX) * 0.3;
            const pathD = `M ${startX} ${startY} Q ${midX} ${startY - curve}, ${endX} ${endY}`;

            return (
              <g key={`${conn.from}-${conn.to}-${index}`}>
                <path
                  d={pathD}
                  fill="none"
                  stroke={isHovered || isSelected ? '#f59e0b' : conn.type === 'primary' ? '#667eea' : '#cbd5e1'}
                  strokeWidth={isHovered || isSelected ? 3 : 2}
                  markerEnd={`url(#arrowhead-${isHovered || isSelected ? 'hover' : conn.type})`}
                  className="connection-line"
                  style={{
                    opacity: isHovered || isSelected ? 1 : 0.6,
                    transition: 'all 0.2s'
                  }}
                />
              </g>
            );
          })}

          {/* Draw agent nodes */}
          {visibleAgents.map(id => {
            const agent = agentConnections[id];
            if (!agent) return null;

            const deps = getDependencyCounts(id);
            const isSelected = id === selectedNode;
            const isHovered = id === hoveredNode;
            const color = categoryColors[agent.category] || '#6b7280';

            return (
              <g
                key={id}
                transform={`translate(${agent.position.x}, ${agent.position.y})`}
                className="agent-node"
                onMouseEnter={() => setHoveredNode(id)}
                onMouseLeave={() => setHoveredNode(null)}
                onClick={() => setSelectedNode(id)}
                style={{ cursor: 'pointer' }}
              >
                {/* Node background */}
                <rect
                  x="0"
                  y="0"
                  width="160"
                  height="80"
                  rx="8"
                  fill="white"
                  stroke={isSelected ? '#667eea' : isHovered ? '#f59e0b' : color}
                  strokeWidth={isSelected ? 4 : isHovered ? 3 : 2}
                  className="node-bg"
                  style={{
                    filter: isSelected || isHovered ? 'drop-shadow(0 4px 12px rgba(0,0,0,0.2))' : 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))',
                    transition: 'all 0.2s'
                  }}
                />

                {/* Category bar */}
                <rect
                  x="0"
                  y="0"
                  width="160"
                  height="8"
                  rx="8"
                  fill={color}
                />

                {/* Icon */}
                <text
                  x="20"
                  y="40"
                  fontSize="28"
                  textAnchor="middle"
                >
                  {agent.icon}
                </text>

                {/* Name */}
                <text
                  x="50"
                  y="35"
                  fontSize="12"
                  fontWeight="600"
                  fill="#111827"
                >
                  {agent.name}
                </text>

                {/* Dependency counts */}
                <g transform="translate(50, 50)">
                  <text fontSize="10" fill="#6b7280" fontWeight="500">
                    ↗ {deps.outgoing} calls  ↙ {deps.incoming} called
                  </text>
                </g>

                {/* Selected indicator */}
                {isSelected && (
                  <circle
                    cx="150"
                    cy="10"
                    r="5"
                    fill="#667eea"
                    className="selected-indicator"
                  />
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {/* Info Panel */}
      {selectedNode && agentConnections[selectedNode] && (
        <div className="flow-info-panel">
          <div className="info-panel-header">
            <span className="info-panel-icon">{agentConnections[selectedNode].icon}</span>
            <h3>{agentConnections[selectedNode].name}</h3>
          </div>
          <div className="info-panel-body">
            <div className="info-section">
              <label>Category</label>
              <div
                className="category-badge"
                style={{
                  backgroundColor: categoryColors[agentConnections[selectedNode].category],
                  color: 'white'
                }}
              >
                {agentConnections[selectedNode].category}
              </div>
            </div>

            <div className="info-section">
              <label>Calls These Agents ({agentConnections[selectedNode].calls.length})</label>
              {agentConnections[selectedNode].calls.length > 0 ? (
                <div className="dependency-list">
                  {agentConnections[selectedNode].calls.map(targetId => {
                    const target = agentConnections[targetId];
                    return target ? (
                      <div
                        key={targetId}
                        className="dependency-item"
                        onClick={() => setSelectedNode(targetId)}
                      >
                        <span className="dep-icon">{target.icon}</span>
                        <span className="dep-name">{target.name}</span>
                      </div>
                    ) : null;
                  })}
                </div>
              ) : (
                <div className="no-dependencies">No outgoing calls</div>
              )}
            </div>

            <div className="info-section">
              <label>Called By These Agents</label>
              {(() => {
                const callers = Object.entries(agentConnections)
                  .filter(([id, agent]) => agent.calls && agent.calls.includes(selectedNode))
                  .map(([id]) => id);

                return callers.length > 0 ? (
                  <div className="dependency-list">
                    {callers.map(callerId => {
                      const caller = agentConnections[callerId];
                      return (
                        <div
                          key={callerId}
                          className="dependency-item"
                          onClick={() => setSelectedNode(callerId)}
                        >
                          <span className="dep-icon">{caller.icon}</span>
                          <span className="dep-name">{caller.name}</span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="no-dependencies">No incoming calls</div>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="flow-instructions">
        <div className="instruction-item">🖱️ Click & drag to pan</div>
        <div className="instruction-item">🔍 Scroll to zoom</div>
        <div className="instruction-item">👆 Click nodes for details</div>
      </div>
    </div>
  );
}

export default AgentFlowDiagram;
