import Prism from "prismjs";

// prism.js's UMD build only exposes a global on the browser (window).
// On the server it keeps everything module-local, but the language
// component files reference the bare `Prism` global. Assign it explicitly
// so both SSR and client bundles can load languages side-effect free.
(globalThis as { Prism?: typeof Prism }).Prism = Prism;

export { Prism };