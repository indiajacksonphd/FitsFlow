# S3 Bucket Policy & CORS

This document shows the S3 bucket policy and CORS configuration used by FitsFlow.  
Identifiers (bucket name, account ID, distribution ID) are redacted with placeholders.

---

## Bucket Policy

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowCloudFrontReadAll",
      "Effect": "Allow",
      "Principal": {
        "Service": "cloudfront.amazonaws.com"
      },
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::<BUCKET_NAME>/*",
      "Condition": {
        "StringEquals": {
          "AWS:SourceArn": "arn:aws:cloudfront::<ACCOUNT_ID>:distribution/<DIST_ID>"
        }
      }
    },
    {
      "Sid": "AllowCloudFrontWriteTempOnly",
      "Effect": "Allow",
      "Principal": {
        "Service": "cloudfront.amazonaws.com"
      },
      "Action": [
        "s3:PutObject",
        "s3:AbortMultipartUpload"
      ],
      "Resource": "arn:aws:s3:::<BUCKET_NAME>/temp/*",
      "Condition": {
        "StringEquals": {
          "AWS:SourceArn": "arn:aws:cloudfront::<ACCOUNT_ID>:distribution/<DIST_ID>"
        }
      }
    }
  ]
}
```

## Cross-Origin Resource Sharing (CORS)

```json

[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["PUT", "GET", "HEAD"],
    "AllowedOrigins": [
      "https://<DOMAIN>",
      "https://www.<DOMAIN>",
      "http://127.0.0.1:5500",
      "http://localhost:5500"
    ],
    "ExposeHeaders": [
      "ETag",
      "Content-Length",
      "Content-Type",
      "Last-Modified",
      "Content-Disposition",
      "Accept-Ranges",
      "Content-Range"
    ],
    "MaxAgeSeconds": 600
  }
]
```
