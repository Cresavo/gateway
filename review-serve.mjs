import { gateway } from "./src/server.js";
import { randomBytes } from "node:crypto";
const s = gateway("http://127.0.0.1:1", randomBytes(32).toString("hex"));
s.listen(0, "127.0.0.1", () => console.log("PORT " + s.address().port));
