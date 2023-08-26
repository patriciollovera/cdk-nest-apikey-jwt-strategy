import { Injectable } from '@nestjs/common';

@Injectable()
export class AuthConfig {
  public userPoolId: string = process.env.USERPOOL_ID;
  public clientId: string = process.env.CLIENT_ID;
  public region: string = "us-east-1";
  public authority = `https://cognito-idp.us-east-1.amazonaws.com/${process.env.USERPOOL_ID}`;
}