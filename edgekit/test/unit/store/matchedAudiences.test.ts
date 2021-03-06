import { matchedAudienceStore } from '@airgrid/edgekit/src/store/matchedAudiences';
import { storage } from '@airgrid/edgekit/src/utils';
import { clearStore } from '../../helpers/localStorage';
import { StorageKeys } from '@airgrid/edgekit/dist/esm/types';
//import { edkt } from '@airgrid/edgekit/src';

describe('matchedAudienceStore', () => {
  const matchedAudience = {
    id: 'id',
    version: 1,
    matchedAt: 1,
    expiresAt: 2,
    matchedOnCurrentPageView: true,
  };

  beforeAll(clearStore);

  it('should load an empty store', () => {
    const matchedAudiences = matchedAudienceStore.getMatchedAudiences();

    expect(matchedAudiences).toHaveLength(0);
  });

  it('should load and return a matched audience', () => {
    matchedAudienceStore.setAudiences([matchedAudience]);
    const matchedAudiences = matchedAudienceStore.getMatchedAudiences();

    expect(matchedAudiences).toHaveLength(1);
  });

  it('there should be 1 matched audience ID in localstorage', () => {
    const matchedAudienceIds = storage.get(StorageKeys.MATCHED_AUDIENCE_IDS);

    expect(matchedAudienceIds).toHaveLength(1);
  });

  it('hasAudienceBeenMatched should return true, for a previously matched audience', () => {
    const wasMatched = matchedAudienceStore.isMatched(
      matchedAudience.id,
      matchedAudience.version
    );

    expect(wasMatched).toBe(true);
  });

  it('hasAudienceBeenMatched should return false, for a new version', () => {
    const wasMatched = matchedAudienceStore.isMatched(matchedAudience.id, 999);

    expect(wasMatched).toBe(false);
  });

  it('hasAudienceBeenMatched should return false, for a new audience id', () => {
    const wasMatched = matchedAudienceStore.isMatched(
      'new',
      matchedAudience.version
    );

    expect(wasMatched).toBe(false);
  });
});
