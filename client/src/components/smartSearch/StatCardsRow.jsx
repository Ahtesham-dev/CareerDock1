import StatCard from './StatCard';

export default function StatCardsRow({ stats }) {
  return (
    <div className="flex gap-3 overflow-x-auto px-4 py-4 scrollbar-hide">
      {stats.map((stat, index) => (
        <StatCard key={index} mainAmount={stat.mainAmount} subLabel={stat.subLabel} />
      ))}
    </div>
  );
}
