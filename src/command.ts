import type { notice } from "@actions/core";
import type { Linter } from "eslint";

export type logSeverity = "debug" | "notice" | "warning" | "error";
type annotationPropertiesTypeNullable = Parameters<typeof notice>[1];
export type annotationPropertiesType = NonNullable<annotationPropertiesTypeNullable>;
export const eslintSeverityToAnnotationSeverity: Record<Linter.Severity, logSeverity> = {
    0: "notice",
    1: "warning",
    2: "error",
};

// Code from @actions/core/lib/command.js to prevent unnecessary dependencies from being included in dist file due to insufficient tree shaking functionality of esbuild
const escapeProperty = (s: string | number) => `${s}`.replaceAll("%", "%25").replaceAll("\r", "%0D").replaceAll("\n", "%0A").replaceAll(":", "%3A").replaceAll(",", "%2C");
const escapeData = (s: string | number) => `${s}`.replaceAll("%", "%25").replaceAll("\r", "%0D").replaceAll("\n", "%0A");
export const log = (severity: logSeverity, msg: string, annotationProperties?: annotationPropertiesTypeNullable) => {
    if (severity === "debug") {
        console.info(`::debug::${escapeData(msg)}`);
        return;
    }
    console.info(`::${severity}${annotationProperties ? ` ${Object.entries(annotationProperties).map(([k, v]) => `${k}=${escapeProperty(v as string | number)}`).join(",")}` : ""}::${escapeData(msg)}`);
};
