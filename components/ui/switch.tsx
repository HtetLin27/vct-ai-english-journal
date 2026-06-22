"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

interface SwitchProps {
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  disabled?: boolean
  id?: string
  "aria-label"?: string
  "aria-labelledby"?: string
}

export const Switch = React.forwardRef<HTMLButtonElement, SwitchProps>(
  function Switch(
    { checked, onCheckedChange, disabled, id, ...aria },
    ref
  ) {
    return (
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        id={id}
        ref={ref}
        disabled={disabled}
        onClick={() => onCheckedChange(!checked)}
        className={cn(
          "inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full border border-white/70 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50",
          checked ? "bg-primary" : "bg-[#c7d5da]"
        )}
        {...aria}
      >
        <span
          aria-hidden
          className={cn(
            "pointer-events-none block h-5 w-5 rounded-full bg-white shadow-[0_8px_18px_-10px_rgba(23,50,77,0.65)] ring-0 transition-transform",
            checked ? "translate-x-6" : "translate-x-1"
          )}
        />
      </button>
    )
  }
)
