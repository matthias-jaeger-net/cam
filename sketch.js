let cam;
let facingMode = "environment";

let fibMode = false;
let fibButtonClicked = false;
let dragging = false;
let dragSpiralIdx = -1;
let dragOffsetX = 0;
let dragOffsetY = 0;

const fibOverlay = document.getElementById("fib-overlay");
const fibCtx = fibOverlay.getContext("2d");

function resizeFibOverlay() {
    fibOverlay.width = window.innerWidth;
    fibOverlay.height = window.innerHeight;
}
resizeFibOverlay();
window.addEventListener("resize", resizeFibOverlay);

let spirals = []; // [{ squares, setup, size, label }]
let activeIdx = -1;
let nextLabelCode = 65; // 65 = 'A'

const flashEl = document.getElementById("flash");
const shutter = document.getElementById("shutter");
const switchBtn = document.getElementById("switch-camera");
const bottomBar = document.querySelector(".bottom-bar");
const fibBtn = document.getElementById("fibonacci-squares");

const overlay = document.getElementById("photo-overlay");
const overlayImage = document.getElementById("overlay-image");
const download = document.getElementById("download");
const closeBtn = document.getElementById("close");

function hideFibUI() {
    [fibControls, fibList, fibShutter, fibMessage].forEach(el => el.style.display = "none");
}

function restoreFibUI() {
    fibControls.style.display = "flex";
    if (spirals.length > 1) fibList.style.display = "flex";
    fibShutter.style.display = "block";
}

closeBtn.onclick = () => {
    overlay.classList.remove("active");
    if (fibMode) restoreFibUI();
};

const fibMessage = document.createElement("div");
fibMessage.textContent = "place the centre of the fibonacci squares";
fibMessage.style.cssText = "position:fixed;top:20px;left:50%;transform:translateX(-50%);color:white;font-size:16px;z-index:1000;pointer-events:none;display:none;white-space:nowrap;";
document.body.appendChild(fibMessage);

const fibControls = document.createElement("div");
fibControls.style.cssText = "position:fixed;bottom:40px;left:50%;transform:translateX(-50%);display:none;gap:20px;z-index:1000;align-items:center;";
fibControls.innerHTML = `
    <button id="fib-minus">−</button>
    <button id="fib-plus">+</button>
    <span style="display:inline-block;width:20px;"></span>
    <button id="fib-spin">↻</button>
    <button id="fib-new">new</button>
    <button id="fib-delete">del</button>
`;
document.body.appendChild(fibControls);

const FIB_DIRS = [
    { dx: 0, dy: -1 }, // 0: UP
    { dx: 1,  dy: 0 }, // 1: RIGHT
    { dx: 0,  dy: 1 }, // 2: DOWN
    { dx: -1, dy: 0 }, // 3: LEFT
];

function buildFibSquares(sp) {
    const { setup, size } = sp;
    if (!setup) return sp.squares;
    const { anchorX, anchorY, sq2DirIndex, count } = setup;
    const d2 = FIB_DIRS[sq2DirIndex];

    const sq1 = { x: anchorX - d2.dx * size / 2, y: anchorY - d2.dy * size / 2, size };
    const sq2 = { x: anchorX + d2.dx * size / 2, y: anchorY + d2.dy * size / 2, size };
    const squares = [sq1, sq2];
    const sizes = [size, size];

    let bbox = {
        x: Math.min(sq1.x, sq2.x) - size / 2,
        y: Math.min(sq1.y, sq2.y) - size / 2,
        w: d2.dx !== 0 ? 2 * size : size,
        h: d2.dy !== 0 ? 2 * size : size,
    };
    let dirIndex = (sq2DirIndex - 1 + 4) % 4;

    for (let i = 2; i < count; i++) {
        const s = sizes[i - 1] + sizes[i - 2];
        const dir = FIB_DIRS[dirIndex];
        let cx, cy;
        if (dir.dx !== 0) {
            cx = dir.dx > 0 ? bbox.x + bbox.w + s / 2 : bbox.x - s / 2;
            cy = bbox.y + bbox.h / 2;
        } else {
            cx = bbox.x + bbox.w / 2;
            cy = dir.dy > 0 ? bbox.y + bbox.h + s / 2 : bbox.y - s / 2;
        }
        squares.push({ x: cx, y: cy, size: s });
        sizes.push(s);
        if (dir.dx > 0)       bbox.w += s;
        else if (dir.dx < 0) { bbox.x -= s; bbox.w += s; }
        else if (dir.dy > 0)  bbox.h += s;
        else                  { bbox.y -= s; bbox.h += s; }
        dirIndex = (dirIndex + 1) % 4;
    }
    return squares;
}

const fibList = document.createElement("div");
fibList.style.cssText = "position:fixed;top:calc(16px + env(safe-area-inset-top));left:16px;display:none;flex-direction:column;gap:10px;z-index:1000;";
document.body.appendChild(fibList);

