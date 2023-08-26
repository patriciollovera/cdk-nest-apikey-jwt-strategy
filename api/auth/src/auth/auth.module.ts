import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { ApiKeyStrategy } from './strategy/apikey.strategy';
import { AuthController } from './auth.controller';
import { AuthConfig } from './auth.config';
import { JwtStrategy } from './strategy/jwt.strategy';
// import { LocalStrategy } from './strategy/local.strategy';
// import { UsersService } from '../users/users.service';



@Module({
  imports: [PassportModule.register({ defaultStrategy: 'jwt' })],
  controllers: [AuthController],
  providers: [AuthConfig, AuthService, ApiKeyStrategy, ConfigService, JwtStrategy],
  exports: [AuthService]
})
export class AuthModule {}
