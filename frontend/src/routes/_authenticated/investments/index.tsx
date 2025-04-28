import { createFileRoute } from '@tanstack/react-router'
import Investments from '@/features/investments'

export const Route = createFileRoute('/_authenticated/investments/')({
  component: Investments,
})
