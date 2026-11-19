// Language-neutral links redirect to /ru or /en; see shared/site/negotiate.ts.
import { neutralRedirect } from '../shared/site/negotiate'

export function onRequest({ request, next }: { request: Request, next(): Promise<Response> }): Response | Promise<Response> {
  return neutralRedirect(request) ?? next()
}
