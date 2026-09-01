import type { ProvenanceType } from '../../types';

interface ProvenancePillProps {
  type: ProvenanceType;
}

const LABELS: Record<ProvenanceType, string> = {
  'REAL': 'Real / Official',
  'DERIVED': 'Derived',
  'SIMULATED': 'Simulated',
  'ILLUSTRATIVE ESTIMATE': 'Illustrative Est.',
};

export function ProvenancePill({ type }: ProvenancePillProps) {
  const cls = {
    'REAL': 'provenance-real',
    'DERIVED': 'provenance-derived',
    'SIMULATED': 'provenance-simulated',
    'ILLUSTRATIVE ESTIMATE': 'provenance-illustrative',
  }[type];

  return (
    <span className={`provenance-pill ${cls}`}>
      <span className="provenance-pill-dot" />
      {LABELS[type]}
    </span>
  );
}
