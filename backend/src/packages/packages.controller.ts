import { Controller, Get, Post, Put, Delete, Body, Param } from '@nestjs/common';
import { PackagesService, PackageItem } from './packages.service';

@Controller('api/packages')
export class PackagesController {
  constructor(private readonly packagesService: PackagesService) {}

  @Get()
  findAll() {
    return this.packagesService.findAll();
  }

  @Get(':id')
  findById(@Param('id') id: string) {
    return this.packagesService.findById(id);
  }

  @Post()
  create(
    @Body()
    dto: {
      name: string;
      description?: string;
      packagePrice?: number;
      items: PackageItem[];
    },
  ) {
    return this.packagesService.create(dto);
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body()
    dto: {
      name?: string;
      description?: string;
      packagePrice?: number;
      items?: PackageItem[];
    },
  ) {
    return this.packagesService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.packagesService.remove(id);
  }
}
