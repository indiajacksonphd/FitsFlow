import os
import io
import re
import json
import time
import tempfile
import zipfile
import shutil
import boto3
import requests
import numpy as np
import pandas as pd

from datetime import datetime, timedelta
from dateutil import parser as dtparser
from astropy.io import fits
from astropy import units as u
from astropy.io.fits.card import Undefined
from PIL import Image
from io import BytesIO
import time
import gc


s3 = boto3.client("s3")
lambda_client = boto3.client("lambda")

bucket = "<BUCKET_NAME>"


def save_log_to_s3(session_id, fname=None, message=""):
    if fname:
        log_id = f"{fname}_log"
    else:
        log_id = "general_log"

    prefix = f"temp/{session_id}/logs"
    
    # Get existing log files
    response = s3.list_objects_v2(Bucket=bucket, Prefix=prefix)
    log_files = response.get('Contents', [])

    # Extract highest log number
    max_index = 0
    for obj in log_files:
        match = re.search(rf"{log_id}_(\d+)\.txt$", obj["Key"])
        if match:
            idx = int(match.group(1))
            max_index = max(max_index, idx)

    next_index = max_index + 1
    filename = f"{prefix}/{log_id}_{next_index}.txt"

    s3.put_object(
        Bucket=bucket,
        Key=filename,
        Body=message.encode("utf-8"),
        ContentType="text/plain"
    )


def fetch_hek_events(timestamp, bucket, session_id, fname, duration_minutes=15):
    url = "https://api.helioviewer.org/v2/events/"

    start_time_str = timestamp.strftime("%Y-%m-%dT%H:%M:%SZ")
    end_time = timestamp + timedelta(minutes=duration_minutes)
    end_time_str = end_time.strftime("%Y-%m-%dT%H:%M:%SZ")

    params = {
        "startTime": start_time_str,
        "endTime": end_time_str,
        "sources": "HEK"
    }

    response = requests.get(url, params=params)
    if response.status_code == 200:
        data = response.json()
        s3_key = f"temp/{session_id}/processed/hek/{fname}_hek.json"
        #s3 = boto3.client("s3")
        s3.put_object(Bucket=bucket, Key=s3_key, Body=json.dumps(data, indent=2))
        print(f"HEK data uploaded to S3: {s3_key}")
        save_log_to_s3(session_id, fname, f"HEK data uploaded: https://www.fitsflow.org/{s3_key}")
        return data
    else:
        print(f"Failed to fetch HEK events for {start_time_str}")
        save_log_to_s3(session_id, f"Failed to fetch HEK events for {start_time_str}")
        return []

########################################################################################################################

def get_closest_image_id(date_str, fname, session_id, source_id):
    url = "https://api.helioviewer.org/v2/getClosestImage/"
    params = {"date": date_str, "sourceId": source_id}

    response = requests.get(url, params=params)
    if response.status_code == 200:
        return response.json().get("id")
    else:
        print(f"Failed to get image ID for {date_str} — {response.status_code}")
        save_log_to_s3(session_id, fname, f"Failed to get image ID for {date_str} — {response.status_code}")
        return None



def download_and_save_helioviewer_image(image_id, bucket, session_id, fname, scale=2.0):
    url = f"https://api.helioviewer.org/v2/downloadImage/?id={image_id}&scale={scale}"
    response = requests.get(url)
    
    if response.status_code == 200:
        # s3 = boto3.client("s3")
        s3_key = f"temp/{session_id}/processed/images/sdo/{fname}_sdo.png"
        s3.put_object(Bucket=bucket, Key=s3_key, Body=response.content, ContentType="image/png")
        print(f"SDO PNG uploaded to S3: {s3_key}")
        save_log_to_s3(session_id, fname, f"SDO PNG uploaded: https://www.fitsflow.org/{s3_key}")
        return True
    else:
        print(f"Failed to download image ID {image_id}")
        save_log_to_s3(session_id, fname, f"Failed to download image ID {image_id}")
        return False

