/*jshint browser:true jquery:true*/
/*global alert*/
define([
    'jquery',
    'CCCC_Addressvalidation/js/operation/edit-address',
    'Magento_Checkout/js/model/quote',
    'Magento_Checkout/js/action/select-billing-address',
    'Magento_Checkout/js/checkout-data',
    'CCCC_Addressvalidation/js/helper/logger',
    'CCCC_Addressvalidation/js/helper/configuration',
    'CCCC_Addressvalidation/js/helper/address',
    'CCCC_Addressvalidation/js/endereco-setup',
    'Magento_Checkout/js/model/payment/place-order-hooks'
], function ($, editAddress, quote, selectBillingAddressAction, checkoutData, logger, configurationHelper, addressHelper, enderecosdk, placeOrderHooks) {
    'use strict';

    var mixin = {
        initialize: function () {
            this._super();
            // TODO: Fix several address forms (per payment method!)
            var amsPrefix = {
                countryCode: "[name='billingAddress."+configurationHelper.ccccGetAddressDataByFieldSelector('country_id', 'country_id')+"'] select[name]",
                postalCode: "[name='billingAddress."+configurationHelper.ccccGetAddressDataByFieldSelector('postCode', 'postcode')+"'] input[name]",
                locality: "[name='billingAddress."+configurationHelper.ccccGetAddressDataByFieldSelector('cityName', 'city')+"'] input[name]",
                streetFull: configurationHelper.ccccGetAddressDataByFieldSelector('street', 'street.0') === configurationHelper.ccccGetAddressDataByFieldSelector('houseNumber', 'street.1')?"[name='billingAddress."+configurationHelper.ccccGetAddressDataByFieldSelector('street', 'street.0')+"'] input[name]":"",
                streetName: configurationHelper.ccccGetAddressDataByFieldSelector('street', 'street.0') !== configurationHelper.ccccGetAddressDataByFieldSelector('houseNumber', 'street.1')?"[name='billingAddress."+configurationHelper.ccccGetAddressDataByFieldSelector('street', 'street.0')+"'] input[name]":"",
                buldingNumber: configurationHelper.ccccGetAddressDataByFieldSelector('street', 'street.0') !== configurationHelper.ccccGetAddressDataByFieldSelector('houseNumber', 'street.1')?"[name='billingAddress."+configurationHelper.ccccGetAddressDataByFieldSelector('houseNumber', 'street.1')+"'] input[name]":"",
                additionalInfo: '',
                addressStatus: '[name="enderecoamsstatus"]',
                addressTimestamp: '[name="enderecoamsts"]',
                addressPredictions: '[name="enderecoamsapredictions"]'
            };

            enderecosdk.startAms(
                amsPrefix,
                {
                    name: 'billing_address',
                    addressType: 'general_address'
                }
            );

            placeOrderHooks.requestModifiers.push(function (headers, payload) {
                if (payload.paymentMethod['extension_attributes'] === undefined) {
                    payload.paymentMethod['extension_attributes'] = {};
                }

                payload.paymentMethod['extension_attributes']['cccc_validation_shipping_result'] =
                    enderecosdk.getAddressStatusAsText(window.EnderecoIntegrator.integratedObjects.shipping_address_ams._addressStatus);
            });
            return this;
        },

        ccccCheckAddress: function () {
            if (window.checkoutConfig.cccc.addressvalidation.endereco.enabled && window.checkoutConfig.cccc.addressvalidation.endereco.check.billing_enabled) {
                logger.logData(
                    "billing-address-mixin/ccccCheckAddress: Billing address will be validated by Endereco API"
                );
                return true;
            }

            logger.logData(
                "billing-address-mixin/ccccCheckAddress: Billing address won't be validated by Endereco API"
            );
            return false;
        },
        updateAddress: function () {
            logger.logData(
                "billing-address-mixin/updateAddress: Starting update procedure"
            );
            if (!this.ccccCheckAddress()) {
                logger.logData(
                    "billing-address-mixin/updateAddress: Using Magento-Base-functionality"
                );
                return this._super();
            }

            var addressChecked = this.source.get('cccc_address_checked');
            if (!addressChecked) {
                var address = this.source.get(this.dataScopePrefix);
                if (!this.isAddressFormVisible()) {
                    address = this.selectedAddress()
                }
                logger.logData(
                    "billing-address-mixin/updateAddress: Address got not checked/was changed: "+JSON.stringify(address)
                );
                logger.logData(
                    "billing-address-mixin/updateAddress: Doing validation..."
                );
                //addresscheck(address, true, this, 'saveNewAddress');
                logger.logData(
                    "billing-address-mixin/updateAddress: Validation done"
                );
            } else {
                logger.logData(
                    "billing-address-mixin/updateAddress: Address already checked/not changed. Skipping."
                );
                this.source.set('cccc_address_checked', false);
                return this._super();
            }
        },

        ccccGetAdressDataFieldselector: function(field, fallback) {
            var fieldSelector = window.checkoutConfig.cccc.addressvalidation.endereco.mapping && window.checkoutConfig.cccc.addressvalidation.endereco.mapping[field]
                ? window.checkoutConfig.cccc.addressvalidation.endereco.mapping[field] : fallback;
            logger.logData(
                "billing-address-mixin/ccccGetAdressDataFieldselector: Retrieved field selector for "+field+" (fallback: "+fallback+") => result: "+fieldSelector
            );
            return fieldSelector;
        },

        ccccGetAddressDataByFieldSelector: function(field, fallback) {
            var fieldSelector = this.ccccGetAdressDataFieldselector(field, fallback);

            logger.logData(
                "billing-address-mixin/ccccGetAddressDataByFieldSelector: Retrieved field selector for "+field+" (fallback: "+fallback+") => result: "+fieldSelector
                +JSON.stringify(addressData)
            );

            return fieldSelector.replace(/\[([0-9]+)\]/, ".$1");
        },

        ccccUpdateAddress: function (addressData) {
            logger.logData(
                "billing-address-mixin/ccccUpdateAddress: Updating address: "+JSON.stringify(addressData)
            );
            this.ccccUpdateAddressSource(addressData);
        },

        ccccUpdateAddressSource: function (addressData) {
            logger.logData(
                "billing-address-mixin/ccccUpdateAddressSource: Setting field "+this.dataScopePrefix + ".region_id => (null)"
            );
            this.source.set(this.dataScopePrefix + ".region_id", null);
            logger.logData(
                "billing-address-mixin/ccccUpdateAddressSource: Setting field "+this.dataScopePrefix + ".region => (null)"
            );
            this.source.set(this.dataScopePrefix +".region", null);
            logger.logData(
                "billing-address-mixin/ccccUpdateAddressSource: Setting field "+this.dataScopePrefix + "."+this.ccccGetAddressDataByFieldSelector('postCode', 'postcode')+" => "
                +addressData.postCode
            );
            this.source.set(this.dataScopePrefix + "." + this.ccccGetAddressDataByFieldSelector('postCode', 'postcode'), addressData.postCode);
            logger.logData(
                "billing-address-mixin/ccccUpdateAddressSource: Setting field "+this.dataScopePrefix + "."+this.ccccGetAddressDataByFieldSelector('cityName', 'city')+" => "
                +addressData.city
            );
            this.source.set(this.dataScopePrefix + "." + this.ccccGetAddressDataByFieldSelector('cityName', 'city'), addressData.city);

            if (this.ccccGetAdressDataFieldselector('street', 'street[0]') != this.ccccGetAdressDataFieldselector('houseNumber', 'street[1]')) {
                logger.logData(
                    "billing-address-mixin/ccccUpdateAddressSource: Setting field "+this.dataScopePrefix + "."+this.ccccGetAddressDataByFieldSelector('street', 'street[0]')+" => "
                    +addressData.street
                );
                this.source.set(this.dataScopePrefix + "." + this.ccccGetAddressDataByFieldSelector('street', 'street[0]'), addressData.street);
                logger.logData(
                    "billing-address-mixin/ccccUpdateAddressSource: Setting field "+this.dataScopePrefix + "."+this.ccccGetAddressDataByFieldSelector('houseNumber', 'street[1]')+" => "
                    +addressData.houseNumber
                );
                this.source.set(this.dataScopePrefix + "." + this.ccccGetAddressDataByFieldSelector('houseNumber', 'street[1]'), (addressData.houseNumber?addressData.houseNumber:""));
            } else {
                logger.logData(
                    "billing-address-mixin/ccccUpdateAddressSource: Setting combined field "+this.dataScopePrefix + "."+this.ccccGetAddressDataByFieldSelector('street', 'street[0]')+" => "
                    + addressData.street + " " + addressData.houseNumber
                );
                this.source.set(this.dataScopePrefix + "." + this.ccccGetAddressDataByFieldSelector('street', 'street[0]'), addressData.street + (addressData.houseNumber?" " + addressData.houseNumber:""));
            }
        },
        ccccContinue: function () {
            logger.logData(
                "billing-address-mixin/ccccContinue: Setting address as checked"
            );
            this.source.set('cccc_address_checked', true);
            logger.logData(
                "billing-address-mixin/ccccContinue: Calling updateAdddress"
            );
            this.updateAddress();
        }
    }

    return function (billing_address) {
        return billing_address.extend(mixin);
    };
});
