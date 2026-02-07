import { useState, useEffect } from "react"

const TOAST_LIMIT = 5
const TOAST_REMOVE_DELAY = 1000000

let count = 0

function generateId() {
  count = (count + 1) % Number.MAX_VALUE
  return count.toString()
}

const toastStore = {
  state: {
    toasts: [],
  },
  listeners: [],
  getState: () => toastStore.state,
  setState: (nextState) => {
    toastStore.state =
      typeof nextState === "function"
        ? nextState(toastStore.state)
        : nextState
    toastStore.listeners.forEach((listener) => listener(toastStore.state))
  },
  subscribe: (listener) => {
    toastStore.listeners.push(listener)
    return () => {
      toastStore.listeners = toastStore.listeners.filter(
        (l) => l !== listener
      )
    }
  },
}

function toast({ ...props }) {
  const id = generateId()

  const update = (props) =>
    toastStore.setState((state) => ({
      ...state,
      toasts: state.toasts.map((t) =>
        t.id === id ? { ...t, ...props } : t
      ),
    }))

  const dismiss = () =>
    toastStore.setState((state) => ({
      ...state,
      toasts: state.toasts.filter((t) => t.id !== id),
    }))

  toastStore.setState((state) => ({
    ...state,
    toasts: [
      {
        id,
        title: props.title,
        description: props.description,
        action: props.action,
        variant: props.variant || "default", // Pass variant correctly
        duration: props.duration || 5000, // Default 5s
        dismiss,
        ...props,
      },
      ...state.toasts,
    ].slice(0, TOAST_LIMIT),
  }))

  return {
    id,
    dismiss,
    update,
  }
}

function useToast() {
  const [state, setState] = useState(toastStore.getState())

  useEffect(() => {
    return toastStore.subscribe(setState)
  }, [])

  useEffect(() => {
    const timeouts = []
    state.toasts.forEach((toast) => {
      if (toast.duration === Infinity) {
        return
      }
      const timeout = setTimeout(() => {
        toast.dismiss()
      }, toast.duration)
      timeouts.push(timeout)
    })
    return () => {
      timeouts.forEach((timeout) => clearTimeout(timeout))
    }
  }, [state.toasts])

  return {
    toast,
    dismiss: (toastId) =>
      toastStore.setState((state) => ({
        ...state,
        toasts: state.toasts.filter((t) => t.id !== toastId),
      })),
    toasts: state.toasts,
  }
}

export { useToast, toast }