import { validate } from './env.validation';

describe('validate (environment variables)', () => {
  const validEnv = {
    NODE_ENV: 'development',
    DATABASE_URL: 'postgresql://user:pass@localhost:5432/booking_db',
    JWT_SECRET: 'a-reasonably-long-secret',
    PORT: '3000',
  };

  it('accepts a valid environment and coerces PORT to a number', () => {
    const result = validate({ ...validEnv });

    expect(result.NODE_ENV).toBe('development');
    expect(result.PORT).toBe(3000);
    expect(typeof result.PORT).toBe('number');
  });

  it('throws when DATABASE_URL is missing', () => {
    const { DATABASE_URL, ...rest } = validEnv;
    void DATABASE_URL;

    expect(() => validate(rest)).toThrow(/DATABASE_URL/);
  });

  it('throws when DATABASE_URL is not a valid postgres connection string', () => {
    expect(() => validate({ ...validEnv, DATABASE_URL: 'not-a-url' })).toThrow(
      /DATABASE_URL/,
    );
  });

  it('throws when JWT_SECRET is missing', () => {
    const { JWT_SECRET, ...rest } = validEnv;
    void JWT_SECRET;

    expect(() => validate(rest)).toThrow(/JWT_SECRET/);
  });

  it('throws when JWT_SECRET is too short', () => {
    expect(() => validate({ ...validEnv, JWT_SECRET: 'short' })).toThrow(
      /JWT_SECRET/,
    );
  });

  it('throws when PORT is not a number', () => {
    expect(() => validate({ ...validEnv, PORT: 'not-a-port' })).toThrow(/PORT/);
  });

  it('throws when PORT is out of range', () => {
    expect(() => validate({ ...validEnv, PORT: '70000' })).toThrow(/PORT/);
  });

  it('throws when NODE_ENV is not one of the allowed values', () => {
    expect(() => validate({ ...validEnv, NODE_ENV: 'staging' })).toThrow(
      /NODE_ENV/,
    );
  });
});