function updateFibList() {
    fibList.innerHTML = "";
    spirals.forEach((sp, i) => {
        const item = document.createElement("button");
        item.textContent = sp.label;
        item.style.opacity = i === activeIdx ? "1" : "0.4";
        item.onclick = (e) => { e.stopPropagation(); fibButtonClicked = true; activeIdx = i; updateFibList(); };
        fibList.appendChild(item);
    });
    fibList.style.display = spirals.length > 1 ? "flex" : "none";
}

fibControls.querySelector("#fib-delete").onclick = (e) => {
    e.stopPropagation();
    fibButtonClicked = true;
    spirals.splice(activeIdx, 1);
    if (spirals.length === 0) {
        spirals.push({ squares: [], setup: null, size: window.innerWidth / 8, label: String.fromCharCode(nextLabelCode++) });
        fibMessage.style.display = "block";
    }
    activeIdx = Math.min(activeIdx, spirals.length - 1);
    updateFibList();
};

fibControls.querySelector("#fib-new").onclick = (e) => {
    e.stopPropagation();
    fibButtonClicked = true;
    spirals.push({ squares: [], setup: null, size: window.innerWidth / 8, label: String.fromCharCode(nextLabelCode++) });
    activeIdx = spirals.length - 1;
    updateFibList();
    fibMessage.style.display = "block";
};

fibControls.querySelector("#fib-minus").onclick = (e) => {
    e.stopPropagation(); fibButtonClicked = true;
    const sp = spirals[activeIdx];
    sp.size = max(20, sp.size - 10);
    sp.squares = buildFibSquares(sp);
};
fibControls.querySelector("#fib-plus").onclick = (e) => {
    e.stopPropagation(); fibButtonClicked = true;
    const sp = spirals[activeIdx];
    sp.size += 10;
    sp.squares = buildFibSquares(sp);
};
fibControls.querySelector("#fib-spin").onclick = (e) => {
    e.stopPropagation(); fibButtonClicked = true;
    const sp = spirals[activeIdx];
    if (sp.setup) {
        const d = FIB_DIRS[sp.setup.sq2DirIndex];
        const sq1x = sp.setup.anchorX - d.dx * sp.size / 2;
        const sq1y = sp.setup.anchorY - d.dy * sp.size / 2;
        sp.setup.sq2DirIndex = (sp.setup.sq2DirIndex + 1) % 4;
        const nd = FIB_DIRS[sp.setup.sq2DirIndex];
        sp.setup.anchorX = sq1x + nd.dx * sp.size / 2;
        sp.setup.anchorY = sq1y + nd.dy * sp.size / 2;
        sp.squares = buildFibSquares(sp);
    }
};

fibBtn.onclick = () => {
    fibMode = true;
    nextLabelCode = 65;
    spirals = [{ squares: [], setup: null, size: window.innerWidth / 8, label: String.fromCharCode(nextLabelCode++) }];
    activeIdx = 0;
    bottomBar.style.display = "none";
    fibBtn.style.display = "none";
    fibMessage.style.display = "block";
    updateFibList();
};


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

    // Fibonacci squares on overlay canvas
    fibCtx.clearRect(0, 0, fibOverlay.width, fibOverlay.height);
    if (fibMode) {
        fibCtx.lineWidth = 2;
        fibCtx.globalCompositeOperation = "source-over";
        for (let i = 0; i < spirals.length; i++) {
            const sp = spirals[i];
            const isActive = i === activeIdx;
            fibCtx.strokeStyle = isActive ? "rgba(0,170,255,1)" : "rgba(0,170,255,0.4)";
            if (sp.squares.length === 0 && isActive) {
                const s = sp.size;
                fibCtx.strokeRect(width / 2 - s / 2, height / 2 - s / 2, s, s);
            } else {
                for (const sq of sp.squares) {
                    const s = sq.size || sp.size;
                    fibCtx.strokeRect(sq.x - s / 2, sq.y - s / 2, s, s);
                }
            }
        }
        // Punch out button areas so lines are hidden behind buttons
        fibCtx.globalCompositeOperation = "destination-out";
        fibCtx.fillStyle = "rgba(0,0,0,1)";
        const pad = 6;
        const btns = [
            fibShutter,
            ...Array.from(fibControls.querySelectorAll("button")),
            ...Array.from(fibList.querySelectorAll("button")),
        ];
        for (const btn of btns) {
            if (window.getComputedStyle(btn).display === "none") continue;
            const r = btn.getBoundingClientRect();
            fibCtx.fillRect(r.left - pad, r.top - pad, r.width + pad * 2, r.height + pad * 2);
        }
        fibCtx.globalCompositeOperation = "source-over";
    }

    // Rule of thirds guide lines
    stroke(255, 50);
    strokeWeight(1);
    line(width / 3, 0, width / 3, height);
    line((2 * width) / 3, 0, (2 * width) / 3, height);
    line(0, height / 3, width, height / 3);
    line(0, (2 * height) / 3, width, (2 * height) / 3);
}

