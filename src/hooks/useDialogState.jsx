import { useState } from "react"

export default function useDialogState(initialState = null) {
  const [open, _setOpen] = useState(initialState)

  const setOpen = (value) => {
    _setOpen((prev) => (prev === value ? null : value))
  }

  return [open, setOpen]
}