def get_closest_jsoc_url(target_dt, fname, session_id, instrument, wavelength=None, content=None):
    year = target_dt.strftime("%Y")
    month = target_dt.strftime("%m")
    day = target_dt.strftime("%d")
    hhmmss = target_dt.strftime("%H%M%S")

    if "AIA" in instrument.upper() and wavelength:
        base_url = f"https://jsoc1.stanford.edu/data/aia/images/{year}/{month}/{day}/{wavelength}/"
        try:
            response = requests.get(base_url)
            if response.status_code != 200:
                print(f"Could not access JSOC index for {target_dt.date()}")
                save_log_to_s3(session_id, fname, f"Could not access JSOC index for {target_dt.date()}")
                return None

            # Extract filenames
            filenames = re.findall(r'href="([^"]+\.jp2)"', response.text)
            if not filenames:
                print(f"No JP2 images found at: {base_url}")
                save_log_to_s3(session_id, fname, f"No JP2 images found at: {base_url}")
                return None

            def extract_dt(name):
                match = re.search(r"(\d{4})_(\d{2})_(\d{2})__"
                                  r"(\d{2})_(\d{2})_(\d{2})_(\d{2,6})", name)
                if match:
                    millisec_str = match[7].ljust(3, '0')[:3]
                    return datetime(
                        int(match[1]), int(match[2]), int(match[3]),
                        int(match[4]), int(match[5]), int(match[6]),
                        int(millisec_str) * 1000
                    )
                return None

            closest_file = min(
                filenames,
                key=lambda fname: abs((extract_dt(fname) - target_dt).total_seconds())
            )
            return base_url + closest_file

        except Exception as e:
            print(f"Error while processing AIA JSOC request: {e}")
            save_log_to_s3(session_id, fname, f"Error while processing AIA JSOC request: {e}")
            return None

    elif "HMI" in instrument.upper() and content:
        content = content.lower().strip()
        if "continuum" in content:
            content_type = "Ic"
        elif "magnetogram" in content:
            content_type = "M"
        else:
            save_log_to_s3(session_id, fname, f"Unknown HMI content type: {content}")
            return None

        base_url = f"https://jsoc1.stanford.edu/data/hmi/images/{year}/{month}/{day}/"
        try:
            response = requests.get(base_url)
            if response.status_code != 200:
                print(f"Could not access JSOC HMI index for {target_dt.date()}")
                save_log_to_s3(session_id, fname, f"Could not access JSOC HMI index for {target_dt.date()}")
                return None

            filenames = re.findall(r'href="(\d{8}_\d{6}_[A-Za-z_]+_4k\.jpg)"', response.text)
            filtered = [f for f in filenames if f"_{content_type}_4k.jpg" in f]
            if not filtered:
                print(f"No HMI {content_type} images found at: {base_url}")
                save_log_to_s3(session_id, fname, f"No HMI {content_type} images found at: {base_url}")
                return None

            def extract_dt_hmi(name):
                match = re.match(r"(\d{8})_(\d{6})", name)
                if match:
                    return datetime.strptime(f"{match[1]}_{match[2]}", "%Y%m%d_%H%M%S")
                return None

            closest_file = min(
                filtered,
                key=lambda f: abs((extract_dt_hmi(f) - target_dt).total_seconds())
            )
            return base_url + closest_file

        except Exception as e:
            print(f"Error while processing HMI JSOC request: {e}")
            save_log_to_s3(session_id, fname, f"Error while processing HMI JSOC request: {e}")
            return None
    else:
        print(f"Unsupported instrument or missing required parameters.")
        save_log_to_s3(session_id, fname, "Unsupported instrument or missing required parameters.")
        return None



def download_jsoc_jp2(jsoc_url, bucket, session_id, fname):
    """Download a JSOC image (JP2 or JPG) from JSOC and save it locally."""
    response = requests.get(jsoc_url)
    if response.status_code == 200:
        try:
            img = Image.open(BytesIO(response.content))
            png_buffer = BytesIO()
            img.save(png_buffer, format="PNG")
            png_buffer.seek(0)
            
            s3_key = f"temp/{session_id}/processed/images/jsoc/{fname}_jsoc.png"
            boto3.client("s3").put_object(
                Bucket=bucket, Key=s3_key, Body=png_buffer, ContentType="image/png"
            )
            print(f"JSOC PNG uploaded to S3: {s3_key}")
            save_log_to_s3(session_id, fname, f"JSOC PNG uploaded: https://www.fitsflow.org/{s3_key}")

            img.close()
            del img, png_buffer
            gc.collect()

            return True
        except Exception as e:
            print(f"Failed to convert JSOC image to PNG: {e}")
            save_log_to_s3(session_id, fname, f"Failed to convert JSOC image to PNG: {e}")
            return False
    else:
        print(f"Failed to download JSOC image from {jsoc_url}")
        save_log_to_s3(session_id, fname, f"Failed to download JSOC image from {jsoc_url}")
        return False


