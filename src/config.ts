export const SITE = {
  name: 'Meu IP',
  url: import.meta.env.PUBLIC_SITE_URL ?? 'http://localhost:4321',
  locale: 'pt-BR',
  author: 'Adryan Freitas',
  twitterHandle: '@adryanfreitas',
  dpoEmail: import.meta.env.PUBLIC_DPO_EMAIL ?? 'contato@adryanfreitas.dev',
} as const;

export const ADSENSE = {
  clientId: import.meta.env.PUBLIC_ADSENSE_CLIENT_ID ?? '',
  fundingChoicesId: import.meta.env.PUBLIC_FUNDING_CHOICES_ID ?? '',
  slots: {
    hero: import.meta.env.PUBLIC_ADSENSE_SLOT_HERO ?? '',
    inArticle: import.meta.env.PUBLIC_ADSENSE_SLOT_INARTICLE ?? '',
    footer: import.meta.env.PUBLIC_ADSENSE_SLOT_FOOTER ?? '',
  },
} as const;

function originOf(url: string): string {
  try {
    return new URL(url).origin;
  } catch {
    return '';
  }
}

const ipv4Url = import.meta.env.PUBLIC_API_IPV4_URL ?? 'http://localhost:4321/api/ip';
const ipv6Url = import.meta.env.PUBLIC_API_IPV6_URL ?? 'http://localhost:4321/api/ip';

export const API_ENDPOINTS = {
  ipv4: ipv4Url,
  ipv6: ipv6Url,
} as const;

export const ALLOWED_ORIGINS: readonly string[] = Array.from(
  new Set([originOf(SITE.url), originOf(ipv4Url), originOf(ipv6Url)].filter(Boolean)),
);

export type ApiEndpoint = (typeof API_ENDPOINTS)[keyof typeof API_ENDPOINTS];
