import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';

export const baseOptions: BaseLayoutProps = {
  nav: {
    title: 'Mirror Agent',
  },
  links: [
    {
      text: 'Documentation',
      url: '/docs',
      active: 'nested-url',
    },
    {
      text: 'Feuille de Route (RFCs)',
      url: '/docs/roadmap',
      active: 'nested-url',
    },
    {
      text: 'GitHub',
      url: 'https://github.com/brandonviry/mirror-agent',
      external: true,
    },
  ],
};
