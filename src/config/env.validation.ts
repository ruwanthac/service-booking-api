import 'reflect-metadata';
import { plainToInstance, Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsUrl,
  Max,
  Min,
  MinLength,
  validateSync,
} from 'class-validator';

enum Environment {
  Development = 'development',
  Production = 'production',
  Test = 'test',
}

class EnvironmentVariables {
  @IsIn(Object.values(Environment), {
    message: 'NODE_ENV must be one of: development, production, test',
  })
  NODE_ENV: Environment;

  @IsUrl(
    {
      protocols: ['postgresql', 'postgres'],
      require_protocol: true,
      require_tld: false,
    },
    { message: 'DATABASE_URL must be a valid postgresql:// connection string' },
  )
  DATABASE_URL: string;

  @MinLength(8, {
    message: 'JWT_SECRET must be at least 8 characters long',
  })
  JWT_SECRET: string;

  @Type(() => Number)
  @IsInt({ message: 'PORT must be an integer' })
  @Min(1, { message: 'PORT must be between 1 and 65535' })
  @Max(65535, { message: 'PORT must be between 1 and 65535' })
  PORT: number;
}

// Runs once when ConfigModule.forRoot() bootstraps; throwing here stops the
// app from starting with a missing or malformed DATABASE_URL, JWT_SECRET,
// or PORT instead of failing later, mid-request, with a confusing error.
export function validate(
  config: Record<string, unknown>,
): EnvironmentVariables {
  const validatedConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });
  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    const messages = errors
      .flatMap((error) => Object.values(error.constraints ?? {}))
      .join('; ');
    throw new Error(`Invalid environment variables: ${messages}`);
  }

  return validatedConfig;
}
