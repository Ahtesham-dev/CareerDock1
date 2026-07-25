import { useState, useEffect } from 'react';
import { jobsAPI } from '../api';

const sourceGroups = [
  { label: 'Professional', sources: ['LinkedIn', 'Naukri'] },
  { label: 'Aggregator', sources: ['JSearch'] },
  { label: 'General', sources: ['Internshala', 'Career Pages'] },
  { label: 'Startup', sources: ['Wellfound', 'YCombinator', 'Instahyre', 'Cutshort', 'Hirect'] },
  { label: 'Community', sources: ['GitHub', 'HackerNews', 'Dev.to', 'Peerlist'] }
];

export default function SourceFilterPanel({ activeSources, toggleSource }) {
  const [sourceCounts, setSourceCounts] = useState({});

  useEffect(() => {
    jobsAPI.getSourceCounts()
      .then(res => {
        const map = {};
        (res.data.sources || []).forEach(s => { map[s._id] = s.count; });
        setSourceCounts(map);
      })
      .catch(() => {});
  }, []);

  return (
    <div className="p-4">
      <p className="text-sm text-text-secondary uppercase tracking-widest mb-3 px-1 font-semibold flex items-center gap-2">
        <i className="ti ti-filter text-sm" /> Sources
        <span className="text-xs text-accent-light/80 font-semibold normal-case">({activeSources?.length || 0} active)</span>
      </p>
      <div className="space-y-1.5">
        {sourceGroups.map(group => (
          <div key={group.label}>
            <p className="text-xs text-text-muted uppercase tracking-[0.12em] px-1.5 py-0.5 font-semibold">{group.label}</p>
            <div className="space-y-1.5">
              {group.sources.map(source => (
                <button
                  key={source}
                  onClick={() => toggleSource(source)}
                  className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs transition-all duration-200 ${
                    activeSources?.includes(source)
                      ? 'text-text-primary bg-white/[0.08] border border-white/[0.08] font-medium'
                      : 'text-text-muted hover:text-text-secondary hover:bg-white/[0.04]'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className={`w-2 h-2 rounded-full ${activeSources?.includes(source) ? 'bg-accent shadow-premium' : 'bg-white/30'}`} />
                    <span className="text-sm">{source}</span>
                  </div>
                  <span className="text-xs text-text-muted/60 font-medium">{sourceCounts[source] || 0}</span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
