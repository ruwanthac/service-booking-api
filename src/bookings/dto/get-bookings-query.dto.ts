import { BookingStatus } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class GetBookingsQueryDto {
  @IsOptional()
  @IsEnum(BookingStatus, {
    message: 'Status must be one of: PENDING, CONFIRMED, CANCELLED, COMPLETED',
  })
  status?: BookingStatus;

  @IsOptional()
  @IsString({
    message: 'Search must be a string',
  })
  search?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Page must be an integer' })
  @Min(1, { message: 'Page must be at least 1' })
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Limit must be an integer' })
  @Min(1, { message: 'Limit must be at least 1' })
  @Max(100, { message: 'Limit must be at most 100' })
  limit?: number;
}
