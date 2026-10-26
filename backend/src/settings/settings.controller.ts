import { Controller, Get, Put, Body } from '@nestjs/common';
import { SettingsService, HospitalSettingsEntity } from './settings.service';

@Controller('api/settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  getSettings() {
    return this.settingsService.getSettings();
  }

  @Put()
  updateSettings(@Body() dto: Partial<HospitalSettingsEntity>) {
    return this.settingsService.updateSettings(dto);
  }
}
