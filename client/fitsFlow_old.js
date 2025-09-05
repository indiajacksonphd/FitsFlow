let session_id = null;
let fitsFiles = [];

let submitButton = document.getElementById('submitFitsUpload');
let storageBar = document.getElementById('storageBar');
let storageText = document.getElementById('storageText');
const resetButton = document.getElementById('resetFitsUpload');

let totalSizeMB = 0;
let maxSizeMB = 170;

let playlist = [];
let skippedFiles = [];



function checkMobileView() {
  if (window.innerWidth <= 600) {
    document.getElementById("mobile-blocker").classList.add("active");
  } else {
    document.getElementById("mobile-blocker").classList.remove("active");
  }
}

window.addEventListener('resize', checkMobileView);
window.addEventListener('load', checkMobileView);


/*
  // Calculate the date two days ago
  const today = new Date();
  const twoDaysAgo = new Date(today);
  twoDaysAgo.setDate(today.getDate() - 2);

  const yyyy = twoDaysAgo.getFullYear();
  const mm = String(twoDaysAgo.getMonth() + 1).padStart(2, '0');
  const dd = String(twoDaysAgo.getDate()).padStart(2, '0');
  const dateStr = `${yyyy}${mm}${dd}`;

  // Build the video HTML
  const videoHTML = `
    <video autoplay muted loop playsinline>
      <source src="https://helioconvert-sdo.s3.us-east-1.amazonaws.com/daily_videos/${dateStr}_stitched.mp4" type="video/mp4">
      Your browser does not support the video tag.
    </video>
  `;

  document.getElementById('image-info-text').innerHTML = `SDO Wavelengths: ${mm} - ${dd} - ${yyyy}`
  // Inject into the placeholder
  document.getElementById('video-placeholder-SDO').innerHTML = videoHTML;
*/

  function loadStitchedSDOVideo() {
    const today = new Date();
    const twoDaysAgo = new Date(today);
    twoDaysAgo.setDate(today.getDate() - 2);
  
    const yyyy = twoDaysAgo.getFullYear();
    const mm = String(twoDaysAgo.getMonth() + 1).padStart(2, '0');
    const dd = String(twoDaysAgo.getDate()).padStart(2, '0');
    const dateStr = `${yyyy}${mm}${dd}`;
  
    const videoHTML = `
      <video autoplay muted loop playsinline>
        <source src="https://helioconvert-sdo.s3.us-east-1.amazonaws.com/daily_videos/${dateStr}_stitched.mp4" type="video/mp4">
        Your browser does not support the video tag.
      </video>
    `;
  
    document.getElementById('image-info-text').innerText = `SDO Wavelengths: ${mm} - ${dd} - ${yyyy}`;
    document.getElementById('video-placeholder-SDO').innerHTML = videoHTML;

    document.getElementById('header-info-text').innerText = "Header and HEK Info"

    document.getElementById('hekBtn').disabled = true;
    document.getElementById('headerBtn').disabled = true;
    document.getElementById('colorBtn').disabled = true;
    document.getElementById('grayBtn').disabled = true;

  }

  


/*

let idleTime = 0;
let idleLimit = 15; // seconds
let idleTimer;

function resetIdleTimer() {
    clearTimeout(idleTimer);
    idleTimer = setTimeout(() => {
        showHelpPrompt();
    }, idleLimit * 1000);
}

function showHelpPrompt() {
    // Customize this however you like
    alert("Need help with FitsFlow? Click '?' or explore the Help section!");
    // Or you could show a styled modal instead
}

// Attach event listeners to detect user activity
['mousemove', 'keydown', 'mousedown', 'touchstart'].forEach(event => {
    document.addEventListener(event, resetIdleTimer, false);
});

// Start the idle timer on load
window.onload = resetIdleTimer;
*/


logToTerminal("Welcome to FitsFlow!"); 


function getBaseUrl() {
  return `https://helioconvert-sdo.s3.us-east-1.amazonaws.com/temp/${session_id}/processed`;
}

function updateStorageDisplay() {
    storageBar.value = totalSizeMB;
    storageText.textContent = `${totalSizeMB.toFixed(1)} / ${maxSizeMB} MB`;

    if (totalSizeMB >= maxSizeMB) {
        submitButton.style.display = 'none';
        resetButton.style.display = 'inline-block';
        document.getElementById('fitsUpload').disabled = true;
        document.querySelector('label[for="fitsUpload"]').classList.add('disabled');
    } else if (totalSizeMB > 0) {
        submitButton.style.display = 'inline-block';
        resetButton.style.display = 'inline-block'; // ✅ fix here
        document.getElementById('fitsUpload').disabled = true;
        document.querySelector('label[for="fitsUpload"]').classList.add('disabled');
    } else {
        resetButton.style.display = 'none';
        document.querySelector('label[for="fitsUpload"]').classList.remove('disabled');
        document.getElementById('fitsUpload').disabled = false;
    }


}



