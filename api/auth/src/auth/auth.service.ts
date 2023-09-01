import { Injectable, HttpException } from '@nestjs/common';
import { SignUpRequestDto } from './dto/signup.request.dto';
import { SignInRequestDto } from './dto/signin.request.dto';
import { ConfirmSignUpRequestDto } from './dto/confirm_signup.request.dto';
import { CognitoIdentityServiceProvider } from 'aws-sdk';
import { InitiateAuthRequest } from 'aws-sdk/clients/cognitoidentityserviceprovider';
import { SignUpRequest } from 'aws-sdk/clients/cognitoidentityserviceprovider';
import { ConfirmSignUpRequest } from 'aws-sdk/clients/cognitoidentityserviceprovider';
import { ConfigService } from '@nestjs/config';
import { SSMClient, GetParameterCommand } from "@aws-sdk/client-ssm";
import { response } from 'express';
import * as AWS from "@aws-sdk/client-secrets-manager";

  const cognito = new CognitoIdentityServiceProvider();
  
  @Injectable()
  export class AuthService {
        
    async validateApiKey(apiKey: string) {
        
        let param: any;
        let secret_object: any;

        // SSM Strategy - Retrieve secret ARN from Prameter Store 
        // Validate apikey using Parameter Store 
        const client = new SSMClient();
        const input = { // GetParameterRequest
        Name: process.env.SECRET_PARAMETER!, // required
        WithDecryption: true || false,
        };
        try {
            const command = new GetParameterCommand(input);
            const response = await client.send(command);
            param = response.Parameter.Value
            console.log("REcovered Parameter:");
            console.log(param);
        } catch (e) {
            throw new HttpException(e.text, e.status);
        }

        // Secret Manager Strategy - Retrieve API KEY from Secret Manager 
        // Validate apikey using Secret Manager
        const secretManager = new AWS.SecretsManager({region: 'us-east-1',});  
        const secret_client = new AWS.SecretsManagerClient();
        const secret_input = { // GetSecretValueRequest
          SecretId: process.env.SECRET_ARN! // required
        };
        const command = new AWS.GetSecretValueCommand(secret_input);
        const secret_response = await secret_client.send(command);    
        secret_object = JSON.parse(secret_response.SecretString);

        // Evaluate apikey comparing to recovered secret.
        if (Object.values(secret_object)[0] === apiKey){
            return true;
        }
        return false;
        

    }

    async signup(authRegisterRequest: SignUpRequestDto) {
      const { name, email, password } = authRegisterRequest;

      const params: SignUpRequest = {
		ClientId: process.env.CLIENT_ID!,
		Username: name,
		Password: password,
		UserAttributes: [{ Name: 'email', Value: email }],
	  };
      try {
		const res = await cognito.signUp(params).promise();
		console.log('[AUTH]', res);

        return {
            statusCode: 200,
            body: JSON.stringify({
                message: res,
            }),
        };
      } catch (err) {
        console.error(err);
        return {
            statusCode: 500,
            body: JSON.stringify({
                message: err,
            }),
        };
      }
    }

    async confirm_signup(confirmRequest: ConfirmSignUpRequestDto) {
        const { name, code } = confirmRequest;
        const params: ConfirmSignUpRequest = {
            ClientId: process.env.CLIENT_ID!,
            Username: name,
            ConfirmationCode: code,
        };
    
        try {
            const res = await cognito.confirmSignUp(params).promise();
            console.log('[AUTH]', res);
    
            return {
                statusCode: 200,
                body: JSON.stringify({
                    message: `User ${name} successfully confirmed`,
                    confirmed: true,
                }),
            };
        } catch (err) {
            return {
                statusCode: 500,
                body: JSON.stringify({
                    message: err,
                }),
            };
        }
    }    

    async signin(user: SignInRequestDto) {
        
        const { name, password } = user;
        const params: InitiateAuthRequest = {
            ClientId: process.env.CLIENT_ID!,
            AuthFlow: 'USER_PASSWORD_AUTH',
            AuthParameters: {
                USERNAME: name,
                PASSWORD: password,
            },
        };

        try {
            const { AuthenticationResult } = await cognito.initiateAuth(params).promise();
            console.log('[AUTH]', AuthenticationResult);
    
            if (!AuthenticationResult) {
                return {
                    statusCode: 400,
                    body: JSON.stringify({
                        message: 'User signin failed',
                    }),
                };
            }
    
            const token = AuthenticationResult.IdToken;
    
            return {
                statusCode: 200,
                headers: {
                    'Access-Control-Allow-Headers': '*',
                    'Access-Control-Allow-Origin': '*',
                    'Set-Cookie': `token=${token}; SameSite=None; Secure; HttpOnly; Path=/; Max-Age=3600;`,
                },
                body: JSON.stringify({
                    message: 'Auth successfull',
                    token: token,
                }),
            };
        } catch (err) {
            console.error(err);
    
            return {
                statusCode: 500,
                body: JSON.stringify({
                    message: err,
                }),
            };
        }

    }
  }