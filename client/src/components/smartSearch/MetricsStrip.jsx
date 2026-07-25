import { Users, PiggyBank, Building2 } from 'lucide-react';

export default function MetricsStrip({ stats }) {
  return (
    <div className="flex justify-around items-center px-4 py-6">
      <div className="flex flex-col items-center gap-2">
        <div className="w-14 h-14 rounded-full bg-[#1A1A1C] flex items-center justify-center">
          <Users size={24} className="text-white" />
        </div>
        <div className="font-bold text-xl text-white">{stats.usersCount}</div>
        <div className="text-sm text-[#8B8B8F]">Users</div>
      </div>
      <div className="flex flex-col items-center gap-2">
        <div className="w-14 h-14 rounded-full bg-[#1A1A1C] flex items-center justify-center">
          <PiggyBank size={24} className="text-white" />
        </div>
        <div className="font-bold text-xl text-white">{stats.jobsTracked}</div>
        <div className="text-sm text-[#8B8B8F]">Jobs Tracked</div>
      </div>
      <div className="flex flex-col items-center gap-2">
        <div className="w-14 h-14 rounded-full bg-[#1A1A1C] flex items-center justify-center">
          <Building2 size={24} className="text-white" />
        </div>
        <div className="font-bold text-xl text-white">{stats.companiesCount}</div>
        <div className="text-sm text-[#8B8B8F]">Companies</div>
      </div>
    </div>
  );
}
