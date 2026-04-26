terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = "eu-central-1"
}

resource "aws_db_instance" "legal_db" {
  allocated_storage    = 20
  engine               = "postgres"
  engine_version       = "15.3"
  instance_class       = "db.t3.micro"
  db_name              = "legal_db"
  username             = "admin"
  password             = "password_please_change"
  parameter_group_name = "default.postgres15"
  skip_final_snapshot  = true
}

output "db_endpoint" {
  value = aws_db_instance.legal_db.endpoint
}
