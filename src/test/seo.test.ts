// Regression tests for the SEO / GEO / performance fixes.
import { describe, it, expect } from 'vitest'
import html from '../../index.html?raw'
import vercelRaw from '../../vercel.json?raw'

const doc = new DOMParser().parseFromString(html, 'text/html')
const meta = (sel: string) => doc.head.querySelector(sel)?.getAttribute('content') ?? ''

describe('index.html', () => {
  it('declares language and viewport', () => {
    expect(doc.documentElement.lang).toBe('en')
    expect(meta('meta[name="viewport"]')).toContain('width=device-width')
  })

  it('has a descriptive title and meta description of sensible length', () => {
    expect(doc.title.length).toBeGreaterThan(10)
    expect(doc.title.length).toBeLessThanOrEqual(65)
    expect(doc.title).toMatch(/FlowBoard/)
    const d = meta('meta[name="description"]')
    expect(d.length).toBeGreaterThanOrEqual(70)
    expect(d.length).toBeLessThanOrEqual(170)
  })

  it('has Open Graph and Twitter large-image tags', () => {
    expect(meta('meta[property="og:type"]')).toBe('website')
    expect(meta('meta[property="og:site_name"]')).toBe('FlowBoard')
    expect(meta('meta[property="og:title"]')).not.toBe('')
    expect(meta('meta[property="og:description"]')).not.toBe('')
    expect(meta('meta[property="og:image:width"]')).toBe('1200')
    expect(meta('meta[property="og:image:height"]')).toBe('630')
    expect(meta('meta[property="og:image:alt"]')).not.toBe('')
    expect(meta('meta[name="twitter:card"]')).toBe('summary_large_image')
    expect(meta('meta[name="twitter:title"]')).not.toBe('')
    expect(meta('meta[name="twitter:image:alt"]')).not.toBe('')
  })

  it('has a favicon and theme colour', () => {
    expect(doc.head.querySelector('link[rel="icon"]')?.getAttribute('href')).toBe('/favicon.svg')
    expect(meta('meta[name="theme-color"]')).toMatch(/^#[0-9a-f]{6}$/i)
  })

  it('has valid WebApplication structured data (GEO)', () => {
    const json = JSON.parse(doc.head.querySelector('script[type="application/ld+json"]')!.textContent!)
    expect(json['@context']).toBe('https://schema.org')
    expect(json['@type']).toBe('WebApplication')
    expect(json.name).toBe('FlowBoard')
    expect(json.description).not.toBe('')
  })

  it('has crawlable <noscript> content with a heading', () => {
    const body = html.slice(html.indexOf('<noscript>'), html.indexOf('</noscript>'))
    expect(body).toMatch(/<main[\s\S]*<h1>FlowBoard<\/h1>/)
  })

  it('keeps the theme script and does not use inline event handlers (CSP)', () => {
    expect(html).toContain('/theme-init.js')
    expect(html).not.toMatch(/\son(load|click|error)=/i)
  })
})

describe('public assets', () => {
  const files = import.meta.glob('/public/*', { query: '?url', eager: true })
  it.each(['favicon.svg', 'og-image.png', 'llms.txt', 'theme-init.js'])('ships %s', (name) => {
    expect(Object.keys(files)).toContain(`/public/${name}`)
  })
})

describe('vercel.json', () => {
  const config = JSON.parse(vercelRaw) as {
    buildCommand?: string
    headers: { source: string; headers: { key: string; value: string }[] }[]
  }
  const headerFor = (source: string, key: string) => config.headers.find((h) => h.source === source)?.headers.find((h) => h.key === key)?.value

  it('runs the tests before every build so a failing test blocks deploys', () => {
    expect(config.buildCommand).toMatch(/npm test.*&&.*npm run build/)
  })

  it('caches hashed assets for a year and revalidates robots/sitemap hourly', () => {
    expect(headerFor('/assets/(.*)', 'Cache-Control')).toBe('public, max-age=31536000, immutable')
    expect(headerFor('/(robots.txt|sitemap.xml|llms.txt)', 'Cache-Control')).toMatch(/max-age=3600/)
  })

  it('still ships the security headers', () => {
    expect(headerFor('/(.*)', 'Content-Security-Policy')).toContain("default-src 'self'")
    expect(headerFor('/(.*)', 'X-Content-Type-Options')).toBe('nosniff')
  })
})
