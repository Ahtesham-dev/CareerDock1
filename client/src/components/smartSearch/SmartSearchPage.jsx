import { useState } from 'react';
import SearchBar from './SearchBar';
import StatCardsRow from './StatCardsRow';
import PillButton from './PillButton';
import MetricsStrip from './MetricsStrip';
import TaglineHero from './TaglineHero';
import BottomNav from './BottomNav';

export default function SmartSearchPage() {
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState('search');

  const salaryStats = [
    { mainAmount: '₹31,999', subLabel: 'Avg ₹39,128' },
    { mainAmount: '₹71,999', subLabel: 'Avg ₹86,254' },
  ];

  const metrics = { usersCount: '10M+', jobsTracked: '200M+', companiesCount: '100+' };

  return (
    <div className="min-h-screen bg-[#0A0A0A] pb-24">
      <SearchBar value={query} onChange={setQuery} onFilterClick={() => {}} />
      <StatCardsRow stats={salaryStats} />
      <div className="flex justify-center py-4">
        <PillButton label="View All" onClick={() => {}} />
      </div>
      <MetricsStrip stats={metrics} />
      <TaglineHero />
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
}
