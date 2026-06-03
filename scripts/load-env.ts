// Side-effect import: loads .env.local before any module that reads env at
// import time (e.g. src/lib/db). Must be imported FIRST in a script — ESM
// evaluates imports in source order, so this runs before the db client is
// constructed.
import { config } from "dotenv";

config({ path: ".env.local" });
config({ path: ".env" });