function displayFromPlaylist(index) {
    const item = playlist[index];
    document.getElementById("carouselImage").src = item.sdo;
    document.getElementById("jsocImage").src = item.jsoc;
  
    fetch(item.header)
      .then(res => res.text())
      .then(text => {
        document.getElementById("headerOverlay").textContent = text;
      });
  
    fetch(item.hek)
      .then(res => res.json())
      .then(data => {
        const cleaned = simplifyArrayKeys(data);
        const container = document.getElementById("hekOverlay");
        container.innerHTML = '';
        Object.entries(cleaned).forEach(([key, value]) => {
          const formatter = new JSONFormatter(value, 0, { theme: 'dark' });
          formatter.key = key;
          container.appendChild(formatter.render());
        });
      });
  }
  
  function switchTab(tabName) {
      // Hide all image tabs
      document.getElementById('video-tab').style.display = 'none';
      document.getElementById('bounding-tab').style.display = 'none';
    
      // Remove active class from image tab buttons only
      document.querySelectorAll('.tab-btn-image').forEach(btn => btn.classList.remove('active'));
    
      // Show selected tab
      document.getElementById(`${tabName}-tab`).style.display = 'block';
    
      // Highlight selected button
      const buttonMap = {
        'video': document.querySelector(".tab-btn-image:nth-child(1)"),
        'bounding': document.querySelector(".tab-btn-image:nth-child(2)")
      };
      if (buttonMap[tabName]) {
        buttonMap[tabName].classList.add('active');
      }
  }
  
  
  function switchHeaderTab(tabName, clickedBtn) {
      ['header-tab', 'hek-tab'].forEach(id => {
        document.getElementById(id).style.display = 'none';
      });
    
      // Remove highlight from header tab buttons only
      document.querySelectorAll('#header-info-label .tab-btn').forEach(btn => btn.classList.remove('active'));
    
      // Show selected content tab
      document.getElementById(`${tabName}-tab`).style.display = 'block';
    
      // Highlight clicked tab
      clickedBtn.classList.add('active');
    }



  function showOverlay(section) {
    const overlay = document.getElementById('overlay');
    const content = document.getElementById('overlay-text');

    /*
      <h3 style="margin-bottom: 0.5em;">Publications Featuring FitsFlow</h3>
      <p style="color: #ccc;">
        No publications listed yet. This section will be updated as peer-reviewed papers and presentations citing FitsFlow become available.
      </p>
    */
    
    if (section === 'about') {
      content.innerHTML = `
      <h3 style="font-weight: bold; font-size: 1.1em; margin-bottom: 1em;">
        FitsFlow: A Cyberinfrastructure, Browser-Based, Cloud-Native Platform for Machine Learning–Ready Processing of Solar FITS Data
      </h3>
    
      <p style="margin-bottom: 2em;">
        FitsFlow is a browser-based platform developed by the author to streamline the exploration and annotation of Solar Dynamics Observatory (SDO) FITS images through a fully integrated, cloud-native environment. The system connects heliophysics data services from the Joint Science Operations Center (JSOC), Helioviewer, and the Heliophysics Event Knowledgebase (HEK), enabling users to parse FITS headers, align event times, and automatically retrieve associated imagery and metadata. The backend, deployed on Amazon Web Services (AWS) Lambda and Elastic Cloud Compute (EC2), handles on-demand processing and delivers all outputs through a lightweight web interface. FitsFlow produces structured, Machine Learning–Ready (ML) outputs, including support for the Advanced Scientific Data Format (ASDF). Each session allows up to 170 MB of FITS data and the results can be downloaded in bulk as a ZIP file containing: header metadata in JSON, pixel data in CSV and NumPy formats, colorized PNG images from Helioviewer, grayscale PNGs from JSOC, and HEK metadata in JSON format. These outputs are designed to support reproducible and interpretable ML workflows for classifying, segmenting, and forecasting solar events, laying the foundation for cyberinfrastructure that connects solar surface activity to radiation impacts in Low Earth Orbit (LEO). FitsFlow represents the first in a planned suite of “KISS” tools (Keep It Simple, Scientist) aimed at lowering the barrier to entry for ML in heliophysics. With browser-native visualization, downloadable structured examples, zero-install access, and no login required, FitsFlow broadens accessibility for researchers, educators, and citizen scientists working with solar data.
      </p>
    
      <p style="font-style: italic; margin-bottom: 2em;">
        Note: FITS (Flexible Image Transport System) files are the standard file format in astronomy for storing scientific images and their metadata.
      </p>
    
    `;
    
    
    }else if (section === 'spacecraft') {
      content.innerHTML = `
      <div style="margin-top: 10px; max-width: 900px; margin-left: auto; margin-right: auto;">
          <h2 style="text-align: center; margin-bottom: 20px;">SDO: Solar Dynamics Observatory</h2>
          
          <div style="
              display: flex;
              flex-direction: row;
              flex-wrap: wrap;
              align-items: center; /* Vertically center content */
              gap: 20px;
          ">
              <div style="
                  flex: 1 1 400px;
                  min-width: 300px;
                  font-size: 0.95em;
                  color: #ccc;
                  text-align: left;
              ">
                  <p style="margin: 0;">
                      NASA’s <strong>Solar Dynamics Observatory (SDO)</strong> is a spacecraft launched in 2010 to study the Sun and its influence on Earth. 
                      It provides continuous, high-resolution observations of solar activity to help scientists better understand solar storms and space weather.
                  </p>
                  <p style="margin-top: 1em;">
                      The <strong>Atmospheric Imaging Assembly (AIA)</strong> captures images of the Sun in ten ultraviolet wavelengths, allowing researchers to monitor solar flares, coronal loops, and dynamic changes in the solar atmosphere.
                  </p>
                  <p style="margin-top: 1em;">
                      The <strong>Helioseismic and Magnetic Imager (HMI)</strong> measures magnetic fields and motion on the Sun’s surface. It is used to study sunspots, solar magnetism, and the Sun’s internal structure through helioseismology.
                  </p>
              </div>
  
              <div style="
                  flex: 0 0 300px;
                  text-align: center;
              ">
                  <img src="sdo.png" alt="Solar Dynamics Observatory" style="width: 100%; max-width: 300px; border-radius: 6px;">
                  <p style="font-size: 0.85em; color: #aaa;">Image credit: <a href="https://sdo.gsfc.nasa.gov/mission/spacecraft.php" style="color: #5ccaff; text-decoration: underline;">NASA/SDO</a></p>
              </div>
          </div>
      </div>
  `;
  
  }
   else if (section === 'supported') {

    /*
      content.innerHTML = `
          <div style="margin-top: 10px; max-width: 900px; margin-left: auto; margin-right: auto;">
              <h2 style="text-align: center; margin-bottom: 20px;">Supported Data</h2>
  
              <ul style="color: #ccc; font-size: 0.95em; padding-left: 1.2em; margin-bottom: 30px;">
                  <li style="margin-bottom: 10px;">
                      The <a href="http://jsoc.stanford.edu/ajax/exportdata.html?ds=aia.lev1_euv_12s[2020-01-01T00:00:00/20m][131]" target="_blank" style="color: #5ccaff;">Joint Science Operations Center (JSOC)</a> hosts calibrated SDO image data, including AIA and HMI grayscale observations used for research and analysis.
                  </li>
                  <li style="margin-bottom: 10px;">
                      <a href="https://helioviewer.org/" target="_blank" style="color: #5ccaff;">Helioviewer</a> provides quick-look, colorized imagery generated from SDO and other solar missions, ideal for visual context and media-ready products.
                  </li>
                  <li style="margin-bottom: 10px;">
                      The <a href="https://www.lmsal.com/hek/" target="_blank" style="color: #5ccaff;">Heliophysics Event Knowledgebase (HEK)</a> catalogs solar features and events such as flares, using metadata extracted from scientific analyses and automated pipelines.
                  </li>
              </ul>
  
              <div style="display: flex; flex-wrap: wrap; gap: 40px; justify-content: center;">
                  
                  <!-- Data Sources -->
                  <div style="flex: 1 1 300px;">
                      <h3 style="color: #fff;">Data Sources</h3>
                      <ul style="list-style: none; padding-left: 0; color: #ccc; font-size: 0.95em;">
                          <li><a href="#" onclick="showWavelengthTable()" style="color: #5ccaff; text-decoration: underline;">SDO AIA</a>  → 94, 131, 171, 193, 211, 304, 335, 1600, 1700, 4500</li>
                          <li><a href="#" onclick="showWavelengthTable()" style="color: #5ccaff; text-decoration: underline;">SDO HMI</a> → Continuum / Magnetogram</li>
                          <li><strong>JSOC</strong> → Grayscale imagery</li>
                          <li><strong>Helioviewer</strong> → Colorized imagery</li>
                          <li><strong>HEK</strong> → Flare and event metadata</li>
                      </ul>
                  </div>
  
                  <!-- Data Types -->
                  <div style="flex: 1 1 300px;">
                      <h3 style="color: #fff;">Data Types</h3>
                      <ul style="list-style: none; padding-left: 0; color: #ccc; font-size: 0.95em;">
                          <li><strong>Header</strong> → JSON</li>
                          <li><strong>Data</strong> → CSV, NPY</li>
                          <li><strong>Images</strong> → PNG</li>
                          <li><strong>HEK</strong> → JSON</li>
                          <li><strong>ASDF</strong> → YAML</li>
                      </ul>
                  </div>
  
              </div>
          </div>
      `;
      */

      content.innerHTML = `
  <div style="margin-top: 10px; max-width: 1100px; margin-left: auto; margin-right: auto;">

    <h2 style="text-align: center; margin-bottom: 20px;">Supported Data</h2>

    <div style="display: flex; justify-content: space-around; gap: 40px; flex-wrap: wrap; margin-bottom: 40px;">
    <!-- JSOC -->
    <div style="flex: 1; text-align: center; min-width: 200px;">
    <a href="http://jsoc.stanford.edu/ajax/exportdata.html?ds=aia.lev1_euv_12s[2020-01-01T00:00:00/20m][131]" target="_blank" class="clickable-icon"><img src="jsoc_favicon.png" alt="JSOC" style="width: 204px; height: 84px; margin-bottom: 10px;"></a>
      <p style="color: #ccc; font-size: 0.95em; text-align: justify;">
          Joint Science Operations Center (JSOC) hosts calibrated SDO image data, including AIA and HMI grayscale observations used for research and analysis.
      </p>
    </div>
  
    <!-- Helioviewer -->
    <div style="flex: 1; text-align: center; min-width: 200px;">
    <a href="https://helioviewer.org/" target="_blank" class="clickable-icon"><img src="hvlogo1s_transparent.png" alt="Helioviewer" style="width: 85px; height: 85px; margin-bottom: 10px;"></a>
      <p style="color: #ccc; font-size: 0.95em; text-align: justify;">
        Helioviewer provides quick-look, colorized imagery generated from SDO and other solar missions, ideal for visual context and media-ready products.
      </p>
    </div>
  
    <!-- HEK -->
    <div style="flex: 1; text-align: center; min-width: 200px;">
    <a href="https://www.lmsal.com/hek/" target="_blank" class="clickable-icon"><img src="hek_favicon.png" alt="HEK" style="width: 85px; height: 85px; margin-bottom: 10px;"></a>
      <p style="color: #ccc; font-size: 0.95em; text-align: justify;"> 
      The Heliophysics Event Knowledgebase (HEK) catalogs solar features and events such as flares, using metadata extracted from scientific analyses and automated pipelines.
      </p>
    </div>
  </div>
  

  <hr style="border-top: 1px solid #555; margin: 30px 0;">

  <div style="display: flex; flex-wrap: nowrap; justify-content: center; gap: 40px;">
  
    <!-- Data Sources Table -->
    <div style="flex: 1 1 300px;">
      <h3 style="color: #fff; text-align: center;">Data Sources</h3>
      <table style="width: 100%; border-collapse: collapse; font-size: 0.95em; margin-top: 12px;">

        <thead>
          <tr style="background-color: #333; color: #fff;">
            <th style="padding: 8px; border: 1px solid #444; text-align: left;">Source</th>
            <th style="padding: 8px; border: 1px solid #444; text-align: left;">Description</th>
          </tr>
        </thead>
        <tbody>
          <tr style="background-color: #1e1e1e;">
            <td style="padding: 8px; border: 1px solid #444;">
              <a href="#" onclick="showWavelengthTable()" style="color: #5ccaff; text-decoration: underline;">SDO AIA</a>
            </td>
            <td style="padding: 8px; border: 1px solid #444;">94, 131, 171, 193, 211, 304, 335, 1600, 1700, 4500</td>
          </tr>
          <tr style="background-color: #2a2a2a;">
            <td style="padding: 8px; border: 1px solid #444;">
              <a href="#" onclick="showWavelengthTable()" style="color: #5ccaff; text-decoration: underline;">SDO HMI</a>
            </td>
            <td style="padding: 8px; border: 1px solid #444;">Continuum / Magnetogram</td>
          </tr>
          <tr style="background-color: #1e1e1e;">
            <td style="padding: 8px; border: 1px solid #444;"><strong style="color: #ccc;">JSOC</strong></td>
            <td style="padding: 8px; border: 1px solid #444;">Grayscale imagery</td>
          </tr>
          <tr style="background-color: #2a2a2a;">
            <td style="padding: 8px; border: 1px solid #444;"><strong style="color: #ccc;">Helioviewer</strong></td>
            <td style="padding: 8px; border: 1px solid #444;">Colorized imagery</td>
          </tr>
          <tr style="background-color: #1e1e1e;">
            <td style="padding: 8px; border: 1px solid #444;"><strong style="color: #ccc;">HEK</strong></td>
            <td style="padding: 8px; border: 1px solid #444;">Flare and event metadata</td>
          </tr>
        </tbody>
      </table>
    </div>
  
    <!-- Vertical Divider -->
    <div style="width: 1px; background-color: #555; height: auto; margin: 0 10px;"></div>
  
    <!-- Data Types Table -->
    <div style="flex: 1 1 300px;">
      <h3 style="color: #fff; text-align: center;">Data Types</h3>
      <table style="width: 100%; border-collapse: collapse; font-size: 0.95em; margin-top: 12px;">

        <thead>
          <tr style="background-color: #333; color: #fff;">
            <th style="padding: 8px; border: 1px solid #444; text-align: left;">Type</th>
            <th style="padding: 8px; border: 1px solid #444; text-align: left;">Format</th>
          </tr>
        </thead>
        <tbody>
          <tr style="background-color: #1e1e1e;">
            <td style="padding: 8px; border: 1px solid #444;"><strong style="color: #ccc;">Header</strong></td>
            <td style="padding: 8px; border: 1px solid #444;">JSON</td>
          </tr>
          <tr style="background-color: #2a2a2a;">
            <td style="padding: 8px; border: 1px solid #444;"><strong style="color: #ccc;">Data</strong></td>
            <td style="padding: 8px; border: 1px solid #444;">CSV, NPY</td>
          </tr>
          <tr style="background-color: #1e1e1e;">
            <td style="padding: 8px; border: 1px solid #444;"><strong style="color: #ccc;">Images</strong></td>
            <td style="padding: 8px; border: 1px solid #444;">PNG</td>
          </tr>
          <tr style="background-color: #2a2a2a;">
            <td style="padding: 8px; border: 1px solid #444;"><strong style="color: #ccc;">HEK</strong></td>
            <td style="padding: 8px; border: 1px solid #444;">JSON</td>
          </tr>
          <tr style="background-color: #1e1e1e;">
            <td style="padding: 8px; border: 1px solid #444;"><strong style="color: #ccc;">ASDF</strong></td>
            <td style="padding: 8px; border: 1px solid #444;">YAML</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
  
  
  </div>
`;
  
  }
else if (section === 'samples') {
  content.innerHTML = `
  <h2 style="margin-bottom: 25px; font-size: 24px; text-align: center;">Example Datasets</h2>

  <div style="display: flex; gap: 40px; border-top: 2px solid #555; padding-top: 30px;">
    <!-- Left Column -->
    <div style="flex: 1; text-align: center;">
      <h3 style="margin-bottom: 12px; font-size: 20px;">May 1, 2013: AIA 304</h3>
      <video width="168" height="168" autoplay muted loop playsinline style="margin-bottom: 12px; border-radius: 6px;">
        <source src="https://sdo.gsfc.nasa.gov/assets/img/dailymov/2013/05/01/20130501_1024_0304.mp4" type="video/mp4">
        Your browser does not support the video tag.
      </video>
      <p style="margin: 18px auto; font-size: 16px; line-height: 1.6; max-width: 400px; text-align: justify;">
        This example shows a dramatic prominence eruption captured in AIA 304 on May 1, 2013.
        The structure rises off the solar limb in ultraviolet light and offers an excellent teaching
        moment for solar dynamics and the value of high-cadence imagery. 
      </p>
      <p style="margin-top: 25px;">
        <a href="https://helioconvert-sdo.s3.us-east-1.amazonaws.com/examples/05-01-2013-304/0304.zip"
           style="color: #5ccaff; text-decoration: underline; font-size: 16px;" target="_blank">
          📦 Download ZIP (AIA 304)
        </a>
      </p>
    </div>

    <!-- Right Column -->
    <div style="flex: 1; border-left: 1px solid #444; padding-left: 30px; text-align: center;">
      <h3 style="margin-bottom: 12px; font-size: 20px;">Multi-Wavelength Samples</h3>
      <img src="multiwavelength.png" alt="JSOC" style="width: 408px; height: 168px; margin-bottom: 10px; border-radius: 6px;">
      <p style="margin: 18px auto; font-size: 16px; line-height: 1.6; max-width: 400px; text-align: justify;">
        This curated set includes a single image from each wavelength/instrument, chosen to highlight
        distinct solar features. Explore how flares, coronal holes, and loops appear differently across:
      </p>
      <ul style="margin-bottom: 18px; padding-left: 40px; font-size: 16px; text-align: left; display: inline-block;">
        <li>AIA: 94, 131, 171, 193, 211, 304, 335, 1700</li>
        <li>HMI: Continuum (Cont), Magnetogram (Mag)</li>
      </ul>
      <p style="margin-top: 25px;">
        <a href="https://helioconvert-sdo.s3.us-east-1.amazonaws.com/examples/collection/collection.zip"
           style="color: #5ccaff; text-decoration: underline; font-size: 16px;" target="_blank">
          📦 Download ZIP (Multi-Wavelength)
        </a>
      </p>
    </div>
  </div>
`;


}


    overlay.classList.remove('hidden');
}

  
  function hideOverlay() {
      document.getElementById('overlay').classList.add('hidden');
      closeWavelengthTable();
  }

