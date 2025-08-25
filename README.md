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