function mouseDragged() {
    if (dragging && dragSpiralIdx >= 0) {
        const sp = spirals[dragSpiralIdx];
        sp.setup.anchorX = mouseX - dragOffsetX;
        sp.setup.anchorY = mouseY - dragOffsetY;
        sp.squares = buildFibSquares(sp);
    }
}

function mouseReleased() {
    dragging = false;
    dragSpiralIdx = -1;
}

function touchStarted() { mousePressed(); return false; }
function touchMoved()   { mouseDragged(); return false; }
function touchEnded()   { mouseReleased(); return false; }

function windowResized() {
    resizeCanvas(window.innerWidth, window.innerHeight);
}

function insideGrabArea(sp, mx, my) {
    if (!sp.setup || sp.squares.length < 2) return false;
    const { anchorX, anchorY, sq2DirIndex } = sp.setup;
    const d = FIB_DIRS[sq2DirIndex];
    const hw = d.dx !== 0 ? sp.size : sp.size / 2;
    const hh = d.dy !== 0 ? sp.size : sp.size / 2;
    return mx >= anchorX - hw && mx <= anchorX + hw &&
           my >= anchorY - hh && my <= anchorY + hh;
}

function isOverFibUI() {
    return [fibShutter, fibControls, fibList].some(el => {
        if (window.getComputedStyle(el).display === "none") return false;
        const r = el.getBoundingClientRect();
        return mouseX >= r.left && mouseX <= r.right &&
               mouseY >= r.top  && mouseY <= r.bottom;
    });
}

function mousePressed() {
    if (fibButtonClicked) { fibButtonClicked = false; return; }
    if (isOverFibUI()) return;
    if (fibMode) {
        for (let i = 0; i < spirals.length; i++) {
            if (insideGrabArea(spirals[i], mouseX, mouseY)) {
                dragging = true;
                dragSpiralIdx = i;
                activeIdx = i;
                dragOffsetX = mouseX - spirals[i].setup.anchorX;
                dragOffsetY = mouseY - spirals[i].setup.anchorY;
                updateFibList();
                return;
            }
        }
    }
    if (fibMode && activeIdx >= 0) {
        const sp = spirals[activeIdx];
        if (sp.squares.length === 0) {
            sp.squares.push({ x: mouseX, y: mouseY, size: sp.size });
            fibControls.style.display = "flex";
            fibMessage.style.display = "none";
            fibShutter.style.display = "block";
        } else if (sp.squares.length === 1) {
            const first = sp.squares[0];
            const dx = mouseX - first.x;
            const dy = mouseY - first.y;
            let sq2DirIndex;
            if (abs(dx) >= abs(dy)) {
                sq2DirIndex = dx > 0 ? 1 : 3;
            } else {
                sq2DirIndex = dy > 0 ? 2 : 0;
            }
            const d = FIB_DIRS[sq2DirIndex];
            sp.setup = {
                anchorX: first.x + d.dx * sp.size / 2,
                anchorY: first.y + d.dy * sp.size / 2,
                sq2DirIndex,
                count: 2,
            };
            sp.squares = buildFibSquares(sp);
        } else if (sp.setup) {
            sp.setup.count++;
            sp.squares = buildFibSquares(sp);
        }
    }
}

async function takePhoto() {
    flashEl.style.opacity = 1;
    setTimeout(() => (flashEl.style.opacity = 0), 100);

    // Draw only the camera image to a temp canvas (no spirals)
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = width;
    tempCanvas.height = height;
    const ctx = tempCanvas.getContext("2d");

    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, width, height);

    const videoEl = cam.elt;
    const canvasRatio = width / height;
    const videoRatio = videoEl.videoWidth / videoEl.videoHeight;
    let w, h;
    if (canvasRatio > videoRatio) {
        w = width; h = width / videoRatio;
    } else {
        h = height; w = height * videoRatio;
    }
    const x = width / 2 - w / 2;
    const y = height / 2 - h / 2;

    if (facingMode === "user") {
        ctx.translate(width, 0);
        ctx.scale(-1, 1);
    }
    ctx.drawImage(videoEl, x, y, w, h);

    const dataUrl = tempCanvas.toDataURL("image/png");

    overlayImage.src = dataUrl;
    overlay.classList.add("active");
    if (fibMode) hideFibUI();

    const res = await fetch(dataUrl);
    const blob = await res.blob();
    const file = new File([blob], "photo.png", { type: "image/png" });

    if (navigator.canShare && navigator.canShare({ files: [file] })) {
        try { await navigator.share({ files: [file] }); } catch {}
    }

    download.href = dataUrl;
}

shutter.onclick = takePhoto;

const fibShutter = document.createElement("button");
fibShutter.id = "fib-shutter";
fibShutter.onclick = (e) => { e.stopPropagation(); fibButtonClicked = true; takePhoto(); };
document.body.appendChild(fibShutter);

switchBtn.onclick = () => {
    facingMode = facingMode === "environment" ? "user" : "environment";
    initCamera();
};
