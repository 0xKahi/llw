import { noul } from '@typesafe-ai/sdk';
import type { CommandStrategy } from '../../utils/commander/command-strategy';
import { JevUtil } from '../../utils/jev.util';

type JevStatus = 'available' | 'unavailable';

const PROBE_TIMEOUT_MS = 5_000;

export class JevStatusCommand implements CommandStrategy {
  readonly config = {
    name: 'status',
    description: "Check whether Jev is reachable and answering ('available' | 'unavailable')",
  };

  async execute(): Promise<void> {
    const status = await this.probe();
    console.log(status);
    if (status === 'unavailable') process.exitCode = 1;
  }

  /** Sends a minimal one-question request; any failure (missing key, auth, network, timeout) means unavailable. */
  private async probe(): Promise<JevStatus> {
    try {
      const { answers } = await JevUtil.createJevClient().systemOne(
        { state: 'ping', questions: { ping: noul('Is `state` the word ping?') } },
        { timeout: PROBE_TIMEOUT_MS, retry: { maxRetries: 0 } },
      );
      return typeof answers.ping?.noul === 'number' ? 'available' : 'unavailable';
    } catch {
      return 'unavailable';
    }
  }
}
