// Holds the current camera stream
let cam;

// Tracks which camera is active:
// "environment" = back camera (phones)
// "user" = front/selfie camera
let facingMode = "environment";

// UI elements
const flashEl = document.getElementById("flash"); // flash effect overlay
const shutter = document.getElementById("shutter"); // capture button
const switchBtn = document.getElementById("switch-camera"); // camera toggle button

// Photo preview overlay elements
const overlay = document.getElementById("photo-overlay");
const overlayImage = document.getElementById("overlay-image");
const overlayDownload = document.getElementById("overlay-download");
const overlayClose = document.getElementById("overlay-close");

// Main container for the canvas
const container = document.getElementById("camera-container");

// -----------------------------
// UI INTERACTIONS
// -----------------------------

// Close the preview overlay when user clicks "close"
overlayClose.addEventListener("click", () => {
    overlay.classList.remove("active");
});

// -----------------------------
// LAYOUT HELPERS
// -----------------------------

// Positions the shutter button near the bottom of the screen
function positionShutter() {
    const margin = 40;
    const y = window.innerHeight - shutter.offsetHeight - margin;
    shutter.style.top = `${y}px`;
}

// -----------------------------
// CAMERA SETUP
// -----------------------------

function initCamera() {
    // Remove previous camera stream if it exists
    if (cam) cam.remove();

    // Create a new video capture stream
    cam = createCapture({
        video: { facingMode: facingMode }, // choose front/back camera
        audio: false, // no audio needed
    });

    // Prevent feedback issues (mainly mobile)
    cam.elt.muted = true;

    // Hide the raw video element (we render it on canvas instead)
    cam.hide();
}

// -----------------------------
// P5.JS SETUP (runs once)
// -----------------------------

function setup() {
    // Create a full-screen canvas
    const canvas = createCanvas(windowWidth, windowHeight);

    // Attach canvas to container div
    canvas.parent("camera-container");

    // Start camera
    initCamera();

    // Position UI
    positionShutter();
}

// -----------------------------
// MAIN DRAW LOOP (runs every frame)
// -----------------------------

function draw() {
    // Clear background (black)
    background(0);

    // Maintain aspect ratio of video
    let canvasRatio = width / height;
    let videoRatio = cam.width / cam.height;

    let drawWidth, drawHeight;

    // Scale video to fill screen while preserving proportions
    if (canvasRatio > videoRatio) {
        drawWidth = width;
        drawHeight = width / videoRatio;
    } else {
        drawHeight = height;
        drawWidth = height * videoRatio;
    }

    push();

    // Mirror image when using front camera (like a selfie view)
    if (facingMode === "user") {
        translate(width, 0);
        scale(-1, 1);
    }

    // Draw the camera feed to the canvas
    image(
        cam,
        width / 2 - drawWidth / 2,
        height / 2 - drawHeight / 2,
        drawWidth,
        drawHeight,
    );

    pop();
}

// -----------------------------
// HANDLE WINDOW RESIZE
// -----------------------------

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
    positionShutter();
}

// -----------------------------
// PHOTO CAPTURE
// -----------------------------

// Trigger photo when shutter button is clicked
shutter.addEventListener("click", takePhoto);

async function takePhoto() {
    // Simulate camera flash
    flashEl.style.opacity = 1;
    setTimeout(() => (flashEl.style.opacity = 0), 100);

    // Capture current canvas frame
    let img = get();

    // Convert to image data URL (PNG)
    let dataUrl = img.canvas.toDataURL("image/png");

    // Show preview overlay
    overlayImage.src = dataUrl;
    overlay.classList.add("active");

    // Convert data URL to file (for sharing)
    const res = await fetch(dataUrl);
    const blob = await res.blob();
    const file = new File([blob], "camera-photo.png", { type: "image/png" });

    // Try native sharing (mobile devices)
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
            await navigator.share({
                files: [file],
                title: "Camera Photo",
            });
        } catch {
            console.log("Share cancelled");
        }
    } else {
        // Fallback: enable download link
        overlayDownload.href = dataUrl;
        overlayDownload.download = "camera-photo.png";
    }
}

// -----------------------------
// SWITCH CAMERA (front/back)
// -----------------------------

switchBtn.addEventListener("click", () => {
    // Toggle between front and back camera
    facingMode = facingMode === "environment" ? "user" : "environment";

    // Reinitialize camera with new mode
    initCamera();
});
