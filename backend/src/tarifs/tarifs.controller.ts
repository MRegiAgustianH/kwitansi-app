import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { TarifsService, TarifEntity, ImportTarifsDto } from './tarifs.service';

@Controller('api/tarifs')
export class TarifsController {
  constructor(private readonly tarifsService: TarifsService) {}

  @Get()
  findAll(
    @Query('search') search?: string,
    @Query('category') category?: string,
    @Query('limit') limit?: string,
    @Query('page') page?: string,
  ) {
    return this.tarifsService.findAll({
      search,
      category,
      limit: limit ? Number(limit) : undefined,
      page: page ? Number(page) : undefined,
    });
  }

  @Get('categories')
  getCategories() {
    return this.tarifsService.getCategories();
  }

  @Get(':id')
  findById(@Param('id') id: string) {
    return this.tarifsService.findById(id);
  }

  @Post()
  create(@Body() dto: Partial<TarifEntity>) {
    return this.tarifsService.create(dto);
  }
  @Post('import')
  importTarifs(@Body() dto: ImportTarifsDto) {
    return this.tarifsService.importTarifs(dto);
  }


  @Put(':id')
  update(@Param('id') id: string, @Body() dto: Partial<TarifEntity>) {
    return this.tarifsService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.tarifsService.remove(id);
  }
}
