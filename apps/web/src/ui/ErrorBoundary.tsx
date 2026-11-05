import { Component, type ErrorInfo, type ReactNode } from 'react'

interface Props {
  fallback: (retry: () => void) => ReactNode
  /** Changing it clears the error, e.g. the route, so navigating away recovers. */
  resetKey?: unknown
  children: ReactNode
}

export class ErrorBoundary extends Component<Props, { failed: boolean; key: unknown }> {
  state = { failed: false, key: this.props.resetKey }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  static getDerivedStateFromProps(props: Props, state: { failed: boolean; key: unknown }) {
    return props.resetKey === state.key ? null : { failed: false, key: props.resetKey }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(error, info.componentStack)
  }

  render() {
    return this.state.failed
      ? this.props.fallback(() => this.setState({ failed: false }))
      : this.props.children
  }
}
