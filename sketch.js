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

// Motion/tilt variables (from accelerometer gravity vector)
let gyroEnabled = false;
let accelX = 0; // left/right tilt (+right, -left)
let accelY = -9.8; // up/down (upright ≈ -9.8)
let accelZ = 0; // forward/back tilt
let hasGyro = false;

closeBtn.onclick = () => overlay.classList.remove("active");

// Check if device requires explicit motion permission (iOS 13+)
function checkGyroSupport() {
    return (
        typeof DeviceMotionEvent !== "undefined" &&
        typeof DeviceMotionEvent.requestPermission === "function"
    );
}

// Auto-request motion permission on app load
async function requestGyroPermission() {
    if (checkGyroSupport()) {
        try {
            const permission = await DeviceMotionEvent.requestPermission();
            if (permission === "granted") {
                hasGyro = true;
                console.log("Motion permission granted automatically");
            }
        } catch (error) {
            console.log("Motion permission not available");
        }
    } else {
        // Non-iOS or older devices - assume support
        hasGyro = true;
        console.log("Motion assumed available");
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
                        await DeviceMotionEvent.requestPermission();
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

// Listen for accelerometer gravity vector
window.addEventListener("devicemotion", (event) => {
    const g = event.accelerationIncludingGravity;
    if (g) {
        accelX = g.x || 0;
        accelY = g.y || 0;
        accelZ = g.z || 0;
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

    // Apply pan effect based on gravity vector
    if (gyroEnabled && hasGyro) {
        let panX = map(accelX, -9.8, 9.8, -30, 30, true);
        let panY = map(accelZ, -9.8, 9.8, -30, 30, true);
        imgX += panX;
        imgY += panY;
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
    let centerX = width / 2;
    let centerY = height / 2;
    let lineLength = 100;

    // Derive roll angle from gravity vector (left/right tilt)
    // atan2(x, -y): 0° = upright, positive = tilted right
    let rollAngle = atan2(accelX, -accelY);

    // Blue vertical line rotating with physical roll angle
    push();
    translate(centerX, centerY);
    rotate(rollAngle);
    stroke(0, 120, 255);
    strokeWeight(3);
    line(0, -lineLength, 0, lineLength);
    pop();

    // Numeric tilt value (left side, vertically centred)
    push();
    textSize(14);
    textFont("monospace");
    noStroke();
    fill(0, 120, 255);
    let tiltDeg = degrees(rollAngle);
    text(`tilt ${nf(tiltDeg, 1, 1)}°`, 12, height / 2);
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
