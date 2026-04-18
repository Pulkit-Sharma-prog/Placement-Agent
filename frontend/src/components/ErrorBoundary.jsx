import { Component } from 'react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    // eslint-disable-next-line no-console
    console.error('App crashed:', error, info)
  }

  handleReload = () => {
    this.setState({ error: null })
    window.location.reload()
  }

  render() {
    if (!this.state.error) return this.props.children

    return (
      <div
        className="min-h-screen flex items-center justify-center p-6"
        style={{ background: 'var(--bg-base)', color: 'var(--text-primary)' }}
      >
        <div
          className="max-w-md w-full p-6 rounded-[14px]"
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
          }}
        >
          <h1 className="text-[20px] font-semibold mb-2" style={{ letterSpacing: '-0.022em' }}>
            Something went wrong
          </h1>
          <p className="text-[14px] mb-5" style={{ color: 'var(--text-secondary)' }}>
            The app hit an unexpected error. Reload to start fresh.
          </p>
          {this.state.error?.message && (
            <pre
              className="text-[12px] p-3 rounded-[8px] mb-5 overflow-auto"
              style={{
                background: 'var(--bg-elevated)',
                color: 'var(--system-red)',
                fontFamily: 'var(--font-mono)',
                maxHeight: 160,
              }}
            >
              {this.state.error.message}
            </pre>
          )}
          <button onClick={this.handleReload} className="btn-aurora w-full">
            Reload app
          </button>
        </div>
      </div>
    )
  }
}
