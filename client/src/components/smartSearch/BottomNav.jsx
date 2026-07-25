import { Home, Tag, Search, Bell, Sparkles } from 'lucide-react';

export default function BottomNav({ activeTab, onTabChange }) {
  const tabs = [
    { key: 'home', icon: Home, label: 'Home' },
    { key: 'deals', icon: Tag, label: 'Deals' },
    { key: 'search', icon: Search, label: 'Search' },
    { key: 'alerts', icon: Bell, label: 'Alerts' },
    { key: 'insights', icon: Sparkles, label: 'Insights', badge: 'NEW' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-[#0A0A0A] border-t border-[#1A1A1C] flex justify-around py-3">
      {tabs.map(({ key, icon: Icon, label, badge }) => (
        <button
          key={key}
          onClick={() => onTabChange(key)}
          className="flex flex-col items-center gap-1 relative"
        >
          {badge && (
            <div className="absolute -top-2 right-0 bg-[#F5A623] text-white text-xs rounded-full px-1.5 py-0.5">
              {badge}
            </div>
          )}
          <Icon size={24} className={activeTab === key ? 'text-white' : 'text-[#6B6B6F]'} />
          <span className={`text-xs ${activeTab === key ? 'text-white' : 'text-[#6B6B6F]'}`}>
            {label}
          </span>
        </button>
      ))}
    </nav>
  );
}
