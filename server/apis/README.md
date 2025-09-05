# FitsFlow APIs & Triggers

This project has **two backend entry points**:  
1. API Gateway → Lambda Trigger  
2. EventBridge → Clean Lambda  

---

## 1) API Gateway — FitsFlow-2-Trigger

- **Name**: FitsFlow-2-Trigger-API  
- **Type**: HTTP  
- **Authorization**: NONE  
- **CORS**: No  
- **Detailed metrics enabled**: No  
- **isComplexStatement**: No  
- **Method**: ANY  
- **Resource path**: `/FitsFlow-2-Trigger`  
- **Stage**: `default`  
- **Service principal**: `apigateway.amazonaws.com`  

---

## 2) EventBridge — Clean Lambda

- **Name**: clean-movies  
- **Rule state**: ENABLED  
- **Description**: delete temp files and create daily movies  
- **Event bus**: default  
- **isComplexStatement**: No  
- **Schedule expression**: `cron(0 4 * * ? *)`  
- **Service principal**: `events.amazonaws.com`  
