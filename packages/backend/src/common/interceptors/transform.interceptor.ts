import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  StreamableFile,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface Response<T> {
  data: T;
  timestamp: string;
}

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<
  T,
  Response<T> | StreamableFile
> {
  intercept(
    context: ExecutionContext,
    next: CallHandler
  ): Observable<Response<T> | StreamableFile> {
    return next.handle().pipe(
      map((data) => {
        // Never wrap file streams — wrapping a StreamableFile into a plain
        // object makes Nest serialize it as JSON instead of streaming bytes
        if (data instanceof StreamableFile) {
          return data;
        }
        return {
          data,
          timestamp: new Date().toISOString(),
        };
      })
    );
  }
}
