# FitsFlow | [![DOI](https://zenodo.org/badge/1044586127.svg)](https://doi.org/10.5281/zenodo.17069413)

FitsFlow is a browser-based application that takes a solar FITS image and returns machine-learning ready outputs.  

In simple terms:  
1. You upload a FITS file in your browser.  
2. FitsFlow automatically connects to NASA/NOAA data services (HEK, JSOC, Helioviewer).  
3. The system processes everything in the cloud.  
4. You get back a single "manifest" file and outputs (images, metadata, ASDF).  

FitsFlow connects all the dots so researchers, educators, and the public can use solar data without special software.  

Click here to access [FitsFlow](https://www.fitsflow.org)!

Click below to check out a demo!

<p align="center">
  <a href="https://youtu.be/6J0IHxmNrg8?si=E2_0lrwMLrccvFSm" target="_blank">
    <img src="https://indiajacksonphd.s3.us-east-1.amazonaws.com/youtube_thumbnail.png" alt="Watch the FitsFlow Demo" width="800"/>
  </a>
</p>


---

## Want the full technical breakdown?
- [Section 2 — Client Side](client/) (frontend code & design)  
- [Section 3 — Server Side](server/) (AWS services, IAM permissions, CORS, Lambda, EC2)  

---

## 1. System Architecture

<center><img width="811" height="633" alt="FitsFlow AWS Chart" src="https://github.com/user-attachments/assets/4403f8b9-ace5-4fe7-8d4f-3ce2b1e809e1" /></center>



- AWS services: Lambda, API Gateway, S3, CloudFront, Route 53, EC2
- External APIs: HEK, JSOC, Helioviewer
- Outputs: images, metadata, ASDF, manifest files

## 2. Data Flow
1. Upload FITS file in browser
2. Presigned URL → S3 upload
3. Lambda pipeline processes headers, metadata, and images
4. Manifest + outputs returned
5. Temporary files auto-cleaned after 24h

## 3. Security
- Private S3 with OAC + KMS encryption
- IAM least privilege for each Lambda
- Short-lived presigned URLs
- CloudFront + WAF rate limiting

## 4. Threat Model
- Risks: unauthorized uploads, presign abuse, cost spikes
- Mitigations: lifecycle rules, cost anomaly detection, throttling

## 5. Future Work
- Fix Safari video reload issue
- Eliminate 403 polling errors via backend HEAD check
- Possible migration to a clean bucket name (`fitsflow`)
- Queueing for EC2 if workloads expand

## 6. Research Outputs
- **Dragon Con 2025** — [Space & Science Tracks](https://app.core-apps.com/dragoncon25/speakers/aadbab04df55073681678e0c579dbd8d)  
- **Science and Cyberinfrastructure for Discovery 2025** — *[Session 4: Lightning Talks](https://arctic.gsu.edu/training/scd/#lightning-talks)*  
- **Data, Analysis, and Software in Heliophysics 2025** — *[Open Oral Session](https://dash2025.space.swri.edu/#agenda)*  
- **AGU Fall Meeting 2025** — Session SH032: *[The Long Way: Heliosphere Modeling with Operations in Mind](https://agu.confex.com/agu/agu25/webprogrampreliminary/Session251735.html)*  

---

## Acknowledgements
FitsFlow is supported by the **National Science Foundation (NSF) Atmospheric and Geospace Sciences Postdoctoral Fellowship (AGS-PRF Award #2444918)**.  
