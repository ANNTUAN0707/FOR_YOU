console.log("Experiencia iniciada - Navegación manual");

// ==========================================
// CANVAS
// ==========================================

const canvas = document.getElementById("particles");
const ctx = canvas.getContext("2d");

let width, height;
let particles = [];

let wordFormed = false;
let sequenceStarted = false;
let currentScene = "";


// ==========================================
// CONFIGURACIÓN DEL DISPOSITIVO
// ==========================================

let isMobile = window.innerWidth <= 768;

let maxParticles = isMobile ? 420 : 900;
let floatingAmount = isMobile ? 60 : 120;
let totalParticles = maxParticles + floatingAmount;


// ==========================================
// COLORES
// ==========================================

const particleColor = "#ff2424";
const wordColor = "#ff1744";
const brightColor = "#fff0f3";


// ==========================================
// CONFIGURACIÓN DE INTERACCIÓN
// ==========================================

const mouse = {
    x: null,
    y: null,
    radius: isMobile ? 85 : 130
};


// MENSAJES DE LA EXPERIENCIA
const messages = [
    "Te quiero",
    "Adoro todo de ti",
    "Papi los extraña",
    "Los amo"
];

let currentMessageIndex = 0;

let particlesReady = false;


// ==========================================
// CREAR PARTÍCULAS
// ==========================================

function newParticle(x, y) {

    return {
        x,
        y,

        originX: x,
        originY: y,

        targetX: null,
        targetY: null,

        isFloating: false,

        size: Math.random() * 1.5 + 0.5,

        speedX: (Math.random() - 0.5) * 0.15,
        speedY: (Math.random() - 0.5) * 0.15,

        floatX: Math.random() * 0.5 + 0.2,
        floatY: Math.random() * 0.5 + 0.2,

        phase: Math.random() * Math.PI * 2,

        driftX: (Math.random() - 0.5) * 0.5,
        driftY: (Math.random() - 0.5) * 0.5,

        driftPhase: Math.random() * Math.PI * 2,

        opacity: Math.random() * 0.6 + 0.4
    };
}


// CREAR PARTÍCULAS INICIALES
function createParticles() {

    particles = [];

    for (let i = 0; i < totalParticles; i++) {

        particles.push(
            newParticle(
                Math.random() * width,
                Math.random() * height
            )
        );
    }
}


// ==========================================
// GENERAR POSICIONES PARA TEXTO
// ==========================================

function createTextTargets(message) {

    const offscreen = document.createElement("canvas");
    const offCtx = offscreen.getContext("2d");

    offscreen.width = width;
    offscreen.height = height;

    // TAMAÑO ADAPTABLE
    let fontSize = isMobile
        ? Math.min(width * 0.105, height * 0.13, 55)
        : Math.min(width * 0.115, height * 0.25, 115);

    offCtx.font = `bold ${fontSize}px Arial`;

    // EVITAR QUE EL TEXTO SE SALGA
    while (
        offCtx.measureText(message).width > width * 0.88 &&
        fontSize > 16
    ) {

        fontSize -= 2;
        offCtx.font = `bold ${fontSize}px Arial`;
    }

    offCtx.textAlign = "center";
    offCtx.textBaseline = "middle";
    offCtx.fillStyle = "#ffffff";

    offCtx.fillText(
        message,
        width / 2,
        height / 2
    );

    // OBTENER PÍXELES
    const imageData = offCtx.getImageData(
        0, 0, width, height
    );

    const points = [];
    const step = isMobile ? 5 : 4;

    for (let y = 0; y < height; y += step) {

        for (let x = 0; x < width; x += step) {

            const index = (y * width + x) * 4;

            if (imageData.data[index + 3] > 100) {
                points.push({ x, y });
            }
        }
    }

    const stride = Math.max(
        1,
        Math.ceil(points.length / maxParticles)
    );

    return points.filter(
        (_, i) => i % stride === 0
    );
}


// ==========================================
// GENERAR CORAZONES
// ==========================================

function createHeartTargets() {

    const points = [];

    const heartWidth = isMobile
        ? Math.min(width * 0.72, height * 0.42)
        : Math.min(width * 0.48, height * 0.65);

    const scale = heartWidth / 32;

    const heartSizes = [1, 0.78, 0.56, 0.34];

    const pointsPerHeart = isMobile ? 120 : 180;

    heartSizes.forEach(size => {

        for (let i = 0; i < pointsPerHeart; i++) {

            const t = (i / pointsPerHeart) * Math.PI * 2;

            const x = 16 * Math.pow(Math.sin(t), 3);

            const y =
                13 * Math.cos(t) -
                5 * Math.cos(2 * t) -
                2 * Math.cos(3 * t) -
                Math.cos(4 * t);

            points.push({

                x: width / 2 + x * scale * size,

                y: height / 2 - y * scale * size

            });
        }
    });

    return points;
}


