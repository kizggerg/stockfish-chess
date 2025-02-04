#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { ChessDeploymentStack } from '../lib/chess-deployment-stack';

const app = new cdk.App();
const env = {
  account: process.env.CDK_DEFAULT_ACCOUNT!,
  region: process.env.CDK_DEFAULT_REGION!
};

new ChessDeploymentStack(app, 'ChessDeploymentStack', { env });