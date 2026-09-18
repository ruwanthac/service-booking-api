import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/prisma/prisma.service';

interface LoginResponseBody {
  accessToken: string;
}

interface ServiceResponseBody {
  id: string;
}

interface BookingResponseBody {
  id: string;
  status: string;
}

describe('App (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
      }),
    );
    await app.init();

    prisma = app.get(PrismaService);
    // Start from a clean slate; bookings must be cleared first because
    // Booking.serviceId is a restrict-on-delete foreign key.
    await prisma.booking.deleteMany();
    await prisma.service.deleteMany();
    await prisma.user.deleteMany();
  });

  afterAll(async () => {
    await app.close();
  });

  it('/health (GET) reports the database as up', async () => {
    const res = await request(app.getHttpServer()).get('/health').expect(200);

    expect(res.body).toEqual({ status: 'ok', database: 'up' });
  });

  it('/ (GET)', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect('Hello World!');
  });

  describe('booking lifecycle', () => {
    const email = 'lifecycle-user@example.com';
    const password = 'password123';
    let accessToken: string;
    let serviceId: string;
    let bookingId: string;

    it('registers a new user', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/register')
        .send({ email, password })
        .expect(201);

      expect(res.body).toEqual({ message: 'User registered successfully' });
    });

    it('rejects registering the same email twice', async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({ email, password })
        .expect(409);
    });

    it('logs in and receives a JWT access token', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email, password })
        .expect(200);

      const body = res.body as LoginResponseBody;
      expect(body.accessToken).toEqual(expect.any(String));
      accessToken = body.accessToken;
    });

    it('creates a service using the JWT', async () => {
      const res = await request(app.getHttpServer())
        .post('/services')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          title: 'Haircut',
          description: 'Standard 30-minute haircut service',
          duration: 30,
          price: 25,
        })
        .expect(201);

      const body = res.body as ServiceResponseBody;
      expect(body.id).toEqual(expect.any(String));
      serviceId = body.id;
    });

    it('rejects creating a service without a JWT', async () => {
      await request(app.getHttpServer())
        .post('/services')
        .send({
          title: 'Haircut',
          description: 'Standard 30-minute haircut service',
          duration: 30,
          price: 25,
        })
        .expect(401);
    });

    it('creates a booking with no authentication required (public endpoint)', async () => {
      const res = await request(app.getHttpServer())
        .post('/bookings')
        .send({
          customerName: 'Jane Doe',
          customerEmail: 'jane.doe@example.com',
          customerPhone: '+94771234567',
          bookingDate: '2999-08-01',
          bookingTime: '10:00',
          serviceId,
        })
        .expect(201);

      const body = res.body as BookingResponseBody;
      expect(body.status).toBe('PENDING');
      bookingId = body.id;
    });

    it('rejects a duplicate booking for the same service/date/time slot', async () => {
      await request(app.getHttpServer())
        .post('/bookings')
        .send({
          customerName: 'John Smith',
          customerEmail: 'john.smith@example.com',
          customerPhone: '+94771234568',
          bookingDate: '2999-08-01',
          bookingTime: '10:00',
          serviceId,
        })
        .expect(409);
    });

    it('rejects listing bookings without a JWT', async () => {
      await request(app.getHttpServer()).get('/bookings').expect(401);
    });

    it('lists bookings with a valid JWT', async () => {
      const res = await request(app.getHttpServer())
        .get('/bookings')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      const body = res.body as BookingResponseBody[];
      expect(body.some((booking) => booking.id === bookingId)).toBe(true);
    });

    it('updates the booking status to CONFIRMED', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/bookings/${bookingId}/status`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ status: 'CONFIRMED' })
        .expect(200);

      expect((res.body as BookingResponseBody).status).toBe('CONFIRMED');
    });

    it('rejects an invalid status transition (CONFIRMED -> PENDING)', async () => {
      await request(app.getHttpServer())
        .patch(`/bookings/${bookingId}/status`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ status: 'PENDING' })
        .expect(400);
    });

    it('cancels the booking', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/bookings/${bookingId}/cancel`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect((res.body as BookingResponseBody).status).toBe('CANCELLED');
    });

    it('rejects cancelling an already-cancelled booking', async () => {
      await request(app.getHttpServer())
        .patch(`/bookings/${bookingId}/cancel`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(400);
    });
  });
});