// ==========================================
// APLICAR POSICIONES
// ==========================================

function applyTargets(targets) {

    particles.forEach((p, i) => {

        if (targets[i]) {

            p.targetX = targets[i].x;
            p.targetY = targets[i].y;

            p.isFloating = false;

            p.size = Math.random() * 1.5 + 1.2;
            p.opacity = Math.random() * 0.25 + 0.75;

        } else {

            p.targetX = null;
            p.targetY = null;

            p.isFloating = true;

            p.driftX = (Math.random() - 0.5) * 0.7;
            p.driftY = (Math.random() - 0.5) * 0.7;

        }
    });
}


// ==========================================
// CAMBIAR ESCENAS
// ==========================================

function showText(message) {

    currentScene = message;

    const targets = createTextTargets(message);

    applyTargets(targets);

    console.log("Mostrando:", message);
}


// CORAZÓN FINAL
function showHeart() {

    currentScene = "heart";

    const targets = createHeartTargets();

    applyTargets(targets);

    console.log("Corazón formado ❤️");
}


// ==========================================
// COMPROBAR SI LAS PARTÍCULAS ESTÁN LISTAS
// ==========================================

function waitForParticles() {

    return new Promise(resolve => {

        let stableFrames = 0;

        function check() {

            const movingParticles = particles.filter(p => {

                if (p.isFloating || p.targetX === null) {
                    return false;
                }

                const dx = p.targetX - p.x;
                const dy = p.targetY - p.y;

                const distance = Math.sqrt(dx * dx + dy * dy);

                return distance > 1.5;
            });

            if (movingParticles.length === 0) {

                stableFrames++;

                // CONFIRMAR 8 FRAMES ESTABLES
                if (stableFrames >= 8) {
                    resolve();
                    return;
                }

            } else {

                stableFrames = 0;

            }

            requestAnimationFrame(check);
        }

        check();

    });
}


// ==========================================
// MOSTRAR MENSAJE ACTUAL
// ==========================================

async function showCurrentMessage() {

    particlesReady = false;

    showText(messages[currentMessageIndex]);

    // ESPERAR A QUE TERMINE LA FORMACIÓN
    await waitForParticles();

    particlesReady = true;

    console.log(
        "Mensaje listo:",
        messages[currentMessageIndex]
    );

    console.log("Esperando toque en pantalla...");
}


// ==========================================
// INICIAR EXPERIENCIA
// ==========================================

function startSequence() {

    if (sequenceStarted) return;

    sequenceStarted = true;
    wordFormed = true;

    // OCULTAR TEXTO PARA TI
    const paraTi = document.getElementById("paraTi");

    if (paraTi) {
        paraTi.classList.add("hide");
    }

    // OCULTAR BOTÓN
    const button = document.getElementById("startButton");

    if (button) {
        button.style.opacity = "0";
        button.style.pointerEvents = "none";
    }

    currentMessageIndex = 0;

    // PRIMER MENSAJE
    showCurrentMessage();
}


// ==========================================
// AVANZAR A LA SIGUIENTE ESCENA
// ==========================================

function nextScene() {

    // EVITAR TOQUES PREMATUROS
    if (!sequenceStarted || !particlesReady) return;

    // BLOQUEAR TOQUES REPETIDOS
    particlesReady = false;

    currentMessageIndex++;

    // SI TERMINARON LOS MENSAJES
    if (currentMessageIndex >= messages.length) {

        showHeart();

        console.log("Experiencia finalizada ❤️");

        return;
    }

    // SIGUIENTE MENSAJE
    showCurrentMessage();
}


// ==========================================
// DETECTAR TOQUES EN PANTALLA
// ==========================================

window.addEventListener("pointerdown", (event) => {

    // NO CONTAR EL BOTÓN INICIAL
    if (event.target.closest("#startButton")) return;

    // NO AVANZAR ANTES DE INICIAR
    if (!sequenceStarted) return;

    // NO AVANZAR SI LAS PARTÍCULAS SIGUEN MOVIÉNDOSE
    if (!particlesReady) return;

    // AVANZAR
    nextScene();

});


// ==========================================
// MOVIMIENTO DEL MOUSE
// ==========================================

window.addEventListener("pointermove", (event) => {

    const rect = canvas.getBoundingClientRect();

    mouse.x = event.clientX - rect.left;
    mouse.y = event.clientY - rect.top;

});

window.addEventListener("pointerup", () => {

    mouse.x = null;
    mouse.y = null;

});

