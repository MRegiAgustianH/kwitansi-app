import { Module } from '@nestjs/common';
import { TarifsService } from './tarifs.service';
import { TarifsController } from './tarifs.controller';

@Module({
  controllers: [TarifsController],
  providers: [TarifsService],
  exports: [TarifsService],
})
export class TarifsModule {}
