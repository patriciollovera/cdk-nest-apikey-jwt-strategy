import { BadRequestException, Body, Controller, Post, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignInRequestDto } from './dto/signin.request.dto';
import { SignUpRequestDto } from './dto/signup.request.dto';
import { ConfirmSignUpRequestDto } from './dto/confirm_signup.request.dto';
import { ApiKeyAuthGuard } from './guard/apikey-auth.guard';

@UseGuards(ApiKeyAuthGuard)
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  async singup(@Body() signupRequest: SignUpRequestDto) {
    try {
      return await this.authService.signup(signupRequest);
    } catch (e) {
      throw new BadRequestException(e.message);
    }
  }

  @Post('confirm_signup')
  async register(@Body() confirmsignupRequest: ConfirmSignUpRequestDto) {
    try {
      return await this.authService.confirm_signup(confirmsignupRequest);
    } catch (e) {
      throw new BadRequestException(e.message);
    }
  }

  @Post('signin')
  async signin(@Body() signinRequest: SignInRequestDto) {
    try {
      return await this.authService.signin(signinRequest);
    } catch (e) {
      throw new BadRequestException(e.message);
    }
  }
}