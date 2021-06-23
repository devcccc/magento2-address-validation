/*jshint browser:true jquery:true*/
/*global alert*/
define([
    'CCCC_Addressvalidation/js/helper/logger',
], function (logger) {
    'use strict';

    return {
        isModuleEnabled: function() {
            return window.checkoutConfig.cccc.addressvalidation.endereco.enabled;
        },

        isAddressValidationEnabled: function() {
            return this.isModuleEnabled() && window.checkoutConfig.cccc.addressvalidation.endereco.check.shipping_enabled;
        },

        isFirstnameToUppercaseEnabled: function() {
            return window.checkoutConfig.cccc.addressvalidation.endereco.transformation.uppercase_firstname;
        },

        isLastnameToUppercaseEnabled: function() {
            return window.checkoutConfig.cccc.addressvalidation.endereco.transformation.uppercase_lastname;
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
    };
});
