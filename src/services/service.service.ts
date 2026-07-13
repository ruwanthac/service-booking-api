import { Injectable } from '@nestjs/common';
import { Service } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateServiceDto } from './dto/create-service.dto';

@Injectable()
export class ServiceService {
  constructor(private readonly prisma: PrismaService) {}

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