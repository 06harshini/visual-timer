const circle = document.getElementById("circle");
const remainingtime = document.getElementById("remainingtime");
const hoursinput = document.getElementById("hours");
const minutesinput = document.getElementById("minutes");
const setbutton = document.getElementById("set");
const pausebutton = document.getElementById("pause");
const resumebutton = document.getElementById("resume");
const resetbutton = document.getElementById("reset");
const settings = document.getElementById("settings");
const controls = document.getElementById("controls");
const endSound = document.getElementById("endSound");
const soundtoggle = document.getElementById("soundtoggle") || { checked: true };
const themetoggle = document.getElementById('themetoggle');

let totaltime = 0;
let starttime = 0;
let paused = false;
let pausedat = 0;
let lastsecond = -1;

let clickAudioCtx = null;
function initAudio() {
    if (!clickAudioCtx) {
        clickAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }

    if (clickAudioCtx.state === "suspended") {
        clickAudioCtx.resume();
    }
}

document.addEventListener("click", initAudio, { once: true });
document.addEventListener("keydown", initAudio, { once: true });

function formattime(ms) {
    let totalseconds = Math.max(0, Math.floor(ms / 1000));
    let h = Math.floor(totalseconds / 3600);
    let m = Math.floor((totalseconds % 3600) / 60);
    let s = totalseconds % 60;


    if (h >= 24) {
        const days = Math.floor(h / 24);
        const hours = h % 24;
        return `${days}d ${String(hours).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    }

    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

const clickSound = document.getElementById("clickSound");

function playClickSound() {
    if (!clickSound) return;

    clickSound.currentTime = 0;
    clickSound.play().catch(() => { });
}


function playEndSound() {
    if (!soundtoggle || !soundtoggle.checked) return;
    if (!endSound) return;

    endSound.currentTime = 0;
    endSound.play().catch(() => { });
}

function applytheme(theme) {
    try {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('vt-theme', theme);
        if (themetoggle) themetoggle.checked = (theme === 'light');
    } catch (e) { }
}


const savedTheme = localStorage.getItem('vt-theme') || 'dark';
applytheme(savedTheme);

if (themetoggle) {

    themetoggle.checked = (savedTheme === 'light');
    themetoggle.addEventListener('change', (e) => {
        applytheme(e.target.checked ? 'light' : 'dark');
    });
}


const accentBtns = document.querySelectorAll('.accent-btn');
const accentColorInput = document.getElementById('accentColor');
function applyAccent(color) {
    try {
        document.documentElement.style.setProperty('--accent', color);
        localStorage.setItem('vt-accent', color);
        if (accentColorInput) accentColorInput.value = color;
    } catch (e) { }
}

const savedAccent = localStorage.getItem('vt-accent') || getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#22c55e';
applyAccent(savedAccent);

accentBtns.forEach(b => b.addEventListener('click', (e) => {
    const c = e.currentTarget.getAttribute('data-color');
    if (c) applyAccent(c);
}));

if (accentColorInput) {
    accentColorInput.value = savedAccent;
    accentColorInput.addEventListener('input', (e) => applyAccent(e.target.value));
}

function update() {
    if (!starttime || totaltime <= 0) {
        remainingtime.textContent = `time left : 00:00:00`;
        circle.style.background = `conic-gradient(var(--accent) 0deg, var(--bg-secondary) 0deg)`;
        return;
    }

    const now = Date.now();
    let elapsed = paused ? pausedat - starttime : now - starttime;
    let remaining = totaltime - elapsed;

    if (remaining <= 0 && !paused) {
        remaining = 0;
        paused = true;

        playEndSound();

        if (settings) settings.style.display = "flex";
        if (controls) controls.style.display = "none";


        const progress = totaltime > 0 ? 1 - ((totaltime - remaining) / totaltime) : 0;
        const degrees = isFinite(progress) ? progress * 360 : 0;
        circle.style.background = `conic-gradient(var(--accent) ${degrees}deg, var(--bg-secondary) ${degrees}deg)`;
        remainingtime.textContent = `time left : ${formattime(remaining)}`;
        return;
    }

    const progress = totaltime > 0 ? 1 - ((totaltime - remaining) / totaltime) : 0;
    const degrees = isFinite(progress) ? progress * 360 : 0;
    circle.style.background = `conic-gradient(var(--accent) ${degrees}deg, var(--bg-secondary) ${degrees}deg)`;

    remainingtime.textContent = `time left : ${formattime(remaining)}`;

    lastsecond = -1;
    requestAnimationFrame(update);
}

setbutton.addEventListener("click", () => {
    const h = parseInt(hoursinput.value) || 0;
    const m = parseInt(minutesinput.value) || 0;
    totaltime = (h * 3600 + m * 60) * 1000;

    if (totaltime === 0) return;

    playClickSound();
    starttime = Date.now();
    paused = false;
    update();
});


hoursinput.addEventListener("input", () => {
    if (hoursinput.value < 0) hoursinput.value = 0;
});

minutesinput.addEventListener("input", () => {
    if (minutesinput.value < 0) minutesinput.value = 0;
});

pausebutton.addEventListener("click", () => {
    if (!paused) {
        playClickSound();
        paused = true;
        pausedat = Date.now();
    }
});

resumebutton.addEventListener("click", () => {
    if (paused) {
        playClickSound();
        paused = false;
        starttime += (Date.now() - pausedat);
    }
});

resetbutton.addEventListener("click", () => {
    playClickSound();
    starttime = 0;
    totaltime = 0;
    paused = false;
    circle.style.background = `conic-gradient(var(--accent) 0deg, var(--bg-secondary) 0deg)`;
    remainingtime.textContent = `time left : 00:00:00`;
});

document.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
        setbutton.click();
    }
});

document.addEventListener("keydown", (e) => {
    if (e.code === "Space" && starttime && totaltime > 0) {
        e.preventDefault();

        if (!paused) {
            pausebutton.click();
        }
        else {
            resumebutton.click();
        }
    }
});

document.addEventListener("keydown", (e) => {
    if ((e.key === 'f' || e.key === 'F') && !e.ctrlKey && !e.altKey) {
        e.preventDefault();

        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(() => { });
        } else {
            document.exitFullscreen().catch(() => { });
        }
    }
});