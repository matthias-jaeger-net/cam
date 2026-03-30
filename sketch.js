let cam;
let facingMode = "environment";

const flashEl = document.getElementById("flash");
const shutter = document.getElementById("shutter");
const switchBtn = document.getElementById("switch-camera");
const gyroToggle = document.getElementById("gyro-toggle");

const overlay = document.getElementById("photo-overlay");
const overlayImage = document.getElementById("overlay-image");
const download = document.getElementById("download");
const closeBtn = document.getElementById("close");

// Gyroscope variables
let gyroEnabled = false;
let gyroAlpha = 0; // rotation around Z axis
let gyroBeta = 0; // rotation around X axis (forward/backward tilt)
let gyroGamma = 0; // rotation around Y axis (left/right tilt)
let hasGyro = false;

closeBtn.onclick = () => overlay.classList.remove("active");

// Check if device supports gyroscope
function checkGyroSupport() {
    return (
        typeof DeviceOrientationEvent !== "undefined" &&
        typeof DeviceOrientationEvent.requestPermission === "function"
    );
}

// Auto-request gyroscope permission on app load
async function requestGyroPermission() {
    if (checkGyroSupport()) {
        try {
            const permission = await DeviceOrientationEvent.requestPermission();
            if (permission === "granted") {
                hasGyro = true;
                console.log("Gyroscope permission granted automatically");
            }
        } catch (error) {
            console.log("Gyroscope permission not available");
        }
    } else {
        // Non-iOS or older devices - assume support
        hasGyro = true;
        console.log("Gyroscope assumed available");
    }
}

// Gyroscope toggle
if (gyroToggle) {
    gyroToggle.onclick = async () => {
        if (!hasGyro) {
            // Request permission first (must be in response to user tap)
            if (checkGyroSupport()) {
                try {
                    const permission =
                        await DeviceOrientationEvent.requestPermission();
                    if (permission === "granted") {
                        hasGyro = true;
                        console.log("Gyroscope permission granted");
                        // Now enable gyro after permission
                        gyroEnabled = true;
                        gyroToggle.classList.toggle("active", true);
                    }
                } catch (error) {
                    console.log("Gyroscope permission denied");
                }
            } else {
                // Non-iOS or older devices - assume support
                hasGyro = true;
                gyroEnabled = true;
                gyroToggle.classList.toggle("active", true);
            }
        } else {
            // Already have permission, just toggle
            gyroEnabled = !gyroEnabled;
            gyroToggle.classList.toggle("active", gyroEnabled);
            console.log("Gyroscope toggled:", gyroEnabled);
        }
    };
}

// Listen for device orientation events
window.addEventListener("deviceorientationabsolute", (event) => {
    gyroAlpha = event.alpha || 0; // 0 to 360
    gyroBeta = event.beta || 0; // -180 to 180
    gyroGamma = event.gamma || 0; // -90 to 90
});

window.addEventListener("deviceorientation", (event) => {
    if (!window.ondeviceorientationabsolute) {
        // Fallback if absolute isn't supported
        gyroAlpha = event.alpha || 0;
        gyroBeta = event.beta || 0;
        gyroGamma = event.gamma || 0;
    }
});

function initCamera() {
    if (cam) cam.remove();

    cam = createCapture({
        video: { facingMode },
        audio: false,
    });

    cam.elt.setAttribute("playsinline", true); // iOS fix
    cam.elt.muted = true;
    cam.hide();
}

function setup() {
    const c = createCanvas(window.innerWidth, window.innerHeight);
    c.parent("camera-container");
    initCamera();
}

function draw() {
    if (!cam || cam.width === 0) return;

    background(0);

    let canvasRatio = width / height;
    let videoRatio = cam.width / cam.height;

    let w, h;

    if (canvasRatio > videoRatio) {
        w = width;
        h = width / videoRatio;
    } else {
        h = height;
        w = height * videoRatio;
    }

    push();

    if (facingMode === "user") {
        translate(width, 0);
        scale(-1, 1);
    }

    let imgX = width / 2 - w / 2;
    let imgY = height / 2 - h / 2;

    // Apply gyroscope pan effect if enabled
    if (gyroEnabled && hasGyro) {
        // Create a subtle panning effect based on device tilt
        // Map gyro values to pixel offsets (max 30px pan)
        let panX = map(gyroGamma, -45, 45, -30, 30, true);
        let panY = map(gyroBeta, -45, 45, 30, -30, true);
        imgX += panX;
        imgY += panY;

        // Slight zoom based on tilt angle
        let tiltMagnitude = sqrt(gyroBeta * gyroBeta + gyroGamma * gyroGamma);
        let zoomAmount = 1 + map(tiltMagnitude, 0, 45, 0, 0.05, true);

        // Apply zoom centered on canvas
        translate(width / 2, height / 2);
        scale(zoomAmount);
        translate(-width / 2, -height / 2);
    }

    image(cam, imgX, imgY, w, h);
    pop();

    // Rule of thirds guide lines
    stroke(255, 50);
    strokeWeight(1);
    line(width / 3, 0, width / 3, height);
    line((2 * width) / 3, 0, (2 * width) / 3, height);
    line(0, height / 3, width, height / 3);
    line(0, (2 * height) / 3, width, (2 * height) / 3);

    // Draw gyroscope level indicator
    if (gyroEnabled && hasGyro) {
        drawLevelIndicator();
    }
}

function drawLevelIndicator() {
    // Simple rotating line indicator
    push();

    let centerX = width / 2;
    let centerY = height / 2;
    let lineLength = 100;

    // Rotate based on gamma (left/right tilt)
    translate(centerX, centerY);
    rotate(radians(gyroGamma));

    // Draw horizontal line
    stroke(0, 255, 100);
    strokeWeight(3);
    line(-lineLength, 0, lineLength, 0);

    // Draw center point
    fill(0, 255, 100);
    noStroke();
    circle(0, 0, 8);

    pop();
}

function windowResized() {
    resizeCanvas(window.innerWidth, window.innerHeight);
}

shutter.onclick = async () => {
    flashEl.style.opacity = 1;
    setTimeout(() => (flashEl.style.opacity = 0), 100);

    let img = get();
    let dataUrl = img.canvas.toDataURL("image/png");

    overlayImage.src = dataUrl;
    overlay.classList.add("active");

    const res = await fetch(dataUrl);
    const blob = await res.blob();
    const file = new File([blob], "photo.png", {
        type: "image/png",
    });

    if (navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
            await navigator.share({ files: [file] });
        } catch {}
    }

    download.href = dataUrl;
};

switchBtn.onclick = () => {
    facingMode = facingMode === "environment" ? "user" : "environment";
    initCamera();
};
