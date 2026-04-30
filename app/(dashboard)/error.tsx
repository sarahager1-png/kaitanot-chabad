'use client'

export default function DashboardError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 p-8" dir="rtl">
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 max-w-2xl w-full">
        <h2 className="text-lg font-bold text-red-700 mb-2">שגיאת שרת</h2>
        <pre className="text-xs text-red-600 whitespace-pre-wrap break-all bg-red-100 rounded p-3">
          {error.message}
          {'\n\n'}
          {error.stack}
        </pre>
        {error.digest && <p className="text-xs text-red-400 mt-2">Digest: {error.digest}</p>}
      </div>
      <button onClick={reset} className="px-4 py-2 bg-[#333654] text-white rounded-lg text-sm font-bold">
        נסה שוב
      </button>
    </div>
  )
}
