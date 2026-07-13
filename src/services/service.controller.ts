import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { Service } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateServiceDto } from './dto/create-service.dto';
import { ServiceService } from './service.service';

@Controller('services')
export class ServiceController {
  constructor(private readonly serviceService: ServiceService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  findAll(): Promise<Service[]> {
    return this.serviceService.findAll();
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() dto: CreateServiceDto): Promise<Service> {
    return this.serviceService.create(dto);
  }
}
