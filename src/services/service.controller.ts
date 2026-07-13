import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Service } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { ServiceService } from './service.service';

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

const validationErrorSchema = {
  type: 'object',
  properties: {
    statusCode: { type: 'number', example: 400 },
    message: {
      type: 'array',
      items: { type: 'string' },
      example: ['Title must be at least 3 characters long'],
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
    message: { type: 'string', example: 'Service not found' },
    error: { type: 'string', example: 'Not Found' },
  },
};

@ApiTags('Services')
@ApiBearerAuth()
@Controller('services')
export class ServiceController {
  constructor(private readonly serviceService: ServiceService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get all services' })
  @ApiOkResponse({
    description: 'List of services ordered by newest first',
    schema: {
      type: 'array',
      items: serviceSchema,
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Missing or invalid JWT token',
    schema: unauthorizedSchema,
  })
  findAll(): Promise<Service[]> {
    return this.serviceService.findAll();
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get a service by ID' })
  @ApiParam({
    name: 'id',
    type: 'string',
    format: 'uuid',
    description: 'Service UUID',
  })
  @ApiOkResponse({
    description: 'Service found',
    schema: serviceSchema,
  })
  @ApiUnauthorizedResponse({
    description: 'Missing or invalid JWT token',
    schema: unauthorizedSchema,
  })
  @ApiNotFoundResponse({
    description: 'Service not found',
    schema: notFoundSchema,
  })
  findOne(@Param('id') id: string): Promise<Service> {
    return this.serviceService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Create a new service' })
  @ApiBody({ type: CreateServiceDto })
  @ApiCreatedResponse({
    description: 'Service created successfully',
    schema: serviceSchema,
  })
  @ApiBadRequestResponse({
    description: 'Validation failed — invalid or missing fields',
    schema: validationErrorSchema,
  })
  @ApiUnauthorizedResponse({
    description: 'Missing or invalid JWT token',
    schema: unauthorizedSchema,
  })
  create(@Body() dto: CreateServiceDto): Promise<Service> {
    return this.serviceService.create(dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Update a service' })
  @ApiParam({
    name: 'id',
    type: 'string',
    format: 'uuid',
    description: 'Service UUID',
  })
  @ApiBody({ type: UpdateServiceDto })
  @ApiOkResponse({
    description: 'Service updated successfully',
    schema: serviceSchema,
  })
  @ApiBadRequestResponse({
    description: 'Validation failed — invalid field values',
    schema: validationErrorSchema,
  })
  @ApiUnauthorizedResponse({
    description: 'Missing or invalid JWT token',
    schema: unauthorizedSchema,
  })
  @ApiNotFoundResponse({
    description: 'Service not found',
    schema: notFoundSchema,
  })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateServiceDto,
  ): Promise<Service> {
    return this.serviceService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a service' })
  @ApiParam({
    name: 'id',
    type: 'string',
    format: 'uuid',
    description: 'Service UUID',
  })
  @ApiNoContentResponse({
    description: 'Service deleted successfully',
  })
  @ApiUnauthorizedResponse({
    description: 'Missing or invalid JWT token',
    schema: unauthorizedSchema,
  })
  @ApiNotFoundResponse({
    description: 'Service not found',
    schema: notFoundSchema,
  })
  @ApiConflictResponse({
    description: 'Cannot delete service because it has existing bookings',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 409 },
        message: {
          type: 'string',
          example: 'Cannot delete service because it has existing bookings',
        },
        error: { type: 'string', example: 'Conflict' },
      },
    },
  })
  remove(@Param('id') id: string): Promise<void> {
    return this.serviceService.remove(id);
  }
}
