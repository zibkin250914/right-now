"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, X } from "lucide-react"
import type { Channel } from "@/app/page"

interface SearchBarProps {
  activeChannel: Channel
  onSearch: (query: string, channel: Channel) => void
  onClear: () => void
  isSearching: boolean
}

export function SearchBar({ activeChannel, onSearch, onClear, isSearching }: SearchBarProps) {
  const [query, setQuery] = useState("")
  const [debouncedQuery, setDebouncedQuery] = useState("")

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query)
    }, 300)

    return () => clearTimeout(timer)
  }, [query])

  // Trigger search when debounced query changes
  useEffect(() => {
    if (debouncedQuery.trim()) {
      onSearch(debouncedQuery, activeChannel)
    } else {
      onClear()
    }
  }, [debouncedQuery, activeChannel])

  const handleClear = () => {
    setQuery("")
    setDebouncedQuery("")
    onClear()
  }

  return (
    <div className="px-2 sm:px-4 py-3 border-b border-border bg-background">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder={`${activeChannel}에서 검색...`}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-10 pr-10 text-sm sm:text-base"
          disabled={isSearching}
        />
        {query && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7 sm:h-8 sm:w-8 p-0"
          >
            <X className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          </Button>
        )}
      </div>
      {isSearching && (
        <div className="flex items-center gap-2 mt-2 text-xs sm:text-sm text-muted-foreground">
          <div className="animate-spin rounded-full h-3 w-3 border-b border-primary"></div>
          검색 중...
        </div>
      )}
    </div>
  )
}
