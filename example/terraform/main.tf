# AWSプロバイダーの設定
provider "aws" {
  region = "ap-northeast-1"  # 東京リージョン
}

# 変数の定義
variable "instance_type" {
  description = "EC2インスタンスタイプ"
  type        = string
  default     = "t2.micro"
}

# VPCの作成
resource "aws_vpc" "main" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name = "example-vpc"
  }
}

# パブリックサブネットの作成
resource "aws_subnet" "public" {
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.1.0/24"
  availability_zone = "ap-northeast-1a"

  tags = {
    Name = "example-public-subnet"
  }
}

# EC2インスタンスの作成
resource "aws_instance" "example" {
  ami           = "ami-0d979355d03fa2522"  # Amazon Linux 2 AMI
  instance_type = var.instance_type
  subnet_id     = aws_subnet.public.id

  tags = {
    Name = "example-instance"
  }
}

# 出力の定義
output "instance_id" {
  description = "作成されたEC2インスタンスのID"
  value       = aws_instance.example.id
}

output "public_ip" {
  description = "EC2インスタンスのパブリックIP"
  value       = aws_instance.example.public_ip
}
