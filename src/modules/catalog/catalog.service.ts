import { Injectable, NotFoundException } from '@nestjs/common';
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
      select: {
        ...catalogSelect,
        assets: {
          where: { isPrimary: true },
          select: { url: true },
          take: 1,
        },
      },
    });

    if (!media) throw new NotFoundException('Contenido no encontrado.');

    const { assets, ...catalogMedia } = media;
    return { ...catalogMedia, sourceUrl: assets[0]?.url ?? null };
  }
}
