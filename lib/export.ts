import * as XLSX from 'xlsx'

export function exportToExcel(data: Record<string, unknown>[], filename: string, sheetName = 'נתונים') {
  const ws = XLSX.utils.json_to_sheet(data)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, sheetName)
  XLSX.writeFile(wb, `${filename}.xlsx`)
}

export function printDataCard(title: string, data: Record<string, string>) {
  const rows = Object.entries(data)
    .filter(([, v]) => v && v !== '—')
    .map(([k, v]) => `<tr><th>${k}</th><td>${v}</td></tr>`)
    .join('')
  const win = window.open('', '_blank')
  if (!win) return
  win.document.write(`
    <html dir="rtl"><head>
      <title>${title}</title>
      <meta charset="UTF-8"/>
      <style>
        body { font-family: Arial, sans-serif; padding: 20px; direction: rtl; max-width: 500px; margin: 0 auto; }
        h1 { font-size: 16px; margin-bottom: 12px; border-bottom: 2px solid #333654; padding-bottom: 8px; color: #333654; }
        table { width: 100%; border-collapse: collapse; font-size: 12px; }
        th { background: #f5f5f3; font-weight: bold; padding: 6px 10px; text-align: right; border: 1px solid #ddd; width: 40%; }
        td { padding: 6px 10px; text-align: right; border: 1px solid #ddd; }
        tr:nth-child(even) td { background: #fafafa; }
        @media print { body { padding: 0; } }
      </style>
    </head><body>
      <h1>${title}</h1>
      <table>${rows}</table>
    </body></html>
  `)
  win.document.close()
  win.focus()
  setTimeout(() => { win.print(); win.close() }, 300)
}

export function exportToPrint(elementId: string, title: string) {
  const el = document.getElementById(elementId)
  if (!el) return
  const win = window.open('', '_blank')
  if (!win) return
  win.document.write(`
    <html dir="rtl"><head>
      <title>${title}</title>
      <meta charset="UTF-8"/>
      <style>
        body { font-family: Arial, sans-serif; padding: 20px; direction: rtl; }
        h1 { font-size: 18px; margin-bottom: 16px; }
        table { width: 100%; border-collapse: collapse; font-size: 12px; }
        th, td { border: 1px solid #ddd; padding: 6px 10px; text-align: right; }
        th { background: #f0f0f0; font-weight: bold; }
        tr:nth-child(even) { background: #fafafa; }
        @media print { body { padding: 0; } }
      </style>
    </head><body>
      <h1>${title}</h1>
      ${el.innerHTML}
    </body></html>
  `)
  win.document.close()
  win.focus()
  setTimeout(() => { win.print(); win.close() }, 300)
}
