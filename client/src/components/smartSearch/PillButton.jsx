export default function PillButton({ label, onClick }) {
  return (
    <button
      onClick={onClick}
      className="block mx-auto max-w-[220px] bg-[#6C5CE7] hover:bg-[#5A4BD1] text-white font-semibold rounded-full px-8 py-3 transition-colors"
    >
      {label}
    </button>
  );
}
