import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { BookingStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { BookingService } from './booking.service';

describe('BookingService', () => {
  let service: BookingService;
  let prisma: {
    service: {
      findUnique: jest.Mock;
    };
    booking: {
      findFirst: jest.Mock;
      findUnique: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
    };
  };

  const validCreateDto = {
    customerName: 'Jane Doe',
    customerEmail: 'jane.doe@example.com',
    customerPhone: '+94771234567',
    bookingDate: '2999-07-15',
    bookingTime: '14:30',
    serviceId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  };

  beforeEach(async () => {
    prisma = {
      service: {
        findUnique: jest.fn(),
      },
      booking: {
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [BookingService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get<BookingService>(BookingService);
  });

  describe('create', () => {
    it('throws NotFoundException when the service does not exist', async () => {
      prisma.service.findUnique.mockResolvedValue(null);

      await expect(service.create(validCreateDto)).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(prisma.booking.create).not.toHaveBeenCalled();
    });

    it('throws BadRequestException when the service is inactive', async () => {
      prisma.service.findUnique.mockResolvedValue({
        id: validCreateDto.serviceId,
        isActive: false,
      });

      await expect(service.create(validCreateDto)).rejects.toBeInstanceOf(
        BadRequestException,
      );
      expect(prisma.booking.create).not.toHaveBeenCalled();
    });

    it('rejects a booking date in the past', async () => {
      prisma.service.findUnique.mockResolvedValue({
        id: validCreateDto.serviceId,
        isActive: true,
      });

      await expect(
        service.create({ ...validCreateDto, bookingDate: '2000-01-01' }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(prisma.booking.create).not.toHaveBeenCalled();
    });

    it('throws ConflictException when the slot is already taken (pre-check)', async () => {
      prisma.service.findUnique.mockResolvedValue({
        id: validCreateDto.serviceId,
        isActive: true,
      });
      prisma.booking.findFirst.mockResolvedValue({ id: 'existing-booking' });

      await expect(service.create(validCreateDto)).rejects.toBeInstanceOf(
        ConflictException,
      );
      expect(prisma.booking.create).not.toHaveBeenCalled();
    });

    it('turns a concurrent unique-constraint violation into a ConflictException', async () => {
      prisma.service.findUnique.mockResolvedValue({
        id: validCreateDto.serviceId,
        isActive: true,
      });
      prisma.booking.findFirst.mockResolvedValue(null);
      prisma.booking.create.mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError('duplicate', {
          code: 'P2002',
          clientVersion: 'test',
        }),
      );

      await expect(service.create(validCreateDto)).rejects.toBeInstanceOf(
        ConflictException,
      );
    });

    it('rethrows unrelated database errors from create', async () => {
      prisma.service.findUnique.mockResolvedValue({
        id: validCreateDto.serviceId,
        isActive: true,
      });
      prisma.booking.findFirst.mockResolvedValue(null);
      const dbError = new Error('connection lost');
      prisma.booking.create.mockRejectedValue(dbError);

      await expect(service.create(validCreateDto)).rejects.toBe(dbError);
    });

    it('creates the booking with normalized date/time when the slot is free', async () => {
      prisma.service.findUnique.mockResolvedValue({
        id: validCreateDto.serviceId,
        isActive: true,
      });
      prisma.booking.findFirst.mockResolvedValue(null);
      prisma.booking.create.mockResolvedValue({ id: 'booking-1' });

      await service.create(validCreateDto);

      const calls = prisma.booking.create.mock.calls as Array<
        [
          {
            data: {
              customerName: string;
              customerEmail: string;
              serviceId: string;
              bookingDate: Date;
              bookingTime: Date;
              notes?: string;
            };
          },
        ]
      >;
      const createArgs = calls[0][0];
      expect(createArgs.data.customerName).toBe(validCreateDto.customerName);
      expect(createArgs.data.customerEmail).toBe(validCreateDto.customerEmail);
      expect(createArgs.data.serviceId).toBe(validCreateDto.serviceId);
      expect(createArgs.data.bookingDate).toEqual(
        new Date(validCreateDto.bookingDate),
      );
      expect(createArgs.data.bookingTime).toEqual(
        new Date('1970-01-01T14:30:00Z'),
      );
      expect(createArgs.data.notes).toBeUndefined();
    });
  });

  describe('update', () => {
    const existingBooking = {
      id: 'booking-1',
      serviceId: validCreateDto.serviceId,
      bookingDate: new Date('2999-07-15'),
      bookingTime: new Date('1970-01-01T14:30:00Z'),
    };

    it('throws NotFoundException when the booking does not exist', async () => {
      prisma.booking.findUnique.mockResolvedValue(null);

      await expect(service.update('missing', {})).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(prisma.booking.update).not.toHaveBeenCalled();
    });

    it('rejects an updated booking date that is in the past', async () => {
      prisma.booking.findUnique.mockResolvedValue(existingBooking);

      await expect(
        service.update('booking-1', { bookingDate: '2000-01-01' }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(prisma.booking.update).not.toHaveBeenCalled();
    });

    it('throws NotFoundException when switching to a service that does not exist', async () => {
      prisma.booking.findUnique.mockResolvedValue(existingBooking);
      prisma.service.findUnique.mockResolvedValue(null);

      await expect(
        service.update('booking-1', { serviceId: 'other-service-id' }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('throws BadRequestException when switching to an inactive service', async () => {
      prisma.booking.findUnique.mockResolvedValue(existingBooking);
      prisma.service.findUnique.mockResolvedValue({
        id: 'other-service-id',
        isActive: false,
      });

      await expect(
        service.update('booking-1', { serviceId: 'other-service-id' }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('throws ConflictException when the new slot clashes with another booking', async () => {
      prisma.booking.findUnique.mockResolvedValue(existingBooking);
      prisma.booking.findFirst.mockResolvedValue({ id: 'other-booking' });

      await expect(
        service.update('booking-1', { bookingTime: '16:00' }),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(prisma.booking.update).not.toHaveBeenCalled();
    });

    it('excludes the booking itself from the slot-clash check', async () => {
      prisma.booking.findUnique.mockResolvedValue(existingBooking);
      prisma.booking.findFirst.mockResolvedValue(null);
      prisma.booking.update.mockResolvedValue({ id: 'booking-1' });

      await service.update('booking-1', { customerName: 'New Name' });

      expect(prisma.booking.findFirst).toHaveBeenCalledWith({
        where: {
          serviceId: existingBooking.serviceId,
          bookingDate: existingBooking.bookingDate,
          bookingTime: existingBooking.bookingTime,
          id: { not: 'booking-1' },
        },
        select: { id: true },
      });
    });

    it('only sends the fields present in a partial update', async () => {
      prisma.booking.findUnique.mockResolvedValue(existingBooking);
      prisma.booking.findFirst.mockResolvedValue(null);
      prisma.booking.update.mockResolvedValue({ id: 'booking-1' });

      await service.update('booking-1', { customerName: 'New Name' });

      expect(prisma.booking.update).toHaveBeenCalledWith({
        where: { id: 'booking-1' },
        data: { customerName: 'New Name' },
        include: { service: true },
      });
    });

    it('turns a concurrent unique-constraint violation into a ConflictException', async () => {
      prisma.booking.findUnique.mockResolvedValue(existingBooking);
      prisma.booking.findFirst.mockResolvedValue(null);
      prisma.booking.update.mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError('duplicate', {
          code: 'P2002',
          clientVersion: 'test',
        }),
      );

      await expect(
        service.update('booking-1', { customerName: 'New Name' }),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe('cancel', () => {
    it('throws NotFoundException when the booking does not exist', async () => {
      prisma.booking.findUnique.mockResolvedValue(null);

      await expect(service.cancel('missing')).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(prisma.booking.update).not.toHaveBeenCalled();
    });

    it('rejects cancelling a booking that is already cancelled', async () => {
      prisma.booking.findUnique.mockResolvedValue({
        id: 'booking-1',
        status: BookingStatus.CANCELLED,
      });

      await expect(service.cancel('booking-1')).rejects.toBeInstanceOf(
        BadRequestException,
      );
      expect(prisma.booking.update).not.toHaveBeenCalled();
    });

    it('cancels a booking that is not already cancelled', async () => {
      prisma.booking.findUnique.mockResolvedValue({
        id: 'booking-1',
        status: BookingStatus.PENDING,
      });
      prisma.booking.update.mockResolvedValue({
        id: 'booking-1',
        status: BookingStatus.CANCELLED,
      });

      await service.cancel('booking-1');

      expect(prisma.booking.update).toHaveBeenCalledWith({
        where: { id: 'booking-1' },
        data: { status: BookingStatus.CANCELLED },
        include: { service: true },
      });
    });
  });

  describe('updateStatus', () => {
    it('throws NotFoundException when the booking does not exist', async () => {
      prisma.booking.findUnique.mockResolvedValue(null);

      await expect(
        service.updateStatus('missing', { status: BookingStatus.CONFIRMED }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('rejects updating the status of a cancelled booking', async () => {
      prisma.booking.findUnique.mockResolvedValue({
        id: 'booking-1',
        status: BookingStatus.CANCELLED,
      });

      await expect(
        service.updateStatus('booking-1', { status: BookingStatus.CONFIRMED }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(prisma.booking.update).not.toHaveBeenCalled();
    });

    it('rejects setting the same status the booking already has', async () => {
      prisma.booking.findUnique.mockResolvedValue({
        id: 'booking-1',
        status: BookingStatus.PENDING,
      });

      await expect(
        service.updateStatus('booking-1', { status: BookingStatus.PENDING }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(prisma.booking.update).not.toHaveBeenCalled();
    });

    it('rejects an invalid transition (PENDING -> COMPLETED)', async () => {
      prisma.booking.findUnique.mockResolvedValue({
        id: 'booking-1',
        status: BookingStatus.PENDING,
      });

      await expect(
        service.updateStatus('booking-1', { status: BookingStatus.COMPLETED }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(prisma.booking.update).not.toHaveBeenCalled();
    });

    it('allows a valid transition (PENDING -> CONFIRMED)', async () => {
      prisma.booking.findUnique.mockResolvedValue({
        id: 'booking-1',
        status: BookingStatus.PENDING,
      });
      prisma.booking.update.mockResolvedValue({
        id: 'booking-1',
        status: BookingStatus.CONFIRMED,
      });

      await service.updateStatus('booking-1', {
        status: BookingStatus.CONFIRMED,
      });

      expect(prisma.booking.update).toHaveBeenCalledWith({
        where: { id: 'booking-1' },
        data: { status: BookingStatus.CONFIRMED },
        include: { service: true },
      });
    });

    it('allows a valid transition (CONFIRMED -> COMPLETED)', async () => {
      prisma.booking.findUnique.mockResolvedValue({
        id: 'booking-1',
        status: BookingStatus.CONFIRMED,
      });
      prisma.booking.update.mockResolvedValue({
        id: 'booking-1',
        status: BookingStatus.COMPLETED,
      });

      await service.updateStatus('booking-1', {
        status: BookingStatus.COMPLETED,
      });

      expect(prisma.booking.update).toHaveBeenCalledWith({
        where: { id: 'booking-1' },
        data: { status: BookingStatus.COMPLETED },
        include: { service: true },
      });
    });

    it('rejects any transition out of COMPLETED', async () => {
      prisma.booking.findUnique.mockResolvedValue({
        id: 'booking-1',
        status: BookingStatus.COMPLETED,
      });

      await expect(
        service.updateStatus('booking-1', { status: BookingStatus.CONFIRMED }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(prisma.booking.update).not.toHaveBeenCalled();
    });
  });
});
