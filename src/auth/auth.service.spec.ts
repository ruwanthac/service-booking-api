import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let prisma: {
    user: {
      findUnique: jest.Mock;
      create: jest.Mock;
    };
  };
  let jwt: { signAsync: jest.Mock };

  beforeEach(async () => {
    prisma = {
      user: {
        findUnique: jest.fn(),
        create: jest.fn(),
      },
    };
    jwt = {
      signAsync: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        { provide: JwtService, useValue: jwt },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  describe('register', () => {
    it('lowercases the email and stores a bcrypt hash, not the raw password', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue({ id: 'user-1' });

      const result = await service.register({
        email: 'User@Example.com',
        password: 'password123',
      });

      expect(result).toEqual({ message: 'User registered successfully' });
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'user@example.com' },
        select: { id: true },
      });

      const calls = prisma.user.create.mock.calls as Array<
        [{ data: { email: string; password: string } }]
      >;
      const createArgs = calls[0][0];
      expect(createArgs.data.email).toBe('user@example.com');
      expect(createArgs.data.password).not.toBe('password123');
      await expect(
        bcrypt.compare('password123', createArgs.data.password),
      ).resolves.toBe(true);
    });

    it('rejects registration when the email is already taken', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 'existing-user' });

      await expect(
        service.register({
          email: 'taken@example.com',
          password: 'password123',
        }),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(prisma.user.create).not.toHaveBeenCalled();
    });

    it('turns a concurrent unique-constraint violation into a ConflictException', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.create.mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError('duplicate', {
          code: 'P2002',
          clientVersion: 'test',
        }),
      );

      await expect(
        service.register({
          email: 'race@example.com',
          password: 'password123',
        }),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('rethrows unrelated database errors from create', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      const dbError = new Error('connection lost');
      prisma.user.create.mockRejectedValue(dbError);

      await expect(
        service.register({
          email: 'boom@example.com',
          password: 'password123',
        }),
      ).rejects.toBe(dbError);
    });
  });

  describe('login', () => {
    it('returns an access token for correct credentials', async () => {
      const passwordHash = await bcrypt.hash('password123', 10);
      prisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'user@example.com',
        password: passwordHash,
      });
      jwt.signAsync.mockResolvedValue('signed.jwt.token');

      const result = await service.login({
        email: 'User@Example.com',
        password: 'password123',
      });

      expect(result).toEqual({ accessToken: 'signed.jwt.token' });
      expect(jwt.signAsync).toHaveBeenCalledWith({
        sub: 'user-1',
        email: 'user@example.com',
      });
    });

    it('rejects an unknown email without revealing whether the account exists', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.login({ email: 'nobody@example.com', password: 'password123' }),
      ).rejects.toThrow('Invalid email or password');
    });

    it('rejects a wrong password with the same message as an unknown email', async () => {
      const passwordHash = await bcrypt.hash('correct-password', 10);
      prisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'user@example.com',
        password: passwordHash,
      });

      await expect(
        service.login({
          email: 'user@example.com',
          password: 'wrong-password',
        }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
      expect(jwt.signAsync).not.toHaveBeenCalled();
    });
  });
});
