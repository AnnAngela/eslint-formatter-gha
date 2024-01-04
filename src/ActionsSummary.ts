import fs from "fs";
import os from "os";

interface ActionsSummaryWrapOptions {
    tag: string
    content?: string
    attributes?: Record<string, string | undefined | null>
    /**
     * The default value is `false`
     */
    contentOnSeparateLine?: boolean
}
export interface ActionsSummaryWriteOptions {
    /**
     * The default value is `false`
     */
    overwrite?: boolean
}
export interface ActionsSummaryCodeBlockOptions {
    code: string
    lang?: string
}
export interface ActionsSummaryListOptions {
    items: string[]
    /**
     * The default value is `false`
     */
    ordered?: boolean
    /**
     * The default value is `0`
     */
    start?: number
}
export interface ActionsSummaryDetailsOptions {
    label: string
    content: string
}
export interface ActionsSummaryWrapImageOptions {
    src: string
    alt?: string
    /**
     * Should be a positive integer
     */
    width?: number
    /**
     * Should be a positive integer
     */
    height?: number
}
export interface ActionsSummaryAddImageOptions extends ActionsSummaryWrapImageOptions {
    /**
     * The default value is same as `src`
     */
    link?: string
}
export interface ActionsSummaryLinkOptions {
    text: string
    href: string
}
export interface ActionsSummaryHeadingOptions {
    text: string
    /**
     * The default value is `1`
     */
    level?: 1 | 2 | 3 | 4 | 5 | 6
}
export interface ActionsSummaryQuoteOptions {
    text: string
    cite?: string
}
export default class ActionsSummary {
    static readonly SUMMARY_ENV_VAR = "GITHUB_STEP_SUMMARY";
    static readonly INTEGER_REGEX = /^[1-9]\d*$/;
    static readonly EMOJI = {
        debug: ":information_source:",
        notice: ":information_source:",
        warning: ":warning:",
        error: ":no_entry:",
        fixable: ":wrench:",
    };
    private summary: string[] = [];
    private _filePath?: string;
    private get filePath(): string {
        if (!this._filePath) {
            const pathFromEnv = process.env[ActionsSummary.SUMMARY_ENV_VAR];
            if (!pathFromEnv) {
                throw new Error(`Unable to find environment variable for $${ActionsSummary.SUMMARY_ENV_VAR}. Check if your runtime environment supports job summaries.`);
            }
            try {
                fs.accessSync(pathFromEnv, fs.constants.R_OK | fs.constants.W_OK);
            } catch {
                throw new Error(`Unable to access summary file: '${pathFromEnv}'. Check if the file has correct read/write permissions.`);
            }
            this._filePath = pathFromEnv;
        }
        return this._filePath;
    }
    private wrap = ({ tag, content, attributes = {}, contentOnSeparateLine = false }: ActionsSummaryWrapOptions) => {
        const htmlAttributes = Object.entries(attributes).map(([key, value]) => value === undefined ? false : value === null ? key : `${key}="${value}"`).filter((attribute): attribute is string => typeof attribute === "string").join(" ");
        const output = [`<${tag}${htmlAttributes}>`];
        if (content) {
            output.push(content, `</${tag}>`);
        }
        return output.join(contentOnSeparateLine ? os.EOL : "");
    };
    write(options?: ActionsSummaryWriteOptions) {
        if (options?.overwrite) {
            // eslint-disable-next-line security/detect-non-literal-fs-filename
            fs.writeFileSync(this.filePath, this.stringify(), { flush: true });
        } else {
            // eslint-disable-next-line security/detect-non-literal-fs-filename
            fs.appendFileSync(this.filePath, this.stringify(), { flush: true });
        }
        return this.emptyBuffer();
    }
    clear() {
        return this.emptyBuffer().write({ overwrite: true });
    }
    stringify() {
        return this.summary.join(os.EOL);
    }
    isEmptyBuffer() {
        return this.summary.length === 0;
    }
    emptyBuffer() {
        this.summary = [];
        return this;
    }
    /**
     * Adds a line to the summary buffer, with a new empty line appended.
     */
    addRaw(line: string) {
        this.summary.push(line);
        return this.addEOL();
    }
    addEOL() {
        this.summary.push("");
        return this;
    }
    addCodeBlock({ code, lang = "" }: ActionsSummaryCodeBlockOptions) {
        this.summary.push(`\`\`\`${lang}`, code, "```");
        return this.addEOL();
    }
    wrapList = ({ items, ordered = false, start = 0 }: ActionsSummaryListOptions) => items.map((item, index) => `${ordered ? Math.max(0, start) + index : "-"} ${item}`).join(os.EOL);
    addList(options: ActionsSummaryListOptions) {
        this.summary.push(this.wrapList(options));
        return this.addEOL();
    }
    addDetails({ label, content }: ActionsSummaryDetailsOptions) {
        this.summary.push(`<details>${this.wrap({ tag: "summary", content: label })}`, "", content, "", "</details>");
        return this.addEOL();
    }
    wrapImage = ({ src, alt, width, height }: ActionsSummaryWrapImageOptions) => {
        const attributes: Record<string, string> = { src };
        if (alt) {
            attributes.alt = alt;
        }
        if (width && ActionsSummary.INTEGER_REGEX.test(`${width}`)) {
            attributes.width = `${width}`;
        }
        if (height && ActionsSummary.INTEGER_REGEX.test(`${height}`)) {
            attributes.height = `${height}`;
        }
        return this.wrap({
            tag: "img",
            attributes,
        });
    };
    addImage(options: ActionsSummaryAddImageOptions) {
        this.summary.push(this.wrapLink({
            text: this.wrapImage(options),
            href: options.link ?? options.src,
        }));
        return this.addEOL();
    }
    addHeading({ text, level = 1 }: ActionsSummaryHeadingOptions) {
        this.summary.push(`${"#".repeat(level)} ${text}`);
        return this.addEOL();
    }
    addSeperator() {
        this.summary.push("*******");
        return this.addEOL();
    }
    addQuote({ text, cite }: ActionsSummaryQuoteOptions) {
        this.summary.push(this.wrap({
            tag: "blockquote",
            content: text,
            attributes: { cite },
            contentOnSeparateLine: true,
        }));
        return this.addEOL();
    }
    wrapLink = ({ text, href }: ActionsSummaryLinkOptions) => `[${text}](${href})`;
    addLink(options: ActionsSummaryLinkOptions) {
        this.summary.push(this.wrapLink(options));
        return this.addEOL();
    }
}