function showWavelengthTable() {
    document.getElementById('wavelength-popup').style.display = 'block';
}

function closeWavelengthTable() {
    document.getElementById('wavelength-popup').style.display = 'none';
}

  
  function logToTerminal(message) {
      const terminalOutput = document.getElementById("terminal-output");
    
      // Remove old blinking cursor
      const oldBlinkLine = document.getElementById("blink-line");
      if (oldBlinkLine) oldBlinkLine.remove();
    
      let newLine = null; // Declare here so it's always defined
    
      if (message && message.trim()) {
        newLine = document.createElement("div");
        newLine.innerHTML = `&gt;&gt; ${message}`;
        terminalOutput.appendChild(newLine);
      }
    
      // Add fresh blinking cursor line
      const blinkLine = document.createElement("div");
      blinkLine.id = "blink-line";
      blinkLine.innerHTML = `&gt;&gt;&nbsp;<span class="blinking-cursor">█</span>`;
      terminalOutput.appendChild(blinkLine);
    
      // Auto-scroll to bottom
      const scrollWrapper = document.getElementById("terminal-scroll-wrapper");
      scrollWrapper.scrollTop = scrollWrapper.scrollHeight;
    
      return newLine; // Always return (even if it's null)
    }


document.getElementById('fitsUpload').addEventListener('change', (event) => {
    const fileList = event.target.files;
    const displayList = document.getElementById('fitsFileList');
  
    //displayList.innerHTML = ''; // Clear existing
    displayList.innerHTML = '<div style="font-weight:bold; margin-bottom: 10px; text-decoration: underline;">SELECTED FILES</div>';
    fitsFiles = [];
    totalSizeMB = 0;
    let hasFits = false;

    const acceptedFiles = [];
    const rejectedFiles = [];
    const seenFilenames = new Set();

    for (const file of fileList) {
        if (!file.name.toLowerCase().endsWith('.fits')) continue;

        if (seenFilenames.has(file.name)) {
            rejectedFiles.push(`${file.name} (duplicate name)`);
            continue;
        }
    
        const fileSizeMB = file.size / (1024 * 1024);
        if (totalSizeMB + fileSizeMB <= maxSizeMB) {
            acceptedFiles.push(file);
            fitsFiles.push(file.name); 
            seenFilenames.add(file.name);  
            totalSizeMB += fileSizeMB;
    
            // ✅ Display only here
            const item = document.createElement('div');
            item.textContent = file.name;
            displayList.appendChild(item);
    
            hasFits = true;
        } else {
            rejectedFiles.push(file.name);
            
        }
    }

    if (rejectedFiles.length > 0) {
        alert(`🚫 The following files were rejected:\n\n${rejectedFiles.join("\n")}`);
    }
    
    // Show or hide reset button
    resetButton.style.display = hasFits ? 'inline-block' : 'none';
    submitButton.style.display = hasFits ? 'inline-block' : 'none';

        // Handle rejected files (optional alert)
        if (rejectedFiles.length > 0) {
            alert(`🚫 The following files were rejected due to size limits:\n\n${rejectedFiles.join("\n")}`);
        }

        updateStorageDisplay(); // ✅ refresh the bar

  });

  
