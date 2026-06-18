import { promises as dns } from 'node:dns';
import type { APIRoute } from 'astro';
import { ALLOWED_ORIGINS } from '../../config';

export const prerender = false;
export const runtime = 'nodejs';

const IPV4_REGEX = /^(?:\d{1,3}\.){3}\d{1,3}$/;
const IPV4_MAPPED_PREFIX = '::ffff:';
const PTR_TIMEOUT_MS = 2000;

const STATIC_CORS_HEADERS: HeadersInit = {
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Max-Age': '86400',
  Vary: 'Origin',
};

function buildCorsHeaders(request: Request): HeadersInit {
  const origin = request.headers.get('origin');
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    return {
      ...STATIC_CORS_HEADERS,
      'Access-Control-Allow-Origin': origin,
    };
  }
  return STATIC_CORS_HEADERS;
}

function buildResponseHeaders(request: Request): HeadersInit {
  return {
    ...buildCorsHeaders(request),
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store, no-cache, must-revalidate',
  };
}

function extractClientIp(request: Request): string | null {
  const cfIp = request.headers.get('cf-connecting-ip');
  if (cfIp) {
    const trimmed = cfIp.trim();
    if (trimmed) return trimmed;
  }

  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    const first = forwarded.split(',')[0]?.trim();
    if (first) return first;
  }

  const real = request.headers.get('x-real-ip');
  if (real) {
    const trimmed = real.trim();
    if (trimmed) return trimmed;
  }

  const devSocket = (request as Request & { socket?: { remoteAddress?: string | null } }).socket
    ?.remoteAddress;
  if (devSocket) {
    return devSocket.replace(/^::ffff:/, '');
  }

  if (import.meta.env.DEV) {
    return '127.0.0.1';
  }

  return null;
}

function stripIpv4MappedPrefix(ip: string): string {
  return ip.toLowerCase().startsWith(IPV4_MAPPED_PREFIX) ? ip.slice(IPV4_MAPPED_PREFIX.length) : ip;
}

function isValidIp(ip: string): boolean {
  if (IPV4_REGEX.test(ip)) return true;
  if (ip.includes(':')) return true;
  return false;
}

async function reverseDnsWithTimeout(ip: string): Promise<string | null> {
  let timer: NodeJS.Timeout | undefined;
  try {
    const timeout = new Promise<null>((resolve) => {
      timer = setTimeout(() => resolve(null), PTR_TIMEOUT_MS);
    });
    const lookup = dns.reverse(ip).then((hostnames: string[]) => hostnames[0] ?? null);
    return await Promise.race([lookup, timeout]);
  } catch {
    return null;
  } finally {
    if (timer) clearTimeout(timer);
  }
}

function jsonResponse(request: Request, body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: buildResponseHeaders(request),
  });
}

export const OPTIONS: APIRoute = ({ request }) => {
  return new Response(null, {
    status: 204,
    headers: buildCorsHeaders(request),
  });
};

export const GET: APIRoute = async ({ request }) => {
  const rawIp = extractClientIp(request);
  if (!rawIp) {
    return jsonResponse(request, { error: 'Não foi possível determinar o IP do cliente.' }, 400);
  }

  const ip = stripIpv4MappedPrefix(rawIp);
  if (!isValidIp(ip)) {
    return jsonResponse(request, { error: 'Endereço IP inválido.' }, 400);
  }

  const hostname = await reverseDnsWithTimeout(ip);

  return jsonResponse(request, { ip, hostname });
};
