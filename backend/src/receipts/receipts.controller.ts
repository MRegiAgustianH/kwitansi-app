import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { ReceiptsService, ReceiptItem } from './receipts.service';

@Controller('api/receipts')
export class ReceiptsController {
  constructor(private readonly receiptsService: ReceiptsService) {}

  @Get('generate-no')
  generateNo() {
    return { receiptNo: this.receiptsService.generateReceiptNo() };
  }

  @Get()
  findAll(
    @Query('search') search?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('limit') limit?: string,
    @Query('page') page?: string,
  ) {
    return this.receiptsService.findAll({
      search,
      startDate,
      endDate,
      limit: limit ? Number(limit) : undefined,
      page: page ? Number(page) : undefined,
    });
  }

  @Get(':id')
  findById(@Param('id') id: string) {
    return this.receiptsService.findById(id);
  }

  @Get('by-no/:no')
  findByNo(@Param('no') no: string) {
    return this.receiptsService.findByReceiptNo(no);
  }

  @Post()
  create(
    @Body()
    dto: {
      receiptNo?: string;
      medicalRecordNo: string;
      patientName: string;
      packageName?: string;
      packageQty?: string;
      totalAmount?: number;
      receiptDate?: string;
      cashierName?: string;
      notes?: string;
      items: ReceiptItem[];
    },
  ) {
    return this.receiptsService.create(dto);
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body()
    dto: {
      receiptNo?: string;
      medicalRecordNo?: string;
      patientName?: string;
      packageName?: string;
      packageQty?: string;
      totalAmount?: number;
      receiptDate?: string;
      cashierName?: string;
      notes?: string;
      items?: ReceiptItem[];
    },
  ) {
    return this.receiptsService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.receiptsService.remove(id);
  }
}
