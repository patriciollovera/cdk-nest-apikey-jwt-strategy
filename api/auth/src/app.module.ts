import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth/auth.service';
// import { JwtStrategy } from './auth/strategy/jwt.strategy';
// import { JwtService } from '@nestjs/jwt';
import { UsersModule } from './users/users.module';
// import { UsersService } from './users/users.service';
import { DevicesModule } from './devices/devices.module';

@Module({
  imports: [AuthModule, UsersModule, DevicesModule],
  controllers: [AppController],
  providers: [AppService, ConfigService, AuthService],
})
export class AppModule {}
