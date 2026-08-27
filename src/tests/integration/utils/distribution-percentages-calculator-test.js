import { expect } from 'chai';
import { describe, it } from 'mocha';
import { setupRenderingTest } from 'ember-mocha';
import DistributionPercentagesCalculator, { providerDistributionFailure } from 'oneprovider-gui/utils/distribution-percentages-calculator';

describe('Integration | Utility | distribution-percentages-calculator', function () {
  const { afterEach } = setupRenderingTest();

  afterEach(function () {
    this.storageDistributionInfo?.destroy();
  });

  it('calculates total files size', function () {
    this.storageDistributionInfo = DistributionPercentagesCalculator.create({
      distributionContainer: [
        { fileSize: 100 },
        { fileSize: 200 },
        { fileSize: 50 },
      ],
    });

    expect(this.storageDistributionInfo.filesSize).to.equal(350);
  });

  it('calculates physical size per storage backend', function () {
    this.storageDistributionInfo = DistributionPercentagesCalculator.create({
      distributionContainer: [{
          fileSize: 100,
          fileDistribution: {
            provider1: {
              success: true,
              distributionPerStorageBackend: {
                storage1: {
                  success: true,
                  physicalSize: 60,
                },
                storage2: {
                  success: true,
                  physicalSize: 40,
                },
              },
            },
          },
        },
        {
          fileSize: 200,
          fileDistribution: {
            provider1: {
              success: true,
              distributionPerStorageBackend: {
                storage1: {
                  success: true,
                  physicalSize: 120,
                },
                storage2: {
                  success: true,
                  physicalSize: 80,
                },
              },
            },
          },
        },
      ],
    });

    expect(this.storageDistributionInfo.physicalSizePerStorageBackend).to.deep.equal({
      provider1: {
        storage1: 180,
        storage2: 120,
      },
    });
  });

  it('calculates physical size separately for each provider', function () {
    this.storageDistributionInfo = DistributionPercentagesCalculator.create({
      distributionContainer: [{
        fileSize: 100,
        fileDistribution: {
          provider1: {
            success: true,
            distributionPerStorageBackend: {
              storage1: {
                success: true,
                physicalSize: 60,
              },
            },
          },
          provider2: {
            success: true,
            distributionPerStorageBackend: {
              storage2: {
                success: true,
                physicalSize: 40,
              },
            },
          },
        },
      }],
    });

    expect(this.storageDistributionInfo.physicalSizePerStorageBackend)
      .to.deep.equal({
        provider1: {
          storage1: 60,
        },
        provider2: {
          storage2: 40,
        },
      });
  });

  it('marks provider as failed when distribution fails', function () {
    this.storageDistributionInfo = DistributionPercentagesCalculator.create({
      distributionContainer: [{
        fileSize: 100,
        fileDistribution: {
          provider1: {
            success: false,
          },
        },
      }],
    });

    expect(this.storageDistributionInfo.physicalSizePerStorageBackend)
      .to.deep.equal({
        provider1: providerDistributionFailure,
      });
  });

  it('marks storage backend as failed when its distribution fails', function () {
    this.storageDistributionInfo = DistributionPercentagesCalculator.create({
      distributionContainer: [{
        fileSize: 100,
        fileDistribution: {
          provider1: {
            success: true,
            distributionPerStorageBackend: {
              storage1: {
                success: false,
              },
              storage2: {
                success: true,
                physicalSize: 100,
              },
            },
          },
        },
      }],
    });

    expect(this.storageDistributionInfo.physicalSizePerStorageBackend)
      .to.deep.equal({
        provider1: {
          storage1: providerDistributionFailure,
          storage2: 100,
        },
      });
  });

  it('calculates percentage per storage backend', function () {
    this.storageDistributionInfo = DistributionPercentagesCalculator.create({
      distributionContainer: [{
        fileSize: 100,
        fileDistribution: {
          provider1: {
            success: true,
            distributionPerStorageBackend: {
              storage1: {
                success: true,
                physicalSize: 25,
              },
              storage2: {
                success: true,
                physicalSize: 75,
              },
            },
          },
        },
      }],
    });

    expect(this.storageDistributionInfo.percentagePerStorageBackend)
      .to.deep.equal({
        provider1: {
          storage1: 25,
          storage2: 75,
        },
      });
  });

  it('returns 100 percent when files size is zero', function () {
    this.storageDistributionInfo = DistributionPercentagesCalculator.create({
      distributionContainer: [{
        fileSize: 0,
        fileDistribution: {
          provider1: {
            success: true,
            distributionPerStorageBackend: {
              storage1: {
                success: true,
                physicalSize: 0,
              },
            },
          },
        },
      }],
    });

    expect(this.storageDistributionInfo.percentagePerStorageBackend)
      .to.deep.equal({
        provider1: {
          storage1: 100,
        },
      });
  });

  it('rounds percentages down and ensures non-zero values are at least one', function () {
    this.storageDistributionInfo = DistributionPercentagesCalculator.create({
      distributionContainer: [{
        fileSize: 100,
        fileDistribution: {
          provider1: {
            success: true,
            distributionPerStorageBackend: {
              storage1: {
                success: true,
                physicalSize: 0.3,
              },
              storage2: {
                success: true,
                physicalSize: 99.5,
              },
              storage3: {
                success: true,
                physicalSize: 0.2,
              },
            },
          },
        },
      }],
    });

    expect(this.storageDistributionInfo.roundedPercentagePerStorageBackend)
      .to.deep.equal({
        provider1: {
          storage1: 1,
          storage2: 99,
          storage3: 1,
        },
      });
  });

  it('adjusts rounded percentages so that they sum up to 100', function () {
    this.storageDistributionInfo = DistributionPercentagesCalculator.create({
      distributionContainer: [{
        fileSize: 100,
        fileDistribution: {
          provider1: {
            success: true,
            distributionPerStorageBackend: {
              storage1: {
                success: true,
                physicalSize: 33.3,
              },
              storage2: {
                success: true,
                physicalSize: 33.3,
              },
              storage3: {
                success: true,
                physicalSize: 33.4,
              },
            },
          },
        },
      }],
    });

    expect(this.storageDistributionInfo.roundedPercentagePerStorageBackend)
      .to.deep.equal({
        provider1: {
          storage1: 33,
          storage2: 33,
          storage3: 34,
        },
      });
  });

  it('adjusts rounded percentages so that they sum up to 100 with one percentage', function () {
    this.storageDistributionInfo = DistributionPercentagesCalculator.create({
      distributionContainer: [{
        fileSize: 100,
        fileDistribution: {
          provider1: {
            success: true,
            distributionPerStorageBackend: {
              storage1: {
                success: true,
                physicalSize: 96.3,
              },
              storage2: {
                success: true,
                physicalSize: 1.3,
              },
              storage3: {
                success: true,
                physicalSize: 2.4,
              },
            },
          },
        },
      }],
    });

    expect(this.storageDistributionInfo.roundedPercentagePerStorageBackend)
      .to.deep.equal({
        provider1: {
          storage1: 96,
          storage2: 1,
          storage3: 3,
        },
      });
  });

  it('adjusts rounded percentages so that they sum up to 100 with more percentage', function () {
    this.storageDistributionInfo = DistributionPercentagesCalculator.create({
      distributionContainer: [{
        fileSize: 100,
        fileDistribution: {
          provider1: {
            success: true,
            distributionPerStorageBackend: {
              storage1: {
                success: true,
                physicalSize: 95.3,
              },
              storage2: {
                success: true,
                physicalSize: 1.4,
              },
              storage3: {
                success: true,
                physicalSize: 1.4,
              },
              storage4: {
                success: true,
                physicalSize: 1.2,
              },
            },
          },
        },
      }],
    });
    expect(this.storageDistributionInfo.roundedPercentagePerStorageBackend)
      .to.deep.equal({
        provider1: {
          storage1: 95,
          storage2: 2,
          storage3: 2,
          storage4: 1,
        },
      });
  });
});
