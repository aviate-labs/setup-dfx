import {getInput, warning} from '@actions/core';
import { platform } from 'os';
import { existsSync, readFileSync } from 'fs';
import { hashFiles } from '@actions/glob';

export function resolveDFXVersion(): string | undefined {
    const dfxVersion = getInput('dfx-version');
    const dfxFilePath = getInput('dfx-version-file');
    if (dfxVersion && dfxFilePath) {
        warning(`Both dfx-version and dfx-version-file are set. Using dfx-version: ${dfxVersion}`);
    }
    if (dfxVersion) {
        return dfxVersion;
    }

    if (dfxFilePath) {
        if (!existsSync(dfxFilePath)) {
            throw new Error(
                `The specified dfx file path does not exist: ${dfxFilePath}`
            )
        }
        const { dfx } = JSON.parse(readFileSync(dfxFilePath, 'utf-8'));
        if (!dfx) {
            throw new Error(
                `The specified dfx file does not contain a dfx version: ${dfxFilePath}`
            )
        }
        return dfx;
    }
}

export function getCachePaths(): string[] {
    let cachePaths: string[] = [];
    if (getInput("dfx-version") || getInput("dfx-version-file")) {
        cachePaths.push(`${process.env.GITHUB_WORKSPACE}/.cache/dfinity`);
        cachePaths.push(`${process.env.GITHUB_WORKSPACE}/.dfx`);
    }
    if (getInput("vessel-version")) {
        cachePaths.push(`${process.env.GITHUB_WORKSPACE}/.vessel`);
    }
    return cachePaths;
}

export function getPrimaryKey() : string {
    let primaryKey = `setup-dfx-${platform()}`;
    const dfxVersion = resolveDFXVersion();
    if (dfxVersion) {
        primaryKey += `-dfx${dfxVersion}`;
    }
    const vesselVersion = getInput('vessel-version');
    if (vesselVersion) {
        const fileHash = hashFiles(`${process.env.GITHUB_WORKSPACE}/package-set.dhall`);
        primaryKey += `-vessel${vesselVersion}-${fileHash}`;
    }
    return primaryKey;
}