function generateUniqueID(length = 20) {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}


  function showPollingOverlay() {
    document.getElementById('polling-overlay').style.display = 'flex';
  }
  
  function hidePollingOverlay() {
    document.getElementById('polling-overlay').style.display = 'none';
  }
  

  async function pollLogs(session_id, filenames) {
    const baseUrl = `https://helioconvert-sdo.s3.us-east-1.amazonaws.com/temp/${session_id}/logs`;

    // 1. Wait for download_summary_log_1.txt
    await pollSingleLog(`${baseUrl}/download_summary_log_1.txt`);

    for (const fname of filenames) {
        //logToTerminal(`\n────────────────────────────────────────`); //add count here, 1/total filenames[0]
        logToTerminal(`\n─────────────────────────────── [${filenames.indexOf(fname)+1} / ${filenames.length}]`);

      
        // Always poll logs 1 and 2
        for (let i = 1; i <= 2; i++) {
          const logUrl = `${baseUrl}/${fname.replace(/\.fits$/, "")}_log_${i}.txt`;
          await pollSingleLog(logUrl);
        }
      
        // Check if log_2 was a skip
        const log2Url = `${baseUrl}/${fname.replace(/\.fits$/, "")}_log_2.txt`;
        let log2Text = "";
        try {
          const res = await fetch(log2Url);
          if (res.ok) log2Text = await res.text();
        } catch (err) {
          logToTerminal(`⚠️ Could not fetch ${log2Url}`);
        }
      
        if (log2Text.includes("Skipping")) {
          logToTerminal(`⚠️ Detected skip — no further logs for ${fname}`);
          skippedFiles.push(fname);
          continue; // Skip logs 3–7
        }
      
        // Poll logs 3–7 for processed files
        for (let i = 3; i <= 7; i++) {
          const logUrl = `${baseUrl}/${fname.replace(/\.fits$/, "")}_log_${i}.txt`;
          await pollSingleLog(logUrl);
        }
      }
      
  
    // 3. Poll summary_log_2.txt (final all-clear)
    await pollSingleLog(`${baseUrl}/summary_log_2.txt`, true);

    document.getElementById('video-placeholder-SDO')?.style.setProperty('display', 'none');
    document.getElementById('carouselImage')?.style.setProperty('display', 'block');
    document.getElementById('video-placeholder-JSOC')?.style.setProperty('display', 'none');
    document.getElementById('jsocImage')?.style.setProperty('display', 'block');

    //document.getElementById('prevBtn').disabled = false;
    //document.getElementById('playBtn').disabled = false;
    document.getElementById('nextBtn').disabled = false;
    document.getElementById('hekBtn').disabled = false;
    document.getElementById('headerBtn').disabled = false;
    document.getElementById('colorBtn').disabled = false;
    document.getElementById('grayBtn').disabled = false;
    document.getElementById('resetFitsUpload').disabled = false;

    showImage(0);
    hidePollingOverlay();

    document.getElementById('submitFitsUpload').style.display = 'none';
    document.getElementById('submitFitsUpload').disabled = true;
    document.getElementById('downloadButton').style.display = 'inline-block';
    document.getElementById('downloadButton').disabled = false;
    document.getElementById('downloadButton').addEventListener('click', createZipFromPlaylist);
    logToTerminal(`\n────────────────────────────────────────`);


  }
  
  // Helper: Poll until a log is found, then print its contents
  async function pollSingleLog(url, mustContainSuccess = false) {
    let found = false;
  
    while (!found) {
      try {
        const res = await fetch(url);
        if (res.ok) {
          const text = await res.text();
          if (text && (!mustContainSuccess || text.includes("ALL FILES PROCESSED SUCCESSFULLY"))) {
            logToTerminal(text.trim());
            found = true;
          }
        }
      } catch (err) {
        // still waiting...
      }
  
      if (!found) await new Promise(resolve => setTimeout(resolve, 1500));
    }
      
  }

  

  submitButton.addEventListener('click', async () => {
    submitButton.disabled = true;
    document.getElementById('resetFitsUpload').disabled = true;
    showPollingOverlay();

    const sound = document.getElementById("done-sound");
    if (sound) {
      sound.play().then(() => {
        sound.pause();
        sound.currentTime = 0;
      }).catch(e => {
        console.log("Sound priming failed:", e);
      });
    }


  
    const input = document.getElementById('fitsUpload');
    const files = Array.from(input.files);
    console.log(files);
  
    if (files.length === 0) {
      alert("Please select at least one FITS file.");
      submitButton.disabled = false;
      return;
    }
  
    session_id = generateUniqueID();
    console.log("📦 Session ID:", session_id);
  
    const uploadPromises = files.map(file =>
      fetch(`https://helioconvert-sdo.s3.amazonaws.com/temp/${session_id}/fits/${file.name}`, {
        method: "PUT",
        headers: { "Content-Type": "application/fits" },
        body: file
      }).then(res => {
        if (!res.ok) throw new Error(`${file.name} failed`);
        console.log(`✅ Uploaded: ${file.name}`);
      })
    );
  
    try {
      await Promise.all(uploadPromises);
      console.log("🎉 All files uploaded to S3!");
      logToTerminal("🎉 All files uploaded to S3!");
  
      fetch(`https://gu3rh7bvn7.execute-api.us-east-1.amazonaws.com/default/FitsFlow-2-Trigger?session_id=${session_id}`)
        .then(res => res.json())
        .then(response => {
          console.log("🚀 Triggered processing:", response);
          logToTerminal(response.status);
          logToTerminal(`Session Id: ${response.session_id}`);
  
          // Create playlist from uploaded files
          const filenames = files.map(f => f.name);
          const baseNames = filenames.map(f => f.replace(/\.fits$/, ""));
          console.log(baseNames);

          playlist = baseNames.map(baseName => ({
            data_csv: `${getBaseUrl()}/data/${baseName}_data.csv`,
            data_npy: `${getBaseUrl()}/data/${baseName}_data.npy`,
            header: `${getBaseUrl()}/header/${baseName}_header.txt`,
            hek: `${getBaseUrl()}/hek/${baseName}_hek.json`,
            asdf: `${getBaseUrl()}/asdf/${baseName}.asdf`,
            sdo: `${getBaseUrl()}/images/sdo/${baseName}_sdo.png`,
            jsoc: `${getBaseUrl()}/images/jsoc/${baseName}_jsoc.png`,
          }));
  
          console.log("🎬 Playlist ready:", playlist);

          // Start polling logs
          pollLogs(session_id, baseNames).then(() => {
            
            /*
            const sound = document.getElementById("done-sound");
            if (sound) {
                sound.currentTime = 0;
                sound.play();
            }
            */

            if (sound) {
              sound.currentTime = 0;
              sound.play();  // now it will work!
            }
            
            playlist = playlist.filter(item =>
              !skippedFiles.includes(item.header.split("/").pop().replace("_header.txt", ""))
            );

            const controls = ['prevBtn', 'playBtn', 'nextBtn'].map(id => document.getElementById(id));
            if (playlist.length <= 1) {
              controls.forEach(btn => btn.disabled = true);
            } else {
              controls.forEach(btn => btn.disabled = false);
            }

            // ⛔ Handle all-skipped condition
            if (playlist.length === 0) {
                handleAllFilesSkipped();
                return;
            }

            // Strikethrough skipped files in UI
            const displayList = document.getElementById('fitsFileList');
            const displayedItems = displayList.querySelectorAll('div');

            displayedItems.forEach(item => {
                const filename = item.textContent.replace(/\.fits$/, "");
                if (skippedFiles.includes(filename)) {
                item.style.textDecoration = 'line-through';
                item.style.opacity = 0.5;
                item.title = "Skipped: not an SDO FITS file";
                }
            });
          });
        })
        .catch(err => {
          console.error("❌ Trigger failed:", err);
          logToTerminal("❌ Failed to start processing.");
          alert("Failed to trigger Lambda.");
          submitButton.disabled = false;
        });
  
    } catch (err) {
      console.error("❌ Upload or Lambda call failed:", err);
      alert("Something went wrong. Check console for details.");
      logToTerminal("Something went wrong. Check console for details.");
      submitButton.disabled = false;
    }
  });

  function handleAllFilesSkipped() {
    logToTerminal("🚫 All uploaded files were skipped — no SDO files detected. Try uploading again?");
  
    // Disable controls
    document.getElementById('downloadButton').disabled = true;
    document.getElementById('downloadButton').style.display = 'none';
    document.getElementById('prevBtn').disabled = true;
    document.getElementById('playBtn').disabled = true;
    document.getElementById('nextBtn').disabled = true;
  
    // Create overlay
    const panel = document.getElementById('main-panels');
    const overlay = document.createElement('div');
    overlay.id = 'skipped-overlay';
    overlay.style.position = 'absolute';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100%';
    overlay.style.height = '100%';
    overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.85)';
    overlay.style.color = '#ff4d4d';
    overlay.style.display = 'flex';
    overlay.style.flexDirection = 'column';
    overlay.style.justifyContent = 'center';
    overlay.style.alignItems = 'center';
    overlay.style.fontSize = '1.5em';
    overlay.style.zIndex = 10;
  
    // Message
    const message = document.createElement('div');
    message.textContent = "🚫 All uploaded files were skipped — no SDO files detected. Try uploading again?";
    overlay.appendChild(message);
  
    // Retry button
    const retryBtn = document.createElement('button');
    retryBtn.textContent = "Upload New Files";
    retryBtn.className = "download-button"; // Use your styling
    retryBtn.style.marginTop = "20px";
    retryBtn.onclick = () => {
      document.getElementById('resetFitsUpload').click();
    };
    overlay.appendChild(retryBtn);
  
    panel.appendChild(overlay);
  }
  
  
  
