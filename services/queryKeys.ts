/**
 * Stable query-key factory — keep keys hierarchical so invalidation can be
 * scoped (one pet, one list, or the whole domain).
 */
export const queryKeys = {
  root: ['ragly'] as const,
  pets: {
    all: ['ragly', 'pets'] as const,
    detail: (petId: string) => ['ragly', 'pets', petId] as const,
  },
  vaccinations: {
    all: (petId: string) => ['ragly', 'pets', petId, 'vaccinations'] as const,
    detail: (petId: string, id: string) =>
      ['ragly', 'pets', petId, 'vaccinations', id] as const,
  },
  reminders: {
    all: (petId: string) => ['ragly', 'pets', petId, 'reminders'] as const,
    tab: (petId: string, tab: string) =>
      ['ragly', 'pets', petId, 'reminders', tab] as const,
    detail: (petId: string, id: string) =>
      ['ragly', 'pets', petId, 'reminders', 'detail', id] as const,
  },
  records: {
    all: (petId: string) => ['ragly', 'pets', petId, 'records'] as const,
    status: (petId: string, status: string) =>
      ['ragly', 'pets', petId, 'records', status] as const,
    detail: (petId: string, id: string) =>
      ['ragly', 'pets', petId, 'records', 'detail', id] as const,
  },
  profile: {
    me: ['ragly', 'profile', 'me'] as const,
  },
} as const;
