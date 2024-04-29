import {isFeatureAvailable, restoreCache} from '@actions/cache';
import * as core from '@actions/core';
import { which } from '@actions/io';
import cp from 'child_process';
import os from 'os';
import { gte } from "semver";

import { getCachePaths, getPrimaryKey, resolveDFXVersion } from './cache-paths';

export async function run() {
    // Configured to run on linux by default.
    let bin = '/home/runner/bin';
    let vesselBuild = 'linux64';
    let pocketicBuild = 'linux';

    // Alter params if running on  macOS.
    if (os.platform() === 'darwin') {
        bin = '/Users/runner/bin';
        vesselBuild = 'macos';
        pocketicBuild = 'darwin';
    }

    // Die if not running on linux or macOS.
    if (!['linux', 'darwin'].includes(os.platform())) {
        core.setFailed(`Action not supported for: ${os.platform()} ${os.arch()}.`)
        return;
    }

    // Add bin to path.
    cp.execSync(`mkdir -p ${bin}`);
    core.addPath(bin);

    let dfxVersion = resolveDFXVersion();
    if (dfxVersion) {
        core.startGroup("dfx")

        if (dfxVersion === 'latest') {
            dfxVersion = ""
        }

        const dfxDisableEncryption = core.getInput('dfx-disable-encryption');
        core.info(`Setup dfx version ${dfxVersion}${dfxDisableEncryption ? ' (without encryption)' : ''}`);

        // Opt-out of having data collected about dfx usage.
        core.exportVariable('DFX_TELEMETRY_DISABLED', 1);

        // Set dfx version.
        core.exportVariable('DFX_VERSION', dfxVersion);

        // Breaking change since dfx 0.17.0...
        core.exportVariable('DFXVM_INIT_YES', 'true');
        if (os.platform() === 'linux') {
            core.addPath("/home/runner/.local/share/dfx/bin")
        } else {
            core.addPath("/Users/runner/Library/Application Support/org.dfinity.dfx/bin");
        }

        // Install dfx.
        cp.execSync(`sh -ci "$(curl -fsSL https://internetcomputer.org/install.sh)"`);

        let dfxPath = await which('dfx');
        dfxPath = dfxPath.replace(" ", "\\ "); // Escape spaces in path.
        const cmdStr = (cp.execSync(`${dfxPath} --version`) || '').toString();
        core.info(cmdStr);
        core.setOutput('dfx-version', cmdStr.split('dfx ')[1].trim());

        // Setup identity.
        const id: string = process.env[`DFX_IDENTITY_PEM`] || '';
        if (id) {
            let disableEncryptionFlag = '';
            if (dfxDisableEncryption) {
                if (gte(dfxVersion, "0.13.0")) {
                    disableEncryptionFlag = ' --storage-mode=plaintext';
                } else {
                    // Deprecated since dfx 0.13.0.
                    disableEncryptionFlag = ' --disable-encryption';
                }
            }

            cp.execSync(`${dfxPath} identity new action${disableEncryptionFlag}`);
            cp.execSync(`chmod +w /home/runner/.config/dfx/identity/action/identity.pem`)
            cp.execSync(`echo "${id}" > /home/runner/.config/dfx/identity/action/identity.pem`);
            infoExec(`${dfxPath} identity list`);
        }

        core.endGroup();

        // Install dfx cache to get moc.
        if (core.getBooleanInput('install-moc')) {
            core.startGroup("moc")
            cp.execSync(`${dfxPath} cache install`);
            const cachePath = infoExec(`${dfxPath} cache show`).trim();
            core.addPath(cachePath);

            const mocPath = await which('moc');
            infoExec(`${mocPath} --version`);
            core.endGroup();
        }
    }

    // Install vessel.
    const vesselVersion = core.getInput('vessel-version');
    if (vesselVersion) {
        core.startGroup("vessel");
        cp.execSync(
            `wget -O ${bin}/vessel https://github.com/dfinity/vessel/releases/download/v${vesselVersion}/vessel-${vesselBuild}`
        );
        cp.execSync(`chmod +x ${bin}/vessel`);

        const vesselPath = await which('vessel');
        infoExec(`${vesselPath} --version`);
        core.endGroup();
    }

    // Install PocketIC.
    const pocketicVersion = core.getInput('pocket-ic-version');
    if (pocketicVersion) {
        core.startGroup("pocket-ic");
        try {
            cp.execSync(
                `wget -O ${bin}/pocket-ic.gz https://github.com/dfinity/pocketic/releases/download/${pocketicVersion}/pocket-ic-x86_64-${pocketicBuild}.gz`
            );
        } catch (error) {
            core.debug(`Failed to download pocket-ic, trying to download from the main ic repo...`);
            cp.execSync(
                `wget -O ${bin}/pocket-ic.gz https://github.com/dfinity/ic/releases/download/${pocketicVersion}/pocket-ic-x86_64-${pocketicBuild}.gz`
            );
        }
        cp.execSync(`gunzip ${bin}/pocket-ic.gz`);
        cp.execSync(`chmod +x ${bin}/pocket-ic`);

        const pocketicPath = await which('pocket-ic');
        infoExec(`${pocketicPath} --version`);
        core.endGroup();
    }

    const cache = core.getBooleanInput('cache');
    if (cache && isFeatureAvailable()) {
        try {
            const cacheKey = await restoreCache(
                getCachePaths(),
                getPrimaryKey(),
            );
            core.setOutput("cache-hit", cacheKey ? true : false);
        } catch (error) {
            core.warning(`Failed to restore cache: ${(error as Error).message}`);
        }
    }
}

function infoExec(command: string): string {
    const cmdStr = (cp.execSync(command) || '').toString();
    core.info(cmdStr);
    return cmdStr;
}
