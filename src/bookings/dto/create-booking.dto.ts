import { Transform } from 'class-transformer';
import {
  IsDateString,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateBookingDto {
  @IsNotEmpty({ message: 'Customer name is required' })
  @IsString({ message: 'Customer name must be a string' })
  @MinLength(2, {
    message: 'Customer name must be at least 2 characters long',
  })
  @MaxLength(100, {
    message: 'Customer name must be at most 100 characters long',
  })
  customerName: string;

  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsNotEmpty({ message: 'Customer email is required' })
  @IsEmail({}, { message: 'Customer email must be a valid email address' })
  customerEmail: string;

  @IsNotEmpty({ message: 'Customer phone is required' })
  @IsString({ message: 'Customer phone must be a string' })
  @MinLength(7, {
    message: 'Customer phone must be at least 7 characters long',
  })
  @MaxLength(20, {
    message: 'Customer phone must be at most 20 characters long',
  })
  customerPhone: string;

  @IsNotEmpty({ message: 'Booking date is required' })
  @IsDateString(
    {},
    { message: 'Booking date must be a valid ISO date string' },
  )
  bookingDate: string;

  @IsNotEmpty({ message: 'Booking time is required' })
  @IsString({ message: 'Booking time must be a string' })
  bookingTime: string;

  @IsNotEmpty({ message: 'Service ID is required' })
  @IsUUID('4', { message: 'Service ID must be a valid UUID' })
  serviceId: string;

  @IsOptional()
  @IsString({ message: 'Notes must be a string' })
  @MaxLength(500, {
    message: 'Notes must be at most 500 characters long',
  })
  notes?: string;
}