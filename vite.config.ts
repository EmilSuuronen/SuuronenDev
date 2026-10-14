import { copyFileSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// GitHub Pages has no SPA fallback: give each client route its own index.html so /desktop and /text
// load directly with a 200, and serve the app as 404.html for anything else.
function spaRoutes(routes: string[]): Plugin {
    let outDir = "dist";

    return {
        name: "spa-routes",
        apply: "build",
        configResolved(config) {
            outDir = resolve(config.root, config.build.outDir);
        },
        closeBundle() {
            const index = resolve(outDir, "index.html");

            for (const route of routes) {
                mkdirSync(resolve(outDir, route), { recursive: true });
                copyFileSync(index, resolve(outDir, route, "index.html"));
            }

            copyFileSync(index, resolve(outDir, "404.html"));
        },
    };
}

export default defineConfig({
    plugins: [react(), tailwindcss(), spaRoutes(["desktop", "text"])],
    resolve: {
        alias: {
            "@": new URL("./src", import.meta.url).pathname,
        },
    },
    base: "/",
    server: {
        host: true
    }
});
