/*jshint browser:true jquery:true*/
/*global alert*/
define([
    'jquery',
    'uiRegistry',
    'Magento_Checkout/js/model/step-navigator',
    'Magento_Checkout/js/model/quote'
], function ($, registry, stepNavigator, quote) {
    'use strict';

    var mixin = {
        /**
         * Navigate method.
         */
        navigate: function () {
            var self = this;
            if (window.checkoutConfig.cccc.addressvalidation.endereco.enabled && window.checkoutConfig.cccc.addressvalidation.endereco.check.shipping_enabled) {
                registry.get('checkoutProvider', function (checkoutProvider) {
                    if (checkoutProvider.get('cccc_address_checked') !== true && checkoutProvider.get('cccc_guest_address_checked') !== true) {
                        self.isVisible(false);
                        stepNavigator.setHash('shipping');
                    }
                });
            } else {
                this._super();
            }
        },

        /**
         * @return {Boolean}
         */
        /*isVisible: function () {
            return quote.isVirtual() || stepNavigator.isProcessed('shipping');
        },*/
    };

    return function (payment) {
        return payment.extend(mixin);
    };
});
