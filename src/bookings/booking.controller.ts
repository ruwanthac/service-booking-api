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
import { Booking } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { BookingService } from './booking.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { GetBookingsQueryDto } from './dto/get-bookings-query.dto';
import { UpdateBookingStatusDto } from './dto/update-booking-status.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';

@Controller('bookings')
export class BookingController {
  constructor(private readonly bookingService: BookingService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  async findAll(
    @Query() query: GetBookingsQueryDto,
  ) {
    return this.bookingService.findAll(query);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async findOne(
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    return this.bookingService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateBookingDto): Promise<Booking> {
    return this.bookingService.create(dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  async update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateBookingDto,
  ) {
    return this.bookingService.update(id, dto);
  }

  @Patch(':id/cancel')
  @UseGuards(JwtAuthGuard)
  async cancel(
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    return this.bookingService.cancel(id);
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard)
  async updateStatus(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateBookingStatusDto,
  ) {
    return this.bookingService.updateStatus(id, dto);
  }
}