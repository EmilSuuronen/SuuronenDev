
let isLightMode = true

function changeColor() {
    const bodyColors = document.body
    const dotColors = document.querySelectorAll(".grid-dot");
    const buttonColor = document.querySelectorAll(".colorModeButton");

    if (!isLightMode){
        bodyColors.style.backgroundColor = ("#ffffff")
        dotColors.forEach(dot => {
            dot.style.backgroundColor = "#000000";
        });
        isLightMode = true
        console.log(isLightMode);
    } else {
        bodyColors.style.backgroundColor = ("#000000")
        dotColors.forEach(dot => {
            dot.style.backgroundColor = "#ffffff";
        });
        isLightMode = false
    }
}