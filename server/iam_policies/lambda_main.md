# Lambda Trigger IAM Policy

This role powers the `FitsFlow-Trigger` Lambda. It requires access to CloudWatch Logs, scoped S3 permissions, and the ability to invoke the main processing Lambda.

## Attached Managed Policy

**AWSLambdaBasicExecutionRole** (AWS-managed)

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "logs:CreateLogGroup",
                "logs:CreateLogStream",
                "logs:PutLogEvents"
            ],
            "Resource": "*"
        }
    ]
}
```

**Inline Policy**

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["s3:GetObject"],
      "Resource": "arn:aws:s3:::<BUCKET_NAME>/temp/*"
    },
    {
      "Effect": "Allow",
      "Action": ["s3:PutObject","s3:PutObjectTagging"],
      "Resource": "arn:aws:s3:::<BUCKET_NAME>/temp/*"
    },
    {
      "Effect": "Allow",
      "Action": ["s3:ListBucket"],
      "Resource": "arn:aws:s3:::<BUCKET_NAME>",
      "Condition": { "StringLike": { "s3:prefix": ["temp/*"] } }
    },
    {
      "Effect": "Allow",
      "Action": ["lambda:InvokeFunction"],
      "Resource": "arn:aws:lambda:<REGION>:<ACCOUNT_ID>:function:<ASDF_FUNCTION_NAME>"
    }
  ]
}

```
