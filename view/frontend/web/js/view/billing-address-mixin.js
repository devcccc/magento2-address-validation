/*jshint browser:true jquery:true*/
/*global alert*/
define([
    'jquery',
    'CCCC_Addressvalidation/js/operation/check/address',
], function ($, addresscheck) {
    'use strict';

    var mixin = {
        ccccCheckAddress: function () {
            if (window.checkoutConfig.cccc.addressvalidation.endereco.enabled && window.checkoutConfig.cccc.addressvalidation.endereco.check.billing_enabled) {
                return true;
            }
            return false;
        },
        updateAddress: function () {
            if (!this.ccccCheckAddress()) {
                return this._super();
            }
            
            var addressChecked = this.source.get('cccc_address_checked');
            if (!addressChecked) {
                var address = this.source.get(this.dataScopePrefix);
                if (!this.isAddressFormVisible()) {
                    address = this.selectedAddress()
                }
                addresscheck(address, true, this, 'saveNewAddress');
            } else {
                this.source.set('cccc_address_checked', false);
                return this._super();
            }
        },

        ccccGetAdressDataFieldselector: function(field, fallback) {
            var fieldSelector = window.checkoutConfig.cccc.addressvalidation.endereco.mapping && window.checkoutConfig.cccc.addressvalidation.endereco.mapping[field]
                ? window.checkoutConfig.cccc.addressvalidation.endereco.mapping[field] : fallback;

            return fieldSelector;
        },

        ccccGetAddressDataByFieldSelector: function(field, fallback) {
            var fieldSelector = this.ccccGetAdressDataFieldselector(field, fallback);

            return fieldSelector.replace(/\[([0-9]+)\]/, ".$1");
        },

        ccccUpdateAddress: function (addressData) {
            this.ccccUpdateAddressSource(addressData);
        },

        ccccUpdateAddressSource: function (addressData) {
            this.source.set(this.dataScopePrefix + ".region_id", null);
            this.source.set(this.dataScopePrefix +".region", null);
            this.source.set(this.dataScopePrefix + "." + this.ccccGetAddressDataByFieldSelector('postCode', 'postcode'), addressData.postCode);
            this.source.set(this.dataScopePrefix + "." + this.ccccGetAddressDataByFieldSelector('cityName', 'city'), addressData.city);

            if (this.ccccGetAdressDataFieldselector('street', 'street[0]') != this.ccccGetAdressDataFieldselector('houseNumber', 'street[1]')) {
                this.source.set(this.dataScopePrefix + "." + this.ccccGetAddressDataByFieldSelector('street', 'street[0]'), addressData.street);
                this.source.set(this.dataScopePrefix + "." + this.ccccGetAddressDataByFieldSelector('houseNumber', 'street[1]'), addressData.houseNumber);
            } else {
                this.source.set(this.dataScopePrefix + "." + this.ccccGetAddressDataByFieldSelector('street', 'street[0]'), addressData.street + " " + addressData.houseNumber);
            }
        },
        ccccContinue: function () {
            this.source.set('cccc_address_checked', true);
            this.updateAddress();
        }
    }

    return function (billing_address) {
        return billing_address.extend(mixin);
    };
});
