/*jshint browser:true jquery:true*/
/*global alert*/
define([
    'jquery',
    'Magento_Checkout/js/model/url-builder',
    'mage/storage',
    'Magento_Checkout/js/model/full-screen-loader',
    'Magento_Checkout/js/model/quote',
    'Magento_Customer/js/model/customer'
], function ($, urlBuilder, storage, fullScreenLoader, quote, customer) {
    'use strict';

    function ccccGetAddressDataByFieldSelector(addressData, field, fallback) {
        var fieldSelector = window.checkoutConfig.cccc.addressvalidation.endereco.mapping && window.checkoutConfig.cccc.addressvalidation.endereco.mapping[field]
            ? window.checkoutConfig.cccc.addressvalidation.endereco.mapping[field] : fallback;

        if (fieldSelector.indexOf('[') == -1) {
            return addressData[fieldSelector];
        } else {
            return eval("addressData."+fieldSelector);
        }
    }

    /** Override default place order action and add agreement_ids to request */
    return function (addressData, isBillingAddress, baseView, type) {
        var serviceUrl = window.checkoutConfig.cccc.addressvalidation.endereco.urls.checkaddress.replace(/\/$/, '');

        var request = {
            country: ccccGetAddressDataByFieldSelector(addressData, 'country', 'country_id'),
            postCode: ccccGetAddressDataByFieldSelector(addressData, 'postCode', 'postcode'),
            city: ccccGetAddressDataByFieldSelector(addressData, 'city', 'city'),
            street: ccccGetAddressDataByFieldSelector(addressData, 'street[0]', 'street[0]'),
            houseNumber: ccccGetAddressDataByFieldSelector(addressData, 'houseNumber', 'street[1]'),
        };

        for (var paramKey in request) {
            serviceUrl = serviceUrl + "/" + encodeURI(paramKey) + "/" + encodeURI(request[paramKey]);
        }

        fullScreenLoader.startLoader();

        return storage.post(
            serviceUrl
        ).done(
            function (response) {
                if (response.success == true) {
                    if (response.valid && response.changed && response.predictions && response.predictions.length == 1) {
                        var message = response.message + '\n\n';

                        for (var i = 0; i < response.predictions.length; i++) {
                            message = message + '- ' + response.predictions[i].street+' '+response.predictions[i].houseNumber+', '+response.predictions[i].postCode+' '+response.predictions[i].city+'\n';
                        }

                        message = message +'\n\n';

                        if ((window.checkoutConfig.cccc.addressvalidation.endereco.force_valid_address && alert(message)) || confirm(message)) {
                            baseView.ccccUpdateAddress(response.predictions[0]);
                        } else if (window.checkoutConfig.cccc.addressvalidation.endereco.force_valid_address) {
                            fullScreenLoader.stopLoader();
                            return;
                        }
                    } else if (response.valid && response.changed && response.predictions && response.predictions.length > 1) {
                        var message = response.message + '\n\n';

                        for (var i = 0; i < response.predictions.length; i++) {
                            message = message + '- ' + response.predictions[i].street+' '+response.predictions[i].houseNumber+', '+response.predictions[i].postCode+' '+response.predictions[i].city+'\n';
                        }

                        message = message +'\n\n';

                        if (confirm(message)) {
                            baseView.ccccUpdateAddress(response.predictions[0]);
                        } else if (window.checkoutConfig.cccc.addressvalidation.endereco.force_valid_address) {
                            fullScreenLoader.stopLoader();
                            return;
                        }
                    }
                    baseView.ccccContinue(type);
                } else {
                    alert(response.errormessage);
                }
                fullScreenLoader.stopLoader();
            }
        ).fail(
            function (response) {
                fullScreenLoader.stopLoader();
                baseView.ccccContinue(type);
            }
        );
    };
});
