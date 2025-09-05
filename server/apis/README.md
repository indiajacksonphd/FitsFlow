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
- **Statement ID**: `lambda-1887ff8c-08bc-4e20-b2ec-d1c4196504b6`  
- **API Endpoint**:  


---

## 2) EventBridge — Clean Lambda

- **Name**: clean-movies  
- **Rule state**: ENABLED  
- **Description**: delete temp files and create daily movies  
- **Event bus**: default  
- **isComplexStatement**: No  
- **Schedule expression**: `cron(0 4 * * ? *)`  
- **Service principal**: `events.amazonaws.com`  
- **Statement ID**: `lambda-12cc996b-49ad-4134-92a9-f41d7acbc955`  
