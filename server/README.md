## server/ (Section 3 — Server Side)

**Purpose:** All AWS backend code and configuration.  

Contents:
- `lambda/` — Lambda functions  
- `worker/` — EC2 worker code (triggered via SSM)  
- `lambda_layers/` — downloadable dependency ZIPs  
- `permissions/` — IAM JSONs, CORS configs, backend_services.md  
- `infra/` — SAM/CDK/Terraform templates  

Add a **server/README.md**:

# Section 3 — Server Side (Backend & AWS Services)

This directory contains all of the backend logic, permissions, and infrastructure for FitsFlow.

## AWS Services Used
- **API Gateway** — routes (`/upload`, `/manifest`, `/poll`) to Lambda
- **Lambda** — lightweight handlers
  - `main_lambda.py` (upload → S3, optional EC2 trigger)
  - `manifest_lambda.py` (read manifest.json from S3)
  - `poll_lambda.py` (optional CloudWatch log tail)
  - `asdf_lambda.py` (post-processing/manifest update)
  - `clean_lambda.py` (nightly cleanup via EventBridge)
- **S3** — `temp/{session_id}/input/` and `.../processed/`
- **EC2 Worker** — heavy tasks via SSM Run Command
- **EventBridge** — nightly cron job for cleanup
- **CloudWatch Logs** — log storage (optional polling)

## Permissions & CORS
See `permissions/backend_services.md` for IAM JSONs and required roles.  
CORS is configured via `CORS_ORIGIN` env var (frontend domain).

## Lambda Layers
Prebuilt dependency bundles live in `lambda_layers/`.  
Each ZIP can be uploaded directly in the AWS Console as a Layer.  

