import { BookingStatus } from '@prisma/client';
import { IsIn, IsNotEmpty } from 'class-validator';

export class UpdateBookingStatusDto {
  @IsNotEmpty({ message: 'Status is required' })
  @IsIn(
    [BookingStatus.PENDING, BookingStatus.CONFIRMED, BookingStatus.COMPLETED],
    {
      message: 'Status must be one of: PENDING, CONFIRMED, COMPLETED',
    },
  )
  status: BookingStatus;
}