'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Plus, Trash2 } from 'lucide-react'
import type { Track } from '@/lib/types'

interface TrackManagerProps {
  tracks: Omit<Track, 'id' | 'camp_id' | 'created_at'>[]
  onChange: (tracks: Omit<Track, 'id' | 'camp_id' | 'created_at'>[]) => void
}

export function TrackManager({ tracks, onChange }: TrackManagerProps) {
  const [newName, setNewName] = useState('')
  const [newPrice, setNewPrice] = useState('')

  function addTrack() {
    if (!newName.trim()) return
    onChange([...tracks, { name: newName.trim(), description: null, price: Number(newPrice) || 0 }])
    setNewName('')
    setNewPrice('')
  }

  function removeTrack(index: number) {
    onChange(tracks.filter((_, i) => i !== index))
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        {tracks.map((track, i) => (
          <Badge key={i} variant="secondary" className="flex items-center gap-1.5 px-3 py-1.5 text-sm">
            {track.name}
            {track.price > 0 && <span className="text-muted-foreground">₪{track.price}</span>}
            <button onClick={() => removeTrack(i)} className="hover:text-destructive">
              <Trash2 className="h-3 w-3" />
            </button>
          </Badge>
        ))}
        {tracks.length === 0 && (
          <span className="text-sm text-muted-foreground">אין מסלולים — הוסף מסלול ראשון</span>
        )}
      </div>
      <div className="flex gap-2">
        <Input
          placeholder="שם מסלול (בוקר, אחה״צ...)"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTrack())}
          className="flex-1"
        />
        <Input
          placeholder="מחיר ₪"
          type="number"
          value={newPrice}
          onChange={(e) => setNewPrice(e.target.value)}
          className="w-28"
        />
        <Button type="button" variant="outline" size="icon" onClick={addTrack}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