document.getElementById('resetFitsUpload').addEventListener('click', () => {
    /*********** UI Controls ***********/
    document.getElementById('video-placeholder-SDO')?.style.setProperty('display', 'block');
    document.getElementById('video-placeholder-JSOC')?.style.setProperty('display', 'block');
    document.getElementById('carouselImage')?.style.setProperty('display', 'none');
    document.getElementById('jsocImage')?.style.setProperty('display', 'none');

    // Force video reload
    const sdoVideo = document.getElementById('video-placeholder-SDO').querySelector('video');
    const jsocVideo = document.getElementById('video-placeholder-JSOC').querySelector('video');
    if (sdoVideo) {
      sdoVideo.pause();
      sdoVideo.currentTime = 0;
      sdoVideo.load(); // Forces reloading of the source
    }
    if (jsocVideo) {
      jsocVideo.pause();
      jsocVideo.currentTime = 0;
      jsocVideo.load();
    }
    /***********************************/
    
    const input = document.getElementById('fitsUpload');
    const list = document.getElementById('fitsFileList');
    const resetButton = document.getElementById('resetFitsUpload');
  
    input.value = '';
    list.innerHTML = '';
    resetButton.style.display = 'none';
    submitButton.style.display = 'none';
    submitButton.disabled = false;

      // Clear global variables
    playlist.length = 0;
    imageNames.length = 0;
    currentIndex = 0;
    totalSizeMB = 0;

      // Clear viewer
    document.getElementById('carouselImage').src = '';
    document.getElementById('jsocImage').src = '';
    document.getElementById('fitsFileList').innerHTML = '<div style="font-weight:bold; margin-bottom: 10px; text-decoration: underline;">SELECTED FILES</div>';
    document.getElementById('headerOverlay').textContent = 'Loading header...';
    document.getElementById('hekOverlay').innerHTML = 'Loading HEK data...';

      // Ensure overlays appear again if needed
    document.getElementById('headerOverlay').style.display = 'block';
    document.getElementById('hekOverlay').style.display = 'block';
        
    // Optionally hide images and overlays if you initially hide them
    $('#carouselImage').hide();
    $('#jsocImage').hide();

    // Clear playlist and index if needed
    imageNames = [];
    currentIndex = 0;
    playing = false;
    clearInterval(intervalId);
    document.getElementById('prevBtn').disabled = true;
    document.getElementById('playBtn').disabled = true;
    document.getElementById('nextBtn').disabled = true;

    document.getElementById('downloadButton').style.display = 'none';
    document.getElementById('downloadButton').disabled = true;


    document.getElementById('terminal-output').innerHTML = '';
    logToTerminal("Welcome to FitsFlow!") 

    const overlay = document.getElementById('skipped-overlay');
    if (overlay) overlay.remove();
    loadStitchedSDOVideo();

    updateStorageDisplay();

});


  
function updateProgressInline(container, percent) {
    const total = 20;
    const filled = Math.round((percent / 100) * total);
    const empty = total - filled;

    let color;
    if (percent < 40) color = 'red';
    else if (percent < 80) color = 'yellow';
    else color = 'lime';

    const bar = `<span style="color:${color};">[${'█'.repeat(filled)}${'░'.repeat(empty)}] ${percent}%</span>`;
    container.innerHTML = `>> Starting ZIP... ${bar}`;
}

