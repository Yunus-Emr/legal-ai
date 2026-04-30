import { create } from 'zustand'

export type ProcessingStage =
  | 'idle'
  | 'uploading'
  | 'parsing'
  | 'chunking'
  | 'embedding'
  | 'indexing'
  | 'done'
  | 'error'

export interface ProcessingJob {
  docId: string
  filename: string
  stage: ProcessingStage
  progress: number        // 0-100
  chunkCount?: number
  error?: string
  startedAt: Date
}

interface ProcessingState {
  jobs: Record<string, ProcessingJob>
  addJob: (docId: string, filename: string) => void
  updateJob: (docId: string, update: Partial<ProcessingJob>) => void
  removeJob: (docId: string) => void
  clearDone: () => void
}

export const useProcessingStore = create<ProcessingState>((set) => ({
  jobs: {},

  addJob: (docId, filename) =>
    set((s) => ({
      jobs: {
        ...s.jobs,
        [docId]: {
          docId,
          filename,
          stage: 'uploading',
          progress: 0,
          startedAt: new Date(),
        },
      },
    })),

  updateJob: (docId, update) =>
    set((s) => ({
      jobs: s.jobs[docId]
        ? { ...s.jobs, [docId]: { ...s.jobs[docId], ...update } }
        : s.jobs,
    })),

  removeJob: (docId) =>
    set((s) => {
      const next = { ...s.jobs }
      delete next[docId]
      return { jobs: next }
    }),

  clearDone: () =>
    set((s) => ({
      jobs: Object.fromEntries(
        Object.entries(s.jobs).filter(([, j]) => j.stage !== 'done'),
      ),
    })),
}))
