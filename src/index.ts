import path from "path";
import fs from "fs";
import type { ESLint, Linter } from "eslint";
import type { notice } from "@actions/core";
type logSeverity = "debug" | "notice" | "warning" | "error";

const eslintSeverityToAnnotationSeverity: Record<Linter.Severity, logSeverity> = {
    0: "notice",
    1: "warning",
    2: "error",
};

const generateESLintRuleLink = (ruleId: string) => `https://eslint.org/docs/latest/rules/${ruleId}`;

// Code from @actions/core/lib/command.js to prevent unnecessary dependencies from being included in dist file due to insufficient tree shaking functionality of esbuild
const escapeProperty = (s: string | number) => `${s}`.replaceAll("%", "%25").replaceAll("\r", "%0D").replaceAll("\n", "%0A").replaceAll(":", "%3A").replaceAll(",", "%2C");
const escapeData = (s: string | number) => `${s}`.replaceAll("%", "%25").replaceAll("\r", "%0D").replaceAll("\n", "%0A");
const log = (severity: logSeverity, msg: string, annotationProperties?: Parameters<typeof notice>[1]) => {
    if (severity === "debug") {
        console.info(`::debug::${msg}`);
        return;
    }
    console.info(`::${severity}${annotationProperties ? ` ${Object.entries(annotationProperties).map(([k, v]) => `${k}=${escapeProperty(v as string | number)}`).join(",")}` : ""}::${escapeData(msg)}`);
};

const writeSummary = (summary: string[]) => {
    if (process.env.GITHUB_STEP_SUMMARY) {
        fs.writeFileSync(process.env.GITHUB_STEP_SUMMARY, summary.join("\n"), { flag: "a" });
    }
};

const formatter: ESLint.Formatter["format"] = (results) => {
    const summary = [
        "",
        "# ESLint Annotation", "",
        "ESLint Annotation from [@annangela/eslint-formatter-gha](https://www.npmjs.com/package/@annangela/eslint-formatter-gha)", "",
    ];
    const deprecatedRulesSeverityFromEnv = process.env.ESLINT_FORMATTER_GHA_DEPRECATED_RULES_SEVERITY?.toLowerCase();
    const deprecatedRulesSeverities = ["debug", "notice", "warning", "error"];
    // @TODO: Switch to `warning` when eslint 9 is released
    let deprecatedRulesSeverity: logSeverity = "debug";
    if (deprecatedRulesSeverityFromEnv) {
        if (deprecatedRulesSeverities.includes(deprecatedRulesSeverityFromEnv)) {
            deprecatedRulesSeverity = deprecatedRulesSeverityFromEnv as logSeverity;
        } else {
            summary.push(`The env \`ESLINT_FORMATTER_GHA_DEPRECATED_RULES_SEVERITY\` it is not a valid severity - \`${deprecatedRulesSeverityFromEnv}\`, so the severity of deprecated rules report is set to \`${deprecatedRulesSeverity}\` instead.`, "");
        }
    }
    if (results.length === 0) {
        const message = "Nothing is broken, everything is fine.";
        summary.push(message, "");
        writeSummary(summary);
        return message;
    }
    const deprecatedRules: string[] = [];
    const deprecatedRulesSummary: string[] = [];
    const annotationSummary: string[] = [];
    for (const {
        filePath, messages, usedDeprecatedRules,
        // // eslint-disable-next-line @typescript-eslint/no-unused-vars
        // suppressedMessages, errorCount, fatalErrorCount, warningCount, fixableErrorCount, fixableWarningCount, output, source,
    } of results) {
        for (const { ruleId, replacedBy } of usedDeprecatedRules) {
            if (deprecatedRules.includes(ruleId)) {
                continue;
            }
            deprecatedRules.push(ruleId);
            const deprecatedRuleMessage = `Deprecated rule: ${ruleId}${replacedBy.length > 0 ? `, replaced by ${replacedBy.join(" / ")} instead` : ""} - ${generateESLintRuleLink(ruleId)}`;
            if (deprecatedRulesSeverity === "debug") {
                log("debug", deprecatedRuleMessage);
            } else {
                deprecatedRulesSummary.push(`[${ruleId}](${generateESLintRuleLink(ruleId)})${replacedBy.length > 0 ? `: replaced by ${replacedBy.map((ruleId) => `[${ruleId}](${generateESLintRuleLink(ruleId)})`).join(" / ")} ` : ""}`);
                log(deprecatedRulesSeverity, deprecatedRuleMessage, {
                    title: "ESLint Annotation",
                });
            }
        }
        for (const {
            message, severity, line, column, endLine, endColumn, ruleId, fix,
            // // eslint-disable-next-line @typescript-eslint/no-unused-vars
            // messageId, nodeType, fatal, source, suggestions,
        } of messages) {
            const fileName = `${path.relative(process.cwd(), filePath)}#L${line}${endLine && line !== endLine ? `-L${endLine}` : ""}`;
            const fileLink = process.env.GITHUB_SHA ? `https://github.com/${process.env.GITHUB_REPOSITORY}/blob/${process.env.GITHUB_SHA.slice(0, 7)}/${encodeURI(fileName)}` : "";
            const msg = `${message} ${fix ? "[maybe fixable]" : ""} ${ruleId ? `(${ruleId}) - ${generateESLintRuleLink(ruleId)}` : ""} @ ${process.env.GITHUB_SHA ? fileLink : fileName}`;
            annotationSummary.push(`${message} ${fix ? "[maybe fixable]" : ""} ${ruleId ? `([${ruleId}](${generateESLintRuleLink(ruleId)}))` : ""} @ ${process.env.GITHUB_SHA ? `[${fileName}](${fileLink})` : fileName}`);
            const annotationProperties: NonNullable<Parameters<typeof notice>[1]> = {
                title: "ESLint Annotation",
                file: filePath,
                startLine: line,
                endLine,
                startColumn: column,
                endColumn,
            };
            log("debug", JSON.stringify({ msg, ...annotationProperties }, null, 4));
            log(eslintSeverityToAnnotationSeverity[severity], msg, annotationProperties);
        }
    }
    if (deprecatedRulesSummary.length > 0) {
        summary.push("## Deprecated Rules", "");
        summary.push(...deprecatedRulesSummary.map((line) => `* ${line}`), "");
    }
    if (annotationSummary.length > 0) {
        summary.push("## Annotations", "");
        summary.push(...annotationSummary.map((line) => `* ${line}`), "");
    }
    writeSummary(summary);
    return "";
};
export default formatter;
