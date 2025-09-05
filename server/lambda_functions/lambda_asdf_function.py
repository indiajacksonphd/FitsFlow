import boto3, io, json
from datetime import datetime
import asdf

s3 = boto3.client("s3")

def lambda_handler(event, context):
    session_id = event["session_id"]
    fname = event["fname"]  # Required
    bucket = "helioconvert-sdo"
    base_key = f"temp/{session_id}/processed"

    # Define relative paths for ASDF tree
    relative_paths = {
        "fits_file": f"./{fname}.fits",
        "npy_data": f"./data/{fname}_data.npy",
        "csv_data": f"./data/{fname}_data.csv",
        "hek_json": f"./hek/{fname}_hek.json",
        "header_txt": f"./header/{fname}_header.txt",
        "image_sdo": f"./images/sdo/{fname}.png",
        "image_jsoc": f"./images/jsoc/{fname}.png"
    }

    # Pull HEK data from S3
    hek_obj = s3.get_object(Bucket=bucket, Key=f"{base_key}/hek/{fname}_hek.json")
    hek_data = json.loads(hek_obj["Body"].read())

    # Pull header text from S3
    header_obj = s3.get_object(Bucket=bucket, Key=f"{base_key}/header/{fname}_header.txt")
    header_text = header_obj["Body"].read().decode("utf-8")

    # Build ASDF tree
    tree = {
        "meta": {
            "creator": "Dr. India Jackson",
            "institution": "Georgia State University",
            "nsf_award": "AGS-PRF #2444918",
            "description": "ASDF archive of file paths + HEK metadata + header info for ML-ready workflow.",
            "pipeline_version": "1.0.0",
            "cyberinfrastructure": "FitsFlow",
            "pipeline_timestamp": datetime.utcnow().isoformat() + "Z"
        },
        "fits": {
            "source_file": relative_paths["fits_file"],
            "header": header_text
        },
        "data": {
            "npy_file": relative_paths["npy_data"],
            "csv_file": relative_paths["csv_data"]
        },
        "images": {
            "sdo": relative_paths["image_sdo"],
            "jsoc": relative_paths["image_jsoc"]
        },
        "hek": hek_data
    }

    # Write ASDF to memory
    buffer = io.BytesIO()
    af = asdf.AsdfFile(tree)
    af.write_to(buffer, all_array_compression="zlib")
    buffer.seek(0)

    # Upload ASDF file
    asdf_key = f"{base_key}/asdf/{fname}.asdf"
    s3.put_object(Bucket=bucket, Key=asdf_key, Body=buffer.getvalue())

    return {
        "status": "complete",
        "asdf_key": asdf_key,
        "fname": fname
    }


