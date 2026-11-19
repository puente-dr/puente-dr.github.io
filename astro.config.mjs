// Puente documentation — https://puente-dr.github.io/docs/
//
// Built with Astro Starlight. `npm run build` writes the site, then
// tools/assemble-pages.mjs places it under /docs/ for GitHub Pages together
// with the root redirect and the one legacy URL that must keep working.
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

const group = (en, es, items) => ({ label: en, translations: { es }, items });
const link = (slug, en, es) => ({ slug, label: en, translations: { es } });

export default defineConfig({
  site: 'https://puente-dr.github.io',
  base: '/docs',
  trailingSlash: 'always',
  integrations: [
    starlight({
      title: { en: 'Puente Docs', es: 'Docs de Puente' },
      description: 'How to use Puente Collect and Puente Manage.',
      logo: { src: './src/assets/puente-mark.svg', alt: 'Puente' },
      favicon: '/favicon.svg',
      defaultLocale: 'root',
      locales: {
        root: { label: 'English', lang: 'en' },
        es: { label: 'Español', lang: 'es' },
      },
      lastUpdated: true,
      pagination: true,
      customCss: ['./src/styles/puente.css'],
      social: [{ icon: 'email', label: 'Contact support', href: 'mailto:info@puente-dr.org' }],
      components: {
        PageTitle: './src/components/PageTitle.astro',
        Footer: './src/components/Footer.astro',
      },
      sidebar: [
        group('Get started', 'Primeros pasos', [
          link('get-started/welcome', 'Welcome to Puente', 'Bienvenida a Puente'),
          link('get-started/data-collectors', 'Start here: data collectors', 'Empieza aquí: recolectores de datos'),
          link('get-started/data-managers', 'Start here: data managers', 'Empieza aquí: responsables de datos'),
          link('get-started/glossary', 'Glossary', 'Glosario'),
        ]),
        group('Puente Collect', 'Puente Collect', [
          link('collect/install-and-sign-in', 'Install and sign in', 'Instalar y entrar'),
          link('collect/getting-around', 'Getting around', 'Cómo moverte en la aplicación'),
          link('collect/find-records', 'Find records', 'Buscar registros'),
          link('collect/resident-id-and-households', 'Resident ID and households', 'Identificación de residente y hogares'),
          link('collect/puente-forms', 'Puente forms', 'Formularios de Puente'),
          link('collect/custom-forms', 'Custom forms', 'Formularios personalizados'),
          link('collect/consent', 'Consent', 'Consentimiento'),
          link('collect/offline-sync', 'Working offline', 'Trabajar sin conexión'),
          link('collect/settings', 'Settings', 'Configuración'),
        ]),
        group('Puente Manage', 'Puente Manage', [
          link('manage/sign-in', 'Sign in to Manage', 'Entrar a Manage'),
          link('manage/review', 'Review dashboard', 'Panel Revisar'),
          link('manage/form-manager', 'Form Manager', 'Gestor de formularios'),
          link('manage/form-creator', 'Form Creator', 'Creador de formularios'),
          link('manage/data-curation', 'Data Curation', 'Curación de datos'),
          link('manage/form-marketplace', 'Form Marketplace', 'Mercado de formularios'),
          link('manage/account-settings', 'Account settings', 'Configuración de la cuenta'),
        ]),
        group('Organizations and people', 'Organizaciones y personas', [
          link('organizations/organizations', 'Organizations', 'Organizaciones'),
          link('organizations/members-and-administrators', 'Members and administrators', 'Miembros y administradores'),
          link('organizations/nicknames', 'Organization nicknames', 'Apodos de la organización'),
        ]),
        group('Data and exports', 'Datos y exportaciones', [
          link('data/exporting-data', 'Exporting data', 'Exportar datos'),
          link('data/reading-export-files', 'Reading export files', 'Leer los archivos exportados'),
          link('data/research-exports', 'Research exports', 'Exportaciones para investigación'),
        ]),
        group('Privacy and security', 'Privacidad y seguridad', [
          link('privacy/protecting-data', "Protecting people's data", 'Proteger los datos de las personas'),
          link('privacy/delete-your-account', 'Delete your account or data', 'Eliminar tu cuenta o tus datos'),
        ]),
        group('Help', 'Ayuda', [
          link('help/troubleshooting', 'Troubleshooting', 'Solución de problemas'),
          link('help/contact-support', 'Contact support', 'Contactar a soporte'),
        ]),
        link('guides', 'Guides', 'Guías'),
      ],
    }),
  ],
});
