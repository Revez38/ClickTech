import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { configurarAplicacao } from './config/aplicacao';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  configurarAplicacao(app);
  const config = app.get(ConfigService);
  await app.listen(config.get<number>('PORT', 3000), '127.0.0.1');
}

void bootstrap();
