let isLightMode = true

function changeColor() {
    const bodyColors = document.body
    const dotColors = document.querySelectorAll(".grid-dot");
    const translucentBox = document.querySelectorAll(".translucent-box")

    if (!isLightMode) {
        bodyColors.style.backgroundColor = ("#f0f0f0")
        
        dotColors.forEach(dot => {
            dot.style.backgroundColor = "#000000";
        });

        translucentBox.forEach(item => {
            item.style.backgroundColor = "rgba(0,0,0,0.8)"
        });
        isLightMode = true
    } else {
        bodyColors.style.backgroundColor = ("#000000")

        dotColors.forEach(dot => {
            dot.style.backgroundColor = "#ffffff";
        });

        translucentBox.forEach(item => {
            item.style.backgroundColor = "rgba(49,49,49,0.5)"
        });
        isLightMode = false
    }
}