resource "aws_iam_policy" "policy_5" {
  name = "policy-5"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect   = "Allow"
      Action   = "ec2:RunInstances"
      Resource = "*"
      Condition = {
        # instance type is one of t3.micro, t3.small, t3.medium
        StringEquals = {
          "ec2:InstanceType" = ["t3.micro", "t3.small", "t3.medium"]
          "aws:RequestedRegion" = [
            "us-east-1",
            "us-west-2"
          ]
        }
      }
    }]
  })
}