import { ApiProperty } from '@nestjs/swagger';
import { BookingStatus } from '@prisma/client';
import { IsIn, IsNotEmpty } from 'class-validator';

export class UpdateBookingStatusDto {
  @ApiProperty({
    enum: [BookingStatus.PENDING, BookingStatus.CONFIRMED, BookingStatus.COMPLETED],
    example: BookingStatus.CONFIRMED,
    description: 'New booking status (PENDING, CONFIRMED, or COMPLETED)',
  })
  @IsNotEmpty({ message: 'Status is required' })
  @IsIn(
    [BookingStatus.PENDING, BookingStatus.CONFIRMED, BookingStatus.COMPLETED],
    {
      message: 'Status must be one of: PENDING, CONFIRMED, COMPLETED',
    },
  )
  status: BookingStatus;
}
