import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Request, Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | object = 'Internal server error';
    let error = 'Internal Server Error';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();
      if (typeof res === 'object' && res !== null) {
        message = (res as any).message || exception.message;
        error = (res as any).error || exception.name;
      } else {
        message = res;
        error = exception.name;
      }
    } else if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      if (['P2002', 'P2025', 'P2034'].includes(exception.code)) {
        status = HttpStatus.CONFLICT;
        error = 'Conflict';
        message = 'La operación entra en conflicto con un cambio existente. Actualiza e inténtalo de nuevo.';
      } else if (['P2024', 'P2028', 'P2037'].includes(exception.code)) {
        status = HttpStatus.SERVICE_UNAVAILABLE;
        error = 'Service Unavailable';
        message = 'El servidor está ocupado. Inténtalo de nuevo en unos segundos.';
        response.setHeader('Retry-After', '3');
      }
      this.logger.error('Database request failed: ' + exception.code);
    } else if (exception instanceof Error) {
      this.logger.error(`Unhandled Error: ${exception.message}`, exception.stack);
    }

    response.status(status).json({
      success: false,
      statusCode: status,
      error,
      message,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
