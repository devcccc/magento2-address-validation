/*jshint browser:true jquery:true*/
/*global alert*/
define([
    'jquery',
    'Magento_Checkout/js/model/url-builder',
    'mage/storage',
    'Magento_Checkout/js/model/full-screen-loader',
    'Magento_Checkout/js/model/quote',
    'Magento_Customer/js/model/customer',
    'Magento_Ui/js/modal/confirm'
], function ($, urlBuilder, storage, fullScreenLoader, quote, customer, confirmation) {
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

                        var message = response.message + '<br/><br/>';

                        for (var i = 0; i < response.predictions.length; i++) {
                            message = message + '- ' + response.predictions[i].street+' '+response.predictions[i].houseNumber+', '+response.predictions[i].postCode+' '+response.predictions[i].city+'\n';
                        }

                        message = message +'<br/><br/>';

                        if ((window.checkoutConfig.cccc.addressvalidation.endereco.force_valid_address && alert(message.split("<br/>").join('\n')))) {
                            baseView.ccccUpdateAddress(response.predictions[0]);
                            baseView.ccccContinue(type);
                            fullScreenLoader.stopLoader();
                        } else if (!window.checkoutConfig.cccc.addressvalidation.endereco.force_valid_address) {
                            confirmation({
                                title: $.mage.__('Addressvalidation'),
                                content: message,
                                buttons: [{
                                    text: $.mage.__('Do not change address'),
                                    class: 'action-secondary action-dismiss',

                                    /**
                                     * Click handler.
                                     */
                                    click: function (event) {
                                        this.closeModal(event);
                                    }
                                }, {
                                    text: $.mage.__('Use selected address'),
                                    class: 'action-primary action-accept',

                                    /**
                                     * Click handler.
                                     */
                                    click: function (event) {
                                        this.closeModal(event, true);
                                    }
                                }],
                                actions: {
                                    confirm: function(){
                                        baseView.ccccUpdateAddress(response.predictions[0]);
                                        baseView.ccccContinue(type);
                                    }, //callback on 'Ok' button click
                                    cancel: function(){
                                        if (window.checkoutConfig.cccc.addressvalidation.endereco.force_valid_address) {
                                            return;
                                        }
                                        baseView.ccccContinue(type);
                                    }, //callback on 'Cancel' button click
                                    always: function(){
                                        fullScreenLoader.stopLoader();
                                    }
                                }
                            });
                        } else if (window.checkoutConfig.cccc.addressvalidation.endereco.force_valid_address) {
                            fullScreenLoader.stopLoader();
                            return;
                        }
                    } else if (response.valid && response.changed && response.predictions && response.predictions.length > 1) {
                        var message = response.message + '\n\n';
                        message += '<select id="adress-valid-select">';

                        for (var i = 0; i < response.predictions.length; i++) {
                            message = message + '<option value="' + i +'">' + response.predictions[i].street+' '+response.predictions[i].houseNumber+', '+response.predictions[i].postCode+' '+response.predictions[i].city+'</option>';
                        }

                        message = message +'</select>';

                        confirmation({
                            title: $.mage.__('Addressvalidation'),
                            content: message,
                            buttons: [{
                                text: $.mage.__('Do not change address'),
                                class: 'action-secondary action-dismiss',

                                /**
                                 * Click handler.
                                 */
                                click: function (event) {
                                    this.closeModal(event);
                                }
                            }, {
                                text: $.mage.__('Use selected address'),
                                class: 'action-primary action-accept',

                                /**
                                 * Click handler.
                                 */
                                click: function (event) {
                                    this.closeModal(event, true);
                                }
                            }],
                            actions: {
                                confirm: function(){
                                    var adressVal = $('#adress-valid-select').val();
                                    baseView.ccccUpdateAddress(response.predictions[adressVal]);
                                    baseView.ccccContinue(type);
                                }, //callback on 'Ok' button click
                                cancel: function(){
                                    if (window.checkoutConfig.cccc.addressvalidation.endereco.force_valid_address) {
                                        return;
                                    }
                                    baseView.ccccContinue(type);
                                }, //callback on 'Cancel' button click
                                always: function(){
                                    fullScreenLoader.stopLoader();
                                }
                            }
                        });
                    } else if ((response.valid && !response.changed) || (!response.valid && !window.checkoutConfig.cccc.addressvalidation.endereco.force_valid_address)) {
                        baseView.ccccContinue(type);
                    } else if (!response.valid && window.checkoutConfig.cccc.addressvalidation.endereco.force_valid_address) {
                        confirmation({
                            title: $.mage.__('Addressvalidation'),
                            content: $.mage.__('We are not able to verify your address. Please check your provided address again.'),
                            buttons: [{
                                text: $.mage.__('Cancel'),
                                class: 'action-primary action-dismiss',

                                /**
                                 * Click handler.
                                 */
                                click: function (event) {
                                    this.closeModal(event);
                                }
                            }],
                            actions: {
                                always: function(){
                                    fullScreenLoader.stopLoader();
                                }
                            }
                        });
                    }
                } else {
                    confirmation({
                        title: $.mage.__('Addressvalidation'),
                        content: response.errormessage,
                        buttons: [{
                            text: $.mage.__('Cancel'),
                            class: 'action-primary action-dismiss',

                            /**
                             * Click handler.
                             */
                            click: function (event) {
                                this.closeModal(event);
                            }
                        }],
                        actions: {
                            always: function () {
                                fullScreenLoader.stopLoader();
                            }
                        }
                    });
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
