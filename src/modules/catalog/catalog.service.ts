import { Injectable, InternalServerErrorException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { MediaStatus } from '@prisma/client';
import { PrismaService } from '../../common/database/prisma.service.js';
import { ListMediaQueryDto } from './dto/list-media-query.dto.js';

const catalogSelect = {
  id: true,
  slug: true,
  title: true,
  synopsis: true,
  type: true,
  posterUrl: true,
  backdropUrl: true,
  durationSec: true,
} as const;

const playbackLifetimeMs = 5 * 60 * 1000;

interface PlaybackTokenPayload {
  exp: number;
  slug: string;
}

@Injectable()
export class CatalogService {
  constructor(private readonly prisma: PrismaService) {}

  list(query: ListMediaQueryDto) {
    return this.prisma.media.findMany({
      where: {
        status: MediaStatus.PUBLISHED,
        type: query.type,
        title: query.search ? { contains: query.search, mode: 'insensitive' } : undefined,
      },
      select: catalogSelect,
      orderBy: { createdAt: 'desc' },
    });
  }

  async getBySlug(slug: string) {
    const media = await this.prisma.media.findFirst({
      where: { slug, status: MediaStatus.PUBLISHED },
      select: catalogSelect,
    });

    if (!media) throw new NotFoundException('Contenido no encontrado.');
    return media;
  }

  async createPlaybackSession(slug: string) {
    const media = await this.prisma.media.findFirst({
      where: { slug, status: MediaStatus.PUBLISHED },
      select: { slug: true, assets: { where: { isPrimary: true }, select: { id: true }, take: 1 } },
    });

    if (!media || !media.assets[0]) throw new NotFoundException('Contenido no disponible para reproducir.');

    const payload: PlaybackTokenPayload = { slug: media.slug, exp: Date.now() + playbackLifetimeMs };
    return { token: this.signPlaybackPayload(payload), expiresAt: new Date(payload.exp).toISOString() };
  }

  async getPlayback(token: string) {
    const { slug } = this.verifyPlaybackToken(token);
    const media = await this.prisma.media.findFirst({
      where: { slug, status: MediaStatus.PUBLISHED },
      select: {
        ...catalogSelect,
        assets: {
          where: { isPrimary: true },
          select: { url: true },
          take: 1,
        },
      },
    });

    if (!media || !media.assets[0]) throw new NotFoundException('Contenido no disponible para reproducir.');
    const { assets, ...catalogMedia } = media;
    return { ...catalogMedia, sourceUrl: assets[0].url };
  }

  private signPlaybackPayload(payload: PlaybackTokenPayload) {
    const compactPayload = `${payload.slug}.${payload.exp.toString(36)}.${randomBytes(6).toString('base64url')}`;
    const encodedPayload = Buffer.from(compactPayload).toString('base64url');
    return `${encodedPayload}.${this.createSignature(encodedPayload)}`;
  }

  private verifyPlaybackToken(token: string) {
    const [encodedPayload, signature, ...rest] = token.split('.');
    if (!encodedPayload || !signature || rest.length) throw new UnauthorizedException('Sesión de reproducción no válida.');

    const expectedSignature = this.createSignature(encodedPayload);
    const providedSignature = Buffer.from(signature);
    const expectedSignatureBuffer = Buffer.from(expectedSignature);
    const signaturesMatch =
      providedSignature.length === expectedSignatureBuffer.length && timingSafeEqual(providedSignature, expectedSignatureBuffer);
    if (!signaturesMatch) throw new UnauthorizedException('Sesión de reproducción no válida.');

    const payload = this.decodePlaybackPayload(encodedPayload);
    if (!payload.slug || !payload.exp || payload.exp <= Date.now()) throw new UnauthorizedException('La sesión de reproducción expiró.');
    return payload;
  }

  private decodePlaybackPayload(encodedPayload: string) {
    try {
      const [slug, expiration, nonce, ...rest] = Buffer.from(encodedPayload, 'base64url').toString('utf8').split('.');
      if (!slug || !expiration || !nonce || rest.length) throw new Error('Invalid playback payload');
      const exp = Number.parseInt(expiration, 36);
      if (!Number.isFinite(exp)) throw new Error('Invalid playback payload');
      return { slug, exp };
    } catch {
      throw new UnauthorizedException('Token de reproducción no válido.');
    }
  }

  private createSignature(value: string) {
    const secret = process.env.PLAYBACK_SIGNING_SECRET;
    if (!secret) throw new InternalServerErrorException('La reproducción no está configurada.');
    return createHmac('sha256', secret).update(value).digest('base64url');
  }
}
