import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ServiceService } from './service.service';

describe('ServiceService', () => {
  let service: ServiceService;
  let prisma: {
    service: {
      findMany: jest.Mock;
      findUnique: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
    };
  };

  beforeEach(async () => {
    prisma = {
      service: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [ServiceService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get<ServiceService>(ServiceService);
  });

  describe('findAll', () => {
    it('returns all services ordered by newest first', async () => {
      const services = [{ id: 'service-1' }];
      prisma.service.findMany.mockResolvedValue(services);

      const result = await service.findAll();

      expect(result).toBe(services);
      expect(prisma.service.findMany).toHaveBeenCalledWith({
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('findOne', () => {
    it('returns the service when it exists', async () => {
      const found = { id: 'service-1' };
      prisma.service.findUnique.mockResolvedValue(found);

      const result = await service.findOne('service-1');

      expect(result).toBe(found);
      expect(prisma.service.findUnique).toHaveBeenCalledWith({
        where: { id: 'service-1' },
      });
    });

    it('throws NotFoundException when the service does not exist', async () => {
      prisma.service.findUnique.mockResolvedValue(null);

      await expect(service.findOne('missing')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('create', () => {
    it('creates a service and omits isActive so the database default applies', async () => {
      const dto = {
        title: 'Haircut',
        description: 'Professional haircut and styling service',
        duration: 60,
        price: 49.99,
      };
      prisma.service.create.mockResolvedValue({ id: 'service-1', ...dto });

      await service.create(dto);

      expect(prisma.service.create).toHaveBeenCalledWith({
        data: {
          title: dto.title,
          description: dto.description,
          duration: dto.duration,
          price: dto.price,
        },
      });
    });

    it('includes isActive in the create payload when explicitly provided', async () => {
      const dto = {
        title: 'Haircut',
        description: 'Professional haircut and styling service',
        duration: 60,
        price: 49.99,
        isActive: false,
      };
      prisma.service.create.mockResolvedValue({ id: 'service-1', ...dto });

      await service.create(dto);

      expect(prisma.service.create).toHaveBeenCalledWith({
        data: {
          title: dto.title,
          description: dto.description,
          duration: dto.duration,
          price: dto.price,
          isActive: false,
        },
      });
    });
  });

  describe('update', () => {
    it('throws NotFoundException when the service does not exist', async () => {
      prisma.service.findUnique.mockResolvedValue(null);

      await expect(service.update('missing', { title: 'New' })).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(prisma.service.update).not.toHaveBeenCalled();
    });

    it('only sends the fields present in a partial update', async () => {
      prisma.service.findUnique.mockResolvedValue({ id: 'service-1' });
      prisma.service.update.mockResolvedValue({ id: 'service-1', price: 29.99 });

      await service.update('service-1', { price: 29.99 });

      expect(prisma.service.update).toHaveBeenCalledWith({
        where: { id: 'service-1' },
        data: { price: 29.99 },
      });
    });
  });

  describe('remove', () => {
    it('throws NotFoundException when the service does not exist', async () => {
      prisma.service.findUnique.mockResolvedValue(null);

      await expect(service.remove('missing')).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(prisma.service.delete).not.toHaveBeenCalled();
    });

    it('deletes the service when it exists and has no bookings', async () => {
      prisma.service.findUnique.mockResolvedValue({ id: 'service-1' });
      prisma.service.delete.mockResolvedValue({ id: 'service-1' });

      await service.remove('service-1');

      expect(prisma.service.delete).toHaveBeenCalledWith({
        where: { id: 'service-1' },
      });
    });

    it('turns a foreign-key restrict violation into a ConflictException', async () => {
      prisma.service.findUnique.mockResolvedValue({ id: 'service-1' });
      prisma.service.delete.mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError('restricted', {
          code: 'P2003',
          clientVersion: 'test',
        }),
      );

      await expect(service.remove('service-1')).rejects.toBeInstanceOf(
        ConflictException,
      );
    });

    it('rethrows unrelated database errors from delete', async () => {
      prisma.service.findUnique.mockResolvedValue({ id: 'service-1' });
      const dbError = new Error('connection lost');
      prisma.service.delete.mockRejectedValue(dbError);

      await expect(service.remove('service-1')).rejects.toBe(dbError);
    });
  });
});
