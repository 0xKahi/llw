import { noul, TypeSafeClient } from '@typesafe-ai/sdk';
import type { BundleMetadata } from '../types/bundle-metadata.type';

type JevNoulVerdict = 'yes' | 'no' | 'unsure';
export type ScoredBundle = BundleMetadata & { probability: number };

const YES_ABOVE = 0.7;
const NO_BELOW = 0.3;

const BUNDLE_SEARCH_STATE = {
  knowledge_base:
    'A personal knowledge base organized into bundles. Each bundle is a folder of notes on one area. ' +
    "Every question includes one bundle's folder, title, description, and trigger phrases (topics the bundle covers).",
};

const BUNDLE_SEARCH_CRITERIA = {
  true: "The bundle's description or triggers cover the topic the question asks about.",
  false: "The bundle's description and triggers are about unrelated topics.",
};

export class JevUtil {
  static createJevClient(): TypeSafeClient {
    return new TypeSafeClient({ fetch: bunSafeFetch });
  }

  static noulVerdict(p: number): JevNoulVerdict {
    if (p > YES_ABOVE) return 'yes';
    if (p < NO_BELOW) return 'no';
    return 'unsure';
  }

  static async searchBundles({ bundleMap, question }: { bundleMap: Map<string, BundleMetadata>; question: string }): Promise<ScoredBundle[]> {
    const bundles = Array.from(bundleMap.values());
    if (bundles.length === 0) return [];

    const questions = Object.fromEntries(
      bundles.map(bundle => [
        bundle.folder,
        noul(
          {
            question,
            bundle: { folder: bundle.folder, title: bundle.title, description: bundle.description, triggers: bundle.triggers },
          },
          BUNDLE_SEARCH_CRITERIA,
        ),
      ]),
    );

    const { answers } = await JevUtil.createJevClient().systemOne({ state: BUNDLE_SEARCH_STATE, questions });

    const result: ScoredBundle[] = [];
    for (const [folder, response] of Object.entries(answers)) {
      const bundle = bundleMap.get(folder);
      if (!bundle) continue;
      if (JevUtil.noulVerdict(response.noul) === 'no') continue;

      result.push({ ...bundle, probability: Number(response.noul.toFixed(3)) });
    }
    return result.sort((a, b) => b.probability - a.probability);
  }
}

/**
 * Workaround for a Bun bug (seen on 1.4.4): after `response.body.getReader()` +
 * `releaseLock()`, Bun marks the body as used, so a later `response.text()` throws
 * "Body already used". The TypeSafe SDK does exactly that while buffering responses.
 *
 * We read the body ourselves, then hand the SDK a Response whose `body` stream is
 * hidden, so the SDK skips its stream buffering and reads via `text()` instead.
 * Remove once Bun fixes this.
 */
const bunSafeFetch = async (input: string | URL | Request, init?: RequestInit): Promise<Response> => {
  const res = await fetch(input, init);
  const buffered = new Response(await res.arrayBuffer(), { status: res.status, statusText: res.statusText, headers: res.headers });
  Object.defineProperty(buffered, 'body', { value: null });
  Object.defineProperty(buffered, 'clone', { value: () => buffered });
  return buffered;
};
