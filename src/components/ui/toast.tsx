"use client"

import * as React from "react"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Alert, AlertDescription } from "./alert"

export interface Toast {
  id: string
  title?: string
  description: string
  variant?: "default" | "success" | "error" | "warning"
  duration?: number
}

interface ToastContextType {
  toasts: Toast[]
  addToast: (toast: Omit<Toast, "id">) => void
  removeToast: (id: string) => void
}

const ToastContext = React.createContext<ToastContextType | undefined>(undefined)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<Toast[]>([])

  const addToast = React.useCallback((toast: Omit<Toast, "id">) => {
    const id = Math.random().toString(36).substring(2, 9)
    const newToast: Toast = {
      id,
      duration: 5000,
      ...toast,
    }
    setToasts((prev) => [...prev, newToast])

    if (newToast.duration && newToast.duration > 0) {
      setTimeout(() => {
        removeToast(id)
      }, newToast.duration)
    }
  }, [])

  const removeToast = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = React.useContext(ToastContext)
  if (!context) {
    // Return a no-op implementation if ToastProvider is not available
    return {
      toasts: [],
      addToast: () => {},
      removeToast: () => {},
    }
  }
  return context
}

function ToastContainer({
  toasts,
  removeToast,
}: {
  toasts: Toast[]
  removeToast: (id: string) => void
}) {
  return (
    <div
      className="fixed top-4 right-4 z-[100] flex flex-col gap-2 w-full max-w-sm pointer-events-none"
      aria-live="polite"
      aria-atomic="true"
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onRemove={removeToast} />
      ))}
    </div>
  )
}

function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: (id: string) => void }) {
  const variantStyles = {
    default: "bg-background border",
    success: "bg-green-50 border-green-200 text-green-900 dark:bg-green-950 dark:border-green-800 dark:text-green-100",
    error: "bg-red-50 border-red-200 text-red-900 dark:bg-red-950 dark:border-red-800 dark:text-red-100",
    warning: "bg-yellow-50 border-yellow-200 text-yellow-900 dark:bg-yellow-950 dark:border-yellow-800 dark:text-yellow-100",
  }

  return (
    <div
      className={cn(
        "pointer-events-auto animate-in slide-in-from-top-5 fade-in-0 duration-300 rounded-lg border p-4 shadow-lg",
        variantStyles[toast.variant || "default"]
      )}
      role="alert"
    >
      <div className="flex items-start gap-3">
        <div className="flex-1">
          {toast.title && (
            <p className="font-semibold text-sm mb-1">{toast.title}</p>
          )}
          <p className="text-sm">{toast.description}</p>
        </div>
        <button
          onClick={() => onRemove(toast.id)}
          className="rounded-md p-1 hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
          aria-label="Close notification"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
