import { stringifyYaml } from './yaml.ts'

// Deployment snippets. The Remnawave rule, the GLOBAL group and the tun list follow the rollout and
// policy guides in content/docs/*/providers; only the manifest URL and the package list are filled in.
export const exampleManifestUrl = 'https://example.net/reclash.yaml'

export const headerLine = (url: string) => `reclash-config: ${url}`

export const nginxSnippet = (url: string) => `add_header reclash-config "${url.replace(/["\\]/g, '\\$&')}" always;`

export const caddySnippet = (url: string) => `header reclash-config "${url.replace(/["\\]/g, '\\$&')}"`

export const remnawaveRule = (url: string) => `{
  "name": "ReClash",
  "description": "Mihomo config and manifest for ReClash",
  "enabled": true,
  "operator": "AND",
  "conditions": [
    { "headerName": "user-agent", "operator": "STARTS_WITH", "value": "reclash", "caseSensitive": false }
  ],
  "responseType": "MIHOMO",
  "responseModifications": {
    "applyHeadersToEnd": true,
    "headers": [
      { "key": "reclash-config", "value": ${JSON.stringify(url)} }
    ]
  }
}`

export const defaultGlobalFilter = '\\bLTE\\b'

export function globalGroup(filter: string, remnawave: boolean): string {
  const lines = [
    'proxy-groups:',
    '  - name: GLOBAL',
    '    type: select',
    '    include-all-proxies: true',
    `    filter: '${(filter || defaultGlobalFilter).replace(/'/g, '\'\'')}'`,
  ]
  if (remnawave) lines.push('    remnawave: { include-proxies: false }')
  return `${lines.join('\n')}\n`
}

export const tunExclusions = (packages: string[]) => stringifyYaml({ tun: { 'exclude-package': packages } })

export function isHttpsUrl(value: string): boolean {
  try { return new URL(value).protocol === 'https:' } catch { return false }
}
