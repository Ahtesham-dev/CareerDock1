export default function StatCard({ mainAmount, subLabel }) {
  return (
    <div className="bg-[#1A1A1C] rounded-2xl p-4 min-w-[110px] flex flex-col items-start gap-1">
      <div className="font-bold text-lg text-white">{mainAmount}</div>
      <div className="text-sm text-[#8B8B8F]">{subLabel}</div>
    </div>
  );
}
