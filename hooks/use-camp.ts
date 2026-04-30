'use client'

import { useEffect, useState } from 'react'

export function useActiveCampId(): string | null {
  const [campId, setCampId] = useState<string | null>(null)

  useEffect(() => {
    const match = document.cookie.match(/active_camp_id=([^;]+)/)
    if (match) setCampId(match[1])
  }, [])

  return campId
}
