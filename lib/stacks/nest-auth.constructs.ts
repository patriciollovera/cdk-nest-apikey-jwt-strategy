import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';

import * as lambda from "aws-cdk-lib/aws-lambda";
import * as gateway from "aws-cdk-lib/aws-apigateway";
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import { UserPool } from 'aws-cdk-lib/aws-cognito';
import { Cors, EndpointType, IResource, LambdaIntegration, RestApi } from 'aws-cdk-lib/aws-apigateway';
import * as ssm from "aws-cdk-lib/aws-ssm";
import * as secretsmanager from "aws-cdk-lib/aws-secretsmanager";
import { CfnParameter} from 'aws-cdk-lib';


export interface AuthApiProps {
	userPoolId: string;
	userPoolClientId: string;
};


export class nestAuthstack extends Construct {
	private auth: IResource;
	private userPoolId: string;
	private userPoolClientId: string;

  constructor(scope: Construct, id: string, props: AuthApiProps)
    {
      super(scope, id);
  
      ({ userPoolId: this.userPoolId, userPoolClientId: this.userPoolClientId } = props);

    const apiKey = 'API_KEY';
    const ssmParam = ssm.StringParameter.fromSecureStringParameterAttributes(
      this,
      'ssmParameter',
      {
        parameterName: apiKey,
      }
    );
    
    
    // Create Secret in Secret Manager
    const secret = new secretsmanager.Secret(this, 'Secret', {
      generateSecretString: {
          generateStringKey: 'api_key',
          secretStringTemplate: JSON.stringify({ username: 'web_user' }),
          excludeCharacters: ' %+~`#$&*()|[]{}:;<>?!\'/@"\\',
      },
    });

    // create an SSM parameters which stores secret ARN
    new ssm.StringParameter(this, 'apikeyparameter', {
      parameterName: `API_KEY`,
      stringValue: secret.secretArn
    });


      // pack all external deps in layer
    const nestAuthLayer = new cdk.aws_lambda.LayerVersion(this, "nestAuthLayer", {
      code: cdk.aws_lambda.Code.fromAsset("api/auth/node_modules"),
      compatibleRuntimes: [
        cdk.aws_lambda.Runtime.NODEJS_16_X,
      ],
    });
        
    // add handler to respond to all our api requests
    const nestAuthLambda = new cdk.aws_lambda.Function(this, "nestAuthHandler", {
      runtime: cdk.aws_lambda.Runtime.NODEJS_16_X,
      code: lambda.Code.fromAsset("api/auth/dist"),
      handler: "main.api",
      layers: [nestAuthLayer],
      timeout: cdk.Duration.seconds(10),
      environment: {
        NODE_PATH: "$NODE_PATH:/opt",
				CLIENT_ID: this.userPoolClientId,
        USERPOOL_ID: this.userPoolId,
        API_KEY: apiKey,
        SECRET_ARN: secret.secretArn,
        SECRET_PARAMETER: apiKey
      },
    });

    // Allow Lambda to read from SSM Parameter Store
    ssmParam.grantRead(nestAuthLambda);

    

    const nestapi = new cdk.aws_apigateway.RestApi(this, `nestAuthEndpoint`, {
      restApiName: `nestAuthLambda`,
      defaultMethodOptions: {
        apiKeyRequired: false,
      },
      deployOptions: {
        stageName: 'v1',
      },
      defaultCorsPreflightOptions: {
				allowOrigins: Cors.ALL_ORIGINS,
			},

    });

    
    

    secret.grantRead(nestAuthLambda);


    // Asign secret as API Key
    // add api key to enable monitoring
    const api_Key = nestapi.addApiKey('ApiKey', {
      apiKeyName: `web-app-key`,
      value: secret.secretValueFromJson('api_key').unsafeUnwrap(),
    });
    
    
    const usagePlan = nestapi.addUsagePlan('UsagePlan', {
      description: 'Standard',
      name: 'Standard',
    });

    usagePlan.addApiKey(api_Key);

    usagePlan.addApiStage({
      stage: nestapi.deploymentStage,
    });

    
    // add proxy resource to handle all api requests
    const apiResource = nestapi.root.addProxy({
      defaultIntegration: new cdk.aws_apigateway.LambdaIntegration(nestAuthLambda),
      // anyMethod:  false,  // this is necessary otherwise you get conflict in Methods
    });
   
    new cdk.CfnOutput(this, `nestAuth-gateway`, {
      exportName: `nestAuth-gateway-arn`,
      value: nestapi.restApiName,
    });
      
    }
}