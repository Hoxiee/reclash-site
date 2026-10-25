// A browser, and ReClash's confirmation preview, ask for HTML and get the stand's page that links the Provider
// Preview API. Every other client keeps getting the static YAML, so the stand still imports normally.
interface Context {
  request: Request
  params: { key?: string | string[] }
  env: { ASSETS: { fetch(input: URL): Promise<Response> } }
  next(): Promise<Response>
}

function varyOnAccept(response: Response): Response {
  const result = new Response(response.body, response)
  result.headers.append('Vary', 'Accept')
  return result
}

export async function onRequestGet({ request, params, env, next }: Context): Promise<Response> {
  const key = String(params.key)
  if (/\btext\/html\b/i.test(request.headers.get('Accept') ?? '') && /^[a-z0-9-]+$/.test(key)) {
    const page = await env.ASSETS.fetch(new URL(`/mock-page/${key}`, request.url))
    if (page.ok) return varyOnAccept(page)
  }
  return varyOnAccept(await next())
}