def upload_header_and_data(header, data, bucket, session_id, fname):
    # s3 = boto3.client("s3")

    npy_buffer = io.BytesIO()
    np.save(npy_buffer, data)
    npy_buffer.seek(0)
    
    header_txt = "\n".join([f"{k} = {v}" for k, v in header.items()])
    s3.put_object(Bucket=bucket, Key=f"temp/{session_id}/processed/header/{fname}_header.txt", Body=header_txt)

    df = pd.DataFrame(data)
    s3.put_object(Bucket=bucket, Key=f"temp/{session_id}/processed/data/{fname}_data.csv", Body=df.to_csv(index=False))
    s3.put_object(Bucket=bucket, Key=f"temp/{session_id}/processed/data/{fname}_data.npy", Body=npy_buffer.getvalue())
    
    del data, header, df
    gc.collect()
    print(f" Header and data uploaded to S3 for {fname}")
    save_log_to_s3(session_id, fname, f" Header uploaded: https://www.fitsflow.org/temp/{session_id}/processed/header/{fname}_header.txt")
    save_log_to_s3(session_id, fname, f" Data uploaded: https://www.fitsflow.org/temp/{session_id}/processed/data/{fname}_data.csv (.npy)")


def process_fits_info(file_paths, bucket, session_id, duration_minutes=15):
    output_files = []
    skipped_files = []
    # s3 = boto3.client("s3")
    with open("helioviewer_source_id.json") as f:
        source_map = json.load(f)

    # Build a wavelength ➝ source_id dictionary (only for SDO/AIA)
    wavelength_to_source = {
        int(entry["measurement"]): entry["source_id"]
        for entry in source_map
        if entry["observatory"] == "SDO" and entry["instrument"] == "AIA"
    }


    content_to_source = {
        entry["measurement"].split("_")[0].lower(): entry["source_id"]
        for entry in source_map
        if entry["observatory"] == "SDO" and entry["instrument"] == "HMI"
    }

    for file_path in file_paths:
        fname = os.path.basename(file_path).replace(".fits", "")
        print(f"\n Processing: {fname}")
        save_log_to_s3(session_id, fname, f"\n Processing: {fname}")


        try:

            with fits.open(file_path) as hdul:
                hdul.verify('fix')
                hdu = hdul[1] if len(hdul) > 1 and hdul[1].data is not None else hdul[0]
                data = hdu.data
                header = hdu.header

        except Exception as e:
            skipped_files.append(f"{fname} — FITS open error: {str(e)}")
            print(f"Skipping: {fname} — FITS error: {e}")
            save_log_to_s3(session_id, fname, f"Skipping: {fname} — FITS error: {e}")
            continue

        tele = header.get("TELESCOP", "")
        if "SDO" not in tele.upper():
            # raise ValueError(f"Not an SDO FITS file: {fname}")
            skipped_files.append(f"Skipping: {fname} — Not an SDO FITS file.")
            print(f"Skipping: {fname} is not an SDO file.")
            save_log_to_s3(session_id, fname, f"Skipping: {fname} is not an SDO file.")
            continue

        # Observation time parsing
        if "T_OBS" in header:
            obs_time = header["T_OBS"].rstrip("Z")
        elif "DATE-OBS" in header and "T" in header["DATE-OBS"]:
            obs_time = header["DATE-OBS"]
        elif "DATE-OBS" in header and "TIME-OBS" in header:
            obs_time = header["DATE-OBS"] + "T" + header["TIME-OBS"]
        else:
            obs_time = None

        if obs_time is None:
            skipped_files.append(f"Skipping: {fname} — Observation time missing")
            print(f"Skipping: Observation time not found in header for {fname}. Skipping...")
            save_log_to_s3(session_id, fname, f"Skipping: Observation time not found in header for {fname}. Skipping...")
            continue


        if "_TAI" in obs_time:
            obs_time_clean = obs_time.replace("_TAI", "").replace("_", "T")
        elif "T" in obs_time:
            obs_time_clean = obs_time
        else:
            # fallback if neither applies
            obs_time_clean = obs_time.replace("_", "T")

        try:
            dt_obs = dtparser.parse(obs_time_clean)
        except Exception as e:
            skipped_files.append(f"Skipping: {fname} — Failed to parse observation time")
            print(f"Skipping: Failed to parse observation time '{obs_time}' for {fname}: {e}")
            save_log_to_s3(session_id, fname, f"Skipping: Failed to parse observation time '{obs_time}' for {fname}: {e}")
            continue

        instrument_raw = header.get("INSTRUME", "").upper()

        if "AIA" in instrument_raw:
            wavelength = header.get("WAVELNTH", None)
            if wavelength is None:
                skipped_files.append(f"Skipping: {fname} — Missing WAVELNTH for AIA file")
                print(f"Skipping: Missing WAVELNTH in header for {fname}")
                save_log_to_s3(session_id, fname, f"Skipping: Missing WAVELNTH in header for {fname}")
                continue

            source_id = wavelength_to_source.get(wavelength)
            if source_id is None:
                skipped_files.append(f"Skipping: {fname} — Unknown AIA wavelength: {wavelength}")
                print(f"Skipping: Unknown AIA wavelength '{wavelength}' in {fname}")
                save_log_to_s3(session_id, fname, f"Skipping: Unknown AIA wavelength '{wavelength}' in {fname}")
                continue

        elif "HMI" in instrument_raw:
            content = header.get("CONTENT", "").lower().strip().split()[0]
            source_id = content_to_source.get(content)
            if source_id is None:
                skipped_files.append(f"Skipping: {fname} — Unknown HMI content: {content}")
                print(f"Skipping: Unknown HMI content '{content}' in {fname}")
                save_log_to_s3(session_id, fname, f"Skipping: Unknown HMI content '{content}' in {fname}")
                continue

        else:
            skipped_files.append(f"Skipping: {fname} — Unsupported instrument: {instrument_raw}")
            print(f"Skipping: Unsupported instrument '{instrument_raw}' in {fname}")
            save_log_to_s3(session_id, fname, f"Skipping: Unsupported instrument '{instrument_raw}' in {fname}")
            continue


        header_dict = {
            card.keyword: str(card.value) if isinstance(card.value, Undefined) else card.value
            for card in header.cards
            if card.keyword
        }

        upload_header_and_data(header_dict, data, bucket, session_id, fname)

        date_str = dt_obs.strftime("%Y-%m-%dT%H:%M:%SZ")
        image_id = get_closest_image_id(date_str, fname, session_id, source_id)
        jsoc_jp2_url = get_closest_jsoc_url(dt_obs, fname, session_id, 
                                            instrument=instrument_raw, 
                                            wavelength=wavelength if "AIA" in instrument_raw else None, 
                                            content=content if "HMI" in instrument_raw else None
        )

        
        if image_id:
            download_and_save_helioviewer_image(image_id, bucket, session_id, fname)

        if jsoc_jp2_url:
            download_jsoc_jp2(jsoc_jp2_url, bucket, session_id, fname)


        hek_data = fetch_hek_events(dt_obs, bucket, session_id, fname, duration_minutes=duration_minutes)

        response = lambda_client.invoke(
            FunctionName='<ASDF_FUNCTION>',
            InvocationType='RequestResponse',
            Payload=json.dumps({
                "session_id": session_id,
                "fname": fname
            }).encode("utf-8")
        )

        result = json.loads(response["Payload"].read())
        if result.get("status") == "complete":
            output_files.append(fname)
            print(f"ASDF created for {fname}")
            save_log_to_s3(session_id, fname, f"ASDF uploaded: https://www.fitsflow.org/temp/{session_id}/processed/asdf/{fname}.asdf")
        else:
            print(f"ASDF creation failed for {fname}: {result}")
            save_log_to_s3(session_id, fname, f"ASDF creation failed: {result}")

        try:
            os.remove(file_path)
            print(f"Removed local FITS file: {file_path}")
        except Exception as e:
            print(f"Failed to delete {file_path}: {e}")
            save_log_to_s3(session_id, fname, f"Failed to delete {file_path}: {e}")

    if skipped_files:
        skipped_summary = "\n Skipped Files Summary:\n" + "\n".join(f" - {msg}" for msg in skipped_files)
        print(skipped_summary)
        save_log_to_s3(session_id, "skipped", skipped_summary)


    save_log_to_s3(session_id, "summary", "ALL FILES PROCESSED SUCCESSFULLY");

    return output_files, skipped_files
