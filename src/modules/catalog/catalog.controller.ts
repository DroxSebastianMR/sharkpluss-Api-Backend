import { Controller, Get, Param, Post, Query } from '@nestjs/common';
import { CatalogService } from './catalog.service.js';
import { ListMediaQueryDto } from './dto/list-media-query.dto.js';

@Controller('catalog')
export class CatalogController {
  constructor(private readonly catalog: CatalogService) {}

  @Get()
  list(@Query() query: ListMediaQueryDto) {
    return this.catalog.list(query);
  }

  @Post(':slug/playback-session')
  createPlaybackSession(@Param('slug') slug: string) {
    return this.catalog.createPlaybackSession(slug);
  }

  @Get('playback/:token')
  getPlayback(@Param('token') token: string) {
    return this.catalog.getPlayback(token);
  }

  @Get(':slug')
  getBySlug(@Param('slug') slug: string) {
    return this.catalog.getBySlug(slug);
  }
}
