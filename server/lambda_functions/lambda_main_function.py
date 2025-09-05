import boto3
import os
import json
from test_fitsflow_function import process_fits_info, save_log_to_s3

def lambda_handler(event, context):

    session_id = event.get("queryStringParameters", {}).get("session_id", "missing")
    bucket = "helioconvert-sdo"
    prefix = f"temp/{session_id}/fits/"
    local_dir = "/tmp/temp_fits"
    os.makedirs(local_dir, exist_ok=True)

    s3 = boto3.client("s3")
    response = s3.list_objects_v2(Bucket=bucket, Prefix=prefix)

    file_paths = []
    for obj in response.get("Contents", []):
        key = obj["Key"]
        if key.endswith(".fits"):
            filename = key.split("/")[-1]
            local_path = os.path.join(local_dir, filename)
            s3.download_file(bucket, key, local_path)
            file_paths.append(local_path)

    print(f"✅ Downloaded {len(file_paths)} FITS files")
    save_log_to_s3(session_id, "download_summary", f"Downloaded {len(file_paths)} FITS files")

    output_files, skipped_files = process_fits_info(file_paths, bucket, session_id)

    return