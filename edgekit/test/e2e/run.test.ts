//import{edkt} from '@airgrid/edgekit/src';
import {
  makeAudienceDefinition,
  makeCosineSimilarityQuery,
} from '../helpers/audienceDefinitions';
import { StorageKeys } from '@airgrid/edgekit/dist/esm/types';

type Store = { edkt_matched_audiences: string; edkt_page_views: string };

const getPageViewsFromStore = (store: Store) =>
  JSON.parse(store[StorageKeys.PAGE_VIEWS]);

const getMatchedAudiencesFromStore = (store: Store) => {
  // TODO: this is added for backward compat.
  // https://github.com/AirGrid/edgekit/issues/152
  const matchedAudiences = JSON.parse(store[StorageKeys.MATCHED_AUDIENCES]);
  return Object.entries(matchedAudiences).map(([_, audience]) => audience);
};

const getLocalStorageFromPage = (): Promise<Store> =>
  page.evaluate('localStorage');

describe('edgekit basic run behaviour', () => {
  // We are serving a mock page with the edgekit transpiled code.
  // look at jest-playwright.config.js
  const TEST_URL = 'http://localhost:9000';

  const MATCHING_VECTOR = [1, 1, 1];

  const topicModelAudience = makeAudienceDefinition({
    id: 'topic_dist_model_id',
    occurrences: 1,
    definition: [
      makeCosineSimilarityQuery({
        queryValue: {
          threshold: 0.99,
          vector: MATCHING_VECTOR,
        },
      }),
    ],
  });

  const pageFeatures = {
    docVector: {
      version: 1,
      value: MATCHING_VECTOR,
    },
  };

  // edkt should already be present on our visited page globals.
  // we run it with our test defined params and check for its
  // consequences on the environment
  const runEdkt = async () =>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await page.evaluate((params) => (< any>window).edkt.edkt.run(params), {
      audienceDefinitions: [topicModelAudience],
      pageFeatures,
      omitGdprConsent: true,
    });

  beforeAll(async () => {
    await page.goto(`${TEST_URL}?edktDebug=true`, { waitUntil: 'networkidle' });
  });

  it('runs and adds pageView to store', async () => {
    await runEdkt();
    const store = await getLocalStorageFromPage();
    expect(getPageViewsFromStore(store)).toHaveLength(1);
    expect(getMatchedAudiencesFromStore(store)).toHaveLength(0);
  });

  it('adds another pageView and match audienceDefinition', async () => {
    await runEdkt();
    const store = await getLocalStorageFromPage();
    expect(getPageViewsFromStore(store)).toHaveLength(2);
    expect(getMatchedAudiencesFromStore(store)).toHaveLength(1);
  });
});
