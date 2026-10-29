import { loadEnv, type Plugin } from 'vite'
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// Absolute-URL SEO assets (canonical, og:url, robots sitemap line, sitemap.xml)
// need the production origin. Set VITE_SITE_URL (e.g. https://flowboard.example.com).
function seo(siteUrl: string): Plugin {
  const origin = siteUrl.replace(/\/+$/, '')
  return {
    name: 'flowboard-seo',
    transformIndexHtml() {
      if (!origin) return []
      return [
        { tag: 'link', attrs: { rel: 'canonical', href: `${origin}/` }, injectTo: 'head' },
        { tag: 'meta', attrs: { property: 'og:url', content: `${origin}/` }, injectTo: 'head' },
        // Social crawlers need an absolute image URL.
        { tag: 'meta', attrs: { property: 'og:image', content: `${origin}/og-image.png` }, injectTo: 'head' },
        { tag: 'meta', attrs: { name: 'twitter:image', content: `${origin}/og-image.png` }, injectTo: 'head' },
      ]
    },
    generateBundle() {
      const robots = [
        'User-agent: *',
        'Allow: /',
        '',
        '# AI / answer-engine crawlers may read the public landing page',
        'User-agent: GPTBot',
        'User-agent: ClaudeBot',
        'User-agent: PerplexityBot',
        'User-agent: Google-Extended',
        'Allow: /',
        '',
        ...(origin ? [`Sitemap: ${origin}/sitemap.xml`] : []),
        '',
      ].join('\n')
      this.emitFile({ type: 'asset', fileName: 'robots.txt', source: robots })
      if (origin) {
        const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url><loc>${origin}/</loc><lastmod>${new Date().toISOString().slice(0, 10)}</lastmod></url>\n</urlset>\n`
        this.emitFile({ type: 'asset', fileName: 'sitemap.xml', source: sitemap })
      }
    },
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', 'VITE_')
  return {
    plugins: [react(), seo(env.VITE_SITE_URL ?? '')],
    test: {
      environment: 'jsdom',
      setupFiles: ['./src/test/setup.ts'],
      css: { include: [/.+/] },
      include: ['src/**/*.test.{ts,tsx}'],
    },
    build: {
      rollupOptions: {
        output: {
          // Separate long-lived vendor code so app changes don't bust its cache.
          manualChunks: (id: string) => {
            if (id.includes('@supabase')) return 'supabase'
            if (id.includes('node_modules/react')) return 'react'
          },
        },
      },
    },
  }
})
