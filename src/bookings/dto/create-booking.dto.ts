import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
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
  @ApiProperty({
    example: 'Jane Doe',
    minLength: 2,
    maxLength: 100,
    description: 'Full name of the customer',
  })
  @IsNotEmpty({ message: 'Customer name is required' })
  @IsString({ message: 'Customer name must be a string' })
  @MinLength(2, {
    message: 'Customer name must be at least 2 characters long',
  })
  @MaxLength(100, {
    message: 'Customer name must be at most 100 characters long',
  })
  customerName: string;

  @ApiProperty({
    example: 'jane.doe@example.com',
    format: 'email',
    description: 'Customer email address',
  })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsNotEmpty({ message: 'Customer email is required' })
  @IsEmail({}, { message: 'Customer email must be a valid email address' })
  customerEmail: string;

  @ApiProperty({
    example: '+94771234567',
    minLength: 7,
    maxLength: 20,
    description: 'Customer phone number',
  })
  @IsNotEmpty({ message: 'Customer phone is required' })
  @IsString({ message: 'Customer phone must be a string' })
  @MinLength(7, {
    message: 'Customer phone must be at least 7 characters long',
  })
  @MaxLength(20, {
    message: 'Customer phone must be at most 20 characters long',
  })
  customerPhone: string;

  @ApiProperty({
    example: '2026-07-15',
    format: 'date',
    description: 'Booking date (ISO 8601 date string)',
  })
  @IsNotEmpty({ message: 'Booking date is required' })
  @IsDateString({}, { message: 'Booking date must be a valid ISO date string' })
  bookingDate: string;

  @ApiProperty({
    example: '14:30',
    description: 'Booking time (HH:mm format)',
  })
  @IsNotEmpty({ message: 'Booking time is required' })
  @IsString({ message: 'Booking time must be a string' })
  bookingTime: string;

  @ApiProperty({
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    format: 'uuid',
    description: 'UUID of the service being booked',
  })
  @IsNotEmpty({ message: 'Service ID is required' })
  @IsUUID('4', { message: 'Service ID must be a valid UUID' })
  serviceId: string;

  @ApiPropertyOptional({
    example: 'Please call before arrival',
    maxLength: 500,
    description: 'Optional notes for the booking',
  })
  @IsOptional()
  @IsString({ message: 'Notes must be a string' })
  @MaxLength(500, {
    message: 'Notes must be at most 500 characters long',
  })
  notes?: string;
}
