import { Controller, Get, Req, Res } from '@nestjs/common';
import type { Request, Response } from 'express';

@Controller()
export class AppController {
  @Get()
  redirectRoot(@Req() req: Request, @Res() res: Response) {
    const host = req.hostname || 'localhost';
    return res.redirect(`http://${host}:3000`);
  }
}
