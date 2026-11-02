import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ErroresGrpcInterceptor } from './errores-grpc.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors();

  app.setGlobalPrefix('api');

  app.useGlobalInterceptors(new ErroresGrpcInterceptor());

  const config = new DocumentBuilder()
    .setTitle('API Rentar - Web Services')
    .setDescription('Documentación de la API REST para el TP de Sistemas Distribuidos (UNLa)')
    .setVersion('1.0')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(process.env.PORT || 3000);
}
bootstrap();