import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Booking, BookingStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { GetBookingsQueryDto } from './dto/get-bookings-query.dto';
import { UpdateBookingStatusDto } from './dto/update-booking-status.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';

@Injectable()
export class BookingService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: GetBookingsQueryDto) {
    const where: Prisma.BookingWhereInput = {};

    if (query.status) {
      where.status = query.status;
    }

    if (query.search?.trim()) {
      const search = query.search.trim();

      where.OR = [
        {
          customerName: {
            contains: search,
            mode: 'insensitive',
          },
        },
        {
          customerEmail: {
            contains: search,
            mode: 'insensitive',
          },
        },
        {
          customerPhone: {
            contains: search,
            mode: 'insensitive',
          },
        },
      ];
    }

    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;

    return this.prisma.booking.findMany({
      where,
      skip,
      take: limit,
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        service: true,
      },
    });
  }

  async findOne(id: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id },
      include: { service: true },
    });
    if (!booking) {
      throw new NotFoundException('Booking not found');
    }
    return booking;
  }

  async create(dto: CreateBookingDto): Promise<Booking> {
    const service = await this.prisma.service.findUnique({
      where: { id: dto.serviceId },
      select: { id: true, isActive: true },
    });
    if (!service) {
      throw new NotFoundException('Service not found');
    }
    if (!service.isActive) {
      throw new BadRequestException('Service is not available');
    }

    // Prisma stores bookingDate as @db.Date and bookingTime as @db.Time(0);
    // both require JS Date objects. Normalize "HH:MM" → "HH:MM:SS" so the
    // constructed Date is always well-formed.
    const bookingDate = new Date(dto.bookingDate);
    this.assertBookingDateNotInPast(bookingDate);
    const normalizedTime = /^\d{2}:\d{2}$/.test(dto.bookingTime)
      ? `${dto.bookingTime}:00`
      : dto.bookingTime;
    const bookingTime = new Date(`1970-01-01T${normalizedTime}Z`);

    const clash = await this.prisma.booking.findFirst({
      where: {
        serviceId: dto.serviceId,
        bookingDate,
        bookingTime,
      },
      select: { id: true },
    });
    if (clash) {
      throw new ConflictException('This time slot is already booked');
    }

    try {
      return await this.prisma.booking.create({
        data: {
          customerName: dto.customerName,
          customerEmail: dto.customerEmail,
          customerPhone: dto.customerPhone,
          bookingDate,
          bookingTime,
          serviceId: dto.serviceId,
          ...(dto.notes !== undefined && { notes: dto.notes }),
        },
      });
    } catch (err) {
      // Race-safety: the schema declares
      // @@unique([serviceId, bookingDate, bookingTime]); two concurrent
      // requests can both clear the pre-check and only one wins.
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === 'P2002'
      ) {
        throw new ConflictException('This time slot is already booked');
      }
      throw err;
    }
  }

  async update(id: string, dto: UpdateBookingDto) {
    const existing = await this.prisma.booking.findUnique({
      where: { id },
      select: {
        id: true,
        serviceId: true,
        bookingDate: true,
        bookingTime: true,
      },
    });
    if (!existing) {
      throw new NotFoundException('Booking not found');
    }

    // Compute effective slot values, converting incoming DTO strings to Date
    // objects the way Prisma's @db.Date / @db.Time columns expect.
    const effectiveServiceId = dto.serviceId ?? existing.serviceId;

    const effectiveBookingDate =
      dto.bookingDate !== undefined
        ? new Date(dto.bookingDate)
        : existing.bookingDate;
    this.assertBookingDateNotInPast(effectiveBookingDate);

    let effectiveBookingTime = existing.bookingTime;
    if (dto.bookingTime !== undefined) {
      const normalizedTime = /^\d{2}:\d{2}$/.test(dto.bookingTime)
        ? `${dto.bookingTime}:00`
        : dto.bookingTime;
      effectiveBookingTime = new Date(`1970-01-01T${normalizedTime}Z`);
    }

    // Re-validate the service only when it actually changes.
    if (dto.serviceId !== undefined && dto.serviceId !== existing.serviceId) {
      const service = await this.prisma.service.findUnique({
        where: { id: dto.serviceId },
        select: { id: true, isActive: true },
      });
      if (!service) {
        throw new NotFoundException('Service not found');
      }
      if (!service.isActive) {
        throw new BadRequestException('Service is not available');
      }
    }

    // Slot conflict pre-check, excluding the booking being updated.
    const clash = await this.prisma.booking.findFirst({
      where: {
        serviceId: effectiveServiceId,
        bookingDate: effectiveBookingDate,
        bookingTime: effectiveBookingTime,
        id: { not: id },
      },
      select: { id: true },
    });
    if (clash) {
      throw new ConflictException('This time slot is already booked');
    }

    // Explicit per-field mapping: only touch keys the client actually sent.
    const data: Prisma.BookingUpdateInput = {
      ...(dto.customerName !== undefined && {
        customerName: dto.customerName,
      }),
      ...(dto.customerEmail !== undefined && {
        customerEmail: dto.customerEmail,
      }),
      ...(dto.customerPhone !== undefined && {
        customerPhone: dto.customerPhone,
      }),
      ...(dto.bookingDate !== undefined && {
        bookingDate: effectiveBookingDate,
      }),
      ...(dto.bookingTime !== undefined && {
        bookingTime: effectiveBookingTime,
      }),
      ...(dto.serviceId !== undefined && {
        service: {
          connect: {
            id: dto.serviceId,
          },
        },
      }),
      ...(dto.notes !== undefined && {
        notes: dto.notes,
      }),
    };

    try {
      return await this.prisma.booking.update({
        where: { id },
        data,
        include: { service: true },
      });
    } catch (err) {
      // Race-safety net for the composite unique constraint.
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === 'P2002'
      ) {
        throw new ConflictException('This time slot is already booked');
      }
      throw err;
    }
  }

  async cancel(id: string) {
    const existing = await this.prisma.booking.findUnique({
      where: { id },
      select: { id: true, status: true },
    });
    if (!existing) {
      throw new NotFoundException('Booking not found');
    }
    if (existing.status === BookingStatus.CANCELLED) {
      throw new BadRequestException('Booking is already cancelled');
    }

    return this.prisma.booking.update({
      where: { id },
      data: { status: BookingStatus.CANCELLED },
      include: { service: true },
    });
  }

  async updateStatus(id: string, dto: UpdateBookingStatusDto) {
    const existing = await this.prisma.booking.findUnique({
      where: { id },
      select: {
        id: true,
        status: true,
      },
    });

    if (!existing) {
      throw new NotFoundException('Booking not found');
    }

    if (existing.status === BookingStatus.CANCELLED) {
      throw new BadRequestException(
        'Cancelled bookings cannot have their status updated',
      );
    }

    if (existing.status === dto.status) {
      throw new BadRequestException('Booking already has this status');
    }

    // Enforce valid booking workflow.
    const validTransitions: Record<BookingStatus, BookingStatus[]> = {
      [BookingStatus.PENDING]: [BookingStatus.CONFIRMED],
      [BookingStatus.CONFIRMED]: [BookingStatus.COMPLETED],
      [BookingStatus.COMPLETED]: [],
      [BookingStatus.CANCELLED]: [],
    };

    if (!validTransitions[existing.status].includes(dto.status)) {
      throw new BadRequestException('Invalid booking status transition');
    }

    const data: Prisma.BookingUpdateInput = {
      status: dto.status,
    };

    return this.prisma.booking.update({
      where: { id },
      data,
      include: {
        service: true,
      },
    });
  }

  private assertBookingDateNotInPast(date: Date): void {
    const now = new Date();
    const todayUtc = Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate(),
    );
    const targetUtc = Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate(),
    );
    if (targetUtc < todayUtc) {
      throw new BadRequestException('Booking date cannot be in the past');
    }
  }
}
