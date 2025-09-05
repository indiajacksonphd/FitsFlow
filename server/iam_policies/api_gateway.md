# API Gateway CORS Configuration

This document shows the CORS configuration for the **FitsFlow Trigger API Gateway**.

---

## CORS Settings

```json
{
  "CorsConfiguration": {
    "AllowOrigins": [
      "http://127.0.0.1:5500",
      "http://localhost:5500",
      "https://fitsflow.org",
      "https://www.fitsflow.org"
    ],
    "AllowMethods": ["GET", "OPTIONS"],
    "AllowHeaders": [],
    "ExposeHeaders": [],
    "MaxAge": 600,
    "AllowCredentials": false
  }
}
```
