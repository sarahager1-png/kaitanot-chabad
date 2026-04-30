'use client'

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="he" dir="rtl">
      <body style={{fontFamily:'sans-serif',padding:'2rem',background:'#fef2f2'}}>
        <h2 style={{color:'#b91c1c',marginBottom:'1rem'}}>שגיאת שרת קריטית</h2>
        <pre style={{background:'#fee2e2',padding:'1rem',borderRadius:'8px',fontSize:'12px',whiteSpace:'pre-wrap',wordBreak:'break-all',color:'#991b1b'}}>
          {error.message}
          {'\n\n'}
          {error.stack}
        </pre>
        {error.digest && <p style={{color:'#9ca3af',fontSize:'11px',marginTop:'8px'}}>Digest: {error.digest}</p>}
        <button onClick={reset} style={{marginTop:'1rem',padding:'8px 16px',background:'#333654',color:'white',border:'none',borderRadius:'8px',cursor:'pointer'}}>
          נסה שוב
        </button>
      </body>
    </html>
  )
}
