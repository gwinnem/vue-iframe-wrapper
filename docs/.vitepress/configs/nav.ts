import type { DefaultTheme } from 'vitepress'

export default [
  {
    text: 'Guide',
    link: '/guide/getting-started',
    activeMatch: '^/guide/',
  },
  {
    text: 'API',
    link: '/api/',
    activeMatch: '^/api/',
  },
  {
    text: 'Parameters',
    link: '/api/parameters',
  },
  {
    text: 'Security',
    link: '/security',
  },
] satisfies DefaultTheme.NavItem[]
