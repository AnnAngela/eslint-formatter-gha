import path from "path";
import type { ESLint } from "eslint";
import ActionsSummary from "./ActionsSummary.js";
import { logSeverity, annotationPropertiesType, eslintSeverityToAnnotationSeverity, log } from "./command.js";

const generateESLintRuleLink = (ruleId: string) => `https://eslint.org/docs/latest/rules/${ruleId}`;

const actionsSummary = new ActionsSummary();

const formatter: ESLint.Formatter["format"] = (results) => {
    actionsSummary.addEOL();
    actionsSummary.addHeading({ text: "ESLint Annotation", level: 1 });
    actionsSummary.addRaw(`ESLint Annotation from ${actionsSummary.wrapLink({ text: "@annangela/eslint-formatter-gha", href: "https://www.npmjs.com/package/@annangela/eslint-formatter-gha" })}`);
    const deprecatedRulesSeverityFromEnv = process.env.ESLINT_FORMATTER_GHA_DEPRECATED_RULES_SEVERITY?.toLowerCase();
    const deprecatedRulesSeverities = ["debug", "notice", "warning", "error"];
    // @TODO: Switch to `warning` when eslint 9 is released
    let deprecatedRulesSeverity: logSeverity = "debug";
    if (deprecatedRulesSeverityFromEnv) {
        if (deprecatedRulesSeverities.includes(deprecatedRulesSeverityFromEnv)) {
            deprecatedRulesSeverity = deprecatedRulesSeverityFromEnv as logSeverity;
        } else {
            actionsSummary.addRaw(`${ActionsSummary.EMOJI.warning} The env \`ESLINT_FORMATTER_GHA_DEPRECATED_RULES_SEVERITY\` it is not a valid severity - \`${deprecatedRulesSeverityFromEnv}\`, so the severity of deprecated rules report is set to \`${deprecatedRulesSeverity}\` instead.`);
        }
    }
    const deprecatedRules: string[] = [];
    const deprecatedRulesSummary: string[] = [];
    const annotationSummary: string[] = [];
    for (const {
        filePath, messages, usedDeprecatedRules,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        suppressedMessages, errorCount, fatalErrorCount, warningCount, fixableErrorCount, fixableWarningCount, output, source,
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
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            messageId, nodeType, fatal, source, suggestions,
        } of messages) {
            const fileName = `${path.relative(process.cwd(), filePath)}#L${line}${endLine && line !== endLine && (endColumn ? endColumn !== 1 : true) ? `-L${endLine}` : ""}`;
            const fileLink = process.env.GITHUB_SHA ? `https://github.com/${process.env.GITHUB_REPOSITORY}/blob/${process.env.GITHUB_SHA.slice(0, 7)}/${encodeURI(fileName)}` : "";
            const msg = `${message} ${fix ? "[maybe fixable]" : ""} ${ruleId ? `(${ruleId}) - ${generateESLintRuleLink(ruleId)}` : ""} @ ${process.env.GITHUB_SHA ? fileLink : fileName}`;
            // eslint-disable-next-line security/detect-object-injection
            annotationSummary.push(`${ActionsSummary.EMOJI[eslintSeverityToAnnotationSeverity[severity]]} ${fix ? ActionsSummary.EMOJI.fixable : ""} ${message} ${ruleId ? `([${ruleId}](${generateESLintRuleLink(ruleId)}))` : ""} @ ${process.env.GITHUB_SHA ? `[${fileName}](${fileLink})` : fileName}`);
            const annotationProperties: annotationPropertiesType = {
                title: "ESLint Annotation",
                file: filePath,
                startLine: line,
                endLine,
                startColumn: column,
                endColumn,
            };
            log("debug", JSON.stringify({ msg, ...annotationProperties }, null, 4));
            // eslint-disable-next-line security/detect-object-injection
            log(eslintSeverityToAnnotationSeverity[severity], msg, annotationProperties);
        }
    }
    if (deprecatedRulesSummary.length + annotationSummary.length === 0) {
        actionsSummary.addRaw("Nothing is broken, everything is fine.");
    }
    if (deprecatedRulesSummary.length > 0) {
        // eslint-disable-next-line security/detect-object-injection
        actionsSummary.addHeading({ text: `${ActionsSummary.EMOJI[deprecatedRulesSeverity]} Deprecated Rules`, level: 2 });
        actionsSummary.addList({ items: deprecatedRulesSummary });
    }
    if (annotationSummary.length > 0) {
        actionsSummary.addHeading({ text: "Annotations", level: 2 });
        actionsSummary.addList({ items: annotationSummary });
    }
    actionsSummary.write();
    return "";
};
export default formatter;