window.addEventListener("pointerleave", () => {

    mouse.x = null;
    mouse.y = null;

});


// ==========================================
// REPULSIÓN DEL MOUSE Y TOUCH
// ==========================================

function repelMouse(p) {

    if (mouse.x === null || mouse.y === null) return;

    const dx = p.x - mouse.x;
    const dy = p.y - mouse.y;

    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < mouse.radius && distance > 0) {

        const force =
            (mouse.radius - distance) / mouse.radius;

        const strength = isMobile ? 3 : 5;

        p.x += (dx / distance) * force * strength;
        p.y += (dy / distance) * force * strength;
    }
}


// ==========================================
// BOTÓN DE INICIO
// ==========================================

const startButton = document.getElementById("startButton");

if (startButton) {

    startButton.addEventListener("click", startSequence);

}


// ==========================================
// ANIMACIÓN PRINCIPAL
// ==========================================

function animate() {

    ctx.clearRect(0, 0, width, height);

    const time = Date.now() * 0.001;

    particles.forEach(p => {

        // PARTÍCULAS DEL TEXTO O CORAZÓN
        if (wordFormed && !p.isFloating) {

            p.x += (p.targetX - p.x) * 0.045;
            p.y += (p.targetY - p.y) * 0.045;

        }

        // PARTÍCULAS FLOTANTES
        else if (wordFormed && p.isFloating) {

            p.x += p.driftX +
                Math.sin(time + p.driftPhase) * 0.3;

            p.y += p.driftY +
                Math.cos(time + p.driftPhase) * 0.3;

            p.driftX += (Math.random() - 0.5) * 0.015;
            p.driftY += (Math.random() - 0.5) * 0.015;

            p.driftX = Math.max(
                -0.7,
                Math.min(0.7, p.driftX)
            );

            p.driftY = Math.max(
                -0.7,
                Math.min(0.7, p.driftY)
            );

            repelMouse(p);

            if (p.x < 0) p.x = width;
            if (p.x > width) p.x = 0;

            if (p.y < 0) p.y = height;
            if (p.y > height) p.y = 0;

        }

        // MOVIMIENTO INICIAL
        else if (!wordFormed) {

            p.x += p.speedX +
                Math.sin(time + p.phase) * p.floatX * 0.15;

            p.y += p.speedY +
                Math.cos(time + p.phase) * p.floatY * 0.15;

            repelMouse(p);

            p.x += (p.originX - p.x) * 0.008;
            p.y += (p.originY - p.y) * 0.008;

            if (p.x < 0 || p.x > width) p.speedX *= -1;
            if (p.y < 0 || p.y > height) p.speedY *= -1;

        }

        // DIBUJAR PARTÍCULAS
        ctx.beginPath();

        ctx.arc(
            p.x,
            p.y,
            p.size,
            0,
            Math.PI * 2
        );

        // COLORES Y BRILLO
        if (wordFormed && !p.isFloating) {

            ctx.fillStyle =
                `rgba(255, 235, 240, ${p.opacity})`;

            ctx.shadowBlur = isMobile ? 10 : 20;
            ctx.shadowColor = wordColor;

        } else if (wordFormed && p.isFloating) {

            ctx.fillStyle =
                `rgba(255, 90, 120, ${p.opacity})`;

            ctx.shadowBlur = isMobile ? 6 : 12;
            ctx.shadowColor = wordColor;

        } else {

            ctx.fillStyle =
                `rgba(255, 50, 70, ${p.opacity})`;

            ctx.shadowBlur = isMobile ? 3 : 5;
            ctx.shadowColor = particleColor;

        }

        ctx.fill();

    });

    requestAnimationFrame(animate);
}


// ==========================================
// REDIMENSIONAR CANVAS
// ==========================================

function resizeCanvas() {

    isMobile = window.innerWidth <= 768;

    maxParticles = isMobile ? 420 : 900;
    floatingAmount = isMobile ? 60 : 120;
    totalParticles = maxParticles + floatingAmount;

    mouse.radius = isMobile ? 85 : 130;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    width = window.innerWidth;
    height = window.innerHeight;

    canvas.style.width = width + "px";
    canvas.style.height = height + "px";

    canvas.width = width * dpr;
    canvas.height = height * dpr;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    if (sequenceStarted) {

        particlesReady = false;

        if (currentScene === "heart") {

            showHeart();

        } else {

            showText(currentScene);

            waitForParticles().then(() => {
                particlesReady = true;
            });

        }

    } else {

        createParticles();

    }
}


// EVENTO DE REDIMENSIONAMIENTO
window.addEventListener("resize", resizeCanvas);


// ==========================================
// INICIALIZAR
// ==========================================

resizeCanvas();
animate();