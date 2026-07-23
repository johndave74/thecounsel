import * as React from 'react'
import { useQuery } from '@tanstack/react-query'
import { searchService } from '@/features/search/services/search.service'

/** Debounce a fast-changing value. */
export function useDebounced<T>(value: T, delay = 200): T {
  const [debounced, setDebounced] = React.useState(value)
  React.useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return debounced
}

export function useGlobalSearch(organizationId: string | null, query: string) {
  const debounced = useDebounced(query, 200)
  return useQuery({
    queryKey: ['global-search', organizationId, debounced],
    enabled: Boolean(organizationId) && debounced.trim().length >= 2,
    queryFn: () => searchService.global(organizationId!, debounced),
    placeholderData: (prev) => prev,
  })
}
