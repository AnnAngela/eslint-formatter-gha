import { createInterface } from "node:readline";
import { valid, gt } from "semver";
import execCommand from "./spawnChildProcess.js";

const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
});
const oldTag = JSON.parse(await execCommand("npm pkg get version"));
console.log(`Current tag: ${oldTag}`);

let tag = valid(await new Promise((res) => {
    rl.question("Enter a tag: ", (tag) => {
        rl.close();
        res(tag);
    });
}));
if (!tag) {
    throw new Error("Invalid tag");
}
if (!tag.startsWith("v")) {
    tag = `v${tag}`;
}
if (!gt(tag, oldTag)) {
    throw new Error(`New tag (${tag}) must be greater than old tag (${oldTag})`);
}
const tagList = (await execCommand("git tag -l")).split("\n");
if (tagList.includes(tag)) {
    throw new Error(`Tag ${tag} already exists`);
}

console.log(`tag: ${tag}`);

console.log("Bump the package version");
await execCommand(`npm version ${tag.replace(/^v/, "")} --git-tag-version --sign-git-tag -m "release: v%s"`, { synchronousStderr: true, synchronousStdout: true });

console.log("Pushing...");
await execCommand("git push --follow-tags", { synchronousStderr: true, synchronousStdout: true });

const draftReleaseURL = new URL(JSON.parse(await execCommand("npm pkg get homepage")));
draftReleaseURL.hash = "";
draftReleaseURL.pathname += "/releases/new";
console.log("Draft release URL:", draftReleaseURL.toString());
console.log("Example changelog:");
console.log("-".repeat(73));
await execCommand(`git log --reverse --pretty=format:"* %s (%h)" v${oldTag}...${tag}`, { synchronousStderr: true, synchronousStdout: true });
console.info("");
console.log("-".repeat(73));
