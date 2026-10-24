import React, { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  Download,
  Users,
  ShieldCheck,
  AlertTriangle,
  Clock,
  Layers,
  ArrowDownToLine,
  RefreshCw,
} from 'lucide-react';
import { EvacuationReportResponse } from '../../types';
import { api } from '../../services/api';
import { MOCK_REPORT } from '../../services/mockData';

export const EvacuationReports: React.FC = () => {
  const [report, setReport] = useState<EvacuationReportResponse>(MOCK_REPORT);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchReport = async () => {
    setIsLoading(true);
    try {
      const data = await api.getReport();
      setReport(data);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, []);

  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(report, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `evacuation_report_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleExportCSV = () => {
    const headers = 'Metric,Value\n';
    const rows = [
      `Scenario Name,${report.scenario_name}`,
      `Total Simulation Steps,${report.total_simulation_steps}`,
      `Total Elapsed Seconds,${report.total_simulation_time_seconds}`,
      `Total Evacuated People,${report.evacuated_people}`,
      `Trapped People,${report.trapped_people}`,
      `Average Evacuation Time,${report.avg_evacuation_time_seconds}`,
      `Maximum Evacuation Time,${report.max_evacuation_time_seconds}`,
      `Total Reroute Events,${report.total_reroute_events}`,
    ].join('\n');

    const csvStr = 'data:text/csv;charset=utf-8,' + encodeURIComponent(headers + rows);
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', csvStr);
    downloadAnchor.setAttribute('download', `evacuation_summary_${Date.now()}.csv`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto bg-surface-main p-4 lg:p-6 select-none">
      {/* Header & Export Actions */}
      <div className="mb-6 border-b border-surface-border pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-brand-sky" />
            <h2 className="text-base font-mono font-bold uppercase text-brand-ice tracking-wider">
              Post-Evacuation Diagnostic Report
            </h2>
          </div>
          <p className="text-xs text-content-secondary mt-1">
            Empirical telemetry metrics aggregated from actual multi-agent simulation executions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchReport}
            className="p-2 bg-surface-elevated hover:bg-surface-elevated/80 text-content-secondary rounded border border-surface-border transition-colors"
            title="Refresh Report"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={handleExportCSV}
            className="px-3 py-1.5 bg-surface-elevated hover:bg-surface-elevated/80 text-brand-ice font-mono text-xs rounded border border-surface-border flex items-center gap-1.5 transition-colors"
          >
            <ArrowDownToLine className="w-3.5 h-3.5" /> CSV
          </button>
          <button
            onClick={handleExportJSON}
            className="px-3 py-1.5 bg-brand-deep hover:bg-brand-deep/80 text-brand-ice font-mono text-xs rounded border border-brand-sky/40 flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <Download className="w-3.5 h-3.5 text-brand-sky" /> JSON Export
          </button>
        </div>
      </div>

      {/* Primary KPI Metrics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="bg-surface-secondary border border-surface-border p-3.5 rounded-lg">
          <span className="text-[10px] font-mono text-content-muted uppercase block">Total Evacuated</span>
          <span className="text-xl font-bold font-mono text-emergency-green mt-1 block">
            {report.evacuated_people} / {report.total_people}{' '}
            <span className="text-xs text-content-secondary font-normal">people</span>
          </span>
          <span className="text-[10px] text-content-muted mt-0.5 block">
            {report.total_people > 0 ? Math.round((report.evacuated_people / report.total_people) * 100) : 0}% success rate
          </span>
        </div>

        <div className="bg-surface-secondary border border-surface-border p-3.5 rounded-lg">
          <span className="text-[10px] font-mono text-content-muted uppercase block">Average Escape Time</span>
          <span className="text-xl font-bold font-mono text-brand-ice mt-1 block">
            {report.avg_evacuation_time_seconds.toFixed(1)}s
          </span>
          <span className="text-[10px] text-content-muted mt-0.5 block">
            Max time: {report.max_evacuation_time_seconds.toFixed(1)}s
          </span>
        </div>

        <div className="bg-surface-secondary border border-surface-border p-3.5 rounded-lg">
          <span className="text-[10px] font-mono text-content-muted uppercase block">Trapped Occupants</span>
          <span className={`text-xl font-bold font-mono mt-1 block ${report.trapped_people > 0 ? 'text-emergency-red' : 'text-emergency-green'}`}>
            {report.trapped_people}
          </span>
          <span className="text-[10px] text-content-muted mt-0.5 block">
            {report.trapped_people > 0 ? 'Exits blocked' : 'Zero fatalities'}
          </span>
        </div>

        <div className="bg-surface-secondary border border-surface-border p-3.5 rounded-lg">
          <span className="text-[10px] font-mono text-content-muted uppercase block">Dynamic Reroutes</span>
          <span className="text-xl font-bold font-mono text-brand-sky mt-1 block">
            {report.total_reroute_events}
          </span>
          <span className="text-[10px] text-content-muted mt-0.5 block">
            Obstacles avoided mid-flight
          </span>
        </div>
      </div>

      {/* Exit Utilization Breakdown */}
      <div className="bg-surface-secondary border border-surface-border rounded-lg p-4 mb-6">
        <h3 className="text-xs font-mono font-bold uppercase text-brand-ice tracking-wider mb-3">
          Emergency Exit Utilization Distribution
        </h3>
        <div className="space-y-3">
          {Object.entries(report.exit_usage_distribution).length > 0 ? (
            Object.entries(report.exit_usage_distribution).map(([exitId, count]) => {
              const pct = report.evacuated_people > 0 ? Math.round((count / report.evacuated_people) * 100) : 0;
              return (
                <div key={exitId} className="space-y-1">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="font-semibold text-content-primary">{exitId}</span>
                    <span className="text-brand-ice">
                      {count} occupants ({pct}%)
                    </span>
                  </div>
                  <div className="w-full h-2.5 bg-surface-main rounded-full overflow-hidden border border-surface-border">
                    <div
                      className="h-full bg-emergency-green rounded-full transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-xs font-mono text-content-muted italic">
              No exit throughput recorded yet. Advance simulation to see exit distributions.
            </div>
          )}
        </div>
      </div>

      {/* Mandatory Academic Disclaimer Box */}
      <div className="bg-surface-secondary border border-surface-border rounded-lg p-4 font-mono text-xs text-content-secondary leading-relaxed">
        <span className="text-xs font-bold text-emergency-amber block mb-1">
          ⚠️ ACADEMIC SIMULATION DISCLAIMER
        </span>
        {report.academic_disclaimer}
      </div>
    </div>
  );
};
