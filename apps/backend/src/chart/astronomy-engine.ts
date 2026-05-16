import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

export const Astronomy = require("astronomy-engine") as typeof import("astronomy-engine");
