/*jshint browser:true jquery:true*/
/*global alert*/
define([
    'jquery',
    'CCCC_Addressvalidation/js/operation/check/address',
    'CCCC_Addressvalidation/js/operation/edit-address',
    'Magento_Checkout/js/model/quote',
    'Magento_Checkout/js/action/select-shipping-address',
    'Magento_Checkout/js/checkout-data'
], function ($, addresscheck, editAddress, quote, selectShippingAddressAction, checkoutData) {
    'use strict';

    var mixin = {
        ccccCheckAddress: function () {
            if (window.checkoutConfig.cccc.addressvalidation.endereco.enabled && window.checkoutConfig.cccc.addressvalidation.endereco.check.shipping_enabled) {
                return true;
            }
            return false;
        },
        saveNewAddress: function () {
            if (!this.ccccCheckAddress()) {
                return this._super();
            }

            if (!this.source.get('cccc_address_checked')) {
                addresscheck(this.source.get('shippingAddress'), false, this, 'saveNewAddress');
            } else {
                this.source.set('cccc_address_checked', false);
                return this._super();
            }
        },
        ccccReplaceInSelectedShippingAddress: function (sReplace, sReplaceWith) {
            var oElem = $('.shipping-address-item.selected-item');
            if (oElem.length > 0) {
                oElem.html(oElem.html().replace(sReplace, sReplaceWith));
            }
        },
        ccccUpdateField: function(oSourceAddress, oResponseData, sField) {
            var matches = sField.match(/([^\.]+)\.(\d)+/);
            if (matches) {
                if (oSourceAddress[matches[1]][matches[2]] !== oResponseData) {
                    this.ccccReplaceInSelectedShippingAddress(oSourceAddress[matches[1]][matches[2]], oResponseData);
                    if (typeof oSourceAddress[matches[1]][matches[2]] === "undefined") {
                        oSourceAddress[matches[1]][matches[2]] = oSourceAddress[matches[1]][matches[2]] + " " + oResponseData;
                    } else {
                        oSourceAddress[matches[1]][matches[2]] = oResponseData;
                    }
                }
            } else {
                if (oSourceAddress[sField] !== oResponseData) {
                    this.ccccReplaceInSelectedShippingAddress(oSourceAddress[sField], oResponseData);
                    oSourceAddress[sField] = oResponseData;
                }
            }
            return oSourceAddress;
        },
        ccccUpdateAddress: function (addressData) {
            if (this.isFormInline) {
                this.ccccUpdateAddressSource(addressData);
            } else {
                this.ccccUpdateAddressRegistered(addressData);
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

        ccccUpdateAddressSource: function (addressData) {
            this.source.set("shippingAddress." + this.ccccGetAddressDataByFieldSelector('postCode', 'postcode'), addressData.postCode);
            this.source.set("shippingAddress." + this.ccccGetAddressDataByFieldSelector('cityName', 'city'), addressData.city);
            if (this.ccccGetAdressDataFieldselector('street', 'street[0]') != this.ccccGetAdressDataFieldselector('houseNumber', 'street[1]')) {
                this.source.set("shippingAddress." + this.ccccGetAddressDataByFieldSelector('street', 'street[0]'), addressData.street);
                this.source.set("shippingAddress." + this.ccccGetAddressDataByFieldSelector('houseNumber', 'street[1]'), addressData.houseNumber);
            } else {
                this.source.set("shippingAddress." + this.ccccGetAddressDataByFieldSelector('street', 'street[0]'), addressData.street + " " + addressData.houseNumber);
            }



            this.source.set("shippingAddress.region_id", null);
            this.source.set("shippingAddress.region", null);
        },
        ccccUpdateAddressRegistered: function (addressData) {
            var newShippingAddress = quote.shippingAddress();

            newShippingAddress = this.ccccUpdateField(newShippingAddress, addressData.postCode, this.ccccGetAddressDataByFieldSelector('postCode', 'postcode'));
            newShippingAddress = this.ccccUpdateField(newShippingAddress, addressData.city, this.ccccGetAddressDataByFieldSelector('cityName', 'city'));
            if (this.ccccGetAdressDataFieldselector('street', 'street[0]') != this.ccccGetAdressDataFieldselector('houseNumber', 'street[1]')) {
                newShippingAddress = this.ccccUpdateField(newShippingAddress, addressData.street, this.ccccGetAddressDataByFieldSelector('street', 'street[0]'));
                newShippingAddress = this.ccccUpdateField(newShippingAddress, addressData.houseNumber, this.ccccGetAddressDataByFieldSelector('houseNumber', 'street[1]'));
            } else {
                newShippingAddress = this.ccccUpdateField(newShippingAddress, addressData.street + " " + addressData.houseNumber, this.ccccGetAddressDataByFieldSelector('street', 'street[0]'));
            }
            newShippingAddress = this.ccccUpdateField(newShippingAddress, null, "region_id");
            newShippingAddress = this.ccccUpdateField(newShippingAddress, null, "region");

            this.ccccUpdateAddressSource(addressData);

            editAddress(newShippingAddress);

            selectShippingAddressAction(newShippingAddress);
            checkoutData.setSelectedShippingAddress(newShippingAddress.getKey());
        },
        ccccContinue: function (sType) {
            if (sType == 'saveNewAddress') {
                this.source.set('cccc_address_checked', true);
                this.saveNewAddress();
            } else if (sType == 'setShippingInformation') {
                this.source.set('cccc_guest_address_checked', true);
                this.setShippingInformation();
            }
        },
        validateShippingInformation: function() {
            var superResult = this._super();

            if (!this.ccccCheckAddress()) {
                return superResult;
            }

            if (!this.source.get('cccc_guest_address_checked')) {
                if (superResult) {
                    if (!this.isFormInline) {
                        var quoteAddress = quote.shippingAddress();
                        var data = {
                            'country_id': quoteAddress['countryId'],
                            'postcode': quoteAddress['postcode'],
                            'street': quoteAddress['street']
                        };

                        addresscheck(data, false, this, 'setShippingInformation');
                    } else {
                        addresscheck(this.source.get('shippingAddress'), false, this, 'setShippingInformation');
                    }
                    return false;
                }
            } else {
                this.source.set('cccc_guest_address_checked', false);
            }

            return superResult;
        }
    };

    return function (shipping) {
        return shipping.extend(mixin);
    };
});
