import os, json, urllib.parse, boto3

s3 = boto3.client("s3")
lambda_client = boto3.client("lambda")

BUCKET = "<BUCKET_NAME>"
MAIN_FUNCTION = "FitsFlow-2"

def lambda_handler(event, _ctx):
    q = event.get("queryStringParameters") or {}
    session_id  = q.get("session_id", "").strip()
    filename    = q.get("filename", "").strip()
    contentType = urllib.parse.unquote(q.get("contentType") or "application/fits")

    if not session_id:
        return _resp(400, {"error": "session_id required"})

    # --- Mode A: presign for PUT (filename present) ---
    if filename:
        key = f"temp/{session_id}/fits/{filename}"
        url = s3.generate_presigned_url(
            "put_object",
            Params={
                "Bucket": BUCKET,
                "Key": key,
                "ContentType": contentType,
                "ServerSideEncryption": "AES256",  # include only if you will send this header on PUT
            },
            ExpiresIn=300
        )
        return _resp(200, {"url": url, "key": key})

    # --- Mode B: trigger main processing (no filename) ---
    lambda_client.invoke(
        FunctionName=MAIN_FUNCTION,
        InvocationType="Event",  # async
        # Payload=json.dumps({"session_id": session_id})
        Payload=json.dumps({
            "queryStringParameters": {
                "session_id": session_id
            }
        })
    )
    return _resp(200, {"status": "Processing Started!", "session_id": session_id})

def _resp(status, body):
    return {
        "statusCode": status,
        "headers": {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*"  # or your exact origin
        },
        "body": json.dumps(body)
    }
