import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Booking, BookingStatus } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { BookingService } from './booking.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { GetBookingsQueryDto } from './dto/get-bookings-query.dto';
import { UpdateBookingStatusDto } from './dto/update-booking-status.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';

const serviceSchema = {
  type: 'object',
  properties: {
    id: { type: 'string', format: 'uuid' },
    title: { type: 'string', example: 'Haircut' },
    description: {
      type: 'string',
      example: 'Standard 30-minute haircut service',
    },
    duration: { type: 'integer', example: 30 },
    price: { type: 'number', example: 25.0 },
    isActive: { type: 'boolean', example: true },
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time' },
  },
};

const bookingSchema = {
  type: 'object',
  properties: {
    id: { type: 'string', format: 'uuid' },
    customerName: { type: 'string', example: 'John Doe' },
    customerEmail: { type: 'string', example: 'john@example.com' },
    customerPhone: { type: 'string', example: '+15551234567' },
    bookingDate: { type: 'string', format: 'date', example: '2026-07-20' },
    bookingTime: { type: 'string', example: '10:30:00' },
    status: {
      type: 'string',
      enum: ['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED'],
      example: 'PENDING',
    },
    notes: { type: 'string', nullable: true, example: 'Prefer morning slot' },
    serviceId: { type: 'string', format: 'uuid' },
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time' },
  },
};

const bookingWithServiceSchema = {
  ...bookingSchema,
  properties: {
    ...bookingSchema.properties,
    service: serviceSchema,
  },
};

const validationErrorSchema = {
  type: 'object',
  properties: {
    statusCode: { type: 'number', example: 400 },
    message: {
      oneOf: [
        { type: 'array', items: { type: 'string' } },
        { type: 'string' },
      ],
      example: ['Customer name must be at least 2 characters long'],
    },
    error: { type: 'string', example: 'Bad Request' },
  },
};

const unauthorizedSchema = {
  type: 'object',
  properties: {
    statusCode: { type: 'number', example: 401 },
    message: { type: 'string', example: 'Unauthorized' },
    error: { type: 'string', example: 'Unauthorized' },
  },
};

const notFoundSchema = {
  type: 'object',
  properties: {
    statusCode: { type: 'number', example: 404 },
    message: { type: 'string', example: 'Booking not found' },
    error: { type: 'string', example: 'Not Found' },
  },
};

const conflictSchema = {
  type: 'object',
  properties: {
    statusCode: { type: 'number', example: 409 },
    message: {
      type: 'string',
      example: 'This time slot is already booked',
    },
    error: { type: 'string', example: 'Conflict' },
  },
};

@ApiTags('Bookings')
@Controller('bookings')
export class BookingController {
  constructor(private readonly bookingService: BookingService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get all bookings with optional filters and pagination',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: BookingStatus,
    description: 'Filter by booking status',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description:
      'Search customerName, customerEmail, or customerPhone (case-insensitive)',
    example: 'john',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number (default: 1)',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Items per page (default: 10, max: 100)',
    example: 10,
  })
  @ApiOkResponse({
    description: 'Paginated list of bookings with related service',
    schema: {
      type: 'array',
      items: bookingWithServiceSchema,
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Missing or invalid JWT token',
    schema: unauthorizedSchema,
  })
  async findAll(@Query() query: GetBookingsQueryDto) {
    return this.bookingService.findAll(query);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get a booking by ID' })
  @ApiParam({
    name: 'id',
    type: 'string',
    format: 'uuid',
    description: 'Booking UUID',
  })
  @ApiOkResponse({
    description: 'Booking found with related service',
    schema: bookingWithServiceSchema,
  })
  @ApiUnauthorizedResponse({
    description: 'Missing or invalid JWT token',
    schema: unauthorizedSchema,
  })
  @ApiNotFoundResponse({
    description: 'Booking not found',
    schema: notFoundSchema,
  })
  async findOne(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.bookingService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a booking (no authentication required)' })
  @ApiBody({ type: CreateBookingDto })
  @ApiCreatedResponse({
    description: 'Booking created successfully',
    schema: bookingSchema,
  })
  @ApiBadRequestResponse({
    description:
      'Validation failed, booking date in the past, or service not available',
    schema: validationErrorSchema,
  })
  @ApiNotFoundResponse({
    description: 'Service not found',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 404 },
        message: { type: 'string', example: 'Service not found' },
        error: { type: 'string', example: 'Not Found' },
      },
    },
  })
  @ApiConflictResponse({
    description: 'Time slot already booked for this service',
    schema: conflictSchema,
  })
  create(@Body() dto: CreateBookingDto): Promise<Booking> {
    return this.bookingService.create(dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a booking' })
  @ApiParam({
    name: 'id',
    type: 'string',
    format: 'uuid',
    description: 'Booking UUID',
  })
  @ApiBody({ type: UpdateBookingDto })
  @ApiOkResponse({
    description: 'Booking updated successfully with related service',
    schema: bookingWithServiceSchema,
  })
  @ApiBadRequestResponse({
    description:
      'Validation failed, booking date in the past, or service not available',
    schema: validationErrorSchema,
  })
  @ApiUnauthorizedResponse({
    description: 'Missing or invalid JWT token',
    schema: unauthorizedSchema,
  })
  @ApiNotFoundResponse({
    description: 'Booking or service not found',
    schema: notFoundSchema,
  })
  @ApiConflictResponse({
    description: 'Time slot already booked for this service',
    schema: conflictSchema,
  })
  async update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateBookingDto,
  ) {
    return this.bookingService.update(id, dto);
  }

  @Patch(':id/cancel')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cancel a booking' })
  @ApiParam({
    name: 'id',
    type: 'string',
    format: 'uuid',
    description: 'Booking UUID',
  })
  @ApiOkResponse({
    description: 'Booking cancelled successfully with related service',
    schema: bookingWithServiceSchema,
  })
  @ApiBadRequestResponse({
    description: 'Booking is already cancelled',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 400 },
        message: { type: 'string', example: 'Booking is already cancelled' },
        error: { type: 'string', example: 'Bad Request' },
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Missing or invalid JWT token',
    schema: unauthorizedSchema,
  })
  @ApiNotFoundResponse({
    description: 'Booking not found',
    schema: notFoundSchema,
  })
  async cancel(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.bookingService.cancel(id);
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update booking status' })
  @ApiParam({
    name: 'id',
    type: 'string',
    format: 'uuid',
    description: 'Booking UUID',
  })
  @ApiBody({ type: UpdateBookingStatusDto })
  @ApiOkResponse({
    description: 'Booking status updated successfully with related service',
    schema: bookingWithServiceSchema,
  })
  @ApiBadRequestResponse({
    description:
      'Invalid status, same status, cancelled booking, or invalid transition',
    schema: validationErrorSchema,
  })
  @ApiUnauthorizedResponse({
    description: 'Missing or invalid JWT token',
    schema: unauthorizedSchema,
  })
  @ApiNotFoundResponse({
    description: 'Booking not found',
    schema: notFoundSchema,
  })
  async updateStatus(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateBookingStatusDto,
  ) {
    return this.bookingService.updateStatus(id, dto);
  }
}
