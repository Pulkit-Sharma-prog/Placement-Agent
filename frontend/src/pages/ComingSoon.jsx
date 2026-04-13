export default function ComingSoon({ page }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
      <div className="text-6xl mb-4">🚧</div>
      <h1 className="text-2xl font-bold text-slate-700 mb-2">{page}</h1>
      <p className="text-slate-400">This page is coming soon.</p>
    </div>
  )
}
