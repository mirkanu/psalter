'use client'
import { useEffect } from "react"
import { getDayOfYear } from "@/lib/daily"

export function DailyPlanClient() {
  useEffect(() => {
    const today = getDayOfYear()
    const el = document.querySelector<HTMLElement>(`[data-day="${today}"]`)
    if (!el) return
    el.setAttribute("data-today", "")
    const badge = el.querySelector<HTMLElement>(".today-badge")
    if (badge) badge.classList.remove("hidden")
    el.scrollIntoView({ behavior: "smooth", block: "center" })
  }, [])
  return null
}
