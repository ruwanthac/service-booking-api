import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Booking, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBookingDto } from './dto/create-booking.dto';

@Injectable()
export class BookingService {
  constructor(private readonly prisma: PrismaService) {}

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
}
