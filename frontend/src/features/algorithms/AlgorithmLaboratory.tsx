import React, { useState } from 'react';
import {
  GitCompare,
  Zap,
  CheckCircle2,
  Sliders,
  HelpCircle,
  Clock,
  ArrowRight,
  TrendingDown,
} from 'lucide-react';
import {
  BuildingGraphModel,
  AlgorithmComparisonResponse,
  AlgorithmType,
} from '../../types';
import { api } from '../../services/api';

interface AlgorithmLaboratoryProps {
  building: BuildingGraphModel;
}

export const AlgorithmLaboratory: React.FC<AlgorithmLaboratoryProps> = ({ building }) => {
  const [startNode, setStartNode] = useState<string>('ROOM_201');
  const [benchmarkResult, setBenchmarkResult] = useState<AlgorithmComparisonResponse | null>(null);
  const [isRunning, setIsRunning] = useState<boolean>(false);

  // Utility weight tuning interactive preview
  const [wTime, setWTime] = useState<number>(0.35);
  const [wHazard, setWHazard] = useState<number>(0.40);
  const [wCongestion, setWCongestion] = useState<number>(0.25);

  const nonExitNodes = building.nodes.filter((n) => !n.is_exit);

  const handleRunBenchmark = async () => {
    setIsRunning(true);
    try {
      const res = await api.compareAlgorithms(startNode, false, 1.2);
      setBenchmarkResult(res);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto bg-surface-main p-4 lg:p-6 select-none">
      {/* Header Banner */}
      <div className="mb-6 border-b border-surface-border pb-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <GitCompare className="w-5 h-5 text-brand-sky" />
            <h2 className="text-base font-mono font-bold uppercase text-brand-ice tracking-wider">
              Algorithm Benchmark & Comparison Laboratory
            </h2>
          </div>
          <p className="text-xs text-content-secondary mt-1">
            Empirical comparative analysis of BFS, Dijkstra, and A* Search running on identical graph conditions.
          </p>
        </div>

        {/* Start Room & Action */}
        <div className="flex items-center gap-3">
          <select
            value={startNode}
            onChange={(e) => setStartNode(e.target.value)}
            className="bg-surface-elevated text-xs font-mono text-brand-ice p-2 rounded border border-surface-border focus:outline-none"
          >
            {nonExitNodes.map((n) => (
              <option key={n.id} value={n.id} className="bg-surface-secondary">
                {n.name} ({n.id} • F{n.floor})
              </option>
            ))}
          </select>

          <button
            onClick={handleRunBenchmark}
            disabled={isRunning}
            className="px-4 py-2 bg-brand-sky hover:bg-brand-ice text-surface-main font-mono text-xs font-bold rounded shadow-glow-sky flex items-center gap-2 transition-all"
          >
            <Zap className="w-4 h-4" />
            <span>{isRunning ? 'Running Benchmark...' : 'Run Benchmark'}</span>
          </button>
        </div>
      </div>

      {/* Benchmark Results Comparison Grid */}
      {benchmarkResult ? (
        <div className="space-y-6">
          {/* Side-by-Side Algorithm Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Object.entries(benchmarkResult.comparisons).map(([algoName, data]) => {
              const isAStar = algoName === 'A*';
              return (
                <div
                  key={algoName}
                  className={`bg-surface-secondary border rounded-lg p-4 flex flex-col justify-between ${
                    isAStar
                      ? 'border-brand-sky/60 shadow-glow-sky'
                      : 'border-surface-border'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between border-b border-surface-border pb-2 mb-3">
                      <span className="text-sm font-bold font-mono text-brand-ice">{algoName}</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-surface-elevated text-content-secondary">
                        {algoName === 'BFS' ? 'Unweighted' : algoName === 'Dijkstra' ? 'Uniform Cost' : 'Informed Search'}
                      </span>
                    </div>

                    <p className="text-[11px] text-content-secondary italic mb-4 leading-relaxed">
                      "{data.objective_description}"
                    </p>

                    {/* Metrics Key-Value List */}
                    <div className="space-y-2 text-xs font-mono">
                      <div className="flex justify-between p-1.5 bg-surface-elevated rounded">
                        <span className="text-content-muted">Target Exit:</span>
                        <strong className="text-emergency-green">{data.selected_exit}</strong>
                      </div>
                      <div className="flex justify-between p-1.5 bg-surface-elevated rounded">
                        <span className="text-content-muted">Edge Hops:</span>
                        <strong className="text-content-primary">{data.total_edges} connections</strong>
                      </div>
                      <div className="flex justify-between p-1.5 bg-surface-elevated rounded">
                        <span className="text-content-muted">Physical Distance:</span>
                        <strong className="text-content-primary">{data.total_distance.toFixed(1)}m</strong>
                      </div>
                      <div className="flex justify-between p-1.5 bg-surface-elevated rounded">
                        <span className="text-content-muted">Est. Travel Time:</span>
                        <strong className="text-brand-ice">{data.estimated_travel_time.toFixed(1)}s</strong>
                      </div>
                      <div className="flex justify-between p-1.5 bg-surface-elevated rounded border border-brand-sky/20">
                        <span className="text-brand-sky font-semibold">Nodes Expanded:</span>
                        <strong className="text-brand-sky font-bold">{data.nodes_expanded} nodes</strong>
                      </div>
                      <div className="flex justify-between p-1.5 bg-surface-elevated rounded">
                        <span className="text-content-muted">Execution Time:</span>
                        <span className="text-content-secondary">{data.execution_time_ms.toFixed(2)}ms</span>
                      </div>
                    </div>
                  </div>

                  {/* Path Sequence */}
                  <div className="mt-4 pt-3 border-t border-surface-border">
                    <span className="text-[10px] font-mono text-content-muted block mb-1">COMPUTED PATH:</span>
                    <div className="flex flex-wrap gap-1 font-mono text-[10px]">
                      {data.path.map((node, i) => (
                        <span key={i} className="flex items-center gap-1">
                          <span className="px-1.5 py-0.5 rounded bg-surface-main text-brand-ice border border-surface-border">
                            {node}
                          </span>
                          {i < data.path.length - 1 && <span className="text-content-muted">→</span>}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Educational Analysis Banner */}
          <div className="bg-brand-deep/30 border border-brand-sky/40 rounded-lg p-4 font-mono text-xs text-brand-ice leading-relaxed">
            <span className="text-xs font-bold text-brand-sky block mb-1">
              EDUCATIONAL COMPARATIVE ANALYSIS:
            </span>
            {benchmarkResult.analysis}
          </div>
        </div>
      ) : (
        <div className="p-8 text-center bg-surface-secondary border border-surface-border rounded-lg text-content-muted font-mono text-xs">
          Select a starting location and click <strong>"Run Benchmark"</strong> to trigger live comparative analysis.
        </div>
      )}

      {/* Educational Concept Breakdown Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
        <div className="bg-surface-secondary p-4 rounded-lg border border-surface-border text-xs">
          <h3 className="font-mono font-bold text-brand-ice mb-1.5 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-content-muted" /> Breadth-First Search (BFS)
          </h3>
          <p className="text-content-secondary leading-relaxed mb-2">
            Explores in concentric circles using a FIFO queue. Minimizes the number of edge hops (room transitions).
          </p>
          <div className="p-2 bg-surface-elevated rounded font-mono text-[10px] text-content-muted">
            Complexity: O(|V| + |E|)<br />
            Limitation: Treats 50m corridor and 5m doorway identically.
          </div>
        </div>

        <div className="bg-surface-secondary p-4 rounded-lg border border-surface-border text-xs">
          <h3 className="font-mono font-bold text-brand-ice mb-1.5 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emergency-amber" /> Dijkstra's Algorithm
          </h3>
          <p className="text-content-secondary leading-relaxed mb-2">
            Uniform-cost search using a binary min-heap. Systematically expands the least-cost node frontier.
          </p>
          <div className="p-2 bg-surface-elevated rounded font-mono text-[10px] text-content-muted">
            Complexity: O((|V| + |E|) log |V|)<br />
            Advantage: Guarantees global least-cost non-negative route.
          </div>
        </div>

        <div className="bg-surface-secondary p-4 rounded-lg border border-surface-border text-xs">
          <h3 className="font-mono font-bold text-brand-ice mb-1.5 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-brand-sky" /> A* Search Algorithm
          </h3>
          <p className="text-content-secondary leading-relaxed mb-2">
            Evaluates f(n) = g(n) + h(n). Uses straight-line 3D Euclidean distance divided by max speed as an admissible lower bound.
          </p>
          <div className="p-2 bg-surface-elevated rounded font-mono text-[10px] text-content-muted">
            Admissibility: h(n) ≤ h*(n)<br />
            Advantage: Prunes nodes heading away from exits.
          </div>
        </div>
      </div>
    </div>
  );
};
