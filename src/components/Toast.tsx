import { useEffect, useState } from 'react'

type ToastProps = {
  message: string
  onDone: () => void
}

export function Toast({ message, onDone }: ToastProps) {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const id = window.setTimeout(() => {
      setVisible(false)
      window.setTimeout(onDone, 250)
    }, 2400)

    return () => window.clearTimeout(id)
  }, [onDone])

  return (
    <div className={`toast ${visible ? 'toast--enter' : 'toast--exit'}`} role="status">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12" />
      </svg>
      {message}
    </div>
  )
}
