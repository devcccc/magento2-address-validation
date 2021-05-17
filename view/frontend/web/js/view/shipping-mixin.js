/*jshint browser:true jquery:true*/
/*global alert*/
define([
    'jquery',
    'CCCC_Addressvalidation/js/operation/check/address',
    'CCCC_Addressvalidation/js/operation/edit-address',
    'Magento_Checkout/js/model/quote',
    'Magento_Checkout/js/action/select-shipping-address',
    'Magento_Checkout/js/checkout-data',
    'CCCC_Addressvalidation/js/helper/logger'
], function ($, addresscheck, editAddress, quote, selectShippingAddressAction, checkoutData, logger) {
    'use strict';

    var mixin = {
        ccccCheckAddress: function () {
            if (window.checkoutConfig.cccc.addressvalidation.endereco.enabled && window.checkoutConfig.cccc.addressvalidation.endereco.check.shipping_enabled) {
                logger.logData(
                    "shipping-mixin/ccccCheckAddress: Shipping address will be validated by Endereco API"
                );
                return true;
            }
            logger.logData(
                "shipping-mixin/ccccCheckAddress: Shipping address won't be validated by Endereco API"
            );
            return false;
        },
        saveNewAddress: function () {
            logger.logData(
                "shipping-mixin/saveNewAddress: Saving new address"
            );
            if (!this.ccccCheckAddress()) {
                logger.logData(
                    "shipping-mixin/saveNewAddress: Using magento base functionality"
                );
                return this._super();
            }

            if (!this.source.get('cccc_address_checked')) {
                logger.logData(
                    "shipping-mixin/saveNewAddress: Address not yet validated, starting validation"
                );
                addresscheck(this.source.get('shippingAddress'), false, this, 'saveNewAddress');
            } else {
                logger.logData(
                    "shipping-mixin/saveNewAddress: Address already validated, resetting marker and storing address"
                );
                this.source.set('cccc_address_checked', false);
                return this._super();
            }
        },
        ccccReplaceInSelectedShippingAddress: function (sReplace, sReplaceWith) {
            var oElem = $('.shipping-address-item.selected-item');
            logger.logData(
                "shipping-mixin/ccccReplaceInSelectedShippingAddress: Replacing "+sReplace+" => "+sReplaceWith
            );
            if (oElem.length > 0) {
                logger.logData(
                    "shipping-mixin/ccccReplaceInSelectedShippingAddress: Replacing "+sReplace+" => "+sReplaceWith+" within element-html "+oElem.html()
                );
                oElem.html(oElem.html().replace(sReplace, sReplaceWith));
            } else {
                logger.logData(
                    "shipping-mixin/ccccReplaceInSelectedShippingAddress: No selected shipping address item found, skipping "
                );
            }
        },
        ccccUpdateField: function(oSourceAddress, oResponseData, sField) {
            logger.logData(
                "shipping-mixin/ccccUpdateField: Trying to update field "+sField+" with new value "+oResponseData+" within address data "
                +JSON.stringify(oSourceAddress)
            );

            var matches = sField.match(/([^\.]+)\.(\d)+/);
            if (matches) {
                logger.logData(
                    "shipping-mixin/ccccUpdateField: Multidimensional field, checking if data changed "+oSourceAddress[matches[1]][matches[2]]+"  => "+oResponseData
                );
                if (oSourceAddress[matches[1]][matches[2]] !== oResponseData) {
                    logger.logData(
                        "shipping-mixin/ccccUpdateField: Multidimensional field, data changed "+oSourceAddress[matches[1]][matches[2]]+"  => "+oResponseData
                    );
                    this.ccccReplaceInSelectedShippingAddress(oSourceAddress[matches[1]][matches[2]], oResponseData);
                    logger.logData(
                        "shipping-mixin/ccccUpdateField: Multidimensional field => new value: "+oResponseData
                    );
                    oSourceAddress[matches[1]][matches[2]] = oResponseData;
                }
            } else {
                logger.logData(
                    "shipping-mixin/ccccUpdateField: Simple field, checking if data got changed "+oSourceAddress[sField]+"  => "+oResponseData
                );
                if (oSourceAddress[sField] !== oResponseData) {
                    logger.logData(
                        "shipping-mixin/ccccUpdateField: Simple field, data changed "+oSourceAddress[sField]+"  => "+oResponseData
                        +" - set new value"
                    );
                    this.ccccReplaceInSelectedShippingAddress(oSourceAddress[sField], oResponseData);
                    oSourceAddress[sField] = oResponseData;
                }
            }
            return oSourceAddress;
        },
        ccccUpdateAddress: function (addressData) {
            logger.logData(
                "shipping-mixin/ccccUpdateAddress: Doing address update => "+JSON.stringify(addressData)
            );
            if (this.isFormInline) {
                logger.logData(
                    "shipping-mixin/ccccUpdateAddress: Form is inline"
                );
                this.ccccUpdateAddressSource(addressData);
            } else {
                logger.logData(
                    "shipping-mixin/ccccUpdateAddress: Update address book entry"
                );
                this.ccccUpdateAddressRegistered(addressData);
            }
        },

        ccccGetAdressDataFieldselector: function(field, fallback) {
            var fieldSelector = window.checkoutConfig.cccc.addressvalidation.endereco.mapping && window.checkoutConfig.cccc.addressvalidation.endereco.mapping[field]
                ? window.checkoutConfig.cccc.addressvalidation.endereco.mapping[field] : fallback;

            logger.logData(
                "shipping-mixin/ccccGetAdressDataFieldselector: Determined field selector for "+field+" (fallback: "+fallback+") => result: "+fieldSelector
            );

            return fieldSelector;
        },

        ccccGetAddressDataByFieldSelector: function(field, fallback) {
            var fieldSelector = this.ccccGetAdressDataFieldselector(field, fallback);
            var val = fieldSelector.replace(/\[([0-9]+)\]/, ".$1");
            logger.logData(
                "shipping-mixin/ccccGetAddressDataByFieldSelector: Determined field selector for "+field+" (fallback: "+fallback+") => normalized result: "+val
            );
            return val;
        },

        ccccUpdateAddressSource: function (addressData) {
            logger.logData(
                "shipping-mixin/ccccUpdateAddressSource: Setting field shippingAddress."
                +this.ccccGetAddressDataByFieldSelector('postCode', 'postcode')+" => "
                +addressData.postCode
            );
            this.source.set("shippingAddress." + this.ccccGetAddressDataByFieldSelector('postCode', 'postcode'), addressData.postCode);
            logger.logData(
                "shipping-mixin/ccccUpdateAddressSource: Setting field shippingAddress."
                +this.ccccGetAddressDataByFieldSelector('cityName', 'city')+" => "
                +addressData.city
            );
            this.source.set("shippingAddress." + this.ccccGetAddressDataByFieldSelector('cityName', 'city'), addressData.city);
            if (this.ccccGetAdressDataFieldselector('street', 'street[0]') != this.ccccGetAdressDataFieldselector('houseNumber', 'street[1]')) {
                logger.logData(
                    "shipping-mixin/ccccUpdateAddressSource: Setting field shippingAddress."
                    +this.ccccGetAddressDataByFieldSelector('street', 'street[0]')+" => "
                    +addressData.street
                );
                this.source.set("shippingAddress." + this.ccccGetAddressDataByFieldSelector('street', 'street[0]'), addressData.street);
                logger.logData(
                    "shipping-mixin/ccccUpdateAddressSource: Setting field shippingAddress."
                    +this.ccccGetAddressDataByFieldSelector('houseNumber', 'street[1]')+" => "
                    +addressData.houseNumber
                );
                this.source.set("shippingAddress." + this.ccccGetAddressDataByFieldSelector('houseNumber', 'street[1]'), (addressData.houseNumber?addressData.houseNumber:""));
            } else {
                logger.logData(
                    "shipping-mixin/ccccUpdateAddressSource: Setting combined field shippingAddress."
                    +this.ccccGetAddressDataByFieldSelector('street', 'street[0]')+" => "
                    +addressData.street + " " + addressData.houseNumber
                );
                this.source.set("shippingAddress." + this.ccccGetAddressDataByFieldSelector('street', 'street[0]'), addressData.street + (addressData.houseNumber?" " + addressData.houseNumber:""));
            }

            logger.logData(
                "shipping-mixin/ccccUpdateAddressSource: Setting field shippingAddress.region => (null)"
            );
            this.source.set("shippingAddress.region_id", null);
            logger.logData(
                "shipping-mixin/ccccUpdateAddressSource: Setting field shippingAddress.region => (null)"
            );
            this.source.set("shippingAddress.region", null);
        },
        ccccUpdateAddressRegistered: function (addressData) {
            var newShippingAddress = quote.shippingAddress();

            logger.logData(
                "shipping-mixin/ccccUpdateAddressRegistered: Setting field "
                +this.ccccGetAddressDataByFieldSelector('postCode', 'postcode')+" => "
                +addressData.postCode
            );
            newShippingAddress = this.ccccUpdateField(newShippingAddress, addressData.postCode, this.ccccGetAddressDataByFieldSelector('postCode', 'postcode'));
            logger.logData(
                "shipping-mixin/ccccUpdateAddressRegistered: Setting field "
                +this.ccccGetAddressDataByFieldSelector('city', 'cityName')+" => "
                +addressData.city
            );
            newShippingAddress = this.ccccUpdateField(newShippingAddress, addressData.city, this.ccccGetAddressDataByFieldSelector('cityName', 'city'));
            if (this.ccccGetAdressDataFieldselector('street', 'street[0]') != this.ccccGetAdressDataFieldselector('houseNumber', 'street[1]')) {
                logger.logData(
                    "shipping-mixin/ccccUpdateAddressRegistered: Setting field "
                    +this.ccccGetAddressDataByFieldSelector('street', 'street[0]')+" => "
                    +addressData.street
                );
                newShippingAddress = this.ccccUpdateField(newShippingAddress, addressData.street, this.ccccGetAddressDataByFieldSelector('street', 'street[0]'));
                logger.logData(
                    "shipping-mixin/ccccUpdateAddressRegistered: Setting field "
                    +this.ccccGetAddressDataByFieldSelector('street', 'street[1]')+" => "
                    +addressData.houseNumber
                );
                newShippingAddress = this.ccccUpdateField(newShippingAddress, addressData.houseNumber, this.ccccGetAddressDataByFieldSelector('houseNumber', 'street[1]'));
            } else {
                logger.logData(
                    "shipping-mixin/ccccUpdateAddressRegistered: Setting combined field "
                    +this.ccccGetAddressDataByFieldSelector('street', 'street[0]')+" => "
                    +addressData.street+" "+addressData.houseNumber
                );
                newShippingAddress = this.ccccUpdateField(newShippingAddress, addressData.street + " " + addressData.houseNumber, this.ccccGetAddressDataByFieldSelector('street', 'street[0]'));
            }
            logger.logData(
                "shipping-mixin/ccccUpdateAddressRegistered: Setting field region_id => (null)"
            );
            newShippingAddress = this.ccccUpdateField(newShippingAddress, null, "region_id");
            logger.logData(
                "shipping-mixin/ccccUpdateAddressRegistered: Setting field region => (null)"
            );
            newShippingAddress = this.ccccUpdateField(newShippingAddress, null, "region");

            this.ccccUpdateAddressSource(addressData);

            logger.logData(
                "shipping-mixin/ccccUpdateAddressRegistered: Set new selected shipping address "+JSON.stringify(newShippingAddress)
            );
            editAddress(newShippingAddress);
            selectShippingAddressAction(newShippingAddress);
            logger.logData(
                "shipping-mixin/ccccUpdateAddressRegistered: Select shipping address within checkout by key  "+newShippingAddress.getKey()
            );
            checkoutData.setSelectedShippingAddress(newShippingAddress.getKey());
        },
        ccccContinue: function (sType) {
            if (sType == 'saveNewAddress') {
                logger.logData(
                    "shipping-mixin/ccccContinue: Setting address as checked and save it as new address"
                );
                this.source.set('cccc_address_checked', true);
                this.saveNewAddress();
            } else if (sType == 'setShippingInformation') {
                logger.logData(
                    "shipping-mixin/ccccContinue: Setting address as checked and set it in the shipping information"
                );
                this.source.set('cccc_guest_address_checked', true);
                this.setShippingInformation();
            }
        },
        validateShippingInformation: function() {
            logger.logData(
                "shipping-mixin/validateShippingInformation: Starting validation of shipping information"
            );
            var superResult = this._super();
            logger.logData(
                "shipping-mixin/validateShippingInformation: Result of base functionality: "+(superResult?"valid":"invalid")
            );

            if (!this.ccccCheckAddress()) {
                logger.logData(
                    "shipping-mixin/validateShippingInformation: Skipping own validation, returning result of base functionality: "+(superResult?"valid":"invalid")
                );
                return superResult;
            }

            if (!this.source.get('cccc_guest_address_checked')) {
                if (superResult) {
                    logger.logData(
                        "shipping-mixin/validateShippingInformation: Base check was valid, now doing own address check/validation against Endereco-API"
                    );
                    if (!this.isFormInline) {
                        var quoteAddress = quote.shippingAddress();                        var data = {
                            'country_id': quoteAddress['countryId'],
                            'postcode': quoteAddress['postcode'],
                            'street': quoteAddress['street'],
                            'city': quoteAddress['city']
                        };

                        logger.logData(
                            "shipping-mixin/validateShippingInformation: Base check was valid, doing address check for stored address against Endereco-API: "+JSON.stringify(data)
                        );
                        logger.logData(
                            "shipping-mixin/validateShippingInformation: setShippingInformation will called directly after address check"
                        );
                        addresscheck(data, false, this, 'setShippingInformation');
                    } else {
                        logger.logData(
                            "shipping-mixin/validateShippingInformation: Base check was valid, doing address check for a new address against Endereco-API: "+JSON.stringify(this.source.get('shippingAddress'))
                        );
                        logger.logData(
                            "shipping-mixin/validateShippingInformation: setShippingInformation will called directly after address check"
                        );
                        addresscheck(this.source.get('shippingAddress'), false, this, 'setShippingInformation');
                    }
                    return false;
                }
                logger.logData(
                    "shipping-mixin/validateShippingInformation: No validdation of the address against Endereco-API as the basse validation failed"
                );
            } else {
                logger.logData(
                    "shipping-mixin/validateShippingInformation: Address was already validated against the Endereco-API, no further check required here. Address will checked next time."
                );
                this.source.set('cccc_guest_address_checked', false);
            }

            logger.logData(
                "shipping-mixin/validateShippingInformation: Returning base validation result: "+(superResult?"valid":"invalid")
            );

            return superResult;
        }
    };

    return function (shipping) {
        return shipping.extend(mixin);
    };
});
