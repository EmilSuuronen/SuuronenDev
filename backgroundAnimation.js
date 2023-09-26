const container = document.body;
const dots = [];

function createGridDots() {
    const dotSize = 20; // Adjust the size of each dot
    const maxRows = 50;    // Maximum number of rows
    const maxCols = 100;    // Maximum number of columns
    const numRows = Math.min(maxRows, Math.floor(window.innerHeight / dotSize));
    const numCols = Math.min(maxCols, Math.floor(window.innerWidth / dotSize));
    const dotSpacingX = window.innerWidth / numCols;
    const dotSpacingY = window.innerHeight / numRows;

    for (let row = 0; row < numRows; row++) {
        for (let col = 0; col < numCols; col++) {
            const x = col * dotSpacingX + dotSize / 2;
            const y = row * dotSpacingY + dotSize / 2;

            const dot = document.createElement("div");
            dot.className = "grid-dot";
            dot.style.left = `${x}px`;
            dot.style.top = `${y}px`;
            container.appendChild(dot);
            dots.push(dot);
        }
    }
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

createGridDots(); // Create the grid dots on page load

function reloadPage() {
    location.reload();
}

window.addEventListener("resize", reloadPage);

container.addEventListener("mousemove", moveDots);