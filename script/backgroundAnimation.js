const container = document.body;
const dots = [];

function createGridDots() {
    const dotSize = 35;
    const numRows = (document.body.scrollHeight/ 40);
    const numCols = (window.innerWidth / 40);
    const dotSpacingX = window.innerWidth / numCols;
    const dotSpacingY = document.body.scrollHeight / numRows;

    const fragment = document.createDocumentFragment();
    
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
        const maxDistance = 50;
        const dotX = parseInt(dot.style.left);
        const dotY = parseInt(dot.style.top);
        const dx = event.pageX - dotX;
        const dy = event.pageY - dotY;
        const distance = Math.sqrt(dx * dx + dy * dy);

        let dotSize = Math.min(maxDistance / distance, 1) * 8;

        dot.style.width = `${dotSize}px`;
        dot.style.height = `${dotSize}px`;
    });
}

function reloadPage() {
    location.reload();
}

document.addEventListener("resize", reloadPage);
container.addEventListener("mousemove", moveDots);

createGridDots();



