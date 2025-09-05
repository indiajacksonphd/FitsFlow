import os
import requests
import subprocess
from datetime import datetime, timedelta
import boto3
import random

BUCKET_NAME = 'helioconvert-sdo'
DEST_FOLDER = 'daily_videos'
WAVELENGTHS = ['0094', '0131', '0171', '0193', '0211', '0304', '0335', '1600', '1700', 'HMIIC', 'HMIB']


def build_url(date_str, wave):
    y, m, d = date_str[:4], date_str[4:6], date_str[6:]
    return f"https://sdo.gsfc.nasa.gov/assets/img/dailymov/{y}/{m}/{d}/{date_str}_1024_{wave}.mp4"


def download_videos(date_str, download_dir):
    os.makedirs(download_dir, exist_ok=True)
    downloaded = []
    for wave in WAVELENGTHS:
        url = build_url(date_str, wave)
        filename = f"{date_str}_1024_{wave}.mp4"
        filepath = os.path.join(download_dir, filename)
        print(f"📥 Attempting: {url}")
        try:
            r = requests.get(url, stream=True, timeout=5)
            if r.status_code == 200:
                with open(filepath, 'wb') as f:
                    for chunk in r.iter_content(chunk_size=8192):
                        f.write(chunk)
                downloaded.append(filepath)
                print(f"✔️ Downloaded: {filename}")
            else:
                print(f"❌ Not found: {filename}")
        except Exception as e:
            print(f"⚠️ Failed to fetch {url}: {e}")
    return downloaded


def create_ffmpeg_filelist(file_paths, filelist_path):
    with open(filelist_path, 'w') as f:
        for path in file_paths:
            f.write(f"file '{os.path.basename(path)}'\n")


def stitch_videos_ffmpeg(filelist_path, output_path):
    print("🔄 Stitching with ffmpeg...")
    working_dir = os.path.dirname(filelist_path)
    result = subprocess.run([
        'ffmpeg', '-f', 'concat', '-safe', '0',
        '-i', os.path.basename(filelist_path),
        '-c', 'copy', output_path
    ], cwd=working_dir)

    if result.returncode == 0:
        print(f"✅ Stitched video saved to: {output_path}")
    else:
        raise RuntimeError("❌ FFmpeg failed to stitch videos.")


def upload_to_s3(filepath, s3_key):
    s3 = boto3.client('s3')
    s3.upload_file(filepath, BUCKET_NAME, s3_key)
    print(f"🚀 Uploaded to s3://{BUCKET_NAME}/{s3_key}")


def main(date_str):
    # random.shuffle(WAVELENGTHS)
    working_dir = f"sdo_temp_{date_str}"
    output_file = os.path.abspath(os.path.join(working_dir, f"{date_str}_stitched.mp4"))
    filelist_txt = os.path.join(working_dir, 'file_list.txt')

    video_paths = download_videos(date_str, working_dir)
    if not video_paths:
        print("❌ No valid videos downloaded.")
        return

    create_ffmpeg_filelist(video_paths, filelist_txt)
    os.makedirs(os.path.dirname(output_file), exist_ok=True)
    stitch_videos_ffmpeg(filelist_txt, output_file)

    s3_key = f"{DEST_FOLDER}/{os.path.basename(output_file)}"
    upload_to_s3(output_file, s3_key)


if __name__ == "__main__":
    two_days_ago = datetime.now() - timedelta(days=2)
    date_str = two_days_ago.strftime("%Y%m%d")
    print(f"📅 Processing daily video for: {date_str}")
    main(date_str)
