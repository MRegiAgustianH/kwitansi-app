import { Module } from '@nestjs/common';
import { DatabaseModule } from './database/database.module';
import { TarifsModule } from './tarifs/tarifs.module';
import { PackagesModule } from './packages/packages.module';
import { ReceiptsModule } from './receipts/receipts.module';
import { SettingsModule } from './settings/settings.module';

@Module({
  imports: [
    DatabaseModule,
    TarifsModule,
    PackagesModule,
    ReceiptsModule,
    SettingsModule,
  ],
})
export class AppModule {}
