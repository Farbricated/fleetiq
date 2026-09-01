interface UtilizationBarProps {
  percent: number;
  showLabel?: boolean;
  width?: string;
}

export function UtilizationBar({ percent, showLabel = true, width = '100%' }: UtilizationBarProps) {
  const cls =
    percent === 0 ? 'util-bar-low' :
    percent < 30 ? 'util-bar-low' :
    percent < 60 ? 'util-bar-medium' :
    'util-bar-good';

  return (
    <div style={{ width }}>
      <div className="util-bar-track">
        <div
          className={`util-bar-fill ${cls}`}
          style={{ width: `${Math.min(percent, 100)}%` }}
        />
      </div>
      {showLabel && (
        <div className="util-bar-label">{percent.toFixed(1)}%</div>
      )}
    </div>
  );
}
