import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CatalogModule } from './modules/catalog/catalog.module.js';
import { HealthModule } from './modules/health/health.module.js';

@Module({ imports: [ConfigModule.forRoot({ isGlobal: true }), HealthModule, CatalogModule] })
export class AppModule {}
