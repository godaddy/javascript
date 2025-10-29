/* eslint-disable */
/* prettier-ignore */

export type introspection_types = {
  Address: {
    kind: 'OBJECT';
    name: 'Address';
    fields: {
      addressDetails: {
        name: 'addressDetails';
        type: { kind: 'OBJECT'; name: 'AddressDetails'; ofType: null };
      };
      addressLine1: {
        name: 'addressLine1';
        type: { kind: 'SCALAR'; name: 'String'; ofType: null };
      };
      addressLine2: {
        name: 'addressLine2';
        type: { kind: 'SCALAR'; name: 'String'; ofType: null };
      };
      addressLine3: {
        name: 'addressLine3';
        type: { kind: 'SCALAR'; name: 'String'; ofType: null };
      };
      adminArea1: {
        name: 'adminArea1';
        type: { kind: 'SCALAR'; name: 'String'; ofType: null };
      };
      adminArea2: {
        name: 'adminArea2';
        type: { kind: 'SCALAR'; name: 'String'; ofType: null };
      };
      adminArea3: {
        name: 'adminArea3';
        type: { kind: 'SCALAR'; name: 'String'; ofType: null };
      };
      adminArea4: {
        name: 'adminArea4';
        type: { kind: 'SCALAR'; name: 'String'; ofType: null };
      };
      countryCode: {
        name: 'countryCode';
        type: { kind: 'SCALAR'; name: 'String'; ofType: null };
      };
      postalCode: {
        name: 'postalCode';
        type: { kind: 'SCALAR'; name: 'String'; ofType: null };
      };
    };
  };
  AddressDetails: {
    kind: 'OBJECT';
    name: 'AddressDetails';
    fields: {
      addressType: {
        name: 'addressType';
        type: { kind: 'SCALAR'; name: 'String'; ofType: null };
      };
      buildingName: {
        name: 'buildingName';
        type: { kind: 'SCALAR'; name: 'String'; ofType: null };
      };
      deliveryService: {
        name: 'deliveryService';
        type: { kind: 'SCALAR'; name: 'String'; ofType: null };
      };
      geoCoordinates: {
        name: 'geoCoordinates';
        type: { kind: 'OBJECT'; name: 'GeoCoordinates'; ofType: null };
      };
      streetName: {
        name: 'streetName';
        type: { kind: 'SCALAR'; name: 'String'; ofType: null };
      };
      streetNumber: {
        name: 'streetNumber';
        type: { kind: 'SCALAR'; name: 'String'; ofType: null };
      };
      streetType: {
        name: 'streetType';
        type: { kind: 'SCALAR'; name: 'String'; ofType: null };
      };
      subBuilding: {
        name: 'subBuilding';
        type: { kind: 'SCALAR'; name: 'String'; ofType: null };
      };
    };
  };
  AddressInput: {
    kind: 'INPUT_OBJECT';
    name: 'AddressInput';
    isOneOf: false;
    inputFields: [
      {
        name: 'addressLine1';
        type: {
          kind: 'NON_NULL';
          name: never;
          ofType: { kind: 'SCALAR'; name: 'String'; ofType: null };
        };
        defaultValue: null;
      },
      {
        name: 'addressLine2';
        type: { kind: 'SCALAR'; name: 'String'; ofType: null };
        defaultValue: null;
      },
      {
        name: 'addressLine3';
        type: { kind: 'SCALAR'; name: 'String'; ofType: null };
        defaultValue: null;
      },
      {
        name: 'adminArea1';
        type: {
          kind: 'NON_NULL';
          name: never;
          ofType: { kind: 'SCALAR'; name: 'String'; ofType: null };
        };
        defaultValue: null;
      },
      {
        name: 'adminArea2';
        type: {
          kind: 'NON_NULL';
          name: never;
          ofType: { kind: 'SCALAR'; name: 'String'; ofType: null };
        };
        defaultValue: null;
      },
      {
        name: 'countryCode';
        type: {
          kind: 'NON_NULL';
          name: never;
          ofType: { kind: 'SCALAR'; name: 'String'; ofType: null };
        };
        defaultValue: null;
      },
      {
        name: 'postalCode';
        type: {
          kind: 'NON_NULL';
          name: never;
          ofType: { kind: 'SCALAR'; name: 'String'; ofType: null };
        };
        defaultValue: null;
      },
    ];
  };
  AdjustmentAmount: {
    kind: 'OBJECT';
    name: 'AdjustmentAmount';
    fields: {
      amount: {
        name: 'amount';
        type: { kind: 'OBJECT'; name: 'SimpleMoney'; ofType: null };
      };
    };
  };
  AdjustmentPercentage: {
    kind: 'OBJECT';
    name: 'AdjustmentPercentage';
    fields: {
      maximumAmount: {
        name: 'maximumAmount';
        type: { kind: 'OBJECT'; name: 'SimpleMoney'; ofType: null };
      };
      percentage: {
        name: 'percentage';
        type: { kind: 'SCALAR'; name: 'String'; ofType: null };
      };
    };
  };
  AdjustmentValue: {
    kind: 'UNION';
    name: 'AdjustmentValue';
    fields: {};
    possibleTypes: 'AdjustmentAmount' | 'AdjustmentPercentage';
  };
  ApplyShippingMethodInput: {
    kind: 'INPUT_OBJECT';
    name: 'ApplyShippingMethodInput';
    isOneOf: false;
    inputFields: [
      {
        name: 'name';
        type: {
          kind: 'NON_NULL';
          name: never;
          ofType: { kind: 'SCALAR'; name: 'String'; ofType: null };
        };
        defaultValue: null;
      },
      {
        name: 'requestedProvider';
        type: { kind: 'SCALAR'; name: 'String'; ofType: null };
        defaultValue: null;
      },
      {
        name: 'requestedService';
        type: { kind: 'SCALAR'; name: 'String'; ofType: null };
        defaultValue: null;
      },
      {
        name: 'subTotal';
        type: { kind: 'INPUT_OBJECT'; name: 'MoneyInput'; ofType: null };
        defaultValue: null;
      },
      {
        name: 'taxTotal';
        type: { kind: 'INPUT_OBJECT'; name: 'MoneyInput'; ofType: null };
        defaultValue: null;
      },
    ];
  };
  Boolean: unknown;
  CalculatedAdjustment: {
    kind: 'UNION';
    name: 'CalculatedAdjustment';
    fields: {};
    possibleTypes: 'CalculatedDiscount' | 'CalculatedFee';
  };
  CalculatedAdjustmentOutput: {
    kind: 'OBJECT';
    name: 'CalculatedAdjustmentOutput';
    fields: {
      adjustment: {
        name: 'adjustment';
        type: { kind: 'UNION'; name: 'CalculatedAdjustment'; ofType: null };
      };
      totalAmount: {
        name: 'totalAmount';
        type: { kind: 'OBJECT'; name: 'SimpleMoney'; ofType: null };
      };
    };
  };
  CalculatedDiscount: {
    kind: 'OBJECT';
    name: 'CalculatedDiscount';
    fields: {
      description: {
        name: 'description';
        type: { kind: 'SCALAR'; name: 'String'; ofType: null };
      };
      id: { name: 'id'; type: { kind: 'SCALAR'; name: 'ID'; ofType: null } };
      label: {
        name: 'label';
        type: { kind: 'SCALAR'; name: 'String'; ofType: null };
      };
      name: {
        name: 'name';
        type: { kind: 'SCALAR'; name: 'String'; ofType: null };
      };
      value: {
        name: 'value';
        type: { kind: 'UNION'; name: 'AdjustmentValue'; ofType: null };
      };
    };
  };
  CalculatedFee: {
    kind: 'OBJECT';
    name: 'CalculatedFee';
    fields: {
      description: {
        name: 'description';
        type: { kind: 'SCALAR'; name: 'String'; ofType: null };
      };
      id: { name: 'id'; type: { kind: 'SCALAR'; name: 'ID'; ofType: null } };
      label: {
        name: 'label';
        type: { kind: 'SCALAR'; name: 'String'; ofType: null };
      };
      name: {
        name: 'name';
        type: { kind: 'SCALAR'; name: 'String'; ofType: null };
      };
      value: {
        name: 'value';
        type: { kind: 'UNION'; name: 'AdjustmentValue'; ofType: null };
      };
    };
  };
  CalculatedLineOutput: {
    kind: 'OBJECT';
    name: 'CalculatedLineOutput';
    fields: {
      adjustments: {
        name: 'adjustments';
        type: {
          kind: 'LIST';
          name: never;
          ofType: {
            kind: 'NON_NULL';
            name: never;
            ofType: {
              kind: 'OBJECT';
              name: 'CalculatedAdjustmentOutput';
              ofType: null;
            };
          };
        };
      };
      calculationLine: {
        name: 'calculationLine';
        type: { kind: 'OBJECT'; name: 'CalculationLineOutput'; ofType: null };
      };
      totalDiscountAmount: {
        name: 'totalDiscountAmount';
        type: { kind: 'OBJECT'; name: 'SimpleMoney'; ofType: null };
      };
      totalFeeAmount: {
        name: 'totalFeeAmount';
        type: { kind: 'OBJECT'; name: 'SimpleMoney'; ofType: null };
      };
    };
  };
  CalculationLineOutput: {
    kind: 'OBJECT';
    name: 'CalculationLineOutput';
    fields: {
      id: {
        name: 'id';
        type: { kind: 'SCALAR'; name: 'String'; ofType: null };
      };
      type: {
        name: 'type';
        type: { kind: 'SCALAR'; name: 'String'; ofType: null };
      };
    };
  };
  CheckoutSession: {
    kind: 'OBJECT';
    name: 'CheckoutSession';
    fields: {
      addresses: {
        name: 'addresses';
        type: {
          kind: 'LIST';
          name: never;
          ofType: {
            kind: 'NON_NULL';
            name: never;
            ofType: { kind: 'OBJECT'; name: 'Address'; ofType: null };
          };
        };
      };
      channelId: {
        name: 'channelId';
        type: {
          kind: 'NON_NULL';
          name: never;
          ofType: { kind: 'SCALAR'; name: 'String'; ofType: null };
        };
      };
      createdAt: {
        name: 'createdAt';
        type: {
          kind: 'NON_NULL';
          name: never;
          ofType: { kind: 'SCALAR'; name: 'DateTime'; ofType: null };
        };
      };
      customerId: {
        name: 'customerId';
        type: { kind: 'SCALAR'; name: 'String'; ofType: null };
      };
      defaultOperatingHours: {
        name: 'defaultOperatingHours';
        type: {
          kind: 'OBJECT';
          name: 'CheckoutSessionStoreHours';
          ofType: null;
        };
      };
      draftOrder: {
        name: 'draftOrder';
        type: { kind: 'OBJECT'; name: 'DraftOrder'; ofType: null };
      };
      enableAddressAutocomplete: {
        name: 'enableAddressAutocomplete';
        type: { kind: 'SCALAR'; name: 'Boolean'; ofType: null };
      };
      enableBillingAddressCollection: {
        name: 'enableBillingAddressCollection';
        type: { kind: 'SCALAR'; name: 'Boolean'; ofType: null };
      };
      enableLocalPickup: {
        name: 'enableLocalPickup';
        type: { kind: 'SCALAR'; name: 'Boolean'; ofType: null };
      };
      enableNotesCollection: {
        name: 'enableNotesCollection';
        type: { kind: 'SCALAR'; name: 'Boolean'; ofType: null };
      };
      enablePaymentMethodCollection: {
        name: 'enablePaymentMethodCollection';
        type: { kind: 'SCALAR'; name: 'Boolean'; ofType: null };
      };
      enablePhoneCollection: {
        name: 'enablePhoneCollection';
        type: { kind: 'SCALAR'; name: 'Boolean'; ofType: null };
      };
      enablePromotionCodes: {
        name: 'enablePromotionCodes';
        type: { kind: 'SCALAR'; name: 'Boolean'; ofType: null };
      };
      enableShippingAddressCollection: {
        name: 'enableShippingAddressCollection';
        type: { kind: 'SCALAR'; name: 'Boolean'; ofType: null };
      };
      enableSurcharge: {
        name: 'enableSurcharge';
        type: { kind: 'SCALAR'; name: 'Boolean'; ofType: null };
      };
      enableTaxCollection: {
        name: 'enableTaxCollection';
        type: { kind: 'SCALAR'; name: 'Boolean'; ofType: null };
      };
      enableTips: {
        name: 'enableTips';
        type: { kind: 'SCALAR'; name: 'Boolean'; ofType: null };
      };
      enabledLocales: {
        name: 'enabledLocales';
        type: {
          kind: 'LIST';
          name: never;
          ofType: {
            kind: 'NON_NULL';
            name: never;
            ofType: { kind: 'SCALAR'; name: 'String'; ofType: null };
          };
        };
      };
      enabledPaymentProviders: {
        name: 'enabledPaymentProviders';
        type: {
          kind: 'LIST';
          name: never;
          ofType: {
            kind: 'NON_NULL';
            name: never;
            ofType: { kind: 'SCALAR'; name: 'String'; ofType: null };
          };
        };
      };
      environment: {
        name: 'environment';
        type: {
          kind: 'ENUM';
          name: 'CheckoutSessionEnvironment';
          ofType: null;
        };
      };
      experimental_rules: {
        name: 'experimental_rules';
        type: {
          kind: 'OBJECT';
          name: 'CheckoutSessionExperimentalRules';
          ofType: null;
        };
      };
      expiresAt: {
        name: 'expiresAt';
        type: {
          kind: 'NON_NULL';
          name: never;
          ofType: { kind: 'SCALAR'; name: 'DateTime'; ofType: null };
        };
      };
      id: {
        name: 'id';
        type: {
          kind: 'NON_NULL';
          name: never;
          ofType: { kind: 'SCALAR'; name: 'String'; ofType: null };
        };
      };
      lineItems: {
        name: 'lineItems';
        type: {
          kind: 'LIST';
          name: never;
          ofType: {
            kind: 'NON_NULL';
            name: never;
            ofType: {
              kind: 'OBJECT';
              name: 'DraftOrderLineItem';
              ofType: null;
            };
          };
        };
      };
      locations: {
        name: 'locations';
        type: {
          kind: 'LIST';
          name: never;
          ofType: {
            kind: 'NON_NULL';
            name: never;
            ofType: {
              kind: 'OBJECT';
              name: 'CheckoutSessionLocation';
              ofType: null;
            };
          };
        };
      };
      paymentMethods: {
        name: 'paymentMethods';
        type: {
          kind: 'OBJECT';
          name: 'CheckoutSessionPaymentMethods';
          ofType: null;
        };
      };
      returnUrl: {
        name: 'returnUrl';
        type: {
          kind: 'NON_NULL';
          name: never;
          ofType: { kind: 'SCALAR'; name: 'String'; ofType: null };
        };
      };
      shipping: {
        name: 'shipping';
        type: {
          kind: 'OBJECT';
          name: 'CheckoutSessionShippingOptions';
          ofType: null;
        };
      };
      skus: {
        name: 'skus';
        type: {
          kind: 'NON_NULL';
          name: never;
          ofType: {
            kind: 'OBJECT';
            name: 'CheckoutSessionSkusConnection';
            ofType: null;
          };
        };
      };
      sourceApp: {
        name: 'sourceApp';
        type: { kind: 'SCALAR'; name: 'String'; ofType: null };
      };
      status: {
        name: 'status';
        type: {
          kind: 'NON_NULL';
          name: never;
          ofType: { kind: 'ENUM'; name: 'CheckoutSessionStatus'; ofType: null };
        };
      };
      storeId: {
        name: 'storeId';
        type: {
          kind: 'NON_NULL';
          name: never;
          ofType: { kind: 'SCALAR'; name: 'String'; ofType: null };
        };
      };
      storeName: {
        name: 'storeName';
        type: { kind: 'SCALAR'; name: 'String'; ofType: null };
      };
      successUrl: {
        name: 'successUrl';
        type: {
          kind: 'NON_NULL';
          name: never;
          ofType: { kind: 'SCALAR'; name: 'String'; ofType: null };
        };
      };
      taxes: {
        name: 'taxes';
        type: {
          kind: 'OBJECT';
          name: 'CheckoutSessionTaxesOptions';
          ofType: null;
        };
      };
      token: {
        name: 'token';
        type: { kind: 'SCALAR'; name: 'String'; ofType: null };
      };
      updatedAt: {
        name: 'updatedAt';
        type: {
          kind: 'NON_NULL';
          name: never;
          ofType: { kind: 'SCALAR'; name: 'DateTime'; ofType: null };
        };
      };
      url: {
        name: 'url';
        type: { kind: 'SCALAR'; name: 'String'; ofType: null };
      };
    };
  };
  CheckoutSessionAddress: {
    kind: 'OBJECT';
    name: 'CheckoutSessionAddress';
    fields: {
      addressDetails: {
        name: 'addressDetails';
        type: { kind: 'OBJECT'; name: 'AddressDetails'; ofType: null };
      };
      addressLine1: {
        name: 'addressLine1';
        type: { kind: 'SCALAR'; name: 'String'; ofType: null };
      };
      addressLine2: {
        name: 'addressLine2';
        type: { kind: 'SCALAR'; name: 'String'; ofType: null };
      };
      addressLine3: {
        name: 'addressLine3';
        type: { kind: 'SCALAR'; name: 'String'; ofType: null };
      };
      adminArea1: {
        name: 'adminArea1';
        type: { kind: 'SCALAR'; name: 'String'; ofType: null };
      };
      adminArea2: {
        name: 'adminArea2';
        type: { kind: 'SCALAR'; name: 'String'; ofType: null };
      };
      adminArea3: {
        name: 'adminArea3';
        type: { kind: 'SCALAR'; name: 'String'; ofType: null };
      };
      adminArea4: {
        name: 'adminArea4';
        type: { kind: 'SCALAR'; name: 'String'; ofType: null };
      };
      countryCode: {
        name: 'countryCode';
        type: { kind: 'SCALAR'; name: 'String'; ofType: null };
      };
      postalCode: {
        name: 'postalCode';
        type: { kind: 'SCALAR'; name: 'String'; ofType: null };
      };
    };
  };
  CheckoutSessionAddressDetailsInput: {
    kind: 'INPUT_OBJECT';
    name: 'CheckoutSessionAddressDetailsInput';
    isOneOf: false;
    inputFields: [
      {
        name: 'addressType';
        type: { kind: 'SCALAR'; name: 'String'; ofType: null };
        defaultValue: null;
      },
      {
        name: 'buildingName';
        type: { kind: 'SCALAR'; name: 'String'; ofType: null };
        defaultValue: null;
      },
      {
        name: 'deliveryService';
        type: { kind: 'SCALAR'; name: 'String'; ofType: null };
        defaultValue: null;
      },
      {
        name: 'geoCoordinates';
        type: {
          kind: 'INPUT_OBJECT';
          name: 'CheckoutSessionGeoCoordinatesInput';
          ofType: null;
        };
        defaultValue: null;
      },
      {
        name: 'streetName';
        type: { kind: 'SCALAR'; name: 'String'; ofType: null };
        defaultValue: null;
      },
      {
        name: 'streetNumber';
        type: { kind: 'SCALAR'; name: 'String'; ofType: null };
        defaultValue: null;
      },
      {
        name: 'streetType';
        type: { kind: 'SCALAR'; name: 'String'; ofType: null };
        defaultValue: null;
      },
      {
        name: 'subBuilding';
        type: { kind: 'SCALAR'; name: 'String'; ofType: null };
        defaultValue: null;
      },
    ];
  };
  CheckoutSessionAddressInput: {
    kind: 'INPUT_OBJECT';
    name: 'CheckoutSessionAddressInput';
    isOneOf: false;
    inputFields: [
      {
        name: 'addressDetails';
        type: {
          kind: 'INPUT_OBJECT';
          name: 'CheckoutSessionAddressDetailsInput';
          ofType: null;
        };
        defaultValue: null;
      },
      {
        name: 'addressLine1';
        type: { kind: 'SCALAR'; name: 'String'; ofType: null };
        defaultValue: null;
      },
      {
        name: 'addressLine2';
        type: { kind: 'SCALAR'; name: 'String'; ofType: null };
        defaultValue: null;
      },
      {
        name: 'addressLine3';
        type: { kind: 'SCALAR'; name: 'String'; ofType: null };
        defaultValue: null;
      },
      {
        name: 'adminArea1';
        type: { kind: 'SCALAR'; name: 'String'; ofType: null };
        defaultValue: null;
      },
      {
        name: 'adminArea2';
        type: { kind: 'SCALAR'; name: 'String'; ofType: null };
        defaultValue: null;
      },
      {
        name: 'adminArea3';
        type: { kind: 'SCALAR'; name: 'String'; ofType: null };
        defaultValue: null;
      },
      {
        name: 'adminArea4';
        type: { kind: 'SCALAR'; name: 'String'; ofType: null };
        defaultValue: null;
      },
      {
        name: 'countryCode';
        type: { kind: 'SCALAR'; name: 'String'; ofType: null };
        defaultValue: null;
      },
      {
        name: 'postalCode';
        type: { kind: 'SCALAR'; name: 'String'; ofType: null };
        defaultValue: null;
      },
    ];
  };
  CheckoutSessionAddressesInput: {
    kind: 'INPUT_OBJECT';
    name: 'CheckoutSessionAddressesInput';
    isOneOf: false;
    inputFields: [
      {
        name: 'query';
        type: {
          kind: 'NON_NULL';
          name: never;
          ofType: { kind: 'SCALAR'; name: 'String'; ofType: null };
        };
        defaultValue: null;
      },
    ];
  };
  CheckoutSessionCalculateTaxesInput: {
    kind: 'INPUT_OBJECT';
    name: 'CheckoutSessionCalculateTaxesInput';
    isOneOf: false;
    inputFields: [
      {
        name: 'destination';
        type: {
          kind: 'INPUT_OBJECT';
          name: 'CheckoutSessionCalculationLocationInput';
          ofType: null;
        };
        defaultValue: null;
      },
      {
        name: 'lines';
        type: {
          kind: 'NON_NULL';
          name: never;
          ofType: {
            kind: 'LIST';
            name: never;
            ofType: {
              kind: 'NON_NULL';
              name: never;
              ofType: {
                kind: 'INPUT_OBJECT';
                name: 'CheckoutSessionCalculationLineInput';
                ofType: null;
              };
            };
          };
        };
        defaultValue: null;
      },
      {
        name: 'origin';
        type: {
          kind: 'INPUT_OBJECT';
          name: 'CheckoutSessionCalculationLocationInput';
          ofType: null;
        };
        defaultValue: null;
      },
    ];
  };
  CheckoutSessionCalculatedLine: {
    kind: 'OBJECT';
    name: 'CheckoutSessionCalculatedLine';
    fields: {
      calculationLine: {
        name: 'calculationLine';
        type: {
          kind: 'OBJECT';
          name: 'CheckoutSessionCalculationLine';
          ofType: null;
        };
      };
      taxAmounts: {
        name: 'taxAmounts';
        type: {
          kind: 'LIST';
          name: never;
          ofType: {
            kind: 'NON_NULL';
            name: never;
            ofType: {
              kind: 'OBJECT';
              name: 'CheckoutSessionTaxAmount';
              ofType: null;
            };
          };
        };
      };
      totalTaxAmount: {
        name: 'totalTaxAmount';
        type: {
          kind: 'OBJECT';
          name: 'CheckoutSessionTotalTaxAmount';
          ofType: null;
        };
      };
    };
  };
  CheckoutSessionCalculatedRate: {
    kind: 'OBJECT';
    name: 'CheckoutSessionCalculatedRate';
    fields: {
      calculationMethod: {
        name: 'calculationMethod';
        type: { kind: 'SCALAR'; name: 'String'; ofType: null };
      };
      id: {
        name: 'id';
        type: { kind: 'SCALAR'; name: 'String'; ofType: null };
      };
      label: {
        name: 'label';
        type: { kind: 'SCALAR'; name: 'String'; ofType: null };
      };
      name: {
        name: 'name';
        type: { kind: 'SCALAR'; name: 'String'; ofType: null };
      };
      value: {
        name: 'value';
        type: {
          kind: 'OBJECT';
          name: 'CheckoutSessionCalculatedRateValue';
          ofType: null;
        };
      };
    };
  };
  CheckoutSessionCalculatedRateValue: {
    kind: 'OBJECT';
    name: 'CheckoutSessionCalculatedRateValue';
    fields: {
      amount: {
        name: 'amount';
        type: { kind: 'OBJECT'; name: 'MoneyValue'; ofType: null };
      };
      appliedAmount: {
        name: 'appliedAmount';
        type: { kind: 'OBJECT'; name: 'MoneyValue'; ofType: null };
      };
      appliedPercentage: {
        name: 'appliedPercentage';
        type: { kind: 'SCALAR'; name: 'Float'; ofType: null };
      };
      percentage: {
        name: 'percentage';
        type: { kind: 'SCALAR'; name: 'String'; ofType: null };
      };
    };
  };
  CheckoutSessionCalculationAddressInput: {
    kind: 'INPUT_OBJECT';
    name: 'CheckoutSessionCalculationAddressInput';
    isOneOf: false;
    inputFields: [
      {
        name: 'addressLine1';
        type: { kind: 'SCALAR'; name: 'String'; ofType: null };
        defaultValue: null;
      },
      {
        name: 'addressLine2';
        type: { kind: 'SCALAR'; name: 'String'; ofType: null };
        defaultValue: null;
      },
      {
        name: 'addressLine3';
        type: { kind: 'SCALAR'; name: 'String'; ofType: null };
        defaultValue: null;
      },
      {
        name: 'adminArea1';
        type: { kind: 'SCALAR'; name: 'String'; ofType: null };
        defaultValue: null;
      },
      {
        name: 'adminArea2';
        type: { kind: 'SCALAR'; name: 'String'; ofType: null };
        defaultValue: null;
      },
      {
        name: 'adminArea3';
        type: { kind: 'SCALAR'; name: 'String'; ofType: null };
        defaultValue: null;
      },
      {
        name: 'adminArea4';
        type: { kind: 'SCALAR'; name: 'String'; ofType: null };
        defaultValue: null;
      },
      {
        name: 'countryCode';
        type: {
          kind: 'NON_NULL';
          name: never;
          ofType: { kind: 'SCALAR'; name: 'String'; ofType: null };
        };
        defaultValue: null;
      },
      {
        name: 'postalCode';
        type: { kind: 'SCALAR'; name: 'String'; ofType: null };
        defaultValue: null;
      },
    ];
  };
  CheckoutSessionCalculationLine: {
    kind: 'OBJECT';
    name: 'CheckoutSessionCalculationLine';
    fields: {
      id: {
        name: 'id';
        type: { kind: 'SCALAR'; name: 'String'; ofType: null };
      };
    };
  };
  CheckoutSessionCalculationLineInput: {
    kind: 'INPUT_OBJECT';
    name: 'CheckoutSessionCalculationLineInput';
    isOneOf: false;
    inputFields: [
      {
        name: 'classification';
        type: { kind: 'SCALAR'; name: 'String'; ofType: null };
        defaultValue: null;
      },
      {
        name: 'destination';
        type: {
          kind: 'INPUT_OBJECT';
          name: 'CheckoutSessionCalculationLocationInput';
          ofType: null;
        };
        defaultValue: null;
      },
      {
        name: 'id';
        type: {
          kind: 'NON_NULL';
          name: never;
          ofType: { kind: 'SCALAR'; name: 'String'; ofType: null };
        };
        defaultValue: null;
      },
      {
        name: 'origin';
        type: {
          kind: 'INPUT_OBJECT';
          name: 'CheckoutSessionCalculationLocationInput';
          ofType: null;
        };
        defaultValue: null;
      },
      {
        name: 'quantity';
        type: {
          kind: 'NON_NULL';
          name: never;
          ofType: { kind: 'SCALAR'; name: 'Float'; ofType: null };
        };
        defaultValue: null;
      },
      {
        name: 'subtotalPrice';
        type: {
          kind: 'NON_NULL';
          name: never;
          ofType: { kind: 'INPUT_OBJECT'; name: 'MoneyInput'; ofType: null };
        };
        defaultValue: null;
      },
      {
        name: 'type';
        type: {
          kind: 'NON_NULL';
          name: never;
          ofType: { kind: 'SCALAR'; name: 'String'; ofType: null };
        };
        defaultValue: null;
      },
      {
        name: 'unitPrice';
        type: { kind: 'INPUT_OBJECT'; name: 'MoneyInput'; ofType: null };
        defaultValue: null;
      },
    ];
  };
  CheckoutSessionCalculationLocationInput: {
    kind: 'INPUT_OBJECT';
    name: 'CheckoutSessionCalculationLocationInput';
    isOneOf: false;
    inputFields: [
      {
        name: 'address';
        type: {
          kind: 'NON_NULL';
          name: never;
          ofType: {
            kind: 'INPUT_OBJECT';
            name: 'CheckoutSessionCalculationAddressInput';
            ofType: null;
          };
        };
        defaultValue: null;
      },
    ];
  };
  CheckoutSessionCalculationResult: {
    kind: 'OBJECT';
    name: 'CheckoutSessionCalculationResult';
    fields: {
      lines: {
        name: 'lines';
        type: {
          kind: 'LIST';
          name: never;
          ofType: {
            kind: 'NON_NULL';
            name: never;
            ofType: {
              kind: 'OBJECT';
              name: 'CheckoutSessionCalculatedLine';
              ofType: null;
            };
          };
        };
      };
      taxAmounts: {
        name: 'taxAmounts';
        type: {
          kind: 'LIST';
          name: never;
          ofType: {
            kind: 'NON_NULL';
            name: never;
            ofType: {
              kind: 'OBJECT';
              name: 'CheckoutSessionTaxAmount';
              ofType: null;
            };
          };
        };
      };
      totalTaxAmount: {
        name: 'totalTaxAmount';
        type: {
          kind: 'OBJECT';
          name: 'CheckoutSessionTotalTaxAmount';
          ofType: null;
        };
      };
    };
  };
  CheckoutSessionDayHours: {
    kind: 'OBJECT';
    name: 'CheckoutSessionDayHours';
    fields: {
      closeTime: {
        name: 'closeTime';
        type: { kind: 'SCALAR'; name: 'String'; ofType: null };
      };
      enabled: {
        name: 'enabled';
        type: {
          kind: 'NON_NULL';
          name: never;
          ofType: { kind: 'SCALAR'; name: 'Boolean'; ofType: null };
        };
      };
      openTime: {
        name: 'openTime';
        type: { kind: 'SCALAR'; name: 'String'; ofType: null };
      };
    };
  };
  CheckoutSessionDayHoursInput: {
    kind: 'INPUT_OBJECT';
    name: 'CheckoutSessionDayHoursInput';
    isOneOf: false;
    inputFields: [
      {
        name: 'closeTime';
        type: { kind: 'SCALAR'; name: 'String'; ofType: null };
        defaultValue: null;
      },
      {
        name: 'enabled';
        type: {
          kind: 'NON_NULL';
          name: never;
          ofType: { kind: 'SCALAR'; name: 'Boolean'; ofType: null };
        };
        defaultValue: null;
      },
      {
        name: 'openTime';
        type: { kind: 'SCALAR'; name: 'String'; ofType: null };
        defaultValue: null;
      },
    ];
  };
  CheckoutSessionEnvironment: {
    name: 'CheckoutSessionEnvironment';
    enumValues: 'dev' | 'ote' | 'prod' | 'test';
  };
  CheckoutSessionExperimentalRules: {
    kind: 'OBJECT';
    name: 'CheckoutSessionExperimentalRules';
    fields: {
      freeShipping: {
        name: 'freeShipping';
        type: {
          kind: 'OBJECT';
          name: 'CheckoutSessionFreeShippingRule';
          ofType: null;
        };
      };
      localDelivery: {
        name: 'localDelivery';
        type: {
          kind: 'OBJECT';
          name: 'CheckoutSessionLocalDeliveryRule';
          ofType: null;
        };
      };
    };
  };
  CheckoutSessionExperimentalRulesInput: {
    kind: 'INPUT_OBJECT';
    name: 'CheckoutSessionExperimentalRulesInput';
    isOneOf: false;
    inputFields: [
      {
        name: 'freeShipping';
        type: {
          kind: 'INPUT_OBJECT';
          name: 'CheckoutSessionFreeShippingRuleInput';
          ofType: null;
        };
        defaultValue: null;
      },
    ];
  };
  CheckoutSessionFreeShippingRule: {
    kind: 'OBJECT';
    name: 'CheckoutSessionFreeShippingRule';
    fields: {
      enabled: {
        name: 'enabled';
        type: {
          kind: 'NON_NULL';
          name: never;
          ofType: { kind: 'SCALAR'; name: 'Boolean'; ofType: null };
        };
      };
      minimumOrderTotal: {
        name: 'minimumOrderTotal';
        type: {
          kind: 'NON_NULL';
          name: never;
          ofType: { kind: 'SCALAR'; name: 'Int'; ofType: null };
        };
      };
    };
  };
  CheckoutSessionFreeShippingRuleInput: {
    kind: 'INPUT_OBJECT';
    name: 'CheckoutSessionFreeShippingRuleInput';
    isOneOf: false;
    inputFields: [
      {
        name: 'enabled';
        type: {
          kind: 'NON_NULL';
          name: never;
          ofType: { kind: 'SCALAR'; name: 'Boolean'; ofType: null };
        };
        defaultValue: null;
      },
      {
        name: 'minimumOrderTotal';
        type: {
          kind: 'NON_NULL';
          name: never;
          ofType: { kind: 'SCALAR'; name: 'Int'; ofType: null };
        };
        defaultValue: null;
      },
    ];
  };
  CheckoutSessionGeoCoordinatesInput: {
    kind: 'INPUT_OBJECT';
    name: 'CheckoutSessionGeoCoordinatesInput';
    isOneOf: false;
    inputFields: [
      {
        name: 'latitude';
        type: {
          kind: 'NON_NULL';
          name: never;
          ofType: { kind: 'SCALAR'; name: 'Float'; ofType: null };
        };
        defaultValue: null;
      },
      {
        name: 'longitude';
        type: {
          kind: 'NON_NULL';
          name: never;
          ofType: { kind: 'SCALAR'; name: 'Float'; ofType: null };
        };
        defaultValue: null;
      },
    ];
  };
  CheckoutSessionLocalDeliveryRule: {
    kind: 'OBJECT';
    name: 'CheckoutSessionLocalDeliveryRule';
    fields: {
      enabled: {
        name: 'enabled';
        type: {
          kind: 'NON_NULL';
          name: never;
          ofType: { kind: 'SCALAR'; name: 'Boolean'; ofType: null };
        };
      };
      minimumOrderTotal: {
        name: 'minimumOrderTotal';
        type: {
          kind: 'NON_NULL';
          name: never;
          ofType: { kind: 'SCALAR'; name: 'Int'; ofType: null };
        };
      };
    };
  };
  CheckoutSessionLocation: {
    kind: 'OBJECT';
    name: 'CheckoutSessionLocation';
    fields: {
      address: {
        name: 'address';
        type: {
          kind: 'NON_NULL';
          name: never;
          ofType: {
            kind: 'OBJECT';
            name: 'CheckoutSessionAddress';
            ofType: null;
          };
        };
      };
      id: {
        name: 'id';
        type: {
          kind: 'NON_NULL';
          name: never;
          ofType: { kind: 'SCALAR'; name: 'String'; ofType: null };
        };
      };
      isDefault: {
        name: 'isDefault';
        type: {
          kind: 'NON_NULL';
          name: never;
          ofType: { kind: 'SCALAR'; name: 'Boolean'; ofType: null };
        };
      };
      operatingHours: {
        name: 'operatingHours';
        type: {
          kind: 'OBJECT';
          name: 'CheckoutSessionStoreHours';
          ofType: null;
        };
      };
    };
  };
  CheckoutSessionLocationInput: {
    kind: 'INPUT_OBJECT';
    name: 'CheckoutSessionLocationInput';
    isOneOf: false;
    inputFields: [
      {
        name: 'address';
        type: {
          kind: 'NON_NULL';
          name: never;
          ofType: {
            kind: 'INPUT_OBJECT';
            name: 'CheckoutSessionAddressInput';
            ofType: null;
          };
        };
        defaultValue: null;
      },
      {
        name: 'id';
        type: {
          kind: 'NON_NULL';
          name: never;
          ofType: { kind: 'SCALAR'; name: 'String'; ofType: null };
        };
        defaultValue: null;
      },
      {
        name: 'isDefault';
        type: {
          kind: 'NON_NULL';
          name: never;
          ofType: { kind: 'SCALAR'; name: 'Boolean'; ofType: null };
        };
        defaultValue: null;
      },
    ];
  };
  CheckoutSessionOperatingHoursMap: {
    kind: 'OBJECT';
    name: 'CheckoutSessionOperatingHoursMap';
    fields: {
      default: {
        name: 'default';
        type: {
          kind: 'OBJECT';
          name: 'CheckoutSessionStoreHours';
          ofType: null;
        };
      };
      locations: {
        name: 'locations';
        type: {
          kind: 'LIST';
          name: never;
          ofType: {
            kind: 'NON_NULL';
            name: never;
            ofType: {
              kind: 'OBJECT';
              name: 'CheckoutSessionStoreHours';
              ofType: null;
            };
          };
        };
      };
    };
  };
  CheckoutSessionOperatingHoursMapInput: {
    kind: 'INPUT_OBJECT';
    name: 'CheckoutSessionOperatingHoursMapInput';
    isOneOf: false;
    inputFields: [
      {
        name: 'default';
        type: {
          kind: 'NON_NULL';
          name: never;
          ofType: {
            kind: 'INPUT_OBJECT';
            name: 'CheckoutSessionStoreHoursInput';
            ofType: null;
          };
        };
        defaultValue: null;
      },
    ];
  };
  CheckoutSessionPaymentMethodConfig: {
    kind: 'OBJECT';
    name: 'CheckoutSessionPaymentMethodConfig';
    fields: {
      checkoutTypes: {
        name: 'checkoutTypes';
        type: {
          kind: 'NON_NULL';
          name: never;
          ofType: {
            kind: 'LIST';
            name: never;
            ofType: {
              kind: 'NON_NULL';
              name: never;
              ofType: { kind: 'SCALAR'; name: 'String'; ofType: null };
            };
          };
        };
      };
      processor: {
        name: 'processor';
        type: {
          kind: 'NON_NULL';
          name: never;
          ofType: { kind: 'SCALAR'; name: 'String'; ofType: null };
        };
      };
    };
  };
  CheckoutSessionPaymentMethodConfigInput: {
    kind: 'INPUT_OBJECT';
    name: 'CheckoutSessionPaymentMethodConfigInput';
    isOneOf: false;
    inputFields: [
      {
        name: 'checkoutTypes';
        type: {
          kind: 'NON_NULL';
          name: never;
          ofType: {
            kind: 'LIST';
            name: never;
            ofType: {
              kind: 'NON_NULL';
              name: never;
              ofType: { kind: 'SCALAR'; name: 'String'; ofType: null };
            };
          };
        };
        defaultValue: null;
      },
      {
        name: 'processor';
        type: {
          kind: 'NON_NULL';
          name: never;
          ofType: { kind: 'SCALAR'; name: 'String'; ofType: null };
        };
        defaultValue: null;
      },
    ];
  };
  CheckoutSessionPaymentMethods: {
    kind: 'OBJECT';
    name: 'CheckoutSessionPaymentMethods';
    fields: {
      applePay: {
        name: 'applePay';
        type: {
          kind: 'OBJECT';
          name: 'CheckoutSessionPaymentMethodConfig';
          ofType: null;
        };
      };
      card: {
        name: 'card';
        type: {
          kind: 'OBJECT';
          name: 'CheckoutSessionPaymentMethodConfig';
          ofType: null;
        };
      };
      express: {
        name: 'express';
        type: {
          kind: 'OBJECT';
          name: 'CheckoutSessionPaymentMethodConfig';
          ofType: null;
        };
      };
      googlePay: {
        name: 'googlePay';
        type: {
          kind: 'OBJECT';
          name: 'CheckoutSessionPaymentMethodConfig';
          ofType: null;
        };
      };
      offline: {
        name: 'offline';
        type: {
          kind: 'OBJECT';
          name: 'CheckoutSessionPaymentMethodConfig';
          ofType: null;
        };
      };
      paypal: {
        name: 'paypal';
        type: {
          kind: 'OBJECT';
          name: 'CheckoutSessionPaymentMethodConfig';
          ofType: null;
        };
      };
      paze: {
        name: 'paze';
        type: {
          kind: 'OBJECT';
          name: 'CheckoutSessionPaymentMethodConfig';
          ofType: null;
        };
      };
    };
  };
  CheckoutSessionPaymentMethodsInput: {
    kind: 'INPUT_OBJECT';
    name: 'CheckoutSessionPaymentMethodsInput';
    isOneOf: false;
    inputFields: [
      {
        name: 'applePay';
        type: {
          kind: 'INPUT_OBJECT';
          name: 'CheckoutSessionPaymentMethodConfigInput';
          ofType: null;
        };
        defaultValue: null;
      },
      {
        name: 'card';
        type: {
          kind: 'INPUT_OBJECT';
          name: 'CheckoutSessionPaymentMethodConfigInput';
          ofType: null;
        };
        defaultValue: null;
      },
      {
        name: 'express';
        type: {
          kind: 'INPUT_OBJECT';
          name: 'CheckoutSessionPaymentMethodConfigInput';
          ofType: null;
        };
        defaultValue: null;
      },
      {
        name: 'googlePay';
        type: {
          kind: 'INPUT_OBJECT';
          name: 'CheckoutSessionPaymentMethodConfigInput';
          ofType: null;
        };
        defaultValue: null;
      },
      {
        name: 'offline';
        type: {
          kind: 'INPUT_OBJECT';
          name: 'CheckoutSessionPaymentMethodConfigInput';
          ofType: null;
        };
        defaultValue: null;
      },
      {
        name: 'paypal';
        type: {
          kind: 'INPUT_OBJECT';
          name: 'CheckoutSessionPaymentMethodConfigInput';
          ofType: null;
        };
        defaultValue: null;
      },
      {
        name: 'paze';
        type: {
          kind: 'INPUT_OBJECT';
          name: 'CheckoutSessionPaymentMethodConfigInput';
          ofType: null;
        };
        defaultValue: null;
      },
    ];
  };
  CheckoutSessionShippingOptions: {
    kind: 'OBJECT';
    name: 'CheckoutSessionShippingOptions';
    fields: {
      fulfillmentLocationId: {
        name: 'fulfillmentLocationId';
        type: { kind: 'SCALAR'; name: 'String'; ofType: null };
      };
      originAddress: {
        name: 'originAddress';
        type: { kind: 'OBJECT'; name: 'CheckoutSessionAddress'; ofType: null };
      };
    };
  };
  CheckoutSessionShippingOptionsInput: {
    kind: 'INPUT_OBJECT';
    name: 'CheckoutSessionShippingOptionsInput';
    isOneOf: false;
    inputFields: [
      {
        name: 'fulfillmentLocationId';
        type: { kind: 'SCALAR'; name: 'String'; ofType: null };
        defaultValue: null;
      },
      {
        name: 'originAddress';
        type: {
          kind: 'INPUT_OBJECT';
          name: 'CheckoutSessionAddressInput';
          ofType: null;
        };
        defaultValue: null;
      },
    ];
  };
  CheckoutSessionSkusConnection: {
    kind: 'OBJECT';
    name: 'CheckoutSessionSkusConnection';
    fields: {
      edges: {
        name: 'edges';
        type: {
          kind: 'LIST';
          name: never;
          ofType: {
            kind: 'OBJECT';
            name: 'CheckoutSessionSkusConnectionEdge';
            ofType: null;
          };
        };
      };
      pageInfo: {
        name: 'pageInfo';
        type: {
          kind: 'NON_NULL';
          name: never;
          ofType: { kind: 'OBJECT'; name: 'PageInfo'; ofType: null };
        };
      };
    };
  };
  CheckoutSessionSkusConnectionEdge: {
    kind: 'OBJECT';
    name: 'CheckoutSessionSkusConnectionEdge';
    fields: {
      cursor: {
        name: 'cursor';
        type: {
          kind: 'NON_NULL';
          name: never;
          ofType: { kind: 'SCALAR'; name: 'String'; ofType: null };
        };
      };
      node: {
        name: 'node';
        type: { kind: 'OBJECT'; name: 'SKU'; ofType: null };
      };
    };
  };
  CheckoutSessionStatus: {
    name: 'CheckoutSessionStatus';
    enumValues: 'ACTIVE' | 'CANCELLED' | 'COMPLETED' | 'CREATED' | 'EXPIRED';
  };
  CheckoutSessionStoreHours: {
    kind: 'OBJECT';
    name: 'CheckoutSessionStoreHours';
    fields: {
      hours: {
        name: 'hours';
        type: {
          kind: 'NON_NULL';
          name: never;
          ofType: {
            kind: 'OBJECT';
            name: 'CheckoutSessionWeekHours';
            ofType: null;
          };
        };
      };
      leadTime: {
        name: 'leadTime';
        type: {
          kind: 'NON_NULL';
          name: never;
          ofType: { kind: 'SCALAR'; name: 'Int'; ofType: null };
        };
      };
      pickupWindowInDays: {
        name: 'pickupWindowInDays';
        type: {
          kind: 'NON_NULL';
          name: never;
          ofType: { kind: 'SCALAR'; name: 'Int'; ofType: null };
        };
      };
      timeZone: {
        name: 'timeZone';
        type: {
          kind: 'NON_NULL';
          name: never;
          ofType: { kind: 'SCALAR'; name: 'String'; ofType: null };
        };
      };
    };
  };
  CheckoutSessionStoreHoursInput: {
    kind: 'INPUT_OBJECT';
    name: 'CheckoutSessionStoreHoursInput';
    isOneOf: false;
    inputFields: [
      {
        name: 'hours';
        type: {
          kind: 'NON_NULL';
          name: never;
          ofType: {
            kind: 'INPUT_OBJECT';
            name: 'CheckoutSessionWeekHoursInput';
            ofType: null;
          };
        };
        defaultValue: null;
      },
      {
        name: 'leadTime';
        type: {
          kind: 'NON_NULL';
          name: never;
          ofType: { kind: 'SCALAR'; name: 'Int'; ofType: null };
        };
        defaultValue: null;
      },
      {
        name: 'pickupWindowInDays';
        type: { kind: 'SCALAR'; name: 'Int'; ofType: null };
        defaultValue: null;
      },
      {
        name: 'timeZone';
        type: {
          kind: 'NON_NULL';
          name: never;
          ofType: { kind: 'SCALAR'; name: 'String'; ofType: null };
        };
        defaultValue: null;
      },
    ];
  };
  CheckoutSessionTaxAmount: {
    kind: 'OBJECT';
    name: 'CheckoutSessionTaxAmount';
    fields: {
      rate: {
        name: 'rate';
        type: {
          kind: 'OBJECT';
          name: 'CheckoutSessionCalculatedRate';
          ofType: null;
        };
      };
      totalTaxAmount: {
        name: 'totalTaxAmount';
        type: {
          kind: 'OBJECT';
          name: 'CheckoutSessionTotalTaxAmount';
          ofType: null;
        };
      };
    };
  };
  CheckoutSessionTaxesOptions: {
    kind: 'OBJECT';
    name: 'CheckoutSessionTaxesOptions';
    fields: {
      originAddress: {
        name: 'originAddress';
        type: { kind: 'OBJECT'; name: 'CheckoutSessionAddress'; ofType: null };
      };
    };
  };
  CheckoutSessionTaxesOptionsInput: {
    kind: 'INPUT_OBJECT';
    name: 'CheckoutSessionTaxesOptionsInput';
    isOneOf: false;
    inputFields: [
      {
        name: 'originAddress';
        type: {
          kind: 'INPUT_OBJECT';
          name: 'CheckoutSessionAddressInput';
          ofType: null;
        };
        defaultValue: null;
      },
    ];
  };
  CheckoutSessionTotalTaxAmount: {
    kind: 'OBJECT';
    name: 'CheckoutSessionTotalTaxAmount';
    fields: {
      currencyCode: {
        name: 'currencyCode';
        type: { kind: 'SCALAR'; name: 'String'; ofType: null };
      };
      value: {
        name: 'value';
        type: { kind: 'SCALAR'; name: 'Float'; ofType: null };
      };
    };
  };
  CheckoutSessionWeekHours: {
    kind: 'OBJECT';
    name: 'CheckoutSessionWeekHours';
    fields: {
      friday: {
        name: 'friday';
        type: { kind: 'OBJECT'; name: 'CheckoutSessionDayHours'; ofType: null };
      };
      monday: {
        name: 'monday';
        type: { kind: 'OBJECT'; name: 'CheckoutSessionDayHours'; ofType: null };
      };
      saturday: {
        name: 'saturday';
        type: { kind: 'OBJECT'; name: 'CheckoutSessionDayHours'; ofType: null };
      };
      sunday: {
        name: 'sunday';
        type: { kind: 'OBJECT'; name: 'CheckoutSessionDayHours'; ofType: null };
      };
      thursday: {
        name: 'thursday';
        type: { kind: 'OBJECT'; name: 'CheckoutSessionDayHours'; ofType: null };
      };
      tuesday: {
        name: 'tuesday';
        type: { kind: 'OBJECT'; name: 'CheckoutSessionDayHours'; ofType: null };
      };
      wednesday: {
        name: 'wednesday';
        type: { kind: 'OBJECT'; name: 'CheckoutSessionDayHours'; ofType: null };
      };
    };
  };
  CheckoutSessionWeekHoursInput: {
    kind: 'INPUT_OBJECT';
    name: 'CheckoutSessionWeekHoursInput';
    isOneOf: false;
    inputFields: [
      {
        name: 'friday';
        type: {
          kind: 'INPUT_OBJECT';
          name: 'CheckoutSessionDayHoursInput';
          ofType: null;
        };
        defaultValue: null;
      },
      {
        name: 'monday';
        type: {
          kind: 'INPUT_OBJECT';
          name: 'CheckoutSessionDayHoursInput';
          ofType: null;
        };
        defaultValue: null;
      },
      {
        name: 'saturday';
        type: {
          kind: 'INPUT_OBJECT';
          name: 'CheckoutSessionDayHoursInput';
          ofType: null;
        };
        defaultValue: null;
      },
      {
        name: 'sunday';
        type: {
          kind: 'INPUT_OBJECT';
          name: 'CheckoutSessionDayHoursInput';
          ofType: null;
        };
        defaultValue: null;
      },
      {
        name: 'thursday';
        type: {
          kind: 'INPUT_OBJECT';
          name: 'CheckoutSessionDayHoursInput';
          ofType: null;
        };
        defaultValue: null;
      },
      {
        name: 'tuesday';
        type: {
          kind: 'INPUT_OBJECT';
          name: 'CheckoutSessionDayHoursInput';
          ofType: null;
        };
        defaultValue: null;
      },
      {
        name: 'wednesday';
        type: {
          kind: 'INPUT_OBJECT';
          name: 'CheckoutSessionDayHoursInput';
          ofType: null;
        };
        defaultValue: null;
      },
    ];
  };
  ConfirmCheckoutBillingInfoInput: {
    kind: 'INPUT_OBJECT';
    name: 'ConfirmCheckoutBillingInfoInput';
    isOneOf: false;
    inputFields: [
      {
        name: 'address';
        type: {
          kind: 'INPUT_OBJECT';
          name: 'ConfirmCheckoutDestinationAddressInput';
          ofType: null;
        };
        defaultValue: null;
      },
      {
        name: 'companyName';
        type: { kind: 'SCALAR'; name: 'String'; ofType: null };
        defaultValue: null;
      },
      {
        name: 'email';
        type: { kind: 'SCALAR'; name: 'String'; ofType: null };
        defaultValue: null;
      },
      {
        name: 'firstName';
        type: { kind: 'SCALAR'; name: 'String'; ofType: null };
        defaultValue: null;
      },
      {
        name: 'lastName';
        type: { kind: 'SCALAR'; name: 'String'; ofType: null };
        defaultValue: null;
      },
      {
        name: 'phone';
        type: { kind: 'SCALAR'; name: 'String'; ofType: null };
        defaultValue: null;
      },
    ];
  };
  ConfirmCheckoutDestinationAddressInput: {
    kind: 'INPUT_OBJECT';
    name: 'ConfirmCheckoutDestinationAddressInput';
    isOneOf: false;
    inputFields: [
      {
        name: 'addressLine1';
        type: { kind: 'SCALAR'; name: 'String'; ofType: null };
        defaultValue: null;
      },
      {
        name: 'addressLine2';
        type: { kind: 'SCALAR'; name: 'String'; ofType: null };
        defaultValue: null;
      },
      {
        name: 'addressLine3';
        type: { kind: 'SCALAR'; name: 'String'; ofType: null };
        defaultValue: null;
      },
      {
        name: 'adminArea1';
        type: { kind: 'SCALAR'; name: 'String'; ofType: null };
        defaultValue: null;
      },
      {
        name: 'adminArea2';
        type: { kind: 'SCALAR'; name: 'String'; ofType: null };
        defaultValue: null;
      },
      {
        name: 'adminArea3';
        type: { kind: 'SCALAR'; name: 'String'; ofType: null };
        defaultValue: null;
      },
      {
        name: 'adminArea4';
        type: { kind: 'SCALAR'; name: 'String'; ofType: null };
        defaultValue: null;
      },
      {
        name: 'countryCode';
        type: {
          kind: 'NON_NULL';
          name: never;
          ofType: { kind: 'SCALAR'; name: 'String'; ofType: null };
        };
        defaultValue: null;
      },
      {
        name: 'postalCode';
        type: {
          kind: 'NON_NULL';
          name: never;
          ofType: { kind: 'SCALAR'; name: 'String'; ofType: null };
        };
        defaultValue: null;
      },
    ];
  };
  ConfirmCheckoutShippingInfoInput: {
    kind: 'INPUT_OBJECT';
    name: 'ConfirmCheckoutShippingInfoInput';
    isOneOf: false;
    inputFields: [
      {
        name: 'address';
        type: {
          kind: 'INPUT_OBJECT';
          name: 'ConfirmCheckoutDestinationAddressInput';
          ofType: null;
        };
        defaultValue: null;
      },
      {
        name: 'companyName';
        type: { kind: 'SCALAR'; name: 'String'; ofType: null };
        defaultValue: null;
      },
      {
        name: 'email';
        type: { kind: 'SCALAR'; name: 'String'; ofType: null };
        defaultValue: null;
      },
      {
        name: 'firstName';
        type: { kind: 'SCALAR'; name: 'String'; ofType: null };
        defaultValue: null;
      },
      {
        name: 'lastName';
        type: { kind: 'SCALAR'; name: 'String'; ofType: null };
        defaultValue: null;
      },
      {
        name: 'phone';
        type: { kind: 'SCALAR'; name: 'String'; ofType: null };
        defaultValue: null;
      },
    ];
  };
  ConfirmCheckoutShippingLineInput: {
    kind: 'INPUT_OBJECT';
    name: 'ConfirmCheckoutShippingLineInput';
    isOneOf: false;
    inputFields: [
      {
        name: 'amount';
        type: {
          kind: 'NON_NULL';
          name: never;
          ofType: { kind: 'INPUT_OBJECT'; name: 'MoneyInput'; ofType: null };
        };
        defaultValue: null;
      },
      {
        name: 'name';
        type: {
          kind: 'NON_NULL';
          name: never;
          ofType: { kind: 'SCALAR'; name: 'String'; ofType: null };
        };
        defaultValue: null;
      },
      {
        name: 'requestedProvider';
        type: { kind: 'SCALAR'; name: 'String'; ofType: null };
        defaultValue: null;
      },
      {
        name: 'requestedService';
        type: { kind: 'SCALAR'; name: 'String'; ofType: null };
        defaultValue: null;
      },
      {
        name: 'taxes';
        type: {
          kind: 'LIST';
          name: never;
          ofType: {
            kind: 'NON_NULL';
            name: never;
            ofType: {
              kind: 'INPUT_OBJECT';
              name: 'ConfirmCheckoutTaxInput';
              ofType: null;
            };
          };
        };
        defaultValue: null;
      },
      {
        name: 'totals';
        type: {
          kind: 'NON_NULL';
          name: never;
          ofType: {
            kind: 'INPUT_OBJECT';
            name: 'ConfirmCheckoutShippingLineTotalsInput';
            ofType: null;
          };
        };
        defaultValue: null;
      },
    ];
  };
  ConfirmCheckoutShippingLineTotalsInput: {
    kind: 'INPUT_OBJECT';
    name: 'ConfirmCheckoutShippingLineTotalsInput';
    isOneOf: false;
    inputFields: [
      {
        name: 'subTotal';
        type: {
          kind: 'NON_NULL';
          name: never;
          ofType: { kind: 'INPUT_OBJECT'; name: 'MoneyInput'; ofType: null };
        };
        defaultValue: null;
      },
      {
        name: 'taxTotal';
        type: {
          kind: 'NON_NULL';
          name: never;
          ofType: { kind: 'INPUT_OBJECT'; name: 'MoneyInput'; ofType: null };
        };
        defaultValue: null;
      },
    ];
  };
  ConfirmCheckoutTaxInput: {
    kind: 'INPUT_OBJECT';
    name: 'ConfirmCheckoutTaxInput';
    isOneOf: false;
    inputFields: [
      {
        name: 'amount';
        type: {
          kind: 'NON_NULL';
          name: never;
          ofType: { kind: 'INPUT_OBJECT'; name: 'MoneyInput'; ofType: null };
        };
        defaultValue: null;
      },
      {
        name: 'exempted';
        type: { kind: 'SCALAR'; name: 'Boolean'; ofType: null };
        defaultValue: null;
      },
      {
        name: 'included';
        type: { kind: 'SCALAR'; name: 'Boolean'; ofType: null };
        defaultValue: null;
      },
      {
        name: 'name';
        type: {
          kind: 'NON_NULL';
          name: never;
          ofType: { kind: 'SCALAR'; name: 'String'; ofType: null };
        };
        defaultValue: null;
      },
      {
        name: 'ratePercentage';
        type: { kind: 'SCALAR'; name: 'String'; ofType: null };
        defaultValue: null;
      },
    ];
  };
  ContactInput: {
    kind: 'INPUT_OBJECT';
    name: 'ContactInput';
    isOneOf: false;
    inputFields: [
      {
        name: 'address';
        type: {
          kind: 'NON_NULL';
          name: never;
          ofType: {
            kind: 'INPUT_OBJECT';
            name: 'DraftOrderAddressInput';
            ofType: null;
          };
        };
        defaultValue: null;
      },
      {
        name: 'companyName';
        type: { kind: 'SCALAR'; name: 'String'; ofType: null };
        defaultValue: null;
      },
      {
        name: 'email';
        type: { kind: 'SCALAR'; name: 'String'; ofType: null };
        defaultValue: null;
      },
      {
        name: 'firstName';
        type: {
          kind: 'NON_NULL';
          name: never;
          ofType: { kind: 'SCALAR'; name: 'String'; ofType: null };
        };
        defaultValue: null;
      },
      {
        name: 'lastName';
        type: {
          kind: 'NON_NULL';
          name: never;
          ofType: { kind: 'SCALAR'; name: 'String'; ofType: null };
        };
        defaultValue: null;
      },
      {
        name: 'phone';
        type: { kind: 'SCALAR'; name: 'String'; ofType: null };
        defaultValue: null;
      },
    ];
  };
  CreateDraftLineItemInput: {
    kind: 'INPUT_OBJECT';
    name: 'CreateDraftLineItemInput';
    isOneOf: false;
    inputFields: [
      {
        name: 'details';
        type: {
          kind: 'INPUT_OBJECT';
          name: 'LineItemInputDetailsInfo';
          ofType: null;
        };
        defaultValue: null;
      },
      {
        name: 'discounts';
        type: {
          kind: 'LIST';
          name: never;
          ofType: {
            kind: 'NON_NULL';
            name: never;
            ofType: {
              kind: 'INPUT_OBJECT';
              name: 'DiscountInput';
              ofType: null;
            };
          };
        };
        defaultValue: null;
      },
      {
        name: 'externalId';
        type: { kind: 'SCALAR'; name: 'String'; ofType: null };
        defaultValue: null;
      },
      {
        name: 'fees';
        type: {
          kind: 'LIST';
          name: never;
          ofType: {
            kind: 'NON_NULL';
            name: never;
            ofType: { kind: 'INPUT_OBJECT'; name: 'FeeInput'; ofType: null };
          };
        };
        defaultValue: null;
      },
      {
        name: 'fulfillmentChannelId';
        type: { kind: 'SCALAR'; name: 'String'; ofType: null };
        defaultValue: null;
      },
      {
        name: 'fulfillmentMode';
        type: {
          kind: 'NON_NULL';
          name: never;
          ofType: { kind: 'ENUM'; name: 'LineItemModeInput'; ofType: null };
        };
        defaultValue: null;
      },
      {
        name: 'id';
        type: { kind: 'SCALAR'; name: 'String'; ofType: null };
        defaultValue: null;
      },
      {
        name: 'metafields';
        type: {
          kind: 'LIST';
          name: never;
          ofType: {
            kind: 'NON_NULL';
            name: never;
            ofType: {
              kind: 'INPUT_OBJECT';
              name: 'OrderMetafieldInput';
              ofType: null;
            };
          };
        };
        defaultValue: null;
      },
      {
        name: 'name';
        type: {
          kind: 'NON_NULL';
          name: never;
          ofType: { kind: 'SCALAR'; name: 'String'; ofType: null };
        };
        defaultValue: null;
      },
      {
        name: 'notes';
        type: {
          kind: 'LIST';
          name: never;
          ofType: {
            kind: 'NON_NULL';
            name: never;
            ofType: { kind: 'INPUT_OBJECT'; name: 'NoteInput'; ofType: null };
          };
        };
        defaultValue: '[]';
      },
      {
        name: 'productId';
        type: { kind: 'SCALAR'; name: 'String'; ofType: null };
        defaultValue: null;
      },
      {
        name: 'quantity';
        type: {
          kind: 'NON_NULL';
          name: never;
          ofType: { kind: 'SCALAR'; name: 'Float'; ofType: null };
        };
        defaultValue: null;
      },
      {
        name: 'serviceEndsAt';
        type: { kind: 'SCALAR'; name: 'DateTime'; ofType: null };
        defaultValue: null;
      },
      {
        name: 'serviceStartAt';
        type: { kind: 'SCALAR'; name: 'DateTime'; ofType: null };
        defaultValue: null;
      },
      {
        name: 'shipping';
        type: {
          kind: 'INPUT_OBJECT';
          name: 'LineItemInputShippingInfo';
          ofType: null;
        };
        defaultValue: null;
      },
      {
        name: 'skuId';
        type: { kind: 'SCALAR'; name: 'String'; ofType: null };
        defaultValue: null;
      },
      {
        name: 'tags';
        type: {
          kind: 'LIST';
          name: never;
          ofType: {
            kind: 'NON_NULL';
            name: never;
            ofType: { kind: 'SCALAR'; name: 'String'; ofType: null };
          };
        };
        defaultValue: null;
      },
      {
        name: 'taxes';
        type: {
          kind: 'LIST';
          name: never;
          ofType: {
            kind: 'NON_NULL';
            name: never;
            ofType: { kind: 'INPUT_OBJECT'; name: 'TaxInput'; ofType: null };
          };
        };
        defaultValue: null;
      },
      {
        name: 'totals';
        type: {
          kind: 'NON_NULL';
          name: never;
          ofType: {
            kind: 'INPUT_OBJECT';
            name: 'LineItemTotalsInput';
            ofType: null;
          };
        };
        defaultValue: null;
      },
      {
        name: 'type';
        type: { kind: 'ENUM'; name: 'LineItemTypesInput'; ofType: null };
        defaultValue: 'PHYSICAL';
      },
      {
        name: 'unitAmount';
        type: {
          kind: 'NON_NULL';
          name: never;
          ofType: { kind: 'INPUT_OBJECT'; name: 'MoneyInput'; ofType: null };
        };
        defaultValue: null;
      },
    ];
  };
  DateTime: unknown;
  DestinationAddressInput: {
    kind: 'INPUT_OBJECT';
    name: 'DestinationAddressInput';
    isOneOf: false;
    inputFields: [
      {
        name: 'addressLine1';
        type: { kind: 'SCALAR'; name: 'String'; ofType: null };
        defaultValue: null;
      },
      {
        name: 'addressLine2';
        type: { kind: 'SCALAR'; name: 'String'; ofType: null };
        defaultValue: null;
      },
      {
        name: 'addressLine3';
        type: { kind: 'SCALAR'; name: 'String'; ofType: null };
        defaultValue: null;
      },
      {
        name: 'adminArea1';
        type: { kind: 'SCALAR'; name: 'String'; ofType: null };
        defaultValue: null;
      },
      {
        name: 'adminArea2';
        type: { kind: 'SCALAR'; name: 'String'; ofType: null };
        defaultValue: null;
      },
      {
        name: 'adminArea3';
        type: { kind: 'SCALAR'; name: 'String'; ofType: null };
        defaultValue: null;
      },
      {
        name: 'adminArea4';
        type: { kind: 'SCALAR'; name: 'String'; ofType: null };
        defaultValue: null;
      },
      {
        name: 'countryCode';
        type: {
          kind: 'NON_NULL';
          name: never;
          ofType: { kind: 'SCALAR'; name: 'String'; ofType: null };
        };
        defaultValue: null;
      },
      {
        name: 'postalCode';
        type: {
          kind: 'NON_NULL';
          name: never;
          ofType: { kind: 'SCALAR'; name: 'String'; ofType: null };
        };
        defaultValue: null;
      },
    ];
  };
  DiscountInput: {
    kind: 'INPUT_OBJECT';
    name: 'DiscountInput';
    isOneOf: false;
    inputFields: [
      {
        name: 'amount';
        type: {
          kind: 'NON_NULL';
          name: never;
          ofType: { kind: 'INPUT_OBJECT'; name: 'MoneyInput'; ofType: null };
        };
        defaultValue: null;
      },
      {
        name: 'appliedBeforeTax';
        type: { kind: 'SCALAR'; name: 'Boolean'; ofType: null };
        defaultValue: 'false';
      },
      {
        name: 'code';
        type: { kind: 'SCALAR'; name: 'String'; ofType: null };
        defaultValue: null;
      },
      {
        name: 'externalIds';
        type: {
          kind: 'LIST';
          name: never;
          ofType: {
            kind: 'NON_NULL';
            name: never;
            ofType: {
              kind: 'INPUT_OBJECT';
              name: 'ExternalIdsInput';
              ofType: null;
            };
          };
        };
        defaultValue: null;
      },
      {
        name: 'metafields';
        type: {
          kind: 'LIST';
          name: never;
          ofType: {
            kind: 'NON_NULL';
            name: never;
            ofType: {
              kind: 'INPUT_OBJECT';
              name: 'OrderMetafieldInput';
              ofType: null;
            };
          };
        };
        defaultValue: null;
      },
      {
        name: 'name';
        type: {
          kind: 'NON_NULL';
          name: never;
          ofType: { kind: 'SCALAR'; name: 'String'; ofType: null };
        };
        defaultValue: null;
      },
      {
        name: 'ratePercentage';
        type: { kind: 'SCALAR'; name: 'String'; ofType: null };
        defaultValue: null;
      },
      {
        name: 'referenceId';
        type: { kind: 'SCALAR'; name: 'String'; ofType: null };
        defaultValue: null;
      },
    ];
  };
  DraftOrder: {
    kind: 'OBJECT';
    name: 'DraftOrder';
    fields: {
      billing: {
        name: 'billing';
        type: { kind: 'OBJECT'; name: 'DraftOrderContact'; ofType: null };
      };
      calculatedAdjustments: {
        name: 'calculatedAdjustments';
        type: {
          kind: 'OBJECT';
          name: 'PriceAdjustmentsCalculationResult';
          ofType: null;
        };
      };
      calculatedShippingRates: {
        name: 'calculatedShippingRates';
        type: {
          kind: 'OBJECT';
          name: 'ShippingRateCalculationResult';
          ofType: null;
        };
      };
      calculatedTaxes: {
        name: 'calculatedTaxes';
        type: {
          kind: 'OBJECT';
          name: 'CheckoutSessionCalculationResult';
          ofType: null;
        };
      };
      cartId: {
        name: 'cartId';
        type: { kind: 'SCALAR'; name: 'String'; ofType: null };
      };
      context: {
        name: 'context';
        type: { kind: 'OBJECT'; name: 'DraftOrderContext'; ofType: null };
      };
      createdAt: {
        name: 'createdAt';
        type: { kind: 'SCALAR'; name: 'DateTime'; ofType: null };
      };
      customerId: {
        name: 'customerId';
        type: { kind: 'SCALAR'; name: 'String'; ofType: null };
      };
      discounts: {
        name: 'discounts';
        type: {
          kind: 'LIST';
          name: never;
          ofType: {
            kind: 'NON_NULL';
            name: never;
            ofType: { kind: 'OBJECT'; name: 'LineItemDiscount'; ofType: null };
          };
        };
      };
      externalId: {
        name: 'externalId';
        type: { kind: 'SCALAR'; name: 'String'; ofType: null };
      };
      fees: {
        name: 'fees';
        type: {
          kind: 'LIST';
          name: never;
          ofType: {
            kind: 'NON_NULL';
            name: never;
            ofType: { kind: 'OBJECT'; name: 'LineItemFee'; ofType: null };
          };
        };
      };
      fulfillmentModes: {
        name: 'fulfillmentModes';
        type: {
          kind: 'LIST';
          name: never;
          ofType: {
            kind: 'NON_NULL';
            name: never;
            ofType: { kind: 'SCALAR'; name: 'String'; ofType: null };
          };
        };
      };
      id: { name: 'id'; type: { kind: 'SCALAR'; name: 'ID'; ofType: null } };
      lineItems: {
        name: 'lineItems';
        type: {
          kind: 'LIST';
          name: never;
          ofType: {
            kind: 'NON_NULL';
            name: never;
            ofType: {
              kind: 'OBJECT';
              name: 'DraftOrderLineItem';
              ofType: null;
            };
          };
        };
      };
      metafields: {
        name: 'metafields';
        type: {
          kind: 'LIST';
          name: never;
          ofType: {
            kind: 'NON_NULL';
            name: never;
            ofType: { kind: 'OBJECT'; name: 'OrderMetafield'; ofType: null };
          };
        };
      };
      notes: {
        name: 'notes';
        type: {
          kind: 'LIST';
          name: never;
          ofType: {
            kind: 'NON_NULL';
            name: never;
            ofType: { kind: 'OBJECT'; name: 'LineItemNote'; ofType: null };
          };
        };
      };
      number: {
        name: 'number';
        type: { kind: 'SCALAR'; name: 'String'; ofType: null };
      };
      numberDisplay: {
        name: 'numberDisplay';
        type: { kind: 'SCALAR'; name: 'String'; ofType: null };
      };
      shipping: {
        name: 'shipping';
        type: { kind: 'OBJECT'; name: 'DraftOrderContact'; ofType: null };
      };
      shippingLines: {
        name: 'shippingLines';
        type: {
          kind: 'LIST';
          name: never;
          ofType: {
            kind: 'NON_NULL';
            name: never;
            ofType: { kind: 'OBJECT'; name: 'ShippingLine'; ofType: null };
          };
        };
      };
      statuses: {
        name: 'statuses';
        type: { kind: 'OBJECT'; name: 'DraftOrderStatuses'; ofType: null };
      };
      tags: {
        name: 'tags';
        type: {
          kind: 'LIST';
          name: never;
          ofType: {
            kind: 'NON_NULL';
            name: never;
            ofType: { kind: 'SCALAR'; name: 'String'; ofType: null };
          };
        };
      };
      taxExempted: {
        name: 'taxExempted';
        type: { kind: 'SCALAR'; name: 'Boolean'; ofType: null };
      };
      taxes: {
        name: 'taxes';
        type: {
          kind: 'LIST';
          name: never;
          ofType: {
            kind: 'NON_NULL';
            name: never;
            ofType: { kind: 'OBJECT'; name: 'LineItemTax'; ofType: null };
          };
        };
      };
      totals: {
        name: 'totals';
        type: { kind: 'OBJECT'; name: 'DraftOrderTotals'; ofType: null };
      };
      updatedAt: {
        name: 'updatedAt';
        type: { kind: 'SCALAR'; name: 'DateTime'; ofType: null };
      };
    };
  };
  DraftOrderAddress: {
    kind: 'OBJECT';
    name: 'DraftOrderAddress';
    fields: {
      addressLine1: {
        name: 'addressLine1';
        type: { kind: 'SCALAR'; name: 'String'; ofType: null };
      };
      addressLine2: {
        name: 'addressLine2';
        type: { kind: 'SCALAR'; name: 'String'; ofType: null };
      };
      addressLine3: {
        name: 'addressLine3';
        type: { kind: 'SCALAR'; name: 'String'; ofType: null };
      };
      adminArea1: {
        name: 'adminArea1';
        type: { kind: 'SCALAR'; name: 'String'; ofType: null };
      };
      adminArea2: {
        name: 'adminArea2';
        type: { kind: 'SCALAR'; name: 'String'; ofType: null };
      };
      adminArea3: {
        name: 'adminArea3';
        type: { kind: 'SCALAR'; name: 'String'; ofType: null };
      };
      adminArea4: {
        name: 'adminArea4';
        type: { kind: 'SCALAR'; name: 'String'; ofType: null };
      };
      countryCode: {
        name: 'countryCode';
        type: { kind: 'SCALAR'; name: 'String'; ofType: null };
      };
      postalCode: {
        name: 'postalCode';
        type: { kind: 'SCALAR'; name: 'String'; ofType: null };
      };
    };
  };
  DraftOrderAddressInput: {
    kind: 'INPUT_OBJECT';
    name: 'DraftOrderAddressInput';
    isOneOf: false;
    inputFields: [
      {
        name: 'addressLine1';
        type: {
          kind: 'NON_NULL';
          name: never;
          ofType: { kind: 'SCALAR'; name: 'String'; ofType: null };
        };
        defaultValue: null;
      },
      {
        name: 'addressLine2';
        type: { kind: 'SCALAR'; name: 'String'; ofType: null };
        defaultValue: null;
      },
      {
        name: 'addressLine3';
        type: { kind: 'SCALAR'; name: 'String'; ofType: null };
        defaultValue: null;
      },
      {
        name: 'adminArea1';
        type: {
          kind: 'NON_NULL';
          name: never;
          ofType: { kind: 'SCALAR'; name: 'String'; ofType: null };
        };
        defaultValue: null;
      },
      {
        name: 'adminArea2';
        type: { kind: 'SCALAR'; name: 'String'; ofType: null };
        defaultValue: null;
      },
      {
        name: 'adminArea3';
        type: { kind: 'SCALAR'; name: 'String'; ofType: null };
        defaultValue: null;
      },
      {
        name: 'adminArea4';
        type: { kind: 'SCALAR'; name: 'String'; ofType: null };
        defaultValue: null;
      },
      {
        name: 'countryCode';
        type: {
          kind: 'NON_NULL';
          name: never;
          ofType: { kind: 'SCALAR'; name: 'String'; ofType: null };
        };
        defaultValue: null;
      },
      {
        name: 'postalCode';
        type: {
          kind: 'NON_NULL';
          name: never;
          ofType: { kind: 'SCALAR'; name: 'String'; ofType: null };
        };
        defaultValue: null;
      },
    ];
  };
  DraftOrderContact: {
    kind: 'OBJECT';
    name: 'DraftOrderContact';
    fields: {
      address: {
        name: 'address';
        type: { kind: 'OBJECT'; name: 'DraftOrderAddress'; ofType: null };
      };
      companyName: {
        name: 'companyName';
        type: { kind: 'SCALAR'; name: 'String'; ofType: null };
      };
      email: {
        name: 'email';
        type: { kind: 'SCALAR'; name: 'String'; ofType: null };
      };
      firstName: {
        name: 'firstName';
        type: { kind: 'SCALAR'; name: 'String'; ofType: null };
      };
      lastName: {
        name: 'lastName';
        type: { kind: 'SCALAR'; name: 'String'; ofType: null };
      };
      phone: {
        name: 'phone';
        type: { kind: 'SCALAR'; name: 'String'; ofType: null };
      };
    };
  };
  DraftOrderContext: {
    kind: 'OBJECT';
    name: 'DraftOrderContext';
    fields: {
      channelId: {
        name: 'channelId';
        type: { kind: 'SCALAR'; name: 'String'; ofType: null };
      };
      owner: {
        name: 'owner';
        type: { kind: 'SCALAR'; name: 'String'; ofType: null };
      };
      storeId: {
        name: 'storeId';
        type: { kind: 'SCALAR'; name: 'String'; ofType: null };
      };
    };
  };
  DraftOrderLineItem: {
    kind: 'OBJECT';
    name: 'DraftOrderLineItem';
    fields: {
      createdAt: {
        name: 'createdAt';
        type: { kind: 'SCALAR'; name: 'String'; ofType: null };
      };
      details: {
        name: 'details';
        type: { kind: 'OBJECT'; name: 'LineItemDetails'; ofType: null };
      };
      discounts: {
        name: 'discounts';
        type: {
          kind: 'LIST';
          name: never;
          ofType: {
            kind: 'NON_NULL';
            name: never;
            ofType: { kind: 'OBJECT'; name: 'LineItemDiscount'; ofType: null };
          };
        };
      };
      externalId: {
        name: 'externalId';
        type: { kind: 'SCALAR'; name: 'String'; ofType: null };
      };
      fees: {
        name: 'fees';
        type: {
          kind: 'LIST';
          name: never;
          ofType: {
            kind: 'NON_NULL';
            name: never;
            ofType: { kind: 'OBJECT'; name: 'LineItemFee'; ofType: null };
          };
        };
      };
      fulfilledAt: {
        name: 'fulfilledAt';
        type: { kind: 'SCALAR'; name: 'String'; ofType: null };
      };
      fulfillmentChannelId: {
        name: 'fulfillmentChannelId';
        type: { kind: 'SCALAR'; name: 'String'; ofType: null };
      };
      fulfillmentMode: {
        name: 'fulfillmentMode';
        type: { kind: 'SCALAR'; name: 'String'; ofType: null };
      };
      id: {
        name: 'id';
        type: {
          kind: 'NON_NULL';
          name: never;
          ofType: { kind: 'SCALAR'; name: 'String'; ofType: null };
        };
      };
      metafields: {
        name: 'metafields';
        type: {
          kind: 'LIST';
          name: never;
          ofType: {
            kind: 'NON_NULL';
            name: never;
            ofType: { kind: 'OBJECT'; name: 'OrderMetafield'; ofType: null };
          };
        };
      };
      name: {
        name: 'name';
        type: { kind: 'SCALAR'; name: 'String'; ofType: null };
      };
      notes: {
        name: 'notes';
        type: {
          kind: 'LIST';
          name: never;
          ofType: {
            kind: 'NON_NULL';
            name: never;
            ofType: { kind: 'OBJECT'; name: 'LineItemNote'; ofType: null };
          };
        };
      };
      orderVersion: {
        name: 'orderVersion';
        type: { kind: 'SCALAR'; name: 'String'; ofType: null };
      };
      productId: {
        name: 'productId';
        type: { kind: 'SCALAR'; name: 'String'; ofType: null };
      };
      quantity: {
        name: 'quantity';
        type: { kind: 'SCALAR'; name: 'Float'; ofType: null };
      };
      returnQuantity: {
        name: 'returnQuantity';
        type: { kind: 'SCALAR'; name: 'Float'; ofType: null };
      };
      returnTotals: {
        name: 'returnTotals';
        type: { kind: 'OBJECT'; name: 'LineItemReturnTotals'; ofType: null };
      };
      returnedAt: {
        name: 'returnedAt';
        type: { kind: 'SCALAR'; name: 'String'; ofType: null };
      };
      serviceEndsAt: {
        name: 'serviceEndsAt';
        type: { kind: 'SCALAR'; name: 'String'; ofType: null };
      };
      serviceStartAt: {
        name: 'serviceStartAt';
        type: { kind: 'SCALAR'; name: 'String'; ofType: null };
      };
      shipping: {
        name: 'shipping';
        type: { kind: 'OBJECT'; name: 'DraftOrderContact'; ofType: null };
      };
      skuId: {
        name: 'skuId';
        type: { kind: 'SCALAR'; name: 'String'; ofType: null };
      };
      status: {
        name: 'status';
        type: { kind: 'SCALAR'; name: 'String'; ofType: null };
      };
      tags: {
        name: 'tags';
        type: {
          kind: 'LIST';
          name: never;
          ofType: {
            kind: 'NON_NULL';
            name: never;
            ofType: { kind: 'SCALAR'; name: 'String'; ofType: null };
          };
        };
      };
      taxes: {
        name: 'taxes';
        type: {
          kind: 'LIST';
          name: never;
          ofType: {
            kind: 'NON_NULL';
            name: never;
            ofType: { kind: 'OBJECT'; name: 'LineItemTax'; ofType: null };
          };
        };
      };
      totals: {
        name: 'totals';
        type: { kind: 'OBJECT'; name: 'LineItemTotals'; ofType: null };
      };
      type: {
        name: 'type';
        type: { kind: 'SCALAR'; name: 'String'; ofType: null };
      };
      unitAmount: {
        name: 'unitAmount';
        type: { kind: 'OBJECT'; name: 'MoneyValue'; ofType: null };
      };
      updatedAt: {
        name: 'updatedAt';
        type: { kind: 'SCALAR'; name: 'String'; ofType: null };
      };
    };
  };
  DraftOrderLineItemInput: {
    kind: 'INPUT_OBJECT';
    name: 'DraftOrderLineItemInput';
    isOneOf: false;
    inputFields: [
      {
        name: 'details';
        type: {
          kind: 'INPUT_OBJECT';
          name: 'LineItemInputDetailsInfo';
          ofType: null;
        };
        defaultValue: null;
      },
      {
        name: 'discounts';
        type: {
          kind: 'LIST';
          name: never;
          ofType: {
            kind: 'NON_NULL';
            name: never;
            ofType: {
              kind: 'INPUT_OBJECT';
              name: 'DiscountInput';
              ofType: null;
            };
          };
        };
        defaultValue: null;
      },
      {
        name: 'externalId';
        type: { kind: 'SCALAR'; name: 'String'; ofType: null };
        defaultValue: null;
      },
      {
        name: 'fees';
        type: {
          kind: 'LIST';
          name: never;
          ofType: {
            kind: 'NON_NULL';
            name: never;
            ofType: { kind: 'INPUT_OBJECT'; name: 'FeeInput'; ofType: null };
          };
        };
        defaultValue: null;
      },
      {
        name: 'fulfillmentMode';
        type: { kind: 'ENUM'; name: 'LineItemModeInput'; ofType: null };
        defaultValue: null;
      },
      {
        name: 'id';
        type: {
          kind: 'NON_NULL';
          name: never;
          ofType: { kind: 'SCALAR'; name: 'String'; ofType: null };
        };
        defaultValue: null;
      },
      {
        name: 'metafields';
        type: {
          kind: 'LIST';
          name: never;
          ofType: {
            kind: 'NON_NULL';
            name: never;
            ofType: {
              kind: 'INPUT_OBJECT';
              name: 'OrderMetafieldInput';
              ofType: null;
            };
          };
        };
        defaultValue: null;
      },
      {
        name: 'name';
        type: { kind: 'SCALAR'; name: 'String'; ofType: null };
        defaultValue: null;
      },
      {
        name: 'notes';
        type: {
          kind: 'LIST';
          name: never;
          ofType: {
            kind: 'NON_NULL';
            name: never;
            ofType: { kind: 'INPUT_OBJECT'; name: 'NoteInput'; ofType: null };
          };
        };
        defaultValue: '[]';
      },
      {
        name: 'productId';
        type: { kind: 'SCALAR'; name: 'String'; ofType: null };
        defaultValue: null;
      },
      {
        name: 'quantity';
        type: { kind: 'SCALAR'; name: 'Float'; ofType: null };
        defaultValue: null;
      },
      {
        name: 'serviceEndsAt';
        type: { kind: 'SCALAR'; name: 'DateTime'; ofType: null };
        defaultValue: null;
      },
      {
        name: 'serviceStartAt';
        type: { kind: 'SCALAR'; name: 'DateTime'; ofType: null };
        defaultValue: null;
      },
      {
        name: 'shipping';
        type: {
          kind: 'INPUT_OBJECT';
          name: 'LineItemInputShippingInfo';
          ofType: null;
        };
        defaultValue: null;
      },
      {
        name: 'skuId';
        type: { kind: 'SCALAR'; name: 'String'; ofType: null };
        defaultValue: null;
      },
      {
        name: 'tags';
        type: {
          kind: 'LIST';
          name: never;
          ofType: {
            kind: 'NON_NULL';
            name: never;
            ofType: { kind: 'SCALAR'; name: 'String'; ofType: null };
          };
        };
        defaultValue: null;
      },
      {
        name: 'taxes';
        type: {
          kind: 'LIST';
          name: never;
          ofType: {
            kind: 'NON_NULL';
            name: never;
            ofType: { kind: 'INPUT_OBJECT'; name: 'TaxInput'; ofType: null };
          };
        };
        defaultValue: null;
      },
      {
        name: 'totals';
        type: {
          kind: 'INPUT_OBJECT';
          name: 'LineItemTotalsInput';
          ofType: null;
        };
        defaultValue: null;
      },
      {
        name: 'type';
        type: { kind: 'ENUM'; name: 'LineItemTypesInput'; ofType: null };
        defaultValue: 'PHYSICAL';
      },
      {
        name: 'unitAmount';
        type: { kind: 'INPUT_OBJECT'; name: 'MoneyInput'; ofType: null };
        defaultValue: null;
      },
    ];
  };
  DraftOrderStatuses: {
    kind: 'OBJECT';
    name: 'DraftOrderStatuses';
    fields: {
      fulfillmentStatus: {
        name: 'fulfillmentStatus';
        type: { kind: 'SCALAR'; name: 'String'; ofType: null };
      };
      paymentStatus: {
        name: 'paymentStatus';
        type: { kind: 'SCALAR'; name: 'String'; ofType: null };
      };
      status: {
        name: 'status';
        type: { kind: 'SCALAR'; name: 'String'; ofType: null };
      };
    };
  };
  DraftOrderTotals: {
    kind: 'OBJECT';
    name: 'DraftOrderTotals';
    fields: {
      discountTotal: {
        name: 'discountTotal';
        type: { kind: 'OBJECT'; name: 'MoneyValue'; ofType: null };
      };
      feeTotal: {
        name: 'feeTotal';
        type: { kind: 'OBJECT'; name: 'MoneyValue'; ofType: null };
      };
      shippingTotal: {
        name: 'shippingTotal';
        type: { kind: 'OBJECT'; name: 'MoneyValue'; ofType: null };
      };
      subTotal: {
        name: 'subTotal';
        type: { kind: 'OBJECT'; name: 'MoneyValue'; ofType: null };
      };
      taxTotal: {
        name: 'taxTotal';
        type: { kind: 'OBJECT'; name: 'MoneyValue'; ofType: null };
      };
      total: {
        name: 'total';
        type: { kind: 'OBJECT'; name: 'MoneyValue'; ofType: null };
      };
    };
  };
  ExternalIdsInput: {
    kind: 'INPUT_OBJECT';
    name: 'ExternalIdsInput';
    isOneOf: false;
    inputFields: [
      {
        name: 'type';
        type: {
          kind: 'NON_NULL';
          name: never;
          ofType: { kind: 'SCALAR'; name: 'String'; ofType: null };
        };
        defaultValue: null;
      },
      {
        name: 'value';
        type: {
          kind: 'NON_NULL';
          name: never;
          ofType: { kind: 'SCALAR'; name: 'String'; ofType: null };
        };
        defaultValue: null;
      },
    ];
  };
  FeeInput: {
    kind: 'INPUT_OBJECT';
    name: 'FeeInput';
    isOneOf: false;
    inputFields: [
      {
        name: 'amount';
        type: {
          kind: 'NON_NULL';
          name: never;
          ofType: { kind: 'INPUT_OBJECT'; name: 'MoneyInput'; ofType: null };
        };
        defaultValue: null;
      },
      {
        name: 'appliedBeforeTax';
        type: { kind: 'SCALAR'; name: 'Boolean'; ofType: null };
        defaultValue: 'false';
      },
      {
        name: 'externalIds';
        type: {
          kind: 'LIST';
          name: never;
          ofType: {
            kind: 'NON_NULL';
            name: never;
            ofType: {
              kind: 'INPUT_OBJECT';
              name: 'ExternalIdsInput';
              ofType: null;
            };
          };
        };
        defaultValue: null;
      },
      {
        name: 'name';
        type: {
          kind: 'NON_NULL';
          name: never;
          ofType: { kind: 'SCALAR'; name: 'String'; ofType: null };
        };
        defaultValue: null;
      },
      {
        name: 'ratePercentage';
        type: { kind: 'SCALAR'; name: 'String'; ofType: null };
        defaultValue: null;
      },
      {
        name: 'referenceId';
        type: { kind: 'SCALAR'; name: 'String'; ofType: null };
        defaultValue: null;
      },
    ];
  };
  Float: unknown;
  FulfillmentModeInput: {
    name: 'FulfillmentModeInput';
    enumValues:
      | 'CURBSIDE'
      | 'DELIVERY'
      | 'DIGITAL'
      | 'DRIVE_THRU'
      | 'FOR_HERE'
      | 'GENERAL_CONTAINER'
      | 'GIFT_CARD'
      | 'NONE'
      | 'NON_LODGING_NRR'
      | 'NON_LODGING_SALE'
      | 'PICKUP'
      | 'PURCHASE'
      | 'QUICK_STAY'
      | 'REGULAR_STAY'
      | 'SHIP'
      | 'TO_GO';
  };
  GeoCoordinates: {
    kind: 'OBJECT';
    name: 'GeoCoordinates';
    fields: {
      latitude: {
        name: 'latitude';
        type: { kind: 'SCALAR'; name: 'Float'; ofType: null };
      };
      longitude: {
        name: 'longitude';
        type: { kind: 'SCALAR'; name: 'Float'; ofType: null };
      };
    };
  };
  ID: unknown;
  Int: unknown;
  LineItemDetails: {
    kind: 'OBJECT';
    name: 'LineItemDetails';
    fields: {
      productAssetUrl: {
        name: 'productAssetUrl';
        type: { kind: 'SCALAR'; name: 'String'; ofType: null };
      };
      selectedAddons: {
        name: 'selectedAddons';
        type: {
          kind: 'LIST';
          name: never;
          ofType: {
            kind: 'NON_NULL';
            name: never;
            ofType: { kind: 'OBJECT'; name: 'SelectedAddon'; ofType: null };
          };
        };
      };
      selectedOptions: {
        name: 'selectedOptions';
        type: {
          kind: 'LIST';
          name: never;
          ofType: {
            kind: 'NON_NULL';
            name: never;
            ofType: { kind: 'OBJECT'; name: 'SelectedOption'; ofType: null };
          };
        };
      };
      sku: {
        name: 'sku';
        type: { kind: 'SCALAR'; name: 'String'; ofType: null };
      };
      unitOfMeasure: {
        name: 'unitOfMeasure';
        type: { kind: 'SCALAR'; name: 'String'; ofType: null };
      };
    };
  };
  LineItemDiscount: {
    kind: 'OBJECT';
    name: 'LineItemDiscount';
    fields: {
      amount: {
        name: 'amount';
        type: { kind: 'OBJECT'; name: 'MoneyValue'; ofType: null };
      };
      appliedBeforeTax: {
        name: 'appliedBeforeTax';
        type: { kind: 'SCALAR'; name: 'Boolean'; ofType: null };
      };
      code: {
        name: 'code';
        type: { kind: 'SCALAR'; name: 'String'; ofType: null };
      };
      id: {
        name: 'id';
        type: { kind: 'SCALAR'; name: 'String'; ofType: null };
      };
      metafields: {
        name: 'metafields';
        type: {
          kind: 'LIST';
          name: never;
          ofType: {
            kind: 'NON_NULL';
            name: never;
            ofType: { kind: 'OBJECT'; name: 'OrderMetafield'; ofType: null };
          };
        };
      };
      name: {
        name: 'name';
        type: { kind: 'SCALAR'; name: 'String'; ofType: null };
      };
      ratePercentage: {
        name: 'ratePercentage';
        type: { kind: 'SCALAR'; name: 'String'; ofType: null };
      };
    };
  };
  LineItemFee: {
    kind: 'OBJECT';
    name: 'LineItemFee';
    fields: {
      amount: {
        name: 'amount';
        type: { kind: 'OBJECT'; name: 'MoneyValue'; ofType: null };
      };
      appliedBeforeTax: {
        name: 'appliedBeforeTax';
        type: { kind: 'SCALAR'; name: 'Boolean'; ofType: null };
      };
      id: {
        name: 'id';
        type: { kind: 'SCALAR'; name: 'String'; ofType: null };
      };
      metafields: {
        name: 'metafields';
        type: {
          kind: 'LIST';
          name: never;
          ofType: {
            kind: 'NON_NULL';
            name: never;
            ofType: { kind: 'OBJECT'; name: 'OrderMetafield'; ofType: null };
          };
        };
      };
      name: {
        name: 'name';
        type: { kind: 'SCALAR'; name: 'String'; ofType: null };
      };
      ratePercentage: {
        name: 'ratePercentage';
        type: { kind: 'SCALAR'; name: 'String'; ofType: null };
      };
    };
  };
  LineItemInputDetailsInfo: {
    kind: 'INPUT_OBJECT';
    name: 'LineItemInputDetailsInfo';
    isOneOf: false;
    inputFields: [
      {
        name: 'productAssetUrl';
        type: { kind: 'SCALAR'; name: 'String'; ofType: null };
        defaultValue: null;
      },
      {
        name: 'selectedAddons';
        type: {
          kind: 'LIST';
          name: never;
          ofType: {
            kind: 'NON_NULL';
            name: never;
            ofType: {
              kind: 'INPUT_OBJECT';
              name: 'SelectedAddonInput';
              ofType: null;
            };
          };
        };
        defaultValue: null;
      },
      {
        name: 'selectedOptions';
        type: {
          kind: 'LIST';
          name: never;
          ofType: {
            kind: 'NON_NULL';
            name: never;
            ofType: {
              kind: 'INPUT_OBJECT';
              name: 'SelectedOptionInput';
              ofType: null;
            };
          };
        };
        defaultValue: null;
      },
      {
        name: 'sku';
        type: { kind: 'SCALAR'; name: 'String'; ofType: null };
        defaultValue: null;
      },
      {
        name: 'unitOfMeasure';
        type: { kind: 'SCALAR'; name: 'String'; ofType: null };
        defaultValue: null;
      },
    ];
  };
  LineItemInputShippingInfo: {
    kind: 'INPUT_OBJECT';
    name: 'LineItemInputShippingInfo';
    isOneOf: false;
    inputFields: [
      {
        name: 'address';
        type: { kind: 'INPUT_OBJECT'; name: 'OrderAddressInput'; ofType: null };
        defaultValue: null;
      },
      {
        name: 'companyName';
        type: { kind: 'SCALAR'; name: 'String'; ofType: null };
        defaultValue: null;
      },
      {
        name: 'email';
        type: { kind: 'SCALAR'; name: 'String'; ofType: null };
        defaultValue: null;
      },
      {
        name: 'firstName';
        type: { kind: 'SCALAR'; name: 'String'; ofType: null };
        defaultValue: null;
      },
      {
        name: 'lastName';
        type: { kind: 'SCALAR'; name: 'String'; ofType: null };
        defaultValue: null;
      },
      {
        name: 'phone';
        type: { kind: 'SCALAR'; name: 'String'; ofType: null };
        defaultValue: null;
      },
    ];
  };
  LineItemModeInput: {
    name: 'LineItemModeInput';
    enumValues:
      | 'CURBSIDE'
      | 'DELIVERY'
      | 'DIGITAL'
      | 'DRIVE_THRU'
      | 'FOR_HERE'
      | 'GENERAL_CONTAINER'
      | 'GIFT_CARD'
      | 'NONE'
      | 'NON_LODGING_NRR'
      | 'NON_LODGING_SALE'
      | 'PICKUP'
      | 'PURCHASE'
      | 'QUICK_STAY'
      | 'REGULAR_STAY'
      | 'SHIP'
      | 'TO_GO';
  };
  LineItemNote: {
    kind: 'OBJECT';
    name: 'LineItemNote';
    fields: {
      author: {
        name: 'author';
        type: { kind: 'SCALAR'; name: 'String'; ofType: null };
      };
      authorType: {
        name: 'authorType';
        type: { kind: 'SCALAR'; name: 'String'; ofType: null };
      };
      content: {
        name: 'content';
        type: { kind: 'SCALAR'; name: 'String'; ofType: null };
      };
      createdAt: {
        name: 'createdAt';
        type: { kind: 'SCALAR'; name: 'String'; ofType: null };
      };
      deletedAt: {
        name: 'deletedAt';
        type: { kind: 'SCALAR'; name: 'String'; ofType: null };
      };
      id: {
        name: 'id';
        type: { kind: 'SCALAR'; name: 'String'; ofType: null };
      };
      metafields: {
        name: 'metafields';
        type: {
          kind: 'LIST';
          name: never;
          ofType: {
            kind: 'NON_NULL';
            name: never;
            ofType: { kind: 'OBJECT'; name: 'OrderMetafield'; ofType: null };
          };
        };
      };
      shouldNotifyCustomer: {
        name: 'shouldNotifyCustomer';
        type: { kind: 'SCALAR'; name: 'Boolean'; ofType: null };
      };
    };
  };
  LineItemReturnTotals: {
    kind: 'OBJECT';
    name: 'LineItemReturnTotals';
    fields: {
      discountTotal: {
        name: 'discountTotal';
        type: { kind: 'OBJECT'; name: 'MoneyValue'; ofType: null };
      };
      feeTotal: {
        name: 'feeTotal';
        type: { kind: 'OBJECT'; name: 'MoneyValue'; ofType: null };
      };
      subTotal: {
        name: 'subTotal';
        type: { kind: 'OBJECT'; name: 'MoneyValue'; ofType: null };
      };
      taxTotal: {
        name: 'taxTotal';
        type: { kind: 'OBJECT'; name: 'MoneyValue'; ofType: null };
      };
      total: {
        name: 'total';
        type: { kind: 'OBJECT'; name: 'MoneyValue'; ofType: null };
      };
    };
  };
  LineItemTax: {
    kind: 'OBJECT';
    name: 'LineItemTax';
    fields: {
      amount: {
        name: 'amount';
        type: { kind: 'OBJECT'; name: 'MoneyValue'; ofType: null };
      };
      exempted: {
        name: 'exempted';
        type: { kind: 'SCALAR'; name: 'Boolean'; ofType: null };
      };
      id: {
        name: 'id';
        type: { kind: 'SCALAR'; name: 'String'; ofType: null };
      };
      included: {
        name: 'included';
        type: { kind: 'SCALAR'; name: 'Boolean'; ofType: null };
      };
      metafields: {
        name: 'metafields';
        type: {
          kind: 'LIST';
          name: never;
          ofType: {
            kind: 'NON_NULL';
            name: never;
            ofType: { kind: 'OBJECT'; name: 'OrderMetafield'; ofType: null };
          };
        };
      };
      name: {
        name: 'name';
        type: { kind: 'SCALAR'; name: 'String'; ofType: null };
      };
      ratePercentage: {
        name: 'ratePercentage';
        type: { kind: 'SCALAR'; name: 'String'; ofType: null };
      };
    };
  };
  LineItemTotals: {
    kind: 'OBJECT';
    name: 'LineItemTotals';
    fields: {
      discountTotal: {
        name: 'discountTotal';
        type: { kind: 'OBJECT'; name: 'MoneyValue'; ofType: null };
      };
      feeTotal: {
        name: 'feeTotal';
        type: { kind: 'OBJECT'; name: 'MoneyValue'; ofType: null };
      };
      subTotal: {
        name: 'subTotal';
        type: { kind: 'OBJECT'; name: 'MoneyValue'; ofType: null };
      };
      taxTotal: {
        name: 'taxTotal';
        type: { kind: 'OBJECT'; name: 'MoneyValue'; ofType: null };
      };
    };
  };
  LineItemTotalsInput: {
    kind: 'INPUT_OBJECT';
    name: 'LineItemTotalsInput';
    isOneOf: false;
    inputFields: [
      {
        name: 'discountTotal';
        type: {
          kind: 'NON_NULL';
          name: never;
          ofType: { kind: 'INPUT_OBJECT'; name: 'MoneyInput'; ofType: null };
        };
        defaultValue: null;
      },
      {
        name: 'feeTotal';
        type: {
          kind: 'NON_NULL';
          name: never;
          ofType: { kind: 'INPUT_OBJECT'; name: 'MoneyInput'; ofType: null };
        };
        defaultValue: null;
      },
      {
        name: 'subTotal';
        type: {
          kind: 'NON_NULL';
          name: never;
          ofType: { kind: 'INPUT_OBJECT'; name: 'MoneyInput'; ofType: null };
        };
        defaultValue: null;
      },
      {
        name: 'taxTotal';
        type: {
          kind: 'NON_NULL';
          name: never;
          ofType: { kind: 'INPUT_OBJECT'; name: 'MoneyInput'; ofType: null };
        };
        defaultValue: null;
      },
    ];
  };
  LineItemTypesInput: {
    name: 'LineItemTypesInput';
    enumValues: 'ALL' | 'DIGITAL' | 'PAY_LINK' | 'PHYSICAL' | 'SERVICE' | 'STAY';
  };
  MetafieldTypeInput: { name: 'MetafieldTypeInput'; enumValues: 'JSON' };
  MoneyInput: {
    kind: 'INPUT_OBJECT';
    name: 'MoneyInput';
    isOneOf: false;
    inputFields: [
      {
        name: 'currencyCode';
        type: {
          kind: 'NON_NULL';
          name: never;
          ofType: { kind: 'SCALAR'; name: 'String'; ofType: null };
        };
        defaultValue: null;
      },
      {
        name: 'value';
        type: {
          kind: 'NON_NULL';
          name: never;
          ofType: { kind: 'SCALAR'; name: 'Int'; ofType: null };
        };
        defaultValue: null;
      },
    ];
  };
  MoneyValue: {
    kind: 'OBJECT';
    name: 'MoneyValue';
    fields: {
      currencyCode: {
        name: 'currencyCode';
        type: { kind: 'SCALAR'; name: 'String'; ofType: null };
      };
      value: {
        name: 'value';
        type: { kind: 'SCALAR'; name: 'Int'; ofType: null };
      };
    };
  };
  Mutation: {
    kind: 'OBJECT';
    name: 'Mutation';
    fields: {
      applyCheckoutSessionDeliveryMethod: {
        name: 'applyCheckoutSessionDeliveryMethod';
        type: { kind: 'OBJECT'; name: 'CheckoutSession'; ofType: null };
      };
      applyCheckoutSessionDiscount: {
        name: 'applyCheckoutSessionDiscount';
        type: { kind: 'OBJECT'; name: 'DraftOrder'; ofType: null };
      };
      applyCheckoutSessionFulfillmentLocation: {
        name: 'applyCheckoutSessionFulfillmentLocation';
        type: { kind: 'OBJECT'; name: 'CheckoutSession'; ofType: null };
      };
      applyCheckoutSessionShippingMethod: {
        name: 'applyCheckoutSessionShippingMethod';
        type: { kind: 'OBJECT'; name: 'CheckoutSession'; ofType: null };
      };
      calculateCheckoutSessionTaxes: {
        name: 'calculateCheckoutSessionTaxes';
        type: {
          kind: 'OBJECT';
          name: 'CheckoutSessionCalculationResult';
          ofType: null;
        };
      };
      confirmCheckoutSession: {
        name: 'confirmCheckoutSession';
        type: { kind: 'OBJECT'; name: 'CheckoutSession'; ofType: null };
      };
      createCheckoutSession: {
        name: 'createCheckoutSession';
        type: { kind: 'OBJECT'; name: 'CheckoutSession'; ofType: null };
      };
      expireCheckoutSession: {
        name: 'expireCheckoutSession';
        type: { kind: 'OBJECT'; name: 'CheckoutSession'; ofType: null };
      };
      removeAppliedCheckoutSessionShippingMethod: {
        name: 'removeAppliedCheckoutSessionShippingMethod';
        type: { kind: 'OBJECT'; name: 'CheckoutSession'; ofType: null };
      };
      updateCheckoutSession: {
        name: 'updateCheckoutSession';
        type: { kind: 'OBJECT'; name: 'CheckoutSession'; ofType: null };
      };
      updateCheckoutSessionDraftOrder: {
        name: 'updateCheckoutSessionDraftOrder';
        type: { kind: 'OBJECT'; name: 'DraftOrder'; ofType: null };
      };
      verifyAddress: {
        name: 'verifyAddress';
        type: {
          kind: 'LIST';
          name: never;
          ofType: {
            kind: 'NON_NULL';
            name: never;
            ofType: { kind: 'OBJECT'; name: 'Address'; ofType: null };
          };
        };
      };
    };
  };
  MutationApplyCheckoutSessionDeliveryMethodInput: {
    kind: 'INPUT_OBJECT';
    name: 'MutationApplyCheckoutSessionDeliveryMethodInput';
    isOneOf: false;
    inputFields: [
      {
        name: 'mode';
        type: {
          kind: 'NON_NULL';
          name: never;
          ofType: { kind: 'ENUM'; name: 'FulfillmentModeInput'; ofType: null };
        };
        defaultValue: null;
      },
    ];
  };
  MutationApplyCheckoutSessionDiscountInput: {
    kind: 'INPUT_OBJECT';
    name: 'MutationApplyCheckoutSessionDiscountInput';
    isOneOf: false;
    inputFields: [
      {
        name: 'discountCodes';
        type: {
          kind: 'LIST';
          name: never;
          ofType: {
            kind: 'NON_NULL';
            name: never;
            ofType: { kind: 'SCALAR'; name: 'String'; ofType: null };
          };
        };
        defaultValue: null;
      },
    ];
  };
  MutationApplyCheckoutSessionFulfillmentLocationInput: {
    kind: 'INPUT_OBJECT';
    name: 'MutationApplyCheckoutSessionFulfillmentLocationInput';
    isOneOf: false;
    inputFields: [
      {
        name: 'fulfillmentLocationId';
        type: {
          kind: 'NON_NULL';
          name: never;
          ofType: { kind: 'SCALAR'; name: 'String'; ofType: null };
        };
        defaultValue: null;
      },
    ];
  };
  MutationConfirmCheckoutSessionInput: {
    kind: 'INPUT_OBJECT';
    name: 'MutationConfirmCheckoutSessionInput';
    isOneOf: false;
    inputFields: [
      {
        name: 'billing';
        type: {
          kind: 'INPUT_OBJECT';
          name: 'ConfirmCheckoutBillingInfoInput';
          ofType: null;
        };
        defaultValue: null;
      },
      {
        name: 'fulfillmentEndAt';
        type: { kind: 'SCALAR'; name: 'DateTime'; ofType: null };
        defaultValue: null;
      },
      {
        name: 'fulfillmentLocationId';
        type: { kind: 'SCALAR'; name: 'String'; ofType: null };
        defaultValue: null;
      },
      {
        name: 'fulfillmentStartAt';
        type: { kind: 'SCALAR'; name: 'DateTime'; ofType: null };
        defaultValue: null;
      },
      {
        name: 'paymentProcessor';
        type: { kind: 'SCALAR'; name: 'String'; ofType: null };
        defaultValue: null;
      },
      {
        name: 'paymentProvider';
        type: {
          kind: 'NON_NULL';
          name: never;
          ofType: { kind: 'SCALAR'; name: 'String'; ofType: null };
        };
        defaultValue: null;
      },
      {
        name: 'paymentToken';
        type: {
          kind: 'NON_NULL';
          name: never;
          ofType: { kind: 'SCALAR'; name: 'String'; ofType: null };
        };
        defaultValue: null;
      },
      {
        name: 'paymentType';
        type: {
          kind: 'NON_NULL';
          name: never;
          ofType: { kind: 'SCALAR'; name: 'String'; ofType: null };
        };
        defaultValue: null;
      },
      {
        name: 'shipping';
        type: {
          kind: 'INPUT_OBJECT';
          name: 'ConfirmCheckoutShippingInfoInput';
          ofType: null;
        };
        defaultValue: null;
      },
      {
        name: 'shippingLines';
        type: {
          kind: 'LIST';
          name: never;
          ofType: {
            kind: 'NON_NULL';
            name: never;
            ofType: {
              kind: 'INPUT_OBJECT';
              name: 'ConfirmCheckoutShippingLineInput';
              ofType: null;
            };
          };
        };
        defaultValue: null;
      },
      {
        name: 'shippingTotal';
        type: { kind: 'INPUT_OBJECT'; name: 'MoneyInput'; ofType: null };
        defaultValue: null;
      },
      {
        name: 'taxTotal';
        type: { kind: 'INPUT_OBJECT'; name: 'MoneyInput'; ofType: null };
        defaultValue: null;
      },
    ];
  };
  MutationCreateCheckoutSessionInput: {
    kind: 'INPUT_OBJECT';
    name: 'MutationCreateCheckoutSessionInput';
    isOneOf: false;
    inputFields: [
      {
        name: 'channelId';
        type: {
          kind: 'NON_NULL';
          name: never;
          ofType: { kind: 'SCALAR'; name: 'String'; ofType: null };
        };
        defaultValue: null;
      },
      {
        name: 'customerId';
        type: { kind: 'SCALAR'; name: 'String'; ofType: null };
        defaultValue: null;
      },
      {
        name: 'draftOrderId';
        type: {
          kind: 'NON_NULL';
          name: never;
          ofType: { kind: 'SCALAR'; name: 'String'; ofType: null };
        };
        defaultValue: null;
      },
      {
        name: 'enableAddressAutocomplete';
        type: { kind: 'SCALAR'; name: 'Boolean'; ofType: null };
        defaultValue: null;
      },
      {
        name: 'enableBillingAddressCollection';
        type: { kind: 'SCALAR'; name: 'Boolean'; ofType: null };
        defaultValue: null;
      },
      {
        name: 'enableLocalPickup';
        type: { kind: 'SCALAR'; name: 'Boolean'; ofType: null };
        defaultValue: null;
      },
      {
        name: 'enableNotesCollection';
        type: { kind: 'SCALAR'; name: 'Boolean'; ofType: null };
        defaultValue: null;
      },
      {
        name: 'enablePaymentMethodCollection';
        type: { kind: 'SCALAR'; name: 'Boolean'; ofType: null };
        defaultValue: null;
      },
      {
        name: 'enablePhoneCollection';
        type: { kind: 'SCALAR'; name: 'Boolean'; ofType: null };
        defaultValue: null;
      },
      {
        name: 'enablePromotionCodes';
        type: { kind: 'SCALAR'; name: 'Boolean'; ofType: null };
        defaultValue: null;
      },
      {
        name: 'enableShippingAddressCollection';
        type: { kind: 'SCALAR'; name: 'Boolean'; ofType: null };
        defaultValue: null;
      },
      {
        name: 'enableSurcharge';
        type: { kind: 'SCALAR'; name: 'Boolean'; ofType: null };
        defaultValue: null;
      },
      {
        name: 'enableTaxCollection';
        type: { kind: 'SCALAR'; name: 'Boolean'; ofType: null };
        defaultValue: null;
      },
      {
        name: 'enableTips';
        type: { kind: 'SCALAR'; name: 'Boolean'; ofType: null };
        defaultValue: null;
      },
      {
        name: 'enabledLocales';
        type: {
          kind: 'LIST';
          name: never;
          ofType: {
            kind: 'NON_NULL';
            name: never;
            ofType: { kind: 'SCALAR'; name: 'String'; ofType: null };
          };
        };
        defaultValue: null;
      },
      {
        name: 'enabledPaymentProviders';
        type: {
          kind: 'LIST';
          name: never;
          ofType: {
            kind: 'NON_NULL';
            name: never;
            ofType: { kind: 'SCALAR'; name: 'String'; ofType: null };
          };
        };
        defaultValue: null;
      },
      {
        name: 'environment';
        type: {
          kind: 'ENUM';
          name: 'CheckoutSessionEnvironment';
          ofType: null;
        };
        defaultValue: null;
      },
      {
        name: 'experimental_rules';
        type: {
          kind: 'INPUT_OBJECT';
          name: 'CheckoutSessionExperimentalRulesInput';
          ofType: null;
        };
        defaultValue: null;
      },
      {
        name: 'expiresAt';
        type: { kind: 'SCALAR'; name: 'DateTime'; ofType: null };
        defaultValue: null;
      },
      {
        name: 'locations';
        type: {
          kind: 'LIST';
          name: never;
          ofType: {
            kind: 'NON_NULL';
            name: never;
            ofType: {
              kind: 'INPUT_OBJECT';
              name: 'CheckoutSessionLocationInput';
              ofType: null;
            };
          };
        };
        defaultValue: null;
      },
      {
        name: 'operatingHours';
        type: {
          kind: 'INPUT_OBJECT';
          name: 'CheckoutSessionOperatingHoursMapInput';
          ofType: null;
        };
        defaultValue: null;
      },
      {
        name: 'paymentMethods';
        type: {
          kind: 'INPUT_OBJECT';
          name: 'CheckoutSessionPaymentMethodsInput';
          ofType: null;
        };
        defaultValue: null;
      },
      {
        name: 'returnUrl';
        type: {
          kind: 'NON_NULL';
          name: never;
          ofType: { kind: 'SCALAR'; name: 'String'; ofType: null };
        };
        defaultValue: null;
      },
      {
        name: 'shipping';
        type: {
          kind: 'INPUT_OBJECT';
          name: 'CheckoutSessionShippingOptionsInput';
          ofType: null;
        };
        defaultValue: null;
      },
      {
        name: 'sourceApp';
        type: { kind: 'SCALAR'; name: 'String'; ofType: null };
        defaultValue: null;
      },
      {
        name: 'storeId';
        type: {
          kind: 'NON_NULL';
          name: never;
          ofType: { kind: 'SCALAR'; name: 'String'; ofType: null };
        };
        defaultValue: null;
      },
      {
        name: 'storeName';
        type: { kind: 'SCALAR'; name: 'String'; ofType: null };
        defaultValue: null;
      },
      {
        name: 'successUrl';
        type: {
          kind: 'NON_NULL';
          name: never;
          ofType: { kind: 'SCALAR'; name: 'String'; ofType: null };
        };
        defaultValue: null;
      },
      {
        name: 'taxes';
        type: {
          kind: 'INPUT_OBJECT';
          name: 'CheckoutSessionTaxesOptionsInput';
          ofType: null;
        };
        defaultValue: null;
      },
      {
        name: 'url';
        type: { kind: 'SCALAR'; name: 'String'; ofType: null };
        defaultValue: null;
      },
    ];
  };
  MutationUpdateCheckoutSessionDraftOrderInput: {
    kind: 'INPUT_OBJECT';
    name: 'MutationUpdateCheckoutSessionDraftOrderInput';
    isOneOf: false;
    inputFields: [
      {
        name: 'billing';
        type: {
          kind: 'INPUT_OBJECT';
          name: 'OrderBillingInfoInput';
          ofType: null;
        };
        defaultValue: null;
      },
      {
        name: 'cartId';
        type: { kind: 'SCALAR'; name: 'String'; ofType: null };
        defaultValue: null;
      },
      {
        name: 'context';
        type: {
          kind: 'NON_NULL';
          name: never;
          ofType: {
            kind: 'INPUT_OBJECT';
            name: 'OrderContextInputUpdate';
            ofType: null;
          };
        };
        defaultValue: null;
      },
      {
        name: 'customerId';
        type: { kind: 'SCALAR'; name: 'String'; ofType: null };
        defaultValue: null;
      },
      {
        name: 'discounts';
        type: {
          kind: 'LIST';
          name: never;
          ofType: {
            kind: 'NON_NULL';
            name: never;
            ofType: {
              kind: 'INPUT_OBJECT';
              name: 'UpdateDiscountInput';
              ofType: null;
            };
          };
        };
        defaultValue: null;
      },
      {
        name: 'externalId';
        type: { kind: 'SCALAR'; name: 'String'; ofType: null };
        defaultValue: null;
      },
      {
        name: 'fees';
        type: {
          kind: 'LIST';
          name: never;
          ofType: {
            kind: 'NON_NULL';
            name: never;
            ofType: {
              kind: 'INPUT_OBJECT';
              name: 'UpdateFeeInput';
              ofType: null;
            };
          };
        };
        defaultValue: null;
      },
      {
        name: 'lineItems';
        type: {
          kind: 'INPUT_OBJECT';
          name: 'UpdateDraftOrderLineItemsInput';
          ofType: null;
        };
        defaultValue: null;
      },
      {
        name: 'metafields';
        type: {
          kind: 'LIST';
          name: never;
          ofType: {
            kind: 'NON_NULL';
            name: never;
            ofType: {
              kind: 'INPUT_OBJECT';
              name: 'OrderMetafieldInput';
              ofType: null;
            };
          };
        };
        defaultValue: null;
      },
      {
        name: 'notes';
        type: {
          kind: 'LIST';
          name: never;
          ofType: {
            kind: 'NON_NULL';
            name: never;
            ofType: { kind: 'INPUT_OBJECT'; name: 'NoteInput'; ofType: null };
          };
        };
        defaultValue: null;
      },
      {
        name: 'shipping';
        type: {
          kind: 'INPUT_OBJECT';
          name: 'OrderShippingInfoInput';
          ofType: null;
        };
        defaultValue: null;
      },
      {
        name: 'shippingLines';
        type: {
          kind: 'LIST';
          name: never;
          ofType: {
            kind: 'NON_NULL';
            name: never;
            ofType: {
              kind: 'INPUT_OBJECT';
              name: 'UpdateDraftShippingLineInput';
              ofType: null;
            };
          };
        };
        defaultValue: null;
      },
      {
        name: 'staffUserIds';
        type: {
          kind: 'LIST';
          name: never;
          ofType: {
            kind: 'NON_NULL';
            name: never;
            ofType: { kind: 'SCALAR'; name: 'String'; ofType: null };
          };
        };
        defaultValue: null;
      },
      {
        name: 'tags';
        type: {
          kind: 'LIST';
          name: never;
          ofType: {
            kind: 'NON_NULL';
            name: never;
            ofType: { kind: 'SCALAR'; name: 'String'; ofType: null };
          };
        };
        defaultValue: null;
      },
      {
        name: 'taxExempted';
        type: { kind: 'SCALAR'; name: 'Boolean'; ofType: null };
        defaultValue: null;
      },
      {
        name: 'taxes';
        type: {
          kind: 'LIST';
          name: never;
          ofType: {
            kind: 'NON_NULL';
            name: never;
            ofType: {
              kind: 'INPUT_OBJECT';
              name: 'UpdateOrderTaxInput';
              ofType: null;
            };
          };
        };
        defaultValue: null;
      },
      {
        name: 'totals';
        type: { kind: 'INPUT_OBJECT'; name: 'OrderTotalsInput'; ofType: null };
        defaultValue: null;
      },
    ];
  };
  MutationUpdateCheckoutSessionInput: {
    kind: 'INPUT_OBJECT';
    name: 'MutationUpdateCheckoutSessionInput';
    isOneOf: false;
    inputFields: [
      {
        name: 'channelId';
        type: { kind: 'SCALAR'; name: 'String'; ofType: null };
        defaultValue: null;
      },
      {
        name: 'customerId';
        type: { kind: 'SCALAR'; name: 'String'; ofType: null };
        defaultValue: null;
      },
      {
        name: 'enableAddressAutocomplete';
        type: { kind: 'SCALAR'; name: 'Boolean'; ofType: null };
        defaultValue: null;
      },
      {
        name: 'enableBillingAddressCollection';
        type: { kind: 'SCALAR'; name: 'Boolean'; ofType: null };
        defaultValue: null;
      },
      {
        name: 'enableLocalPickup';
        type: { kind: 'SCALAR'; name: 'Boolean'; ofType: null };
        defaultValue: null;
      },
      {
        name: 'enableNotesCollection';
        type: { kind: 'SCALAR'; name: 'Boolean'; ofType: null };
        defaultValue: null;
      },
      {
        name: 'enablePaymentMethodCollection';
        type: { kind: 'SCALAR'; name: 'Boolean'; ofType: null };
        defaultValue: null;
      },
      {
        name: 'enablePhoneCollection';
        type: { kind: 'SCALAR'; name: 'Boolean'; ofType: null };
        defaultValue: null;
      },
      {
        name: 'enablePromotionCodes';
        type: { kind: 'SCALAR'; name: 'Boolean'; ofType: null };
        defaultValue: null;
      },
      {
        name: 'enableShippingAddressCollection';
        type: { kind: 'SCALAR'; name: 'Boolean'; ofType: null };
        defaultValue: null;
      },
      {
        name: 'enableSurcharge';
        type: { kind: 'SCALAR'; name: 'Boolean'; ofType: null };
        defaultValue: null;
      },
      {
        name: 'enableTaxCollection';
        type: { kind: 'SCALAR'; name: 'Boolean'; ofType: null };
        defaultValue: null;
      },
      {
        name: 'enableTips';
        type: { kind: 'SCALAR'; name: 'Boolean'; ofType: null };
        defaultValue: null;
      },
      {
        name: 'enabledLocales';
        type: {
          kind: 'LIST';
          name: never;
          ofType: {
            kind: 'NON_NULL';
            name: never;
            ofType: { kind: 'SCALAR'; name: 'String'; ofType: null };
          };
        };
        defaultValue: null;
      },
      {
        name: 'enabledPaymentProviders';
        type: {
          kind: 'LIST';
          name: never;
          ofType: {
            kind: 'NON_NULL';
            name: never;
            ofType: { kind: 'SCALAR'; name: 'String'; ofType: null };
          };
        };
        defaultValue: null;
      },
      {
        name: 'environment';
        type: {
          kind: 'ENUM';
          name: 'CheckoutSessionEnvironment';
          ofType: null;
        };
        defaultValue: null;
      },
      {
        name: 'experimental_rules';
        type: {
          kind: 'INPUT_OBJECT';
          name: 'CheckoutSessionExperimentalRulesInput';
          ofType: null;
        };
        defaultValue: null;
      },
      {
        name: 'expiresAt';
        type: { kind: 'SCALAR'; name: 'DateTime'; ofType: null };
        defaultValue: null;
      },
      {
        name: 'locations';
        type: {
          kind: 'LIST';
          name: never;
          ofType: {
            kind: 'NON_NULL';
            name: never;
            ofType: {
              kind: 'INPUT_OBJECT';
              name: 'CheckoutSessionLocationInput';
              ofType: null;
            };
          };
        };
        defaultValue: null;
      },
      {
        name: 'operatingHours';
        type: {
          kind: 'INPUT_OBJECT';
          name: 'CheckoutSessionOperatingHoursMapInput';
          ofType: null;
        };
        defaultValue: null;
      },
      {
        name: 'paymentMethods';
        type: {
          kind: 'INPUT_OBJECT';
          name: 'CheckoutSessionPaymentMethodsInput';
          ofType: null;
        };
        defaultValue: null;
      },
      {
        name: 'returnUrl';
        type: { kind: 'SCALAR'; name: 'String'; ofType: null };
        defaultValue: null;
      },
      {
        name: 'sourceApp';
        type: { kind: 'SCALAR'; name: 'String'; ofType: null };
        defaultValue: null;
      },
      {
        name: 'storeId';
        type: { kind: 'SCALAR'; name: 'String'; ofType: null };
        defaultValue: null;
      },
      {
        name: 'storeName';
        type: { kind: 'SCALAR'; name: 'String'; ofType: null };
        defaultValue: null;
      },
      {
        name: 'successUrl';
        type: { kind: 'SCALAR'; name: 'String'; ofType: null };
        defaultValue: null;
      },
      {
        name: 'url';
        type: { kind: 'SCALAR'; name: 'String'; ofType: null };
        defaultValue: null;
      },
    ];
  };
  MutationVerifyAddressInput: {
    kind: 'INPUT_OBJECT';
    name: 'MutationVerifyAddressInput';
    isOneOf: false;
    inputFields: [
      {
        name: 'addressLine1';
        type: {
          kind: 'NON_NULL';
          name: never;
          ofType: { kind: 'SCALAR'; name: 'String'; ofType: null };
        };
        defaultValue: null;
      },
      {
        name: 'addressLine2';
        type: { kind: 'SCALAR'; name: 'String'; ofType: null };
        defaultValue: null;
      },
      {
        name: 'addressLine3';
        type: { kind: 'SCALAR'; name: 'String'; ofType: null };
        defaultValue: null;
      },
      {
        name: 'adminArea1';
        type: { kind: 'SCALAR'; name: 'String'; ofType: null };
        defaultValue: null;
      },
      {
        name: 'adminArea2';
        type: { kind: 'SCALAR'; name: 'String'; ofType: null };
        defaultValue: null;
      },
      {
        name: 'adminArea3';
        type: { kind: 'SCALAR'; name: 'String'; ofType: null };
        defaultValue: null;
      },
      {
        name: 'adminArea4';
        type: { kind: 'SCALAR'; name: 'String'; ofType: null };
        defaultValue: null;
      },
      {
        name: 'countryCode';
        type: {
          kind: 'NON_NULL';
          name: never;
          ofType: { kind: 'SCALAR'; name: 'String'; ofType: null };
        };
        defaultValue: null;
      },
      {
        name: 'postalCode';
        type: {
          kind: 'NON_NULL';
          name: never;
          ofType: { kind: 'SCALAR'; name: 'String'; ofType: null };
        };
        defaultValue: null;
      },
    ];
  };
  NoteAuthorTypeInput: {
    name: 'NoteAuthorTypeInput';
    enumValues: 'CUSTOMER' | 'MERCHANT' | 'NONE';
  };
  NoteInput: {
    kind: 'INPUT_OBJECT';
    name: 'NoteInput';
    isOneOf: false;
    inputFields: [
      {
        name: 'author';
        type: { kind: 'SCALAR'; name: 'String'; ofType: null };
        defaultValue: null;
      },
      {
        name: 'authorType';
        type: { kind: 'ENUM'; name: 'NoteAuthorTypeInput'; ofType: null };
        defaultValue: null;
      },
      {
        name: 'content';
        type: {
          kind: 'NON_NULL';
          name: never;
          ofType: { kind: 'SCALAR'; name: 'String'; ofType: null };
        };
        defaultValue: null;
      },
      {
        name: 'createdAt';
        type: { kind: 'SCALAR'; name: 'DateTime'; ofType: null };
        defaultValue: null;
      },
      {
        name: 'deletedAt';
        type: { kind: 'SCALAR'; name: 'DateTime'; ofType: null };
        defaultValue: null;
      },
      {
        name: 'externalIds';
        type: {
          kind: 'LIST';
          name: never;
          ofType: {
            kind: 'NON_NULL';
            name: never;
            ofType: {
              kind: 'INPUT_OBJECT';
              name: 'ExternalIdsInput';
              ofType: null;
            };
          };
        };
        defaultValue: null;
      },
      {
        name: 'metafields';
        type: {
          kind: 'LIST';
          name: never;
          ofType: {
            kind: 'NON_NULL';
            name: never;
            ofType: {
              kind: 'INPUT_OBJECT';
              name: 'OrderMetafieldInput';
              ofType: null;
            };
          };
        };
        defaultValue: null;
      },
      {
        name: 'referenceId';
        type: { kind: 'SCALAR'; name: 'String'; ofType: null };
        defaultValue: null;
      },
      {
        name: 'shouldNotifyCustomer';
        type: { kind: 'SCALAR'; name: 'Boolean'; ofType: null };
        defaultValue: null;
      },
    ];
  };
  Null: unknown;
  OrderAddressInput: {
    kind: 'INPUT_OBJECT';
    name: 'OrderAddressInput';
    isOneOf: false;
    inputFields: [
      {
        name: 'addressLine1';
        type: { kind: 'SCALAR'; name: 'String'; ofType: null };
        defaultValue: null;
      },
      {
        name: 'addressLine2';
        type: { kind: 'SCALAR'; name: 'String'; ofType: null };
        defaultValue: null;
      },
      {
        name: 'addressLine3';
        type: { kind: 'SCALAR'; name: 'String'; ofType: null };
        defaultValue: null;
      },
      {
        name: 'adminArea1';
        type: { kind: 'SCALAR'; name: 'String'; ofType: null };
        defaultValue: null;
      },
      {
        name: 'adminArea2';
        type: { kind: 'SCALAR'; name: 'String'; ofType: null };
        defaultValue: null;
      },
      {
        name: 'adminArea3';
        type: { kind: 'SCALAR'; name: 'String'; ofType: null };
        defaultValue: null;
      },
      {
        name: 'adminArea4';
        type: { kind: 'SCALAR'; name: 'String'; ofType: null };
        defaultValue: null;
      },
      {
        name: 'countryCode';
        type: { kind: 'SCALAR'; name: 'String'; ofType: null };
        defaultValue: null;
      },
      {
        name: 'postalCode';
        type: { kind: 'SCALAR'; name: 'String'; ofType: null };
        defaultValue: null;
      },
    ];
  };
  OrderBillingInfoInput: {
    kind: 'INPUT_OBJECT';
    name: 'OrderBillingInfoInput';
    isOneOf: false;
    inputFields: [
      {
        name: 'address';
        type: { kind: 'INPUT_OBJECT'; name: 'OrderAddressInput'; ofType: null };
        defaultValue: null;
      },
      {
        name: 'companyName';
        type: { kind: 'SCALAR'; name: 'String'; ofType: null };
        defaultValue: null;
      },
      {
        name: 'email';
        type: { kind: 'SCALAR'; name: 'String'; ofType: null };
        defaultValue: null;
      },
      {
        name: 'firstName';
        type: { kind: 'SCALAR'; name: 'String'; ofType: null };
        defaultValue: null;
      },
      {
        name: 'lastName';
        type: { kind: 'SCALAR'; name: 'String'; ofType: null };
        defaultValue: null;
      },
      {
        name: 'phone';
        type: { kind: 'SCALAR'; name: 'String'; ofType: null };
        defaultValue: null;
      },
    ];
  };
  OrderContextInputUpdate: {
    kind: 'INPUT_OBJECT';
    name: 'OrderContextInputUpdate';
    isOneOf: false;
    inputFields: [
      {
        name: 'channelId';
        type: {
          kind: 'NON_NULL';
          name: never;
          ofType: { kind: 'SCALAR'; name: 'String'; ofType: null };
        };
        defaultValue: null;
      },
      {
        name: 'storeId';
        type: {
          kind: 'NON_NULL';
          name: never;
          ofType: { kind: 'SCALAR'; name: 'String'; ofType: null };
        };
        defaultValue: null;
      },
    ];
  };
  OrderMetafield: {
    kind: 'OBJECT';
    name: 'OrderMetafield';
    fields: {
      key: {
        name: 'key';
        type: { kind: 'SCALAR'; name: 'String'; ofType: null };
      };
      type: {
        name: 'type';
        type: { kind: 'SCALAR'; name: 'String'; ofType: null };
      };
      value: {
        name: 'value';
        type: { kind: 'SCALAR'; name: 'String'; ofType: null };
      };
    };
  };
  OrderMetafieldInput: {
    kind: 'INPUT_OBJECT';
    name: 'OrderMetafieldInput';
    isOneOf: false;
    inputFields: [
      {
        name: 'key';
        type: {
          kind: 'NON_NULL';
          name: never;
          ofType: { kind: 'SCALAR'; name: 'String'; ofType: null };
        };
        defaultValue: null;
      },
      {
        name: 'type';
        type: {
          kind: 'NON_NULL';
          name: never;
          ofType: { kind: 'ENUM'; name: 'MetafieldTypeInput'; ofType: null };
        };
        defaultValue: 'JSON';
      },
      {
        name: 'value';
        type: {
          kind: 'NON_NULL';
          name: never;
          ofType: { kind: 'SCALAR'; name: 'String'; ofType: null };
        };
        defaultValue: null;
      },
    ];
  };
  OrderShippingInfoInput: {
    kind: 'INPUT_OBJECT';
    name: 'OrderShippingInfoInput';
    isOneOf: false;
    inputFields: [
      {
        name: 'address';
        type: { kind: 'INPUT_OBJECT'; name: 'OrderAddressInput'; ofType: null };
        defaultValue: null;
      },
      {
        name: 'companyName';
        type: { kind: 'SCALAR'; name: 'String'; ofType: null };
        defaultValue: null;
      },
      {
        name: 'email';
        type: { kind: 'SCALAR'; name: 'String'; ofType: null };
        defaultValue: null;
      },
      {
        name: 'firstName';
        type: { kind: 'SCALAR'; name: 'String'; ofType: null };
        defaultValue: null;
      },
      {
        name: 'lastName';
        type: { kind: 'SCALAR'; name: 'String'; ofType: null };
        defaultValue: null;
      },
      {
        name: 'phone';
        type: { kind: 'SCALAR'; name: 'String'; ofType: null };
        defaultValue: null;
      },
    ];
  };
  OrderTotalsInput: {
    kind: 'INPUT_OBJECT';
    name: 'OrderTotalsInput';
    isOneOf: false;
    inputFields: [
      {
        name: 'discountTotal';
        type: {
          kind: 'NON_NULL';
          name: never;
          ofType: { kind: 'INPUT_OBJECT'; name: 'MoneyInput'; ofType: null };
        };
        defaultValue: null;
      },
      {
        name: 'feeTotal';
        type: {
          kind: 'NON_NULL';
          name: never;
          ofType: { kind: 'INPUT_OBJECT'; name: 'MoneyInput'; ofType: null };
        };
        defaultValue: null;
      },
      {
        name: 'shippingTotal';
        type: {
          kind: 'NON_NULL';
          name: never;
          ofType: { kind: 'INPUT_OBJECT'; name: 'MoneyInput'; ofType: null };
        };
        defaultValue: null;
      },
      {
        name: 'subTotal';
        type: {
          kind: 'NON_NULL';
          name: never;
          ofType: { kind: 'INPUT_OBJECT'; name: 'MoneyInput'; ofType: null };
        };
        defaultValue: null;
      },
      {
        name: 'taxTotal';
        type: {
          kind: 'NON_NULL';
          name: never;
          ofType: { kind: 'INPUT_OBJECT'; name: 'MoneyInput'; ofType: null };
        };
        defaultValue: null;
      },
      {
        name: 'total';
        type: {
          kind: 'NON_NULL';
          name: never;
          ofType: { kind: 'INPUT_OBJECT'; name: 'MoneyInput'; ofType: null };
        };
        defaultValue: null;
      },
    ];
  };
  PageInfo: {
    kind: 'OBJECT';
    name: 'PageInfo';
    fields: {
      endCursor: {
        name: 'endCursor';
        type: { kind: 'SCALAR'; name: 'String'; ofType: null };
      };
      hasNextPage: {
        name: 'hasNextPage';
        type: {
          kind: 'NON_NULL';
          name: never;
          ofType: { kind: 'SCALAR'; name: 'Boolean'; ofType: null };
        };
      };
      hasPreviousPage: {
        name: 'hasPreviousPage';
        type: {
          kind: 'NON_NULL';
          name: never;
          ofType: { kind: 'SCALAR'; name: 'Boolean'; ofType: null };
        };
      };
      startCursor: {
        name: 'startCursor';
        type: { kind: 'SCALAR'; name: 'String'; ofType: null };
      };
    };
  };
  PriceAdjustmentShippingLineInput: {
    kind: 'INPUT_OBJECT';
    name: 'PriceAdjustmentShippingLineInput';
    isOneOf: false;
    inputFields: [
      {
        name: 'id';
        type: { kind: 'SCALAR'; name: 'String'; ofType: null };
        defaultValue: null;
      },
      {
        name: 'name';
        type: { kind: 'SCALAR'; name: 'String'; ofType: null };
        defaultValue: null;
      },
      {
        name: 'subTotal';
        type: {
          kind: 'NON_NULL';
          name: never;
          ofType: { kind: 'INPUT_OBJECT'; name: 'MoneyInput'; ofType: null };
        };
        defaultValue: null;
      },
    ];
  };
  PriceAdjustmentsCalculationResult: {
    kind: 'OBJECT';
    name: 'PriceAdjustmentsCalculationResult';
    fields: {
      adjustments: {
        name: 'adjustments';
        type: {
          kind: 'LIST';
          name: never;
          ofType: {
            kind: 'NON_NULL';
            name: never;
            ofType: {
              kind: 'OBJECT';
              name: 'CalculatedAdjustmentOutput';
              ofType: null;
            };
          };
        };
      };
      lines: {
        name: 'lines';
        type: {
          kind: 'LIST';
          name: never;
          ofType: {
            kind: 'NON_NULL';
            name: never;
            ofType: {
              kind: 'OBJECT';
              name: 'CalculatedLineOutput';
              ofType: null;
            };
          };
        };
      };
      totalDiscountAmount: {
        name: 'totalDiscountAmount';
        type: { kind: 'OBJECT'; name: 'SimpleMoney'; ofType: null };
      };
      totalFeeAmount: {
        name: 'totalFeeAmount';
        type: { kind: 'OBJECT'; name: 'SimpleMoney'; ofType: null };
      };
    };
  };
  Query: {
    kind: 'OBJECT';
    name: 'Query';
    fields: {
      checkoutSession: {
        name: 'checkoutSession';
        type: { kind: 'OBJECT'; name: 'CheckoutSession'; ofType: null };
      };
    };
  };
  RemoveShippingMethodInput: {
    kind: 'INPUT_OBJECT';
    name: 'RemoveShippingMethodInput';
    isOneOf: false;
    inputFields: [
      {
        name: 'name';
        type: {
          kind: 'NON_NULL';
          name: never;
          ofType: { kind: 'SCALAR'; name: 'String'; ofType: null };
        };
        defaultValue: null;
      },
      {
        name: 'serviceCode';
        type: { kind: 'SCALAR'; name: 'String'; ofType: null };
        defaultValue: null;
      },
    ];
  };
  SKU: {
    kind: 'OBJECT';
    name: 'SKU';
    fields: {
      attributeValues: {
        name: 'attributeValues';
        type: {
          kind: 'NON_NULL';
          name: never;
          ofType: {
            kind: 'LIST';
            name: never;
            ofType: {
              kind: 'NON_NULL';
              name: never;
              ofType: {
                kind: 'OBJECT';
                name: 'SKUAttributeValue';
                ofType: null;
              };
            };
          };
        };
      };
      attributes: {
        name: 'attributes';
        type: {
          kind: 'NON_NULL';
          name: never;
          ofType: {
            kind: 'LIST';
            name: never;
            ofType: {
              kind: 'NON_NULL';
              name: never;
              ofType: { kind: 'OBJECT'; name: 'SKUAttribute'; ofType: null };
            };
          };
        };
      };
      code: {
        name: 'code';
        type: {
          kind: 'NON_NULL';
          name: never;
          ofType: { kind: 'SCALAR'; name: 'String'; ofType: null };
        };
      };
      createdAt: {
        name: 'createdAt';
        type: {
          kind: 'NON_NULL';
          name: never;
          ofType: { kind: 'SCALAR'; name: 'DateTime'; ofType: null };
        };
      };
      description: {
        name: 'description';
        type: { kind: 'SCALAR'; name: 'String'; ofType: null };
      };
      disableShipping: {
        name: 'disableShipping';
        type: { kind: 'SCALAR'; name: 'Boolean'; ofType: null };
      };
      htmlDescription: {
        name: 'htmlDescription';
        type: { kind: 'SCALAR'; name: 'String'; ofType: null };
      };
      id: {
        name: 'id';
        type: {
          kind: 'NON_NULL';
          name: never;
          ofType: { kind: 'SCALAR'; name: 'ID'; ofType: null };
        };
      };
      label: {
        name: 'label';
        type: { kind: 'SCALAR'; name: 'String'; ofType: null };
      };
      mediaUrls: {
        name: 'mediaUrls';
        type: {
          kind: 'NON_NULL';
          name: never;
          ofType: {
            kind: 'LIST';
            name: never;
            ofType: {
              kind: 'NON_NULL';
              name: never;
              ofType: { kind: 'SCALAR'; name: 'String'; ofType: null };
            };
          };
        };
      };
      metafields: {
        name: 'metafields';
        type: {
          kind: 'NON_NULL';
          name: never;
          ofType: {
            kind: 'OBJECT';
            name: 'SKUMetafieldsConnection';
            ofType: null;
          };
        };
      };
      name: {
        name: 'name';
        type: {
          kind: 'NON_NULL';
          name: never;
          ofType: { kind: 'SCALAR'; name: 'String'; ofType: null };
        };
      };
      prices: {
        name: 'prices';
        type: {
          kind: 'NON_NULL';
          name: never;
          ofType: {
            kind: 'LIST';
            name: never;
            ofType: {
              kind: 'NON_NULL';
              name: never;
              ofType: { kind: 'OBJECT'; name: 'SKUPrice'; ofType: null };
            };
          };
        };
      };
      status: {
        name: 'status';
        type: { kind: 'SCALAR'; name: 'String'; ofType: null };
      };
      unitOfWeight: {
        name: 'unitOfWeight';
        type: { kind: 'SCALAR'; name: 'String'; ofType: null };
      };
      updatedAt: {
        name: 'updatedAt';
        type: {
          kind: 'NON_NULL';
          name: never;
          ofType: { kind: 'SCALAR'; name: 'DateTime'; ofType: null };
        };
      };
      weight: {
        name: 'weight';
        type: { kind: 'SCALAR'; name: 'Float'; ofType: null };
      };
    };
  };
  SKUAttribute: {
    kind: 'OBJECT';
    name: 'SKUAttribute';
    fields: {
      description: {
        name: 'description';
        type: { kind: 'SCALAR'; name: 'String'; ofType: null };
      };
      htmlDescription: {
        name: 'htmlDescription';
        type: { kind: 'SCALAR'; name: 'String'; ofType: null };
      };
      id: {
        name: 'id';
        type: {
          kind: 'NON_NULL';
          name: never;
          ofType: { kind: 'SCALAR'; name: 'ID'; ofType: null };
        };
      };
      label: {
        name: 'label';
        type: { kind: 'SCALAR'; name: 'String'; ofType: null };
      };
      name: {
        name: 'name';
        type: {
          kind: 'NON_NULL';
          name: never;
          ofType: { kind: 'SCALAR'; name: 'String'; ofType: null };
        };
      };
      values: {
        name: 'values';
        type: {
          kind: 'NON_NULL';
          name: never;
          ofType: {
            kind: 'LIST';
            name: never;
            ofType: {
              kind: 'NON_NULL';
              name: never;
              ofType: {
                kind: 'OBJECT';
                name: 'SKUAttributeValue';
                ofType: null;
              };
            };
          };
        };
      };
    };
  };
  SKUAttributeValue: {
    kind: 'OBJECT';
    name: 'SKUAttributeValue';
    fields: {
      id: {
        name: 'id';
        type: {
          kind: 'NON_NULL';
          name: never;
          ofType: { kind: 'SCALAR'; name: 'ID'; ofType: null };
        };
      };
      label: {
        name: 'label';
        type: { kind: 'SCALAR'; name: 'String'; ofType: null };
      };
      name: {
        name: 'name';
        type: {
          kind: 'NON_NULL';
          name: never;
          ofType: { kind: 'SCALAR'; name: 'String'; ofType: null };
        };
      };
    };
  };
  SKUMetafield: {
    kind: 'OBJECT';
    name: 'SKUMetafield';
    fields: {
      id: {
        name: 'id';
        type: {
          kind: 'NON_NULL';
          name: never;
          ofType: { kind: 'SCALAR'; name: 'ID'; ofType: null };
        };
      };
      key: {
        name: 'key';
        type: {
          kind: 'NON_NULL';
          name: never;
          ofType: { kind: 'SCALAR'; name: 'String'; ofType: null };
        };
      };
      namespace: {
        name: 'namespace';
        type: {
          kind: 'NON_NULL';
          name: never;
          ofType: { kind: 'SCALAR'; name: 'String'; ofType: null };
        };
      };
      value: {
        name: 'value';
        type: {
          kind: 'NON_NULL';
          name: never;
          ofType: { kind: 'SCALAR'; name: 'String'; ofType: null };
        };
      };
    };
  };
  SKUMetafieldsConnection: {
    kind: 'OBJECT';
    name: 'SKUMetafieldsConnection';
    fields: {
      edges: {
        name: 'edges';
        type: {
          kind: 'LIST';
          name: never;
          ofType: {
            kind: 'OBJECT';
            name: 'SKUMetafieldsConnectionEdge';
            ofType: null;
          };
        };
      };
      pageInfo: {
        name: 'pageInfo';
        type: {
          kind: 'NON_NULL';
          name: never;
          ofType: { kind: 'OBJECT'; name: 'PageInfo'; ofType: null };
        };
      };
    };
  };
  SKUMetafieldsConnectionEdge: {
    kind: 'OBJECT';
    name: 'SKUMetafieldsConnectionEdge';
    fields: {
      cursor: {
        name: 'cursor';
        type: {
          kind: 'NON_NULL';
          name: never;
          ofType: { kind: 'SCALAR'; name: 'String'; ofType: null };
        };
      };
      node: {
        name: 'node';
        type: { kind: 'OBJECT'; name: 'SKUMetafield'; ofType: null };
      };
    };
  };
  SKUPrice: {
    kind: 'OBJECT';
    name: 'SKUPrice';
    fields: {
      currencyCode: {
        name: 'currencyCode';
        type: {
          kind: 'NON_NULL';
          name: never;
          ofType: { kind: 'SCALAR'; name: 'String'; ofType: null };
        };
      };
      value: {
        name: 'value';
        type: {
          kind: 'NON_NULL';
          name: never;
          ofType: { kind: 'SCALAR'; name: 'Float'; ofType: null };
        };
      };
    };
  };
  SelectedAddon: {
    kind: 'OBJECT';
    name: 'SelectedAddon';
    fields: {
      attribute: {
        name: 'attribute';
        type: { kind: 'SCALAR'; name: 'String'; ofType: null };
      };
      sku: {
        name: 'sku';
        type: { kind: 'SCALAR'; name: 'String'; ofType: null };
      };
      values: {
        name: 'values';
        type: {
          kind: 'LIST';
          name: never;
          ofType: {
            kind: 'NON_NULL';
            name: never;
            ofType: {
              kind: 'OBJECT';
              name: 'SelectedAddonValue';
              ofType: null;
            };
          };
        };
      };
    };
  };
  SelectedAddonInput: {
    kind: 'INPUT_OBJECT';
    name: 'SelectedAddonInput';
    isOneOf: false;
    inputFields: [
      {
        name: 'attribute';
        type: {
          kind: 'NON_NULL';
          name: never;
          ofType: { kind: 'SCALAR'; name: 'String'; ofType: null };
        };
        defaultValue: null;
      },
      {
        name: 'sku';
        type: { kind: 'SCALAR'; name: 'String'; ofType: null };
        defaultValue: null;
      },
      {
        name: 'values';
        type: {
          kind: 'NON_NULL';
          name: never;
          ofType: {
            kind: 'LIST';
            name: never;
            ofType: {
              kind: 'NON_NULL';
              name: never;
              ofType: {
                kind: 'INPUT_OBJECT';
                name: 'SelectedAddonValueInput';
                ofType: null;
              };
            };
          };
        };
        defaultValue: null;
      },
    ];
  };
  SelectedAddonValue: {
    kind: 'OBJECT';
    name: 'SelectedAddonValue';
    fields: {
      costAdjustment: {
        name: 'costAdjustment';
        type: { kind: 'OBJECT'; name: 'MoneyValue'; ofType: null };
      };
      name: {
        name: 'name';
        type: { kind: 'SCALAR'; name: 'String'; ofType: null };
      };
    };
  };
  SelectedAddonValueInput: {
    kind: 'INPUT_OBJECT';
    name: 'SelectedAddonValueInput';
    isOneOf: false;
    inputFields: [
      {
        name: 'amount';
        type: { kind: 'INPUT_OBJECT'; name: 'MoneyInput'; ofType: null };
        defaultValue: null;
      },
      {
        name: 'amountIncreased';
        type: { kind: 'SCALAR'; name: 'Boolean'; ofType: null };
        defaultValue: null;
      },
      {
        name: 'costAdjustment';
        type: {
          kind: 'NON_NULL';
          name: never;
          ofType: { kind: 'INPUT_OBJECT'; name: 'MoneyInput'; ofType: null };
        };
        defaultValue: null;
      },
      {
        name: 'name';
        type: {
          kind: 'NON_NULL';
          name: never;
          ofType: { kind: 'SCALAR'; name: 'String'; ofType: null };
        };
        defaultValue: null;
      },
    ];
  };
  SelectedOption: {
    kind: 'OBJECT';
    name: 'SelectedOption';
    fields: {
      attribute: {
        name: 'attribute';
        type: { kind: 'SCALAR'; name: 'String'; ofType: null };
      };
      values: {
        name: 'values';
        type: {
          kind: 'LIST';
          name: never;
          ofType: {
            kind: 'NON_NULL';
            name: never;
            ofType: { kind: 'SCALAR'; name: 'String'; ofType: null };
          };
        };
      };
    };
  };
  SelectedOptionInput: {
    kind: 'INPUT_OBJECT';
    name: 'SelectedOptionInput';
    isOneOf: false;
    inputFields: [
      {
        name: 'attribute';
        type: {
          kind: 'NON_NULL';
          name: never;
          ofType: { kind: 'SCALAR'; name: 'String'; ofType: null };
        };
        defaultValue: null;
      },
      {
        name: 'values';
        type: {
          kind: 'NON_NULL';
          name: never;
          ofType: {
            kind: 'LIST';
            name: never;
            ofType: {
              kind: 'NON_NULL';
              name: never;
              ofType: { kind: 'SCALAR'; name: 'String'; ofType: null };
            };
          };
        };
        defaultValue: null;
      },
    ];
  };
  ShippingLine: {
    kind: 'OBJECT';
    name: 'ShippingLine';
    fields: {
      amount: {
        name: 'amount';
        type: { kind: 'OBJECT'; name: 'MoneyValue'; ofType: null };
      };
      discounts: {
        name: 'discounts';
        type: {
          kind: 'LIST';
          name: never;
          ofType: {
            kind: 'NON_NULL';
            name: never;
            ofType: { kind: 'OBJECT'; name: 'LineItemDiscount'; ofType: null };
          };
        };
      };
      id: {
        name: 'id';
        type: { kind: 'SCALAR'; name: 'String'; ofType: null };
      };
      metafields: {
        name: 'metafields';
        type: {
          kind: 'LIST';
          name: never;
          ofType: {
            kind: 'NON_NULL';
            name: never;
            ofType: { kind: 'OBJECT'; name: 'OrderMetafield'; ofType: null };
          };
        };
      };
      name: {
        name: 'name';
        type: { kind: 'SCALAR'; name: 'String'; ofType: null };
      };
      requestedProvider: {
        name: 'requestedProvider';
        type: { kind: 'SCALAR'; name: 'String'; ofType: null };
      };
      requestedService: {
        name: 'requestedService';
        type: { kind: 'SCALAR'; name: 'String'; ofType: null };
      };
      taxes: {
        name: 'taxes';
        type: {
          kind: 'LIST';
          name: never;
          ofType: {
            kind: 'NON_NULL';
            name: never;
            ofType: { kind: 'OBJECT'; name: 'LineItemTax'; ofType: null };
          };
        };
      };
      totals: {
        name: 'totals';
        type: { kind: 'OBJECT'; name: 'ShippingLineTotals'; ofType: null };
      };
    };
  };
  ShippingLineTotals: {
    kind: 'OBJECT';
    name: 'ShippingLineTotals';
    fields: {
      subTotal: {
        name: 'subTotal';
        type: { kind: 'OBJECT'; name: 'MoneyValue'; ofType: null };
      };
      taxTotal: {
        name: 'taxTotal';
        type: { kind: 'OBJECT'; name: 'MoneyValue'; ofType: null };
      };
    };
  };
  ShippingLineType: {
    name: 'ShippingLineType';
    enumValues: 'FEE' | 'SHIPPING' | 'SKU';
  };
  ShippingRate: {
    kind: 'OBJECT';
    name: 'ShippingRate';
    fields: {
      carrierCode: {
        name: 'carrierCode';
        type: { kind: 'SCALAR'; name: 'String'; ofType: null };
      };
      cost: {
        name: 'cost';
        type: { kind: 'OBJECT'; name: 'ShippingRateMoneyValue'; ofType: null };
      };
      description: {
        name: 'description';
        type: { kind: 'SCALAR'; name: 'String'; ofType: null };
      };
      displayName: {
        name: 'displayName';
        type: { kind: 'SCALAR'; name: 'String'; ofType: null };
      };
      features: {
        name: 'features';
        type: {
          kind: 'LIST';
          name: never;
          ofType: {
            kind: 'NON_NULL';
            name: never;
            ofType: { kind: 'SCALAR'; name: 'String'; ofType: null };
          };
        };
      };
      maxDeliveryDate: {
        name: 'maxDeliveryDate';
        type: { kind: 'SCALAR'; name: 'String'; ofType: null };
      };
      minDeliveryDate: {
        name: 'minDeliveryDate';
        type: { kind: 'SCALAR'; name: 'String'; ofType: null };
      };
      serviceCode: {
        name: 'serviceCode';
        type: { kind: 'SCALAR'; name: 'String'; ofType: null };
      };
    };
  };
  ShippingRateCalculationResult: {
    kind: 'OBJECT';
    name: 'ShippingRateCalculationResult';
    fields: {
      rates: {
        name: 'rates';
        type: {
          kind: 'LIST';
          name: never;
          ofType: {
            kind: 'NON_NULL';
            name: never;
            ofType: { kind: 'OBJECT'; name: 'ShippingRate'; ofType: null };
          };
        };
      };
    };
  };
  ShippingRateMoneyValue: {
    kind: 'OBJECT';
    name: 'ShippingRateMoneyValue';
    fields: {
      currencyCode: {
        name: 'currencyCode';
        type: { kind: 'SCALAR'; name: 'String'; ofType: null };
      };
      value: {
        name: 'value';
        type: { kind: 'SCALAR'; name: 'Float'; ofType: null };
      };
    };
  };
  SimpleMoney: {
    kind: 'OBJECT';
    name: 'SimpleMoney';
    fields: {
      currencyCode: {
        name: 'currencyCode';
        type: { kind: 'SCALAR'; name: 'String'; ofType: null };
      };
      value: {
        name: 'value';
        type: { kind: 'SCALAR'; name: 'Float'; ofType: null };
      };
    };
  };
  String: unknown;
  TaxDestinationAddressInput: {
    kind: 'INPUT_OBJECT';
    name: 'TaxDestinationAddressInput';
    isOneOf: false;
    inputFields: [
      {
        name: 'addressLine1';
        type: { kind: 'SCALAR'; name: 'String'; ofType: null };
        defaultValue: null;
      },
      {
        name: 'addressLine2';
        type: { kind: 'SCALAR'; name: 'String'; ofType: null };
        defaultValue: null;
      },
      {
        name: 'addressLine3';
        type: { kind: 'SCALAR'; name: 'String'; ofType: null };
        defaultValue: null;
      },
      {
        name: 'adminArea1';
        type: { kind: 'SCALAR'; name: 'String'; ofType: null };
        defaultValue: null;
      },
      {
        name: 'adminArea2';
        type: { kind: 'SCALAR'; name: 'String'; ofType: null };
        defaultValue: null;
      },
      {
        name: 'adminArea3';
        type: { kind: 'SCALAR'; name: 'String'; ofType: null };
        defaultValue: null;
      },
      {
        name: 'adminArea4';
        type: { kind: 'SCALAR'; name: 'String'; ofType: null };
        defaultValue: null;
      },
      {
        name: 'countryCode';
        type: {
          kind: 'NON_NULL';
          name: never;
          ofType: { kind: 'SCALAR'; name: 'String'; ofType: null };
        };
        defaultValue: null;
      },
      {
        name: 'postalCode';
        type: {
          kind: 'NON_NULL';
          name: never;
          ofType: { kind: 'SCALAR'; name: 'String'; ofType: null };
        };
        defaultValue: null;
      },
    ];
  };
  TaxInput: {
    kind: 'INPUT_OBJECT';
    name: 'TaxInput';
    isOneOf: false;
    inputFields: [
      {
        name: 'amount';
        type: {
          kind: 'NON_NULL';
          name: never;
          ofType: { kind: 'INPUT_OBJECT'; name: 'MoneyInput'; ofType: null };
        };
        defaultValue: null;
      },
      {
        name: 'exempted';
        type: { kind: 'SCALAR'; name: 'Boolean'; ofType: null };
        defaultValue: 'false';
      },
      {
        name: 'externalIds';
        type: {
          kind: 'LIST';
          name: never;
          ofType: {
            kind: 'NON_NULL';
            name: never;
            ofType: {
              kind: 'INPUT_OBJECT';
              name: 'ExternalIdsInput';
              ofType: null;
            };
          };
        };
        defaultValue: null;
      },
      {
        name: 'included';
        type: { kind: 'SCALAR'; name: 'Boolean'; ofType: null };
        defaultValue: null;
      },
      {
        name: 'metafields';
        type: {
          kind: 'LIST';
          name: never;
          ofType: {
            kind: 'NON_NULL';
            name: never;
            ofType: {
              kind: 'INPUT_OBJECT';
              name: 'OrderMetafieldInput';
              ofType: null;
            };
          };
        };
        defaultValue: null;
      },
      {
        name: 'name';
        type: {
          kind: 'NON_NULL';
          name: never;
          ofType: { kind: 'SCALAR'; name: 'String'; ofType: null };
        };
        defaultValue: null;
      },
      {
        name: 'ratePercentage';
        type: { kind: 'SCALAR'; name: 'String'; ofType: null };
        defaultValue: null;
      },
      {
        name: 'referenceId';
        type: { kind: 'SCALAR'; name: 'String'; ofType: null };
        defaultValue: null;
      },
    ];
  };
  TaxLineInput: {
    kind: 'INPUT_OBJECT';
    name: 'TaxLineInput';
    isOneOf: false;
    inputFields: [
      {
        name: 'classification';
        type: { kind: 'SCALAR'; name: 'String'; ofType: null };
        defaultValue: null;
      },
      {
        name: 'destination';
        type: {
          kind: 'INPUT_OBJECT';
          name: 'TaxDestinationAddressInput';
          ofType: null;
        };
        defaultValue: null;
      },
      {
        name: 'id';
        type: { kind: 'SCALAR'; name: 'String'; ofType: null };
        defaultValue: null;
      },
      {
        name: 'origin';
        type: {
          kind: 'INPUT_OBJECT';
          name: 'TaxDestinationAddressInput';
          ofType: null;
        };
        defaultValue: null;
      },
      {
        name: 'quantity';
        type: { kind: 'SCALAR'; name: 'Int'; ofType: null };
        defaultValue: null;
      },
      {
        name: 'subtotalPrice';
        type: {
          kind: 'NON_NULL';
          name: never;
          ofType: { kind: 'INPUT_OBJECT'; name: 'MoneyInput'; ofType: null };
        };
        defaultValue: null;
      },
      {
        name: 'type';
        type: { kind: 'ENUM'; name: 'ShippingLineType'; ofType: null };
        defaultValue: null;
      },
      {
        name: 'unitPrice';
        type: { kind: 'INPUT_OBJECT'; name: 'MoneyInput'; ofType: null };
        defaultValue: null;
      },
    ];
  };
  UpdateDiscountInput: {
    kind: 'INPUT_OBJECT';
    name: 'UpdateDiscountInput';
    isOneOf: false;
    inputFields: [
      {
        name: 'amount';
        type: { kind: 'INPUT_OBJECT'; name: 'UpdateMoneyInput'; ofType: null };
        defaultValue: null;
      },
      {
        name: 'appliedBeforeTax';
        type: { kind: 'SCALAR'; name: 'Boolean'; ofType: null };
        defaultValue: 'false';
      },
      {
        name: 'code';
        type: { kind: 'SCALAR'; name: 'String'; ofType: null };
        defaultValue: null;
      },
      {
        name: 'externalIds';
        type: {
          kind: 'LIST';
          name: never;
          ofType: {
            kind: 'NON_NULL';
            name: never;
            ofType: {
              kind: 'INPUT_OBJECT';
              name: 'ExternalIdsInput';
              ofType: null;
            };
          };
        };
        defaultValue: null;
      },
      {
        name: 'id';
        type: { kind: 'SCALAR'; name: 'String'; ofType: null };
        defaultValue: null;
      },
      {
        name: 'metafields';
        type: {
          kind: 'LIST';
          name: never;
          ofType: {
            kind: 'NON_NULL';
            name: never;
            ofType: {
              kind: 'INPUT_OBJECT';
              name: 'OrderMetafieldInput';
              ofType: null;
            };
          };
        };
        defaultValue: null;
      },
      {
        name: 'name';
        type: { kind: 'SCALAR'; name: 'String'; ofType: null };
        defaultValue: null;
      },
      {
        name: 'ratePercentage';
        type: { kind: 'SCALAR'; name: 'String'; ofType: null };
        defaultValue: null;
      },
      {
        name: 'referenceId';
        type: { kind: 'SCALAR'; name: 'String'; ofType: null };
        defaultValue: null;
      },
    ];
  };
  UpdateDraftLineItemInput: {
    kind: 'INPUT_OBJECT';
    name: 'UpdateDraftLineItemInput';
    isOneOf: false;
    inputFields: [
      {
        name: 'details';
        type: {
          kind: 'INPUT_OBJECT';
          name: 'LineItemInputDetailsInfo';
          ofType: null;
        };
        defaultValue: null;
      },
      {
        name: 'discounts';
        type: {
          kind: 'LIST';
          name: never;
          ofType: {
            kind: 'NON_NULL';
            name: never;
            ofType: {
              kind: 'INPUT_OBJECT';
              name: 'DiscountInput';
              ofType: null;
            };
          };
        };
        defaultValue: null;
      },
      {
        name: 'externalId';
        type: { kind: 'SCALAR'; name: 'String'; ofType: null };
        defaultValue: null;
      },
      {
        name: 'fees';
        type: {
          kind: 'LIST';
          name: never;
          ofType: {
            kind: 'NON_NULL';
            name: never;
            ofType: { kind: 'INPUT_OBJECT'; name: 'FeeInput'; ofType: null };
          };
        };
        defaultValue: null;
      },
      {
        name: 'fulfillmentChannelId';
        type: { kind: 'SCALAR'; name: 'String'; ofType: null };
        defaultValue: null;
      },
      {
        name: 'fulfillmentMode';
        type: { kind: 'ENUM'; name: 'LineItemModeInput'; ofType: null };
        defaultValue: null;
      },
      {
        name: 'id';
        type: {
          kind: 'NON_NULL';
          name: never;
          ofType: { kind: 'SCALAR'; name: 'String'; ofType: null };
        };
        defaultValue: null;
      },
      {
        name: 'metafields';
        type: {
          kind: 'LIST';
          name: never;
          ofType: {
            kind: 'NON_NULL';
            name: never;
            ofType: {
              kind: 'INPUT_OBJECT';
              name: 'OrderMetafieldInput';
              ofType: null;
            };
          };
        };
        defaultValue: null;
      },
      {
        name: 'name';
        type: { kind: 'SCALAR'; name: 'String'; ofType: null };
        defaultValue: null;
      },
      {
        name: 'notes';
        type: {
          kind: 'LIST';
          name: never;
          ofType: {
            kind: 'NON_NULL';
            name: never;
            ofType: { kind: 'INPUT_OBJECT'; name: 'NoteInput'; ofType: null };
          };
        };
        defaultValue: '[]';
      },
      {
        name: 'productId';
        type: { kind: 'SCALAR'; name: 'String'; ofType: null };
        defaultValue: null;
      },
      {
        name: 'quantity';
        type: { kind: 'SCALAR'; name: 'Float'; ofType: null };
        defaultValue: null;
      },
      {
        name: 'serviceEndsAt';
        type: { kind: 'SCALAR'; name: 'DateTime'; ofType: null };
        defaultValue: null;
      },
      {
        name: 'serviceStartAt';
        type: { kind: 'SCALAR'; name: 'DateTime'; ofType: null };
        defaultValue: null;
      },
      {
        name: 'shipping';
        type: {
          kind: 'INPUT_OBJECT';
          name: 'LineItemInputShippingInfo';
          ofType: null;
        };
        defaultValue: null;
      },
      {
        name: 'skuId';
        type: { kind: 'SCALAR'; name: 'String'; ofType: null };
        defaultValue: null;
      },
      {
        name: 'tags';
        type: {
          kind: 'LIST';
          name: never;
          ofType: {
            kind: 'NON_NULL';
            name: never;
            ofType: { kind: 'SCALAR'; name: 'String'; ofType: null };
          };
        };
        defaultValue: null;
      },
      {
        name: 'taxes';
        type: {
          kind: 'LIST';
          name: never;
          ofType: {
            kind: 'NON_NULL';
            name: never;
            ofType: { kind: 'INPUT_OBJECT'; name: 'TaxInput'; ofType: null };
          };
        };
        defaultValue: null;
      },
      {
        name: 'totals';
        type: {
          kind: 'INPUT_OBJECT';
          name: 'LineItemTotalsInput';
          ofType: null;
        };
        defaultValue: null;
      },
      {
        name: 'type';
        type: { kind: 'ENUM'; name: 'LineItemTypesInput'; ofType: null };
        defaultValue: null;
      },
      {
        name: 'unitAmount';
        type: { kind: 'INPUT_OBJECT'; name: 'MoneyInput'; ofType: null };
        defaultValue: null;
      },
    ];
  };
  UpdateDraftOrderInput: {
    kind: 'INPUT_OBJECT';
    name: 'UpdateDraftOrderInput';
    isOneOf: false;
    inputFields: [
      {
        name: 'lineItems';
        type: {
          kind: 'INPUT_OBJECT';
          name: 'UpdateDraftOrderLineItemsInput';
          ofType: null;
        };
        defaultValue: null;
      },
      {
        name: 'notes';
        type: {
          kind: 'LIST';
          name: never;
          ofType: {
            kind: 'NON_NULL';
            name: never;
            ofType: { kind: 'INPUT_OBJECT'; name: 'NoteInput'; ofType: null };
          };
        };
        defaultValue: null;
      },
      {
        name: 'taxExempted';
        type: { kind: 'SCALAR'; name: 'Boolean'; ofType: null };
        defaultValue: null;
      },
    ];
  };
  UpdateDraftOrderLineItemsInput: {
    kind: 'INPUT_OBJECT';
    name: 'UpdateDraftOrderLineItemsInput';
    isOneOf: false;
    inputFields: [
      {
        name: 'add';
        type: {
          kind: 'LIST';
          name: never;
          ofType: {
            kind: 'NON_NULL';
            name: never;
            ofType: {
              kind: 'INPUT_OBJECT';
              name: 'CreateDraftLineItemInput';
              ofType: null;
            };
          };
        };
        defaultValue: null;
      },
      {
        name: 'remove';
        type: {
          kind: 'LIST';
          name: never;
          ofType: {
            kind: 'NON_NULL';
            name: never;
            ofType: { kind: 'SCALAR'; name: 'String'; ofType: null };
          };
        };
        defaultValue: null;
      },
      {
        name: 'update';
        type: {
          kind: 'LIST';
          name: never;
          ofType: {
            kind: 'NON_NULL';
            name: never;
            ofType: {
              kind: 'INPUT_OBJECT';
              name: 'UpdateDraftLineItemInput';
              ofType: null;
            };
          };
        };
        defaultValue: null;
      },
    ];
  };
  UpdateDraftShippingLineInput: {
    kind: 'INPUT_OBJECT';
    name: 'UpdateDraftShippingLineInput';
    isOneOf: false;
    inputFields: [
      {
        name: 'amount';
        type: { kind: 'INPUT_OBJECT'; name: 'UpdateMoneyInput'; ofType: null };
        defaultValue: null;
      },
      {
        name: 'discounts';
        type: {
          kind: 'LIST';
          name: never;
          ofType: {
            kind: 'NON_NULL';
            name: never;
            ofType: {
              kind: 'INPUT_OBJECT';
              name: 'UpdateDiscountInput';
              ofType: null;
            };
          };
        };
        defaultValue: null;
      },
      {
        name: 'externalIds';
        type: {
          kind: 'LIST';
          name: never;
          ofType: {
            kind: 'NON_NULL';
            name: never;
            ofType: {
              kind: 'INPUT_OBJECT';
              name: 'ExternalIdsInput';
              ofType: null;
            };
          };
        };
        defaultValue: null;
      },
      {
        name: 'fees';
        type: {
          kind: 'LIST';
          name: never;
          ofType: {
            kind: 'NON_NULL';
            name: never;
            ofType: {
              kind: 'INPUT_OBJECT';
              name: 'UpdateFeeInput';
              ofType: null;
            };
          };
        };
        defaultValue: null;
      },
      {
        name: 'id';
        type: { kind: 'SCALAR'; name: 'String'; ofType: null };
        defaultValue: null;
      },
      {
        name: 'metafields';
        type: {
          kind: 'LIST';
          name: never;
          ofType: {
            kind: 'NON_NULL';
            name: never;
            ofType: {
              kind: 'INPUT_OBJECT';
              name: 'OrderMetafieldInput';
              ofType: null;
            };
          };
        };
        defaultValue: null;
      },
      {
        name: 'name';
        type: { kind: 'SCALAR'; name: 'String'; ofType: null };
        defaultValue: null;
      },
      {
        name: 'requestedProvider';
        type: { kind: 'SCALAR'; name: 'String'; ofType: null };
        defaultValue: null;
      },
      {
        name: 'requestedService';
        type: { kind: 'SCALAR'; name: 'String'; ofType: null };
        defaultValue: null;
      },
      {
        name: 'taxes';
        type: {
          kind: 'LIST';
          name: never;
          ofType: {
            kind: 'NON_NULL';
            name: never;
            ofType: {
              kind: 'INPUT_OBJECT';
              name: 'UpdateTaxInput';
              ofType: null;
            };
          };
        };
        defaultValue: null;
      },
      {
        name: 'totals';
        type: {
          kind: 'INPUT_OBJECT';
          name: 'UpdateDraftShippingLineTotalsInput';
          ofType: null;
        };
        defaultValue: null;
      },
    ];
  };
  UpdateDraftShippingLineTotalsInput: {
    kind: 'INPUT_OBJECT';
    name: 'UpdateDraftShippingLineTotalsInput';
    isOneOf: false;
    inputFields: [
      {
        name: 'subTotal';
        type: { kind: 'INPUT_OBJECT'; name: 'UpdateMoneyInput'; ofType: null };
        defaultValue: null;
      },
      {
        name: 'taxTotal';
        type: { kind: 'INPUT_OBJECT'; name: 'UpdateMoneyInput'; ofType: null };
        defaultValue: null;
      },
    ];
  };
  UpdateFeeInput: {
    kind: 'INPUT_OBJECT';
    name: 'UpdateFeeInput';
    isOneOf: false;
    inputFields: [
      {
        name: 'amount';
        type: { kind: 'INPUT_OBJECT'; name: 'UpdateMoneyInput'; ofType: null };
        defaultValue: null;
      },
      {
        name: 'appliedBeforeTax';
        type: { kind: 'SCALAR'; name: 'Boolean'; ofType: null };
        defaultValue: 'false';
      },
      {
        name: 'externalIds';
        type: {
          kind: 'LIST';
          name: never;
          ofType: {
            kind: 'NON_NULL';
            name: never;
            ofType: {
              kind: 'INPUT_OBJECT';
              name: 'ExternalIdsInput';
              ofType: null;
            };
          };
        };
        defaultValue: null;
      },
      {
        name: 'id';
        type: { kind: 'SCALAR'; name: 'String'; ofType: null };
        defaultValue: null;
      },
      {
        name: 'name';
        type: { kind: 'SCALAR'; name: 'String'; ofType: null };
        defaultValue: null;
      },
      {
        name: 'ratePercentage';
        type: { kind: 'SCALAR'; name: 'String'; ofType: null };
        defaultValue: null;
      },
      {
        name: 'referenceId';
        type: { kind: 'SCALAR'; name: 'String'; ofType: null };
        defaultValue: null;
      },
    ];
  };
  UpdateMoneyInput: {
    kind: 'INPUT_OBJECT';
    name: 'UpdateMoneyInput';
    isOneOf: false;
    inputFields: [
      {
        name: 'currencyCode';
        type: { kind: 'SCALAR'; name: 'String'; ofType: null };
        defaultValue: null;
      },
      {
        name: 'value';
        type: { kind: 'SCALAR'; name: 'Int'; ofType: null };
        defaultValue: null;
      },
    ];
  };
  UpdateNoteInput: {
    kind: 'INPUT_OBJECT';
    name: 'UpdateNoteInput';
    isOneOf: false;
    inputFields: [
      {
        name: 'author';
        type: { kind: 'SCALAR'; name: 'String'; ofType: null };
        defaultValue: null;
      },
      {
        name: 'authorType';
        type: { kind: 'ENUM'; name: 'NoteAuthorTypeInput'; ofType: null };
        defaultValue: null;
      },
      {
        name: 'content';
        type: {
          kind: 'NON_NULL';
          name: never;
          ofType: { kind: 'SCALAR'; name: 'String'; ofType: null };
        };
        defaultValue: null;
      },
      {
        name: 'id';
        type: { kind: 'SCALAR'; name: 'String'; ofType: null };
        defaultValue: null;
      },
      {
        name: 'metafields';
        type: {
          kind: 'LIST';
          name: never;
          ofType: {
            kind: 'NON_NULL';
            name: never;
            ofType: {
              kind: 'INPUT_OBJECT';
              name: 'OrderMetafieldInput';
              ofType: null;
            };
          };
        };
        defaultValue: null;
      },
      {
        name: 'shouldNotifyCustomer';
        type: { kind: 'SCALAR'; name: 'Boolean'; ofType: null };
        defaultValue: 'false';
      },
    ];
  };
  UpdateOrderTaxInput: {
    kind: 'INPUT_OBJECT';
    name: 'UpdateOrderTaxInput';
    isOneOf: false;
    inputFields: [
      {
        name: 'additional';
        type: { kind: 'SCALAR'; name: 'Boolean'; ofType: null };
        defaultValue: 'false';
      },
      {
        name: 'amount';
        type: { kind: 'INPUT_OBJECT'; name: 'UpdateMoneyInput'; ofType: null };
        defaultValue: null;
      },
      {
        name: 'exempted';
        type: { kind: 'SCALAR'; name: 'Boolean'; ofType: null };
        defaultValue: 'false';
      },
      {
        name: 'externalIds';
        type: {
          kind: 'LIST';
          name: never;
          ofType: {
            kind: 'NON_NULL';
            name: never;
            ofType: {
              kind: 'INPUT_OBJECT';
              name: 'ExternalIdsInput';
              ofType: null;
            };
          };
        };
        defaultValue: null;
      },
      {
        name: 'id';
        type: { kind: 'SCALAR'; name: 'String'; ofType: null };
        defaultValue: null;
      },
      {
        name: 'included';
        type: { kind: 'SCALAR'; name: 'Boolean'; ofType: null };
        defaultValue: null;
      },
      {
        name: 'metafields';
        type: {
          kind: 'LIST';
          name: never;
          ofType: {
            kind: 'NON_NULL';
            name: never;
            ofType: {
              kind: 'INPUT_OBJECT';
              name: 'OrderMetafieldInput';
              ofType: null;
            };
          };
        };
        defaultValue: null;
      },
      {
        name: 'name';
        type: { kind: 'SCALAR'; name: 'String'; ofType: null };
        defaultValue: null;
      },
      {
        name: 'ratePercentage';
        type: { kind: 'SCALAR'; name: 'String'; ofType: null };
        defaultValue: null;
      },
      {
        name: 'referenceId';
        type: { kind: 'SCALAR'; name: 'String'; ofType: null };
        defaultValue: null;
      },
    ];
  };
  UpdateShippingLineInput: {
    kind: 'INPUT_OBJECT';
    name: 'UpdateShippingLineInput';
    isOneOf: false;
    inputFields: [
      {
        name: 'amount';
        type: { kind: 'INPUT_OBJECT'; name: 'UpdateMoneyInput'; ofType: null };
        defaultValue: null;
      },
      {
        name: 'externalIds';
        type: {
          kind: 'LIST';
          name: never;
          ofType: {
            kind: 'NON_NULL';
            name: never;
            ofType: {
              kind: 'INPUT_OBJECT';
              name: 'ExternalIdsInput';
              ofType: null;
            };
          };
        };
        defaultValue: null;
      },
      {
        name: 'id';
        type: { kind: 'SCALAR'; name: 'String'; ofType: null };
        defaultValue: null;
      },
      {
        name: 'metafields';
        type: {
          kind: 'LIST';
          name: never;
          ofType: {
            kind: 'NON_NULL';
            name: never;
            ofType: {
              kind: 'INPUT_OBJECT';
              name: 'OrderMetafieldInput';
              ofType: null;
            };
          };
        };
        defaultValue: null;
      },
      {
        name: 'name';
        type: { kind: 'SCALAR'; name: 'String'; ofType: null };
        defaultValue: null;
      },
      {
        name: 'requestedProvider';
        type: { kind: 'SCALAR'; name: 'String'; ofType: null };
        defaultValue: null;
      },
      {
        name: 'requestedService';
        type: { kind: 'SCALAR'; name: 'String'; ofType: null };
        defaultValue: null;
      },
      {
        name: 'taxes';
        type: {
          kind: 'LIST';
          name: never;
          ofType: {
            kind: 'NON_NULL';
            name: never;
            ofType: {
              kind: 'INPUT_OBJECT';
              name: 'UpdateTaxInput';
              ofType: null;
            };
          };
        };
        defaultValue: null;
      },
      {
        name: 'totals';
        type: {
          kind: 'INPUT_OBJECT';
          name: 'UpdateShippingLineTotalsInput';
          ofType: null;
        };
        defaultValue: null;
      },
    ];
  };
  UpdateShippingLineTotalsInput: {
    kind: 'INPUT_OBJECT';
    name: 'UpdateShippingLineTotalsInput';
    isOneOf: false;
    inputFields: [
      {
        name: 'subTotal';
        type: { kind: 'INPUT_OBJECT'; name: 'UpdateMoneyInput'; ofType: null };
        defaultValue: null;
      },
      {
        name: 'taxTotal';
        type: { kind: 'INPUT_OBJECT'; name: 'UpdateMoneyInput'; ofType: null };
        defaultValue: null;
      },
    ];
  };
  UpdateTaxInput: {
    kind: 'INPUT_OBJECT';
    name: 'UpdateTaxInput';
    isOneOf: false;
    inputFields: [
      {
        name: 'amount';
        type: { kind: 'INPUT_OBJECT'; name: 'UpdateMoneyInput'; ofType: null };
        defaultValue: null;
      },
      {
        name: 'exempted';
        type: { kind: 'SCALAR'; name: 'Boolean'; ofType: null };
        defaultValue: 'false';
      },
      {
        name: 'externalIds';
        type: {
          kind: 'LIST';
          name: never;
          ofType: {
            kind: 'NON_NULL';
            name: never;
            ofType: {
              kind: 'INPUT_OBJECT';
              name: 'ExternalIdsInput';
              ofType: null;
            };
          };
        };
        defaultValue: null;
      },
      {
        name: 'id';
        type: { kind: 'SCALAR'; name: 'String'; ofType: null };
        defaultValue: null;
      },
      {
        name: 'included';
        type: { kind: 'SCALAR'; name: 'Boolean'; ofType: null };
        defaultValue: null;
      },
      {
        name: 'metafields';
        type: {
          kind: 'LIST';
          name: never;
          ofType: {
            kind: 'NON_NULL';
            name: never;
            ofType: {
              kind: 'INPUT_OBJECT';
              name: 'OrderMetafieldInput';
              ofType: null;
            };
          };
        };
        defaultValue: null;
      },
      {
        name: 'name';
        type: { kind: 'SCALAR'; name: 'String'; ofType: null };
        defaultValue: null;
      },
      {
        name: 'ratePercentage';
        type: { kind: 'SCALAR'; name: 'String'; ofType: null };
        defaultValue: null;
      },
      {
        name: 'referenceId';
        type: { kind: 'SCALAR'; name: 'String'; ofType: null };
        defaultValue: null;
      },
    ];
  };
};

/** An IntrospectionQuery representation of your schema.
 *
 * @remarks
 * This is an introspection of your schema saved as a file by GraphQLSP.
 * It will automatically be used by `gql.tada` to infer the types of your GraphQL documents.
 * If you need to reuse this data or update your `scalars`, update `tadaOutputLocation` to
 * instead save to a .ts instead of a .d.ts file.
 */
export type introspection = {
  name: never;
  query: 'Query';
  mutation: 'Mutation';
  subscription: never;
  types: introspection_types;
};

import * as gqlTada from 'gql.tada';

declare module 'gql.tada' {
  interface setupSchema {
    introspection: introspection;
  }
}
