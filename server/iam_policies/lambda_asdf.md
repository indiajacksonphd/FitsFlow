# Lambda ASDF IAM Policy

This role powers the `FitsFlow-ASDF` Lambda.

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
    }
  ]
}
```
