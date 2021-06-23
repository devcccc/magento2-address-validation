/*jshint browser:true jquery:true*/
/*global alert*/
define([
    'CCCC_Addressvalidation/js/helper/logger',
    'CCCC_Addressvalidation/js/helper/configuration',
    'CCCC_Addressvalidation/js/operation/edit-address'
], function (logger, configurationHelper, editAddress) {
    'use strict';

    return {
        ccccUpdateAddressSource: function (addressData, source, contextPrefix) {
            logger.logData(
                "helper/address/ccccUpdateAddressSource: Setting field "+source+"."
                +configurationHelper.ccccGetAddressDataByFieldSelector('postCode', 'postcode')+" => "
                +addressData.postCode
            );
            source.set(contextPrefix + configurationHelper.ccccGetAddressDataByFieldSelector('postCode', 'postcode'), addressData.postCode);
            logger.logData(
                "helper/address/ccccUpdateAddressSource: Setting field "+source+"."
                +configurationHelper.ccccGetAddressDataByFieldSelector('cityName', 'city')+" => "
                +addressData.city
            );
            source.set(contextPrefix + configurationHelper.ccccGetAddressDataByFieldSelector('cityName', 'city'), addressData.city);
            if (configurationHelper.ccccGetAdressDataFieldselector('street', 'street[0]') != configurationHelper.ccccGetAdressDataFieldselector('houseNumber', 'street[1]')) {
                logger.logData(
                    "helper/address/ccccUpdateAddressSource: Setting field "+source+"."
                    +configurationHelper.ccccGetAddressDataByFieldSelector('street', 'street[0]')+" => "
                    +addressData.street
                );
                source.set(contextPrefix + configurationHelper.ccccGetAddressDataByFieldSelector('street', 'street[0]'), addressData.street);
                logger.logData(
                    "helper/address/ccccUpdateAddressSource: Setting field "+source+"."
                    +configurationHelper.ccccGetAddressDataByFieldSelector('houseNumber', 'street[1]')+" => "
                    +addressData.houseNumber
                );
                source.set(contextPrefix + configurationHelper.ccccGetAddressDataByFieldSelector('houseNumber', 'street[1]'), (addressData.houseNumber?addressData.houseNumber:""));
            } else {
                logger.logData(
                    "helper/address/ccccUpdateAddressSource: Setting combined field "+source+"."
                    +configurationHelper.ccccGetAddressDataByFieldSelector('street', 'street[0]')+" => "
                    +addressData.street + " " + addressData.houseNumber
                );
                source.set(contextPrefix + configurationHelper.ccccGetAddressDataByFieldSelector('street', 'street[0]'), addressData.street + (addressData.houseNumber?" " + addressData.houseNumber:""));
            }

            logger.logData(
                "helper/address/ccccUpdateAddressSource: Setting field shippingAddress.region => (null)"
            );
            source.set("shippingAddress.region_id", null);
            logger.logData(
                "helper/address/ccccUpdateAddressSource: Setting field shippingAddress.region => (null)"
            );
            source.set("shippingAddress.region", null);

            logger.logData(
                "helper/address/ccccUpdateAddressSource: Setting field "+source+"."+configurationHelper.ccccGetAddressDataByFieldSelector('country', 'country_id')+" => "+addressData.countryId
            );
            source.set(contextPrefix+configurationHelper.ccccGetAddressDataByFieldSelector('country', 'country_id'), addressData.countryId);

            if(configurationHelper.isFirstnameToUppercaseEnabled()) {
                var currentFirstname = source.get('shippingAddress.firstname').toUpperCase();
                logger.logData(
                    "helper/address/ccccUpdateAddressSource: Setting field shippingAddress.firstname to upper case => "+" => "+currentFirstname
                );
                source.set('shippingAddress.firstname', currentFirstname)
            }

            if(configurationHelper.isLastnameToUppercaseEnabled()) {
                var currentLastname = source.get('shippingAddress.lastname').toUpperCase();
                logger.logData(
                    "helper/address/ccccUpdateAddressSource: Setting field shippingAddress.lastname to upper case => "+" => "+currentLastname
                );
                source.set('shippingAddress.lastname', currentLastname)
            }
        },

        ccccUpdateAddressRegistered: function (addressData, quoteAddress, selectedItemSelector) {
            logger.logData(
                "helper/address/ccccUpdateAddressRegistered: Setting field "
                +configurationHelper.ccccGetAddressDataByFieldSelector('postCode', 'postcode')+" => "
                +addressData.postCode
            );
            quoteAddress = this.ccccUpdateField(quoteAddress, addressData.postCode, configurationHelper.ccccGetAddressDataByFieldSelector('postCode', 'postcode'), selectedItemSelector);
            logger.logData(
                "helper/address/ccccUpdateAddressRegistered: Setting field "
                +configurationHelper.ccccGetAddressDataByFieldSelector('city', 'cityName')+" => "
                +addressData.city
            );
            quoteAddress = this.ccccUpdateField(quoteAddress, addressData.city, configurationHelper.ccccGetAddressDataByFieldSelector('cityName', 'city'), selectedItemSelector);
            if (configurationHelper.ccccGetAdressDataFieldselector('street', 'street[0]') != configurationHelper.ccccGetAdressDataFieldselector('houseNumber', 'street[1]')) {
                logger.logData(
                    "helper/address/ccccUpdateAddressRegistered: Setting field "
                    +configurationHelper.ccccGetAddressDataByFieldSelector('street', 'street[0]')+" => "
                    +addressData.street
                );
                quoteAddress = this.ccccUpdateField(quoteAddress, addressData.street, configurationHelper.ccccGetAddressDataByFieldSelector('street', 'street[0]'), selectedItemSelector);
                logger.logData(
                    "helper/address/ccccUpdateAddressRegistered: Setting field "
                    +configurationHelper.ccccGetAddressDataByFieldSelector('street', 'street[1]')+" => "
                    +addressData.houseNumber
                );
                quoteAddress = this.ccccUpdateField(quoteAddress, addressData.houseNumber, configurationHelper.ccccGetAddressDataByFieldSelector('houseNumber', 'street[1]'), selectedItemSelector);
            } else {
                logger.logData(
                    "helper/address/ccccUpdateAddressRegistered: Setting combined field "
                    +configurationHelper.ccccGetAddressDataByFieldSelector('street', 'street[0]')+" => "
                    +addressData.street+" "+addressData.houseNumber
                );
                quoteAddress = this.ccccUpdateField(quoteAddress, addressData.street + " " + addressData.houseNumber, configurationHelper.ccccGetAddressDataByFieldSelector('street', 'street[0]'), selectedItemSelector);
            }
            logger.logData(
                "helper/address/ccccUpdateAddressRegistered: Setting field region_id => (null)"
            );
            quoteAddress = this.ccccUpdateField(quoteAddress, null, "region_id", selectedItemSelector);
            logger.logData(
                "helper/address/ccccUpdateAddressRegistered: Setting field region => (null)"
            );
            quoteAddress = this.ccccUpdateField(quoteAddress, null, "region", selectedItemSelector);

            logger.logData(
                "helper/address/ccccUpdateAddressRegistered: Setting field "+configurationHelper.ccccGetAddressDataByFieldSelector('country', 'country_id')+" => "+addressData.countryId
            );
            quoteAddress = this.ccccUpdateField(quoteAddress, addressData.countryId, configurationHelper.ccccGetAddressDataByFieldSelector('country', 'country_id'), selectedItemSelector);

            if(configurationHelper.isFirstnameToUppercaseEnabled()) {
                var currentFirstname = quoteAddress[firstname].toUpperCase();
                logger.logData(
                    "helper/address/ccccUpdateAddressRegistered: Setting field shippingAddress.firstname to upper case => "+" => "+currentFirstname
                );
                quoteAddress = this.ccccUpdateField(quoteAddress, currentFirstname, "firstname", selectedItemSelector);
            }

            if(configurationHelper.isLastnameToUppercaseEnabled()) {
                var currentLastname = quoteAddress[lastname].toUpperCase();
                logger.logData(
                    "helper/address/ccccUpdateAddressRegistered: Setting field shippingAddress.lastname to upper case => "+" => "+currentLastname
                );
                quoteAddress = this.ccccUpdateField(quoteAddress, currentLastname, "lastname", selectedItemSelector);
            }

            this.ccccUpdateAddressSource(addressData);

            logger.logData(
                "helper/address/ccccUpdateAddressRegistered: Set new selected shipping address "+JSON.stringify(quoteAddress)
            );
            editAddress(quoteAddress);
            return quoteAddress;
        },

        ccccUpdateField: function(oSourceAddress, oResponseData, sField, selectedItemSelector) {
            logger.logData(
                "helper/address/ccccUpdateField: Trying to update field "+sField+" with new value "+oResponseData+" within address data "
                +JSON.stringify(oSourceAddress)
            );

            var matches = sField.match(/([^\.]+)\.(\d)+/);
            if (matches) {
                logger.logData(
                    "helper/address/ccccUpdateField: Multidimensional field, checking if data changed "+oSourceAddress[matches[1]][matches[2]]+"  => "+oResponseData
                );
                if (oSourceAddress[matches[1]][matches[2]] !== oResponseData) {
                    logger.logData(
                        "helper/address/ccccUpdateField: Multidimensional field, data changed "+oSourceAddress[matches[1]][matches[2]]+"  => "+oResponseData
                    );
                    this.ccccReplaceInSelectedAddress(oSourceAddress[matches[1]][matches[2]], oResponseData, selectedItemSelector);
                    logger.logData(
                        "helper/address/ccccUpdateField: Multidimensional field => new value: "+oResponseData
                    );
                    oSourceAddress[matches[1]][matches[2]] = oResponseData;
                }
            } else {
                logger.logData(
                    "helper/address/ccccUpdateField: Simple field, checking if data got changed "+oSourceAddress[sField]+"  => "+oResponseData
                );
                if (oSourceAddress[sField] !== oResponseData) {
                    logger.logData(
                        "helper/address/ccccUpdateField: Simple field, data changed "+oSourceAddress[sField]+"  => "+oResponseData
                        +" - set new value"
                    );
                    this.ccccReplaceInSelectedAddress(oSourceAddress[sField], oResponseData, selectedItemSelector);
                    oSourceAddress[sField] = oResponseData;
                }
            }
            return oSourceAddress;
        },

        ccccReplaceInSelectedAddress: function (sReplace, sReplaceWith, selectedItemSelector) {
            var oElem = $('.shipping-address-item.selected-item');
            var oElem = $(selectedItemSelector);
            logger.logData(
                "shipping-mixin/ccccReplaceInSelectedAddress: Replacing "+sReplace+" => "+sReplaceWith
            );
            if (oElem.length > 0) {
                logger.logData(
                    "shipping-mixin/ccccReplaceInSelectedAddress: Replacing "+sReplace+" => "+sReplaceWith+" within element-html "+oElem.html()
                );
                oElem.html(oElem.html().replace(sReplace, sReplaceWith));
            } else {
                logger.logData(
                    "shipping-mixin/ccccReplaceInSelectedAddress: No selected shipping address item found, skipping "
                );
            }
        },
    };
});
