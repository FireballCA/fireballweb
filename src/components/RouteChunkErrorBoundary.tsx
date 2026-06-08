import { Component, type ErrorInfo, type ReactNode } from 'react'
import { isChunkLoadError, reloadForStaleChunks } from '@/utils/chunkLoadRecovery'

type Props = { children: ReactNode }

type State = { hasError: boolean }

export class RouteChunkErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: Error, _info: ErrorInfo): void {
    if (isChunkLoadError(error)) {
      reloadForStaleChunks()
    }
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-[40vh] items-center justify-center bg-[#111111] px-6">
          <p className="text-sm text-white/70">Mise à jour du site en cours…</p>
        </div>
      )
    }
    return this.props.children
  }
}
