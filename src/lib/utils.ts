import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(date))
}

export function formatRelativeTime(date: string | Date) {
  const now = new Date()
  const d = new Date(date)
  const diffMs = now.getTime() - d.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return formatDate(date)
}

export function getStatusColor(status: string) {
  const colors: Record<string, string> = {
    new: 'bg-surface-100 text-surface-600 dark:bg-surface-800 dark:text-surface-400',
    contacted: 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    replied: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    meeting_booked: 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    closed: 'bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    unqualified: 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    draft: 'bg-surface-100 text-surface-600 dark:bg-surface-800 dark:text-surface-400',
    active: 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    paused: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    completed: 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  }
  return colors[status] || colors.new
}

export function getStatusLabel(status: string) {
  const labels: Record<string, string> = {
    new: 'New',
    contacted: 'Contacted',
    replied: 'Replied',
    meeting_booked: 'Meeting Booked',
    closed: 'Closed',
    unqualified: 'Unqualified',
  }
  return labels[status] || status
}

export function calculateConversionRate(meetings: number, total: number) {
  if (total === 0) return 0
  return Math.round((meetings / total) * 100 * 10) / 10
}
