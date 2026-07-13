import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    example: 'user@example.com',
    format: 'email',
    description: 'Registered user email address',
  })
  @Transform(({ value }) => value.trim().toLowerCase())
  @IsNotEmpty({ message: 'Email is required' })
  @IsEmail({}, { message: 'Email must be a valid email address' })
  email: string;

  @ApiProperty({
    example: 'password123',
    minLength: 8,
    description: 'User password',
  })
  @IsNotEmpty({ message: 'Password is required' })
  @IsString({ message: 'Password must be a string' })
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  password: string;
}
