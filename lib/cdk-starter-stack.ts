import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as cdk from 'aws-cdk-lib';

export class CdkStarterStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const vpc = new ec2.Vpc(this, 'my-cdk-vpc', {
      cidr: '10.0.0.0/16',
      natGateways: 0,
      maxAzs: 3,
      subnetConfiguration: [
        {
          name: 'public-subnet-1',
          subnetType: ec2.SubnetType.PUBLIC,
          cidrMask: 24,
        },
      ],
    });

    // 👇 Create a SG for a web server
    const webserverSG = new ec2.SecurityGroup(this, 'web-server-sg', {
      vpc,
      allowAllOutbound: true,
      description: 'security group for a web server',
    });

    webserverSG.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(22),
      'allow SSH access from anyhwere',
    );

    webserverSG.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      'allow HTTP traffic from anywhere',
    );

    webserverSG.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'allow HTTPS traffic from anywhere',
    );

    webserverSG.addIngressRule(
      ec2.Peer.ipv4('123.123.123.123/16'),
      ec2.Port.allIcmp(),
      'allow ICMP traffic from a specific IP range',
    );

    // 👇 Create a SG for a backend server
    const backendServerSG = new ec2.SecurityGroup(this, 'backend-server-sg', {
      vpc,
      allowAllOutbound: true,
      description: 'security group for a backend server',
    });
    backendServerSG.connections.allowFrom(
      new ec2.Connections({
        securityGroups: [webserverSG],
      }),
      ec2.Port.tcp(8000),
      'allow traffic on port 8000 from the webserver security group',
    );

    // 👇 Create a SG for a database server
    const dbserverSG = new ec2.SecurityGroup(this, 'database-server-sg', {
      vpc,
      allowAllOutbound: true,
      description: 'security group for a database server',
    });

    dbserverSG.connections.allowFrom(
      new ec2.Connections({
        securityGroups: [backendServerSG],
      }),
      ec2.Port.tcp(3306),
      'allow traffic on port 3306 from the backend server security group',
    );

    // 👇 create a SG with custom Outbound rules
    const customOutboundSG = new ec2.SecurityGroup(this, 'custom-outbound-sg', {
      vpc,
      allowAllOutbound: false,
      description: 'a security group with custom outbound rules',
    });

    customOutboundSG.addEgressRule(
      ec2.Peer.ipv4('10.0.0.0/16'),
      ec2.Port.tcp(3306),
      'allow outgoing traffic on port 3306',
    );

    customOutboundSG.addEgressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      'allow outgoing traffic on port 80',
    );
  }
}
