import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/receipt')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/receipt"!</div>
}
