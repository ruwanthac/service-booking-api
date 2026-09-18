import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, Service } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';

@Injectable()
export class ServiceService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(): Promise<Service[]> {
    return this.prisma.service.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  // Used by the public booking page: customers must be able to see what
  // they can book without authenticating, but only active services.
  findAllActive(): Promise<Service[]> {
    return this.prisma.service.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string): Promise<Service> {
    const service = await this.prisma.service.findUnique({
      where: { id },
    });

    if (!service) {
      throw new NotFoundException('Service not found');
    }

    return service;
  }

  create(dto: CreateServiceDto): Promise<Service> {
    return this.prisma.service.create({
      data: {
        title: dto.title,
        description: dto.description,
        duration: dto.duration,
        price: dto.price,

        // Let the database default (true) apply when isActive is omitted.
        ...(dto.isActive !== undefined && {
          isActive: dto.isActive,
        }),
      },
    });
  }

  async update(id: string, dto: UpdateServiceDto): Promise<Service> {
    const existing = await this.prisma.service.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existing) {
      throw new NotFoundException('Service not found');
    }

    const data: Prisma.ServiceUpdateInput = {
      ...(dto.title !== undefined && { title: dto.title }),
      ...(dto.description !== undefined && {
        description: dto.description,
      }),
      ...(dto.duration !== undefined && { duration: dto.duration }),
      ...(dto.price !== undefined && { price: dto.price }),
      ...(dto.isActive !== undefined && {
        isActive: dto.isActive,
      }),
    };

    return this.prisma.service.update({
      where: { id },
      data,
    });
  }

  async remove(id: string): Promise<void> {
    const existing = await this.prisma.service.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!existing) {
      throw new NotFoundException('Service not found');
    }

    try {
      await this.prisma.service.delete({ where: { id } });
    } catch (err) {
      // Booking.serviceId is declared with `onDelete: Restrict` in the Prisma
      // schema, so Postgres rejects deleting a service that still has
      // bookings. Translate that FK violation into a proper 409 instead of
      // letting it surface as a 500.
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === 'P2003'
      ) {
        throw new ConflictException(
          'Cannot delete service because it has existing bookings',
        );
      }
      throw err;
    }
  }
}
