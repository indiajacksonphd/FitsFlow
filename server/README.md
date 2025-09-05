# Section 3 — Server Side (Backend & AWS Services)

This directory contains all backend logic, permissions, and infrastructure for FitsFlow.

---

## AWS Services Used

- **API Gateway**  
  Provides the HTTP interface for the application. Routes requests to the Trigger Lambda, which issues presigned S3 URLs and kicks off processing.  
  → See `iam_policies/api_gateway.md` for the CORS configuration.

- **Lambda Functions**  
  Lightweight handlers for all server-side logic.  
  - `trigger_lambda.py` → generate presigned URLs, trigger main processing.  
  - `main_lambda.py` → read from `temp/`, process, and (optionally) invoke ASDF Lambda.  
  - `asdf_lambda.py` → generate ASDF files and manifests.  
  - `clean_lambda.py` → nightly cleanup, run via EventBridge.  

- **S3**  
  Central storage for inputs and outputs.  
  - `temp/{session_id}/...` → incoming uploads.  
  - `processed/` → processed outputs.  
  - `daily_videos/` → auto-generated SDO videos.  
  → See `iam_policies/s3_bucket.md` for bucket policy and CORS config.

- **CloudFront (OAC)**  
  Used as a CDN in front of the S3 bucket. Access is granted in the S3 bucket policy via the CloudFront distribution ARN.  
  (No separate IAM policy file required.)

- **EventBridge**  
  Runs the Clean Lambda nightly on a cron schedule (`cron(0 4 * * ? *)`).  
  Permissions are set via a Lambda **resource-based policy** (`lambda:AddPermission`).  
  (No separate IAM policy file required.)

- **CloudWatch Logs**  
  Stores logs for each Lambda. Permissions are provided by the AWS-managed policy `AWSLambdaBasicExecutionRole`.  
  (No separate IAM policy file required.)

- **Route 53**  
  Provides DNS routing from `fitsflow.org` to the CloudFront distribution.  
  No application IAM needed unless automating DNS updates.  
  (No separate IAM policy file required.)

- **EC2 Worker (optional)**  
  Can be triggered via SSM Run Command for heavy processing tasks. Not currently active in production, but code stubs are in `lambda_layers/`.

---

## Permissions & CORS
- Detailed IAM JSONs are stored in `iam_policies/` (Trigger, Main, ASDF, Clean, S3, API Gateway).  
- Non-IAM services (CloudFront, EventBridge, CloudWatch Logs, Route 53) are documented here only.  
- CORS is configured at API Gateway and S3 bucket level. See:
  - `iam_policies/api_gateway.md`  
  - `iam_policies/s3_bucket.md`

---

## Lambda Layers
Prebuilt dependency bundles are stored in `lambda_layers/`.  
Each ZIP can be uploaded directly in the AWS Console as a Layer (built on Amazon Linux EC2 for compatibility with Lambda runtime).
