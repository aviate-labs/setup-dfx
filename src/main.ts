import * as core from '@actions/core';
import * as io from '@actions/io';
import cp from 'child_process';
import os from 'os';
import {gte} from "semver";

type Manifest = {
    tags: {
        latest: string;
    }
    versions: string[];
}

export async function run() {
    // Configured to run on linux by default.
    let bin = '/home/runner/bin';
    let vesselBuild = 'linux64';

    // Alter params if running on Mac OS.
    if (os.platform() === 'darwin') {
        bin = '/usr/local/share';
        vesselBuild = 'macos';
    }

    // Die if not running on linux or Mac OS.
    if (!['linux', 'darwin'].includes(os.platform())) {
        core.setFailed(`Action not supported for: ${os.platform()} ${os.arch()}.`)
        return;
    }

    // Add bin to path.
    cp.execSync(`mkdir -p ${bin}`);
    core.addPath(bin);

    const dfxVersion = core.getInput('dfx-version');
    const dfxDisableEncryption = core.getInput('dfx-disable-encryption');
    if (dfxVersion) {
        core.info(`Setup dfx version ${dfxVersion}${dfxDisableEncryption ? ' (without encryption)' : ''}`);

        // Opt-out of having data collected about dfx usage.
        core.exportVariable('DFX_TELEMETRY_DISABLED', 1);

        // Set dfx version.
        core.exportVariable('DFX_VERSION', dfxVersion);

        // Breaking change since dfx 0.17.0...
        core.exportVariable('DFXVM_INIT_YES', 'true');
        if (os.platform() === 'linux') {
            core.addPath(`/home/runner/.local/share/dfx/bin`)
        } else {
            core.addPath(`/usr/Library/Application Support/org.dfinity.dfx/bin`);
        }

        // Install dfx.
        cp.execSync(`sh -ci "$(curl -fsSL https://internetcomputer.org/install.sh)"`);

        const dfxPath = await io.which('dfx');
        infoExec(`${dfxPath} --version`);

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

        // Install dfx cache to get moc.
        if (core.getBooleanInput('install-moc')) {
            cp.execSync(`${dfxPath} cache install`);
            const cachePath = infoExec(`${dfxPath} cache show`).trim();
            core.addPath(cachePath);

            const mocPath = await io.which('moc');
            infoExec(`${mocPath} --version`);
        }
    }

    // Install vessel.
    const vesselVersion = core.getInput('vessel-version');
    if (vesselVersion) {
        cp.execSync(
            `wget -O ${bin}/vessel https://github.com/dfinity/vessel/releases/download/v${vesselVersion}/vessel-${vesselBuild}`
        );
        cp.execSync(`chmod +x ${bin}/vessel`);

        const vesselPath = await io.which('vessel');
        infoExec(`${vesselPath} --version`);
    }
}

function infoExec(command: string): string {
    const cmdStr = (cp.execSync(command) || '').toString();
    core.info(cmdStr);
    return cmdStr;
}
