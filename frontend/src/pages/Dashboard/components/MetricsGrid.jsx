// @ts-check

/**
 * @typedef {import("../dashboardContent").DashboardMetric} DashboardMetric
 */

/**
 * @param {{ metrics: DashboardMetric[] }} props
 */
export function MetricsGrid({ metrics }) {
  return (
    <div className="metrics-grid">
      {metrics.map((metric) => {
        const Icon = metric.icon;
        return (
          <article className="metric-card" key={metric.label}>
            <Icon size={22} />
            <strong>{metric.value}</strong>
            <span>{metric.label}</span>
          </article>
        );
      })}
    </div>
  );
}
