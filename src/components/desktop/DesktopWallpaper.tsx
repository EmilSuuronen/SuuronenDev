import type { DesktopTheme } from "../../data/themes";
import Grainient from "../Grainient";

type DesktopWallpaperProps = {
  theme: DesktopTheme;
};

function DesktopWallpaper({ theme }: DesktopWallpaperProps) {
  return (
    <div aria-hidden="true" className="desktop-background">
      <Grainient
        className="desktop-wallpaper"
        timeSpeed={0.075}
        colorBalance={-0.14}
        warpStrength={1}
        warpFrequency={5.2}
        warpSpeed={0.38}
        warpAmplitude={50}
        blendAngle={-10}
        blendSoftness={0.07}
        rotationAmount={920}
        noiseScale={2}
        grainAmount={0.04}
        grainScale={2}
        grainAnimated={false}
        contrast={1.32}
        gamma={1}
        saturation={0.96}
        centerX={-0.02}
        centerY={0}
        zoom={0.78}
        color1={theme.wallpaperColor1}
        color2={theme.wallpaperColor2}
        color3={theme.wallpaperColor3}
      />
      <div className="desktop-wallpaper-glow" />
    </div>
  );
}

export default DesktopWallpaper;
