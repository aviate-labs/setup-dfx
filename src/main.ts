import * as core from '@actions/core';
import * as io from '@actions/io';
import cp from 'child_process';
import os from 'os';

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

    const dfxVersion = core.getInput('dfx-version');
    const dfxDisableEncryption = core.getInput('dfx-disable-encryption');
    if (dfxVersion) {
        core.info(`Setup dfx version ${dfxVersion}${dfxDisableEncryption ? ' (without encryption)' : ''}`);

        // Opt-out of having data collected about dfx usage.
        core.exportVariable('DFX_TELEMETRY_DISABLED', 1);

        // Install dfx.
        cp.execSync(`mkdir -p ${bin}`);
        core.addPath(bin);
        cp.execSync(`echo y | DFX_VERSION=${dfxVersion} sh -ci "$(curl -fsSL https://sdk.dfinity.org/install.sh)"`);

        const dfxPath = await io.which('dfx');
        core.debug(dfxPath);
        infoExec(`${dfxPath} --version`);

        // Setup identity.
        const id: string = process.env[`DFX_IDENTITY_PEM`] || '';
        if (id) {
            cp.execSync(`${dfxPath} identity new action${dfxDisableEncryption ? ' --disable-encryption' : ''}`);
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
