import * as core from '@actions/core';
import * as cache from '@actions/cache';
import { existsSync } from 'fs';

import { getCachePaths } from './cache-paths';

// Instead of failing this action, just warn.
process.on('uncaughtException', e => {
    core.info(`[warning] ${e.message}`);
});

export async function run(earlyExit?: boolean) {
    try {
        const cacheInput = core.getBooleanInput('cache');
        if (cacheInput) {
            await cacheDFX();

            if (earlyExit) {
                process.exit(0);
            }
        }
    } catch (error) {
        let message = 'Unknown error!';
        if (error instanceof Error) {
            message = error.message;
        }
        if (typeof error === 'string') {
            message = error;
        }
        core.warning(message);
    }
}

const cacheDFX = async () => {
    const state = core.getState('CACHE_RESULT');
    const primaryKey = core.getState('CACHE_KEY');

    const cachePaths = getCachePaths();

    const nonExistendPaths = cachePaths.filter(path => !existsSync(path));
    if (nonExistendPaths.length === cachePaths.length) {
        logWarning(`None of the cache paths exist. Skipping cache save.`);
        return;
    }

    if (nonExistendPaths.length) {
        logWarning(`Some cache paths do not exist: ${nonExistendPaths.join(', ')}`);
    }

    if (primaryKey === state) {
        core.info(`Cache key is the same as the previous run. Skipping cache save.`);
        return;
    }

    const cacheID = await cache.saveCache(cachePaths, primaryKey);
    if (cacheID === -1) {
        return;
    }
    core.info(`Cache saved with key: ${primaryKey}`);
}

function logWarning(message: string): void {
    core.info(`[warning] ${message}`);
}

run(true);
