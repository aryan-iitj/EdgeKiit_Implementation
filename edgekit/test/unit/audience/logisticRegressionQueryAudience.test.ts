import { edkt } from '@airgrid/edgekit/src';
import {
  clearStore,
  getMatchedAudiences,
  getPageViews,
} from '../../helpers/localStorage';
import {
  makeAudienceDefinition,
  makeLogisticRegressionQuery,
} from '../../helpers/audienceDefinitions';

describe('logistic regression audiences matching behaviour', () => {
  const VECTOR_ONE = [1, 1, 1];
  const VECTOR_TWO = [1, 0, 1];
  const NOT_MATCHING_VECTOR = [0, 1, 0];

  const logRegAudience = makeAudienceDefinition({
    occurrences: 1,
    definition: [
      makeLogisticRegressionQuery({
        queryValue: {
          threshold: 0.9,
          vector: VECTOR_ONE,
          bias: 0,
        },
      }),
    ],
  });

  const multiLogRegAudience = makeAudienceDefinition({
    occurrences: 1,
    definition: [
      makeLogisticRegressionQuery({
        queryValue: {
          threshold: 0.9,
          vector: VECTOR_ONE,
          bias: 0,
        },
      }),
      makeLogisticRegressionQuery({
        queryValue: {
          threshold: 0.9,
          vector: VECTOR_TWO,
          bias: 1,
        },
      }),
    ],
  });

  describe('logistic regression with single query audiences', () => {
    const pageFeatures = {
      docVector: {
        value: VECTOR_ONE,
        version: 1,
      },
    };

    it('adds 1st page view and does not match on first run', async () => {
      await edkt.run({
        pageFeatures: pageFeatures,
        audienceDefinitions: [logRegAudience],
        omitGdprConsent: true,
      });

      expect(getPageViews()).toHaveLength(1);
      expect(getMatchedAudiences()).toHaveLength(0);
    });

    it('adds 2nd page view and does match on second run', async () => {
      await edkt.run({
        pageFeatures: pageFeatures,
        audienceDefinitions: [logRegAudience],
        omitGdprConsent: true,
      });

      expect(getPageViews()).toHaveLength(2);
      expect(getMatchedAudiences()).toHaveLength(1);
    });

    it('adds 3rd page view on third run', async () => {
      await edkt.run({
        pageFeatures: pageFeatures,
        audienceDefinitions: [logRegAudience],
        omitGdprConsent: true,
      });

      expect(getPageViews()).toHaveLength(3);
      expect(getMatchedAudiences()).toHaveLength(1);
    });
  });

  describe('logistic regression multi query audiences matching above threshold', () => {
    const pageFeaturesMatchOne = {
      docVector: {
        value: VECTOR_ONE,
        version: 1,
      },
    };

    const pageFeaturesMatchTwo = {
      docVector: {
        value: VECTOR_TWO,
        version: 1,
      },
    };

    beforeAll(clearStore);

    it('adds 1st page view and does not match on first run', async () => {
      await edkt.run({
        pageFeatures: pageFeaturesMatchOne,
        audienceDefinitions: [multiLogRegAudience],
        omitGdprConsent: true,
      });

      expect(getPageViews()).toHaveLength(1);
      expect(getMatchedAudiences()).toHaveLength(0);
    });

    it('adds 2nd page view and match second run', async () => {
      await edkt.run({
        pageFeatures: pageFeaturesMatchTwo,
        audienceDefinitions: [multiLogRegAudience],
        omitGdprConsent: true,
      });

      expect(getPageViews()).toHaveLength(2);
      expect(getMatchedAudiences()).toHaveLength(1);
    });

    it('adds 3rd page view third run', async () => {
      await edkt.run({
        pageFeatures: pageFeaturesMatchOne,
        audienceDefinitions: [logRegAudience],
        omitGdprConsent: true,
      });

      expect(getPageViews()).toHaveLength(3);
      expect(getMatchedAudiences()).toHaveLength(1);
    });
  });

  describe('logistic regression multi query audiences not matching below threshold', () => {
    const pageFeaturesNotMatch = {
      docVector: {
        value: NOT_MATCHING_VECTOR,
        version: 1,
      },
    };

    beforeAll(clearStore);

    it('adds 1st page view and does not match on first run', async () => {
      await edkt.run({
        pageFeatures: pageFeaturesNotMatch,
        audienceDefinitions: [multiLogRegAudience],
        omitGdprConsent: true,
      });

      expect(getPageViews()).toHaveLength(1);
      expect(getMatchedAudiences()).toHaveLength(0);
    });

    it('adds 2nd page view and does not match on second run', async () => {
      await edkt.run({
        pageFeatures: pageFeaturesNotMatch,
        audienceDefinitions: [multiLogRegAudience],
        omitGdprConsent: true,
      });

      expect(getPageViews()).toHaveLength(2);
      expect(getMatchedAudiences()).toHaveLength(0);
    });

    it('adds 3rd page view and does not match on third run', async () => {
      await edkt.run({
        pageFeatures: pageFeaturesNotMatch,
        audienceDefinitions: [multiLogRegAudience],
        omitGdprConsent: true,
      });

      expect(getPageViews()).toHaveLength(3);
      expect(getMatchedAudiences()).toHaveLength(0);
    });
  });
});
