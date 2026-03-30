let cam;
let facingMode = "environment";

const flashEl = document.getElementById("flash");
const shutter = document.getElementById("shutter");
const switchBtn = document.getElementById("switch-camera");
const gyroToggle = document.getElementById("gyro-toggle");
const permissionBtn = document.getElementById("gyro-permission");

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

// Gyroscope permission request (iOS 13+)
if (permissionBtn) {
    permissionBtn.onclick = async () => {
        if (checkGyroSupport()) {
            try {
                const permission =
                    await DeviceOrientationEvent.requestPermission();
                if (permission === "granted") {
                    hasGyro = true;
                    permissionBtn.innerHTML = "✓ 📍";
                    console.log("Gyroscope permission granted");
                } else {
                    console.warn("Gyroscope permission denied");
                    alert("Gyroscope access denied");
                }
            } catch (error) {
                console.error("Permission error:", error);
                alert("Error requesting permission");
            }
        } else {
            // Non-iOS or older devices - assume support
            hasGyro = true;
            permissionBtn.innerHTML = "✓ 📍";
            console.log("Gyroscope assumed available");
        }
    };
}

// Gyroscope toggle
if (gyroToggle) {
    gyroToggle.onclick = () => {
        if (!hasGyro) {
            alert("Please request gyroscope permission first");
            return;
        }
        gyroEnabled = !gyroEnabled;
        gyroToggle.classList.toggle("active", gyroEnabled);
        console.log("Gyroscope toggled:", gyroEnabled);
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

    // Apply gyroscope tilt effect if enabled
    if (gyroEnabled && hasGyro) {
        translate(width / 2, height / 2);
        // Map gyro values to rotation (limit rotation for usability)
        let tiltX = map(gyroBeta, -90, 90, -15, 15, true);
        let tiltY = map(gyroGamma, -90, 90, -15, 15, true);
        rotateX(radians(tiltX * 0.3));
        rotateY(radians(tiltY * 0.3));
        translate(-width / 2, -height / 2);
    }

    if (facingMode === "user") {
        translate(width, 0);
        scale(-1, 1);
    }

    image(cam, width / 2 - w / 2, height / 2 - h / 2, w, h);
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
    // Horizontal level indicator (shows if device is level left-right)
    push();
    stroke(0, 255, 100);
    strokeWeight(2);
    noFill();

    let indicatorY = 80;
    let indicatorWidth = 120;
    let indicatorX = width / 2 - indicatorWidth / 2;

    // Background box
    fill(0, 0, 0, 100);
    rect(indicatorX - 20, indicatorY - 20, indicatorWidth + 40, 40, 5);

    // Level line
    stroke(0, 255, 100);
    line(indicatorX, indicatorY, indicatorX + indicatorWidth, indicatorY);

    // Bubble position based on gamma (left-right tilt)
    let bubblePos = map(
        gyroGamma,
        -30,
        30,
        indicatorX,
        indicatorX + indicatorWidth,
        true,
    );
    fill(0, 255, 100);
    circle(bubblePos, indicatorY, 12);

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
