import type {SidebarsConfig} from '@docusaurus/plugin-content-docs';

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

/**
 * Creating a sidebar enables you to:
 - create an ordered group of docs
 - render a sidebar for each doc of that group
 - provide next/previous navigation

 The sidebars can be generated from the filesystem, or explicitly defined here.

 Create as many sidebars as you want.
 */
const sidebars: SidebarsConfig = {
  tutorialSidebar: [
    'intro',
    {
      type: 'category',
      label: '🚀 Primeiros Passos',
      items: [
        'instalacao/index',
        'conceitos-basicos/index',
      ],
    },
    {
      type: 'category', 
      label: '🎨 Interface e Componentes',
      items: [
        'componentes/index',
      ],
    },
    {
      type: 'category',
      label: '🔧 Funcionalidades Avançadas',
      items: [
        'backend-embebido/index',
        'configuracao/index',
        'cross-platform/index',
        'requisicoes-http/index',
        'midia/index',
      ],
    },
    {
      type: 'category',
      label: '💼 Exemplos Práticos',
      items: [
        'exemplos-avancados/index',
      ],
    },
  ],
};

export default sidebars;
