import { baseConfig, nodeConfig, typescriptConfig } from "@annangela/eslint-config";
/**
 * @type { import("eslint").Linter.FlatConfig[] }
 */
const config = [
    {
        ignores: [
            "dist"
        ],
    },
    { // Default config
        ...baseConfig,
        ...nodeConfig,
    },
    {
        rules: {
            "n/no-sync": "off",
        },
    },
    { // For TypeScript files in src/
        files: [
            "src/**/*.ts",
        ],
        ...typescriptConfig,
    },
];
export default config;