let imageNames = [];
let currentIndex = 0;
let playing = false;
let intervalId = null;

// ==============================
// 🔃 Image Viewer Controls
// ==============================

function simplifyArrayKeys(input) {
    if (Array.isArray(input)) {
      const result = {};
      input.forEach((item, index) => {
        if (item && typeof item === 'object') {
          const keyParts = [];
          if ('name' in item) keyParts.push(item.name);
          if ('pin' in item) keyParts.push(item.pin);
          if ('source' in item) keyParts.push(item.source);
          const key = keyParts.length ? keyParts.join(' - ') : `Item ${index + 1}`;
          result[key] = simplifyArrayKeys(item);
        } else {
          result[`Item ${index + 1}`] = item;
        }
      });
      return result;
    }
  
    if (typeof input === 'object' && input !== null) {
      const result = {};
      for (const [key, value] of Object.entries(input)) {
        result[key] = simplifyArrayKeys(value);
      }
      return result;
    }
  
    return input;
}

/*
function showImage(index) {
    const item = playlist[index];
    console.log(item.header);
    console.log(item.hek);
    console.log(item.sdo);
    console.log(item.jsoc);


    $('#carouselImage').show().attr('src', item.sdo);
    $('#jsocImage').attr('src', item.jsoc);
    $('#header-download').attr('href', item.header);

    // Extract file info from the SDO image name
    const filename = item.sdo.split('/').pop();
    const match = filename.match(/^([a-z]+)_([a-z]+)_([a-z0-9]+)_(\d{4})-(\d{2})-(\d{2})T(\d{2})_(\d{2})/i);
    
    if (match) {
        const spacecraft = match[1].toUpperCase();
        const instrument = match[2].toUpperCase();
        const detector = match[3].toUpperCase();
        const year = match[4];
        const month = match[5];
        const day = match[6];
        const hour = match[7];
        const minute = match[8];

        const formattedTime = `${year}-${month}-${day}T${hour}:${minute}`;
        document.getElementById('image-info-label').innerHTML =
            `<strong>Image Info:</strong> ${spacecraft} / ${instrument} / ${detector} / ${formattedTime}`;
        document.getElementById('header-info-label').innerHTML =
            `<strong>Header Info:</strong> ${spacecraft} / ${instrument} / ${detector} / ${formattedTime}`;
    }

    // Fetch header file
    fetch(item.header)
        .then(res => res.text())
        .then(text => {
            document.getElementById('headerOverlay').textContent = text;
        })
        .catch(err => {
            document.getElementById('headerOverlay').textContent = '⚠️ Failed to load header: ' + err;
        });

    // Fetch HEK JSON and apply simplifyArrayKeys()
    fetch(item.hek)
        .then(res => res.json())
        .then(data => {
            const cleaned = simplifyArrayKeys(data);
            const container = document.getElementById("hekOverlay");
            container.innerHTML = '';
            Object.entries(cleaned).forEach(([key, value]) => {
                const formatter = new JSONFormatter(value, 0, { theme: 'dark' });
                formatter.key = key;
                container.appendChild(formatter.render());
            });
        })
        .catch(err => {
            document.getElementById("hekOverlay").innerText = '⚠️ Failed to load HEK: ' + err;
        });
}
*/

