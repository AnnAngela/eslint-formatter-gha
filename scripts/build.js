import fs from "node:fs";
import execCommand from "./spawnChildProcess.js";

console.info("Preparing to build...");
for (const dir of [
    "dist",
]) {
    console.info("\tDeleting", dir, "...");
    await fs.promises.rm(dir, {
        force: true,
        recursive: true,
    });
}

console.info("Building the module ...");
await execCommand("tsc", {
    synchronousStderr: true,
    synchronousStdout: true,
});

console.info("Marking as CommonJS module ...");
await fs.promises.writeFile("dist/package.json", JSON.stringify({ type: "commonjs" }), {
    encoding: "utf-8",
});
await fs.promises.appendFile("dist/index.js", "\n;module.exports=module.exports.default;", {
    encoding: "utf-8",
});

console.info("Result:");
await execCommand("tree -afNshv dist", {
    synchronousStderr: true,
    synchronousStdout: true,
});

console.info("Done.");
