import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class CreateServiceDto {
  @ApiProperty({
    example: 'Haircut',
    minLength: 3,
    maxLength: 100,
    description: 'Service title',
  })
  @IsNotEmpty({ message: 'Title is required' })
  @IsString({ message: 'Title must be a string' })
  @MinLength(3, { message: 'Title must be at least 3 characters long' })
  @MaxLength(100, { message: 'Title must be at most 100 characters long' })
  title: string;

  @ApiProperty({
    example: 'Professional haircut and styling service',
    minLength: 10,
    description: 'Detailed service description',
  })
  @IsNotEmpty({ message: 'Description is required' })
  @IsString({ message: 'Description must be a string' })
  @MinLength(10, {
    message: 'Description must be at least 10 characters long',
  })
  description: string;

  @ApiProperty({
    example: 60,
    minimum: 1,
    description: 'Service duration in minutes',
  })
  @IsNotEmpty({ message: 'Duration is required' })
  @IsInt({ message: 'Duration must be an integer (in minutes)' })
  @Min(1, { message: 'Duration must be at least 1 minute' })
  duration: number;

  @ApiProperty({
    example: 49.99,
    minimum: 0,
    description: 'Service price',
  })
  @IsNotEmpty({ message: 'Price is required' })
  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'Price must be a number with up to 2 decimal places' },
  )
  @Min(0, { message: 'Price must be greater than or equal to 0' })
  price: number;

  @ApiPropertyOptional({
    example: true,
    default: true,
    description: 'Whether the service is active and bookable',
  })
  @IsOptional()
  @IsBoolean({ message: 'isActive must be a boolean' })
  isActive?: boolean;
}
