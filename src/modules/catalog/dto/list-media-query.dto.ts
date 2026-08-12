import { MediaType } from '@prisma/client';
import { IsEnum, IsOptional, IsString } from 'class-validator';
export class ListMediaQueryDto {
  @IsOptional() @IsEnum(MediaType) type?: MediaType;
  @IsOptional() @IsString() search?: string;
}
