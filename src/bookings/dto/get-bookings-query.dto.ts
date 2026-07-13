import { BookingStatus } from '@prisma/client';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export class GetBookingsQueryDto {
  @IsOptional()
  @IsEnum(BookingStatus, {
    message:
      'Status must be one of: PENDING, CONFIRMED, CANCELLED, COMPLETED',
  })
  status?: BookingStatus;

  @IsOptional()
  @IsString({
    message: 'Search must be a string',
  })
  search?: string;
}