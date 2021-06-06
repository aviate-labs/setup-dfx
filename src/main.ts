import * as core from '@actions/core';
import * as io from '@actions/io';
import cp from 'child_process';

export async function run() {
    try {
        let dfxVersion = core.getInput('dfx-version');
        core.info(`Setup dfx version ${dfxVersion}`);

        // Opt-out of having data collected about dfx usage.
        core.exportVariable('DFX_TELEMETRY_DISABLED', 1);

        // Install dfx.
        cp.execSync(`echo y | DFX_VERSION=${dfxVersion} sh -ci "$(curl -fsSL https://sdk.dfinity.org/install.sh)"`);
        core.addPath('/home/runner/bin');

        let dfxPath = await io.which('dfx');
        core.debug(dfxPath);
        infoExec(`${dfxPath} --version`);

        // Install dfx cache to get moc.
        cp.execSync(`${dfxPath} cache install`);
        let cachePath = infoExec(`${dfxPath} cache show`).trim();
        core.addPath(cachePath);

        let mocPath = await io.which('moc');
        infoExec(`${mocPath} --version`);

        // Install vessel.
        let vesselVersion = core.getInput('vessel-version');
        if (vesselVersion) {
            cp.execSync(`curl -L https://github.com/dfinity/vessel/releases/download/v${vesselVersion}/vessel-linux64 > /home/runner/bin/vessel`);
            cp.execSync(`chmod +x /home/runner/bin/vessel`);

            let vesselPath = await io.which('vessel');
            infoExec(`${vesselPath} --version`);
        }
    } catch (e) {
        core.setFailed(e.message);
    }
}

function infoExec(command: string) : string {
    let cmdStr = (cp.execSync(command) || '').toString();
    core.info(cmdStr);
    return cmdStr;
}
