const container = document.body;
const dots = [];

function createGridDots() {
    const dotSize = 20;    // Adjust the size of each dot
    const maxRows = 25;    // Maximum number of rows
    const maxCols = 50;    // Maximum number of columns
    const numRows = Math.min(maxRows, Math.floor(window.innerHeight / dotSize));
    const numCols = Math.min(maxCols, Math.floor(window.innerWidth / dotSize));
    const dotSpacingX = window.innerWidth / numCols;
    const dotSpacingY = window.innerHeight / numRows;

    const fragment = document.createDocumentFragment(); // Use a document fragment for faster DOM insertion

    for (let row = 0; row < numRows; row++) {
        for (let col = 0; col < numCols; col++) {
            const x = col * dotSpacingX + dotSize / 2;
            const y = row * dotSpacingY + dotSize / 2;

            const dot = document.createElement("div");
            dot.className = "grid-dot";
            dot.style.left = `${x}px`;
            dot.style.top = `${y}px`;

            fragment.appendChild(dot);
            dots.push(dot);
        }
    }
    container.appendChild(fragment);
}

function moveDots(event) {
    dots.forEach((dot) => {

        const maxDistance = 100;

        const dotX = parseInt(dot.style.left);
        const dotY = parseInt(dot.style.top);
        const dx = event.clientX - dotX;
        const dy = event.clientY - dotY;
        const distance = Math.sqrt(dx * dx + dy * dy);

        const dotSize = Math.min(maxDistance / distance, 1) * 8;
        dot.style.width = `${dotSize}px`;
        dot.style.height = `${dotSize}px`;
        
        if (distance < 100) {
            dot.style.width = `${dotSize}px`;
            dot.style.height = `${dotSize}px`;
        }
    });
}

let prevWindowWidth = window.innerWidth;
let prevWindowHeight = window.innerHeight;

function checkZoomLevel() {
    const newWindowWidth = window.innerWidth;
    const newWindowHeight = window.innerHeight;

    // Check if the dimensions have changed significantly, indicating a possible zoom
    if (Math.abs(prevWindowWidth - newWindowWidth) > 5 || Math.abs(prevWindowHeight - newWindowHeight) > 5) {
        location.reload();
    }

    // Update the previous dimensions
    prevWindowWidth = newWindowWidth;
    prevWindowHeight = newWindowHeight;
}

function reloadPage() {
    location.reload();
}


window.addEventListener("resize", checkZoomLevel);

window.addEventListener("resize", reloadPage);

container.addEventListener("mousemove", moveDots);

container.addEventListener("touchmove", moveDots);

createGridDots(); // Create the grid dots on page load


