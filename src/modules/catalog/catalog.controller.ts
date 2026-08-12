import { Controller, Get, Param, Query } from '@nestjs/common';
import { CatalogService } from './catalog.service.js';
import { ListMediaQueryDto } from './dto/list-media-query.dto.js';

@Controller('catalog')
export class CatalogController {
  constructor(private readonly catalog: CatalogService) {}

  @Get()
  list(@Query() query: ListMediaQueryDto) {
    return this.catalog.list(query);
  }

  @Get(':slug')
  getBySlug(@Param('slug') slug: string) {
    return this.catalog.getBySlug(slug);
  }
}
