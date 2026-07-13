import { Injectable, NotFoundException } from '@nestjs/common';
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
}