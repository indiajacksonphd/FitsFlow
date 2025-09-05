# FitsFlow

FitsFlow is a browser-based application that takes a solar FITS image and returns machine-learning ready outputs.  

In simple terms:  
1. You upload a FITS file in your browser.  
2. FitsFlow automatically connects to NASA/NOAA data services (HEK, JSOC, Helioviewer).  
3. The system processes everything in the cloud.  
4. You get back a single "manifest" file and outputs (images, metadata, ASDF).  

That’s it — FitsFlow connects all the dots so researchers, educators, and the public can use solar data without special software.  

---

## Want the full technical breakdown?
- [Section 2 — Client Side](client/) (frontend code & design)  
- [Section 3 — Server Side](server/) (AWS services, IAM permissions, CORS, Lambda, EC2)  


# FitsFlow

FitsFlow is a browser-based application that takes a solar FITS image and returns machine-learning-ready outputs.

---

## 1. System Architecture
[insert PNG diagram here]

- AWS services: Lambda, API Gateway, S3, CloudFront, Route 53
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
### Conferences
- AGU Fall Meeting 2025 (session SH005)
- Dragon Con 2025, Space Track demo
- SPD Anchorage 2025
- AAS Congressional Visits Day 2025

### Publications
- Paper I (HelioConverter) – to *Space Weather*
- Paper II (SEPStream) – to *Space Weather*
- Fits2ASDF file format paper – to *Earth and Space Science*
- Policy paper on radiation & human health – in prep

See [citations.bib](./architecture-and-research/citations.bib) for BibTeX entries.
