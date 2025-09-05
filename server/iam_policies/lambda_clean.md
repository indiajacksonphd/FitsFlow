# Lambda Clean IAM Policy

This role powers the `FitsFlow-Clean` Lambda. It deletes temporary session data under `temp/` and maintains daily SDO video artifacts under `daily_videos/`.

---

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
      "Sid": "ListTemp",
      "Effect": "Allow",
      "Action": ["s3:ListBucket"],
      "Resource": "arn:aws:s3:::<BUCKET_NAME>",
      "Condition": { "StringLike": { "s3:prefix": ["temp/*"] } }
    },
    {
      "Sid": "CleanTemp",
      "Effect": "Allow",
      "Action": ["s3:GetObject","s3:DeleteObject","s3:DeleteObjectTagging","s3:PutObject"],
      "Resource": "arn:aws:s3:::<BUCKET_NAME>/temp/*"
    },
    {
      "Sid": "WriteDailyVideos",
      "Effect": "Allow",
      "Action": ["s3:PutObject","s3:AbortMultipartUpload","s3:ListMultipartUploadParts","s3:PutObjectTagging"],
      "Resource": "arn:aws:s3:::<BUCKET_NAME>/daily_videos/*"
    },
    {
      "Sid": "ListForDailyVideos",
      "Effect": "Allow",
      "Action": ["s3:ListBucket","s3:ListBucketMultipartUploads"],
      "Resource": "arn:aws:s3:::<BUCKET_NAME>",
      "Condition": { "StringLike": { "s3:prefix": ["daily_videos/*"] } }
    }
  ]
}
```
