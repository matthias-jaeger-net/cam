let cam;
let facingMode = "environment";

const flashEl = document.getElementById("flash");
const shutter = document.getElementById("shutter");
const switchBtn = document.getElementById("switch-camera");

const overlay = document.getElementById("photo-overlay");
const overlayImage = document.getElementById("overlay-image");
const download = document.getElementById("download");
const closeBtn = document.getElementById("close");

closeBtn.onclick = () => overlay.classList.remove("active");


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

    image(cam, width / 2 - w / 2, height / 2 - h / 2, w, h);
    pop();

    // Rule of thirds guide lines
    stroke(255, 50);
    strokeWeight(1);
    line(width / 3, 0, width / 3, height);
    line((2 * width) / 3, 0, (2 * width) / 3, height);
    line(0, height / 3, width, height / 3);
    line(0, (2 * height) / 3, width, (2 * height) / 3);
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
