import React, { useState, useEffect, useCallback } from 'react';
import {
  teamService,
  TeamStatus,
  TeamMetrics,
  AgentHealth,
} from '../services/team-service';
import './TeamDashboard.css';

const ROLE_LABELS: Record<string, string> = {
  leader: '领导者 Agent',
  analysis_worker: '分析 Worker',
  generation_worker: '生成 Worker',
  retrieval_worker: '检索 Worker',
  validation_worker: '验证 Worker',
};

const STATUS_COLORS: Record<string, string> = {
  idle: 'status-idle',
  busy: 'status-busy',
  error: 'status-error',
  offline: 'status-offline',
};

const STATUS_LABELS: Record<string, string> = {
  idle: '空闲',
  busy: '忙碌',
  error: '错误',
  offline: '离线',
};

export const TeamDashboard: React.FC = () => {
  const [status, setStatus] = useState<TeamStatus | null>(null);
  const [metrics, setMetrics] = useState<{
    current: TeamMetrics | null;
    history: TeamMetrics[];
  } | null>(null);
  const [agents, setAgents] = useState<AgentHealth[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(5000);

  const loadData = useCallback(async () => {
    try {
      setError(null);
      const [statusData, metricsData, agentsData] = await Promise.all([
        teamService.getTeamStatus(),
        teamService.getMetrics(),
        teamService.getAgents(),
      ]);
      setStatus(statusData);
      setMetrics(metricsData);
      setAgents(agentsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(loadData, refreshInterval);
    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, loadData]);

  const formatDuration = (ms: number): string => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}min`;
  };

  const formatTime = (dateStr: string): string => {
    return new Date(dateStr).toLocaleTimeString('zh-CN');
  };

  if (loading) {
    return (
      <div className="team-dashboard loading">
        <div className="spinner"></div>
        <p>加载团队状态...</p>
      </div>
    );
  }

  return (
    <div className="team-dashboard">
      <div className="dashboard-header">
        <h2>🤖 多智能体团队监控</h2>
        <div className="header-controls">
          <label className="auto-refresh-toggle">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
            />
            自动刷新
          </label>
          <select
            value={refreshInterval}
            onChange={(e) => setRefreshInterval(Number(e.target.value))}
            disabled={!autoRefresh}
          >
            <option value={3000}>3秒</option>
            <option value={5000}>5秒</option>
            <option value={10000}>10秒</option>
            <option value={30000}>30秒</option>
          </select>
          <button onClick={loadData} className="btn-refresh">
            🔄 刷新
          </button>
        </div>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div className="health-indicator">
        <span
          className={`health-dot ${status?.healthy ? 'healthy' : 'unhealthy'}`}
        ></span>
        <span>系统状态: {status?.healthy ? '✅ 正常' : '⚠️ 异常'}</span>
      </div>

      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-icon">👥</div>
          <div className="metric-content">
            <div className="metric-value">
              {status?.metrics?.totalAgents || 0}
            </div>
            <div className="metric-label">总 Agent 数</div>
          </div>
        </div>
        <div className="metric-card">
          <div className="metric-icon">⚡</div>
          <div className="metric-content">
            <div className="metric-value">
              {status?.metrics?.activeAgents || 0}
            </div>
            <div className="metric-label">活跃 Agent</div>
          </div>
        </div>
        <div className="metric-card">
          <div className="metric-icon">✅</div>
          <div className="metric-content">
            <div className="metric-value">
              {status?.metrics?.totalTasksProcessed || 0}
            </div>
            <div className="metric-label">已完成任务</div>
          </div>
        </div>
        <div className="metric-card">
          <div className="metric-icon">❌</div>
          <div className="metric-content">
            <div className="metric-value">
              {status?.metrics?.totalTasksFailed || 0}
            </div>
            <div className="metric-label">失败任务</div>
          </div>
        </div>
        <div className="metric-card">
          <div className="metric-icon">⏱️</div>
          <div className="metric-content">
            <div className="metric-value">
              {formatDuration(status?.metrics?.averageTaskDuration || 0)}
            </div>
            <div className="metric-label">平均执行时间</div>
          </div>
        </div>
        <div className="metric-card">
          <div className="metric-icon">📋</div>
          <div className="metric-content">
            <div className="metric-value">
              {status?.metrics?.queueDepth || 0}
            </div>
            <div className="metric-label">队列深度</div>
          </div>
        </div>
      </div>

      <div className="agents-section">
        <h3>Agent 状态</h3>
        <div className="agents-grid">
          {agents.map((agent) => (
            <div key={agent.agentId} className="agent-card">
              <div className="agent-header">
                <span className="agent-role">
                  {ROLE_LABELS[agent.role] || agent.role}
                </span>
                <span className={`agent-status ${STATUS_COLORS[agent.status]}`}>
                  {STATUS_LABELS[agent.status] || agent.status}
                </span>
              </div>
              <div className="agent-id">{agent.agentId}</div>
              <div className="agent-stats">
                <div className="stat">
                  <span className="stat-label">当前任务</span>
                  <span className="stat-value">{agent.currentTaskCount}</span>
                </div>
                <div className="stat">
                  <span className="stat-label">已完成</span>
                  <span className="stat-value">{agent.completedTasks}</span>
                </div>
                <div className="stat">
                  <span className="stat-label">失败</span>
                  <span className="stat-value">{agent.failedTasks}</span>
                </div>
                <div className="stat">
                  <span className="stat-label">错误率</span>
                  <span className="stat-value">
                    {(agent.errorRate * 100).toFixed(1)}%
                  </span>
                </div>
              </div>
              <div className="agent-health">
                <span
                  className={`health-dot ${agent.isHealthy ? 'healthy' : 'unhealthy'}`}
                ></span>
                <span>最后心跳: {formatTime(agent.lastHeartbeat)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {metrics?.history && metrics.history.length > 0 && (
        <div className="history-section">
          <h3>历史指标</h3>
          <div className="history-chart">
            {metrics.history.map((m, idx) => (
              <div key={idx} className="history-bar">
                <div
                  className="bar-active"
                  style={{
                    height: `${(m.activeAgents / m.totalAgents) * 100}%`,
                  }}
                  title={`活跃: ${m.activeAgents}`}
                ></div>
                <div className="bar-label">{formatTime(m.timestamp)}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamDashboard;