function showImage(index) {
  const item = playlist[index];
  console.log(item.header);
  console.log(item.hek);
  console.log(item.sdo);
  console.log(item.jsoc);

  $('#carouselImage').show().attr('src', item.sdo);
  $('#jsocImage').attr('src', item.jsoc);
  $('#header-download').attr('href', item.header);

  // Fetch header file and extract key info
  fetch(item.header)
      .then(res => res.text())
      .then(text => {
          document.getElementById('headerOverlay').textContent = text;

          // Parse FITS header into key-value pairs
          const headerLines = text.split(/\r?\n/);
          const headerObj = {};
          headerLines.forEach(line => {
              const eqIndex = line.indexOf('=');
              if (eqIndex !== -1) {
                  const key = line.slice(0, eqIndex).trim().toUpperCase();
                  const valueComment = line.slice(eqIndex + 1).trim();
                  const valuePart = valueComment.split('/')[0].trim();
                  const cleanValue = valuePart.replace(/^'+|'+$/g, ''); // remove quotes
                  headerObj[key] = cleanValue;
              }
          });
          
          const rawTelescope = headerObj['TELESCOP'] || 'Unknown';
          const telescope = rawTelescope.replace('/', ' ');
          const instrumentRaw = headerObj['INSTRUME'] || 'Unknown';
          const instrument = instrumentRaw.split('_')[0];

          let datetime = headerObj['DATE-OBS'] || 'Unknown';
          console.log(datetime);
          const contentRaw = (headerObj['CONTENT'] || '').trim();
          const content = contentRaw.split(' ')[0];
          

          console.log(content);
          const wavelength = headerObj['WAVELNTH'];
          console.log(wavelength);
          const descriptor = content || wavelength || 'Unknown';
          console.log(descriptor);

          const isHMI = instrument.includes("HMI");
          document.getElementById("colorBtn").disabled = isHMI;
          document.getElementById("grayBtn").disabled = isHMI;
          document.getElementById("colorBtn").style.opacity = isHMI ? 0.5 : 1;
          document.getElementById("grayBtn").style.opacity = isHMI ? 0.5 : 1;

          // Toggle button classes for HMI
          if (isHMI){
            $('#carouselImage').show().attr('src', item.jsoc);
          } 

          //document.getElementById('image-info-label').innerHTML =
          document.getElementById('image-info-text').innerHTML =
              `${telescope}: ${instrument} / ${descriptor} / ${datetime}`;
          document.getElementById('header-info-text').innerHTML =
              `${telescope}: ${instrument} / ${descriptor} / ${datetime}`;
      })
      .catch(err => {
          document.getElementById('headerOverlay').textContent = '⚠️ Failed to load header: ' + err;
      });

  // Fetch HEK JSON and apply simplifyArrayKeys()
  fetch(item.hek)
      .then(res => res.json())
      .then(data => {
          const cleaned = simplifyArrayKeys(data);
          const container = document.getElementById("hekOverlay");
          container.innerHTML = '';
          Object.entries(cleaned).forEach(([key, value]) => {
              const formatter = new JSONFormatter(value, 0, { theme: 'dark' });
              formatter.key = key;
              container.appendChild(formatter.render());
          });
      })
      .catch(err => {
          document.getElementById("hekOverlay").innerText = '⚠️ Failed to load HEK: ' + err;
      });
}


  
function nextImage() {
    currentIndex = (currentIndex + 1) % playlist.length;
    showImage(currentIndex);
    document.getElementById('playBtn').disabled = false;
    document.getElementById('prevBtn').disabled = false;
}
  
