import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { SPADeploy } from 'cdk-spa-deploy';

export class ChessDeploymentStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    new SPADeploy(this, 'ChessSpaDeploy')
      .createSiteFromHostedZone({
        indexDoc: 'index.html',
        errorDoc: 'index.html',
        zoneName: 'autom8.cloud',
        subdomain: 'chess',
        websiteFolder: '../react-chess/build', // Path to the React app build folder
      });
  }
}