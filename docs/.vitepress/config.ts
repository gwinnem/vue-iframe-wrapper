import { defineConfig } from 'vitepress'
import nav from './configs/nav'
import sidebar from './configs/sidebar'

export default defineConfig({
  lang: 'en-US',
  title: 'Vue Iframe Wrapper',
  description: 'Enterprise-grade Vue 3 iframe wrapper with controlled CSS/JS injection.',
  appearance: true,
  lastUpdated: true,
  cleanUrls: true,

  // Configurable so the built site can be deployed under a sub-path (e.g. GitHub
  // Pages' <org>.github.io/<repo>/) without forking this file — set BASE at build time
  // (`BASE=/vue-iframe-wrapper/ npm run docs:build`) rather than hardcoding one.
  base: process.env.BASE || '/',

  head: [['link', { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' }]],

  markdown: {
    // Renders a line-number gutter on every fenced code block. Worth the visual
    // density here specifically because this docs site is almost entirely code
    // examples (PARAMETERS.md alone has dozens of snippets).
    lineNumbers: true,
    toc: { level: [1, 2, 3] },
  },

  themeConfig: {
    siteTitle: 'Vue Iframe Wrapper',
    logo: '/favicon.svg',
    lastUpdatedText: 'Updated',

    nav,
    sidebar,

    editLink: {
      pattern: 'https://github.com/enterprise/vue-iframe-wrapper/edit/main/docs/:path',
      text: 'Edit this page on GitHub',
    },

    socialLinks: [{ icon: 'github', link: 'https://github.com/enterprise/vue-iframe-wrapper' }],

    footer: {
      message: 'Released under the MIT License.',
      copyright: `Copyright © 2025-${new Date().getFullYear()} Geirr Winnem`,
    },
  },

  vite: {
    server: {
      host: true,
      // Only auto-open for a real interactive dev session — CI shouldn't try to
      // launch a browser window.
      open: !process.env.CI,
      port: 5174,
    },
  },
})
