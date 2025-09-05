import os
import boto3
from datetime import datetime, timedelta, timezone
import daily_videos  # <-- your original file

# ---- ENV (set these in Lambda console) ----
BUCKET_NAME   = os.environ.get("BUCKET_NAME", "<BUCKET_NAME>")
DEST_FOLDER   = os.environ.get("DEST_FOLDER", "daily_videos")
DAYS_BACK     = int(os.environ.get("DAYS_BACK", "2"))            # 1=yesterday
TEMP_PREFIX   = os.environ.get("TEMP_PREFIX", "temp/")           # S3 temp/ cleaner
KEEP_MARKER   = os.environ.get("KEEP_MARKER", "1") == "1"        # keep temp/.keep
RUN_CLEAN     = os.environ.get("RUN_CLEAN", "1") == "1"          # run the S3 cleaner
# -------------------------------------------

s3 = boto3.client("s3")

# Ensure your script's globals match env (optional but helpful)
daily_videos.BUCKET_NAME = BUCKET_NAME
daily_videos.DEST_FOLDER = DEST_FOLDER

os.environ["PATH"] = "/opt/python/bin:/opt/bin:" + os.environ.get("PATH", "")

def clean_s3_temp(bucket, prefix, keep_marker=True):
    """Delete all objects under prefix, optionally preserving a marker so prefix stays visible."""
    keep = {f"{prefix}.keep", prefix} if keep_marker else set()
    deleted = 0
    paginator = s3.get_paginator("list_objects_v2")
    for page in paginator.paginate(Bucket=bucket, Prefix=prefix):
        keys = [obj["Key"] for obj in page.get("Contents", [])]
        to_delete = [{"Key": k} for k in keys if k not in keep]
        for i in range(0, len(to_delete), 1000):
            if to_delete[i:i+1000]:
                s3.delete_objects(Bucket=bucket, Delete={"Objects": to_delete[i:i+1000]})
                deleted += len(to_delete[i:i+1000])
    if keep_marker:
        # ensure marker so folder shows in console
        head = s3.list_objects_v2(Bucket=bucket, Prefix=prefix, MaxKeys=5)
        existing = {o["Key"] for o in head.get("Contents", [])}
        if not (existing & keep):
            s3.put_object(Bucket=bucket, Key=f"{prefix}.keep", Body=b"")
    return deleted

def lambda_handler(event, context):
    """
    By default runs: (1) clean S3 temp/, then (2) build & upload daily video.
    To run only one step, pass event={"action": "clean"} or {"action": "video"}.
    """
    action = (event or {}).get("action")
    result = {"bucket": BUCKET_NAME}

    # 0) Optionally clean S3 temp/
    if action in (None, "clean", "both") and RUN_CLEAN:
        deleted = clean_s3_temp(BUCKET_NAME, TEMP_PREFIX, keep_marker=KEEP_MARKER)
        result["clean_deleted"] = deleted
        if action == "clean":
            return {"ok": True, **result}

    # 1) Build the date
    date_str = (datetime.now(timezone.utc) - timedelta(days=DAYS_BACK)).strftime("%Y%m%d")
    result["date"] = date_str
    if action == "clean":    # safety
        return {"ok": True, **result}

    # 2) Use your script's helpers with a /tmp working dir (no changes in your file)
    work = f"/tmp/sdo_temp_{date_str}"
    os.makedirs(work, exist_ok=True)
    filelist_txt = os.path.join(work, "file_list.txt")
    out_path = os.path.join(work, f"{date_str}_stitched.mp4")

    # download
    downloaded = daily_videos.download_videos(date_str, work)
    if not downloaded:
        return {"ok": False, "reason": "no_inputs", **result}

    # concat list
    daily_videos.create_ffmpeg_filelist(downloaded, filelist_txt)

    # stitch (your function calls 'ffmpeg' — PATH already includes /opt/bin)
    daily_videos.stitch_videos_ffmpeg(filelist_txt, out_path)

    # upload
    s3_key = f"{DEST_FOLDER}/{os.path.basename(out_path)}"
    daily_videos.upload_to_s3(out_path, s3_key)
    result["s3_key"] = s3_key

    # best-effort clean /tmp
    for p in downloaded + [filelist_txt, out_path]:
        try: os.remove(p)
        except: pass

    return {"ok": True, **result}
