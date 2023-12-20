import path from "path";
import type { ESLint } from "eslint";
import { debug, notice, warning, error, summary } from "@actions/core";
type deprecatedRulesSeverity = "debug" | "notice" | "warning" | "error";

const generateESLintRuleLink = (ruleId: string) => `https://eslint.org/docs/latest/rules/${ruleId}`;
const isInGithubActions = process.env.GITHUB_ACTIONS === "true";
const formatter: ESLint.Formatter["format"] = (results) => {
    summary.addHeading("ESLint Annotation", 1);
    summary.addBreak();
    summary.addRaw("ESLint Annotation from ").addLink("@annangela/eslint-formatter-gha", "https://www.npmjs.com/package/@annangela/eslint-formatter-gha");
    summary.addBreak();
    const deprecatedRulesSeverityFromEnv = process.env.ESLINT_FORMATTER_GHA_DEPRECATED_RULES_SEVERITY?.toLowerCase();
    const deprecatedRulesSeverities = ["debug", "notice", "warning", "error"];
    // @TODO: Switch to `warning` when eslint 9 is released
    let deprecatedRulesSeverity: deprecatedRulesSeverity = "debug";
    if (deprecatedRulesSeverityFromEnv) {
        if (deprecatedRulesSeverities.includes(deprecatedRulesSeverityFromEnv)) {
            deprecatedRulesSeverity = deprecatedRulesSeverityFromEnv as deprecatedRulesSeverity;
        } else {
            summary.addRaw(`The env \`ESLINT_FORMATTER_GHA_DEPRECATED_RULES_SEVERITY\` it is not a valid severity - \`${deprecatedRulesSeverityFromEnv}\`, so the severity of deprecated rules report is set to \`${deprecatedRulesSeverity}\` instead.`);
            summary.addBreak();
        }
    }
    if (results.length === 0) {
        const message = "Nothing is broken, everything is fine.";
        summary.addRaw(message);
        summary.addBreak();
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
                debug(deprecatedRuleMessage);
            } else {
                deprecatedRulesSummary.push(`[${ruleId}](${generateESLintRuleLink(ruleId)})${replacedBy.length > 0 ? `: replaced by ${replacedBy.map((ruleId) => `[${ruleId}](${generateESLintRuleLink(ruleId)})`).join(" / ")} ` : ""}`);
                switch (deprecatedRulesSeverity) {
                    case "notice":
                        notice(deprecatedRuleMessage, {
                            title: "ESLint Annotation",
                        });
                        break;
                    case "warning":
                        warning(deprecatedRuleMessage, {
                            title: "ESLint Annotation",
                        });
                        break;
                    case "error":
                        error(deprecatedRuleMessage, {
                            title: "ESLint Annotation",
                        });
                        break;
                    default:
                        break;
                }
            }
        }
        for (const {
            message, severity, line, column, endLine, endColumn, ruleId, fix,
            // // eslint-disable-next-line @typescript-eslint/no-unused-vars
            // messageId, nodeType, fatal, source, suggestions,
        } of messages) {
            const fileName = path.relative(process.cwd(), filePath);
            const msg = `${message} ${fix ? "[maybe fixable]" : ""} ${ruleId ? `(${ruleId}) - ${generateESLintRuleLink(ruleId)}` : ""}${isInGithubActions ? ` @ https://github.com/${process.env.GITHUB_REPOSITORY}/blob/${process.env.GITHUB_SHAs?.slice(0, 7)}/${path.relative(process.cwd(), filePath)}#L${line}${line !== endLine ? `-L${endLine}` : ""}` : ""}`;
            annotationSummary.push(`${message} ${fix ? "[maybe fixable]" : ""} ${ruleId ? `([${ruleId}](${generateESLintRuleLink(ruleId)}))` : ""}${isInGithubActions ? ` @ [${fileName}](https://github.com/${process.env.GITHUB_REPOSITORY}/blob/${process.env.GITHUB_SHAs?.slice(0, 7)}/${fileName}#L${line}${line !== endLine ? `-L${endLine})` : ""}` : ""}`);
            const annotationProperties: NonNullable<Parameters<typeof notice>[1]> = {
                title: "ESLint Annotation",
                file: filePath,
                startLine: line,
                endLine,
                startColumn: column,
                endColumn,
            };
            debug(JSON.stringify({ msg, ...annotationProperties }, null, 4));
            switch (severity) {
                case 0:
                    notice(msg, annotationProperties);
                    break;
                case 1:
                    warning(msg, annotationProperties);
                    break;
                case 2:
                    error(msg, annotationProperties);
                    break;
                default:
                    break;
            }
        }
    }
    if (deprecatedRulesSummary.length > 0) {
        summary.addHeading("Deprecated Rules", 2);
        summary.addBreak();
        summary.addList(deprecatedRulesSummary);
        summary.addBreak();
    }
    if (annotationSummary.length > 0) {
        summary.addHeading("Annotations", 2);
        summary.addBreak();
        summary.addList(annotationSummary);
        summary.addBreak();
    }
    return "";
};
export default formatter;