function prevImage() {
    currentIndex = (currentIndex - 1 + playlist.length) % playlist.length;
    showImage(currentIndex);
}
  

function togglePlay() {
    if (playing) {
        clearInterval(intervalId);
        $('#playBtn').text("▶️ Play");
    } else {
      nextImage(); 
        intervalId = setInterval(nextImage, 300);
        $('#playBtn').text("⏸️ Pause");
    }
    playing = !playing;
}


  async function createZipFromPlaylist() {
    const zip = new JSZip();
    logToTerminal("📦 Building ZIP from playlist...");
    document.getElementById('downloadButton').disabled = true;
    document.getElementById('resetFitsUpload').disabled = true;
  
    for (const item of playlist) {
      const base = item.header.split("_header.txt")[0];
      console.log(base);
  
      const filesToFetch = [
        { url: item.header, folder: 'headers' },
        { url: item.hek, folder: 'hek' },
        { url: item.asdf, folder: 'asdf' },
        { url: item.sdo, folder: 'images/sdo' },
        { url: item.jsoc, folder: 'images/jsoc' },
        { url: item.data_csv, folder: 'data' },
        { url: item.data_npy, folder: 'data' }
      ];
  
      for (const file of filesToFetch) {
        try {
          const filename = file.url.split('/').pop();
          //logToTerminal(`\n────────────────────────────────────────`);
          logToTerminal(`\n─────────────────────────────── [${filesToFetch.indexOf(file) + 1} / ${filesToFetch.length}]`);

          logToTerminal(`📥 Fetching ${filename}...`);
          const blob = await fetch(file.url).then(res => {
            if (!res.ok) throw new Error(`Failed: ${file.url}`);
            return res.blob();
          });
          zip.folder(file.folder).file(filename, blob);
          logToTerminal(`✅ Added ${file.folder}/${filename}`);
        } catch (err) {
          logToTerminal(`⚠️ Skipped missing: ${file.url}`);
        }
      }
    }
  
    logToTerminal(`\n────────────────────────────────────────`);
    logToTerminal("📦 Finalizing ZIP...");
  
    const readmeText = generateReadmeFromPlaylist(playlist);
    zip.file("README.txt", readmeText);
  
    const now = new Date();
    const date = now.toISOString().split('T')[0];
    const time = now.toTimeString().split(' ')[0].replace(/:/g, '-');
  
    const blob = await zip.generateAsync({ type: "blob" });
    saveAs(blob, `FitsFlow_Download_${date}_${time}.zip`);
    logToTerminal("🎉 Download complete!");
    document.getElementById('resetFitsUpload').disabled = false;
  }
 

function generateReadmeFromPlaylist(playlist) {
    const header = `FitsFlow Output Bundle
  ======================
  
  This archive contains structured output derived from NASA SDO Level 1 FITS files, organized into the following folders:
  
  - data/   — extracted numerical arrays in CSV and NPY formats
  - headers/ — FITS header metadata in plain text
  - hek/    — HEK event metadata (e.g., solar flares) in JSON
  - images/ — PNG previews from SDO and JSOC imagery
  - asdf/     — Machine-learning-ready ASDF files combining header, data, event, and image metadata into a single structured format
  
  All files are also accessible via direct URL from the server for 24 hours after generation. These URLs are public but temporary and will be deleted after the expiration period.
  
  ⚠️ Access expires in 24 hours. Be sure to download and save any needed files before then.
  
  ---
  
  📁 Included Files and URLs:
  `;
  
    const fileLines = playlist.map(item => {
      return [
        `- ${item.header}`,
        `- ${item.hek}`,
        `- ${item.asdf}`,
        `- ${item.sdo}`,
        `- ${item.jsoc}`,
        item.data_csv ? `- ${item.data_csv}` : '',
        item.data_npy ? `- ${item.data_npy}` : ''
      ].filter(Boolean).join('\n');
    }).join('\n\n');
  
    const footer = `
  
  ---
  
  Formats included: TXT, JSON, CSV, PNG, NPY
  
  Generated by: FitsFlow
  Developer: Dr. India Jackson
  Institution: Georgia State University
  Support: National Science Foundation AGS Postdoctoral Research Fellowship
  Award Number: NSF AGS-PRF #2444918
  `;
  
    return `${header}${fileLines}${footer}`;
  }
  