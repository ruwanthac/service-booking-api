import { Injectable, NotFoundException } from '@nestjs/common';
import { Service } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateServiceDto } from './dto/create-service.dto';

@Injectable()
export class ServiceService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(): Promise<Service[]> {
    return this.prisma.service.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string): Promise<Service> {
    const service = await this.prisma.service.findUnique({ where: { id } });
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
}