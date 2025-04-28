import { createFileRoute } from '@tanstack/react-router'
import Finances from '@/features/finances'

export const Route = createFileRoute('/_authenticated/finances/')({
  component: Finances,
})
