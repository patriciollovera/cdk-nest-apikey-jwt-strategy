import { Controller, Get, Post, Request, UseGuards } from '@nestjs/common';
import { AppService } from './app.service';
import { AuthService } from './auth/auth.service';
import { ApiKeyAuthGuard } from './auth/guard/apikey-auth.guard';
// import { JwtAuthGuard } from './auth/guard/jwt-auth.guard';
// import { LocalAuthGuard } from './auth/guard/local-auth.guard';

// @UseGuards(ApiKeyAuthGuard)
@Controller()
export class AppController {
  constructor(private readonly appService: AppService, private authService: AuthService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
}
