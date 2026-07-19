import type { DefaultTheme } from 'vitepress'

function getGuideSidebar(): DefaultTheme.SidebarItem {
  return {
    text: 'Guide',
    items: [
      { text: 'Getting Started', link: '/guide/getting-started' },
      { text: 'Examples', link: '/guide/examples' },
      { text: 'Testing', link: '/guide/testing' },
      { text: 'Visual Regression', link: '/guide/visual-regression' },
      { text: 'Telemetry Integration', link: '/guide/telemetry' },
      { text: 'Vue Devtools', link: '/guide/devtools' },
      { text: 'SSR / Nuxt', link: '/guide/ssr' },
    ],
  }
}

function getReferenceSidebar(): DefaultTheme.SidebarItem {
  return {
    text: 'Reference',
    items: [
      { text: 'API', link: '/api/' },
      { text: 'Parameters', link: '/api/parameters' },
      { text: 'HTML iframe Reference', link: '/html-iframe-element' },
      { text: 'Security', link: '/security' },
      { text: 'Browser Support', link: '/browser-support' },
      { text: 'Versioning & Deprecation', link: '/versioning' },
      { text: 'Accessibility', link: '/accessibility' },
      { text: 'Feature Recommendations', link: '/feature-recommendations' },
      { text: 'Enterprise Readiness', link: '/enterprise-readiness' },
    ],
  }
}

// Kept as a single flat array applied to every page, rather than a path-keyed object
// (`{ '/guide/': [...], '/api/': [...] }`) — this project's reference pages
// (/security, /browser-support, /versioning, etc.) live at the URL root, not under a
// shared prefix, so there's no path to key them off without first moving them under
// e.g. /reference/. That's a real restructuring (renamed URLs, updated cross-links
// throughout every doc page) rather than a config-file change, and hasn't been done.
export default [getGuideSidebar(), getReferenceSidebar()] satisfies DefaultTheme.Sidebar
