/*jshint browser:true jquery:true*/
/*global alert*/
define([
    'jquery',
    'Magento_Checkout/js/model/url-builder',
    'mage/storage',
    'Magento_Checkout/js/model/full-screen-loader',
    'Magento_Checkout/js/model/quote',
    'Magento_Customer/js/model/customer',
    'CCCC_Addressvalidation/js/helper/logger',
    'Magento_Ui/js/modal/confirm'
], function ($, urlBuilder, storage, fullScreenLoader, quote, customer, logger, confirmation) {
    'use strict';

    function ccccGetAdressDataFieldselector(field, fallback) {
        var fieldSelector = window.checkoutConfig.cccc.addressvalidation.endereco.mapping && window.checkoutConfig.cccc.addressvalidation.endereco.mapping[field]
            ? window.checkoutConfig.cccc.addressvalidation.endereco.mapping[field] : fallback;

        logger.logData(
            "ccccGetAdressDataFieldselector: Retrieved field selector for "+field+" (fallback: "+fallback+") => result: "+fieldSelector
        );

        return fieldSelector;
    }

    function ccccGetAddressDataByFieldSelector(addressData, field, fallback) {
        logger.logData(
            "ccccGetAddressDataByFieldSelector: reading address data for field "+field+" (fallback: "+fallback+"), full address data: "
                +JSON.stringify(addressData)
        );

        var fieldSelector = ccccGetAdressDataFieldselector(field, fallback);
        if (fieldSelector.indexOf('[') == -1) {
            logger.logData(
                "ccccGetAddressDataByFieldSelector: reading address data entry for selector "+fieldSelector+" => result: "+JSON.stringify(addressData[fieldSelector])
            );
            return addressData[fieldSelector];
        } else {
            logger.logData(
                "ccccGetAddressDataByFieldSelector: reading address data entry for selector "+fieldSelector+" => result: "+JSON.stringify(eval("addressData."+fieldSelector))
            );
            return eval("addressData."+fieldSelector);
        }
    }

    /** Override default place order action and add agreement_ids to request */
    return function (addressData, isBillingAddress, baseView, type) {
        var serviceUrl = window.checkoutConfig.cccc.addressvalidation.endereco.urls.checkaddress.replace(/\/$/, '');

        logger.logData(
            "address/check: Service-URL selected: "+serviceUrl
        );

        var request = {
            country: ccccGetAddressDataByFieldSelector(addressData, 'country', 'country_id'),
            postCode: ccccGetAddressDataByFieldSelector(addressData, 'postCode', 'postcode'),
            city: ccccGetAddressDataByFieldSelector(addressData, 'city', 'city'),
            street: ccccGetAddressDataByFieldSelector(addressData, 'street', 'street[0]'),
            houseNumber: ccccGetAddressDataByFieldSelector(addressData, 'houseNumber', 'street[1]'),
            streetFull: ""
        };

        logger.logData(
            "address/check: Request data to backend before street normalization: "+JSON.stringify(request)
        );

        if (request.street == request.houseNumber && ccccGetAdressDataFieldselector('street[0]', 'street[0]')
            && ccccGetAdressDataFieldselector('houseNumber', 'street[1]')) {
            request.streetFull = request.street;
            delete request.street;
            delete request.houseNumber;
            logger.logData(
                "address/check: Street normalization - sending streetFull-data, data was a single datum before: "+request.streetFull
            );
        } else {
            request.streetFull = request.street + ' ' + request.houseNumber;
            delete request.street;
            delete request.houseNumber;
            logger.logData(
                "address/check: Street normalization - sending streetFull-data, data got concatenated: "+request.streetFull
            );
        }

        logger.logData(
            "address/check: Request data to backend after street normalization: "+JSON.stringify(request)
        );

        for (var paramKey in request) {
            serviceUrl = serviceUrl + "/" + encodeURI(paramKey) + "/" + encodeURI(request[paramKey]);
        }

        logger.logData(
            "address/check: Service-URL generated with request data: "+serviceUrl
        );

        fullScreenLoader.startLoader();

        logger.logData(
            "address/check: Loader displayed, sending request to  "+serviceUrl
        );

        return storage.post(
            serviceUrl
        ).done(
            function (response) {
                logger.logData(
                    "address/check: Retrieved successful response: "+JSON.stringify(response)
                );
                if (response.success == true) {
                    logger.logData(
                        "address/check: Response analysis; success: yes, changed: "+(response.changed?"yes":"no")
                        +", has predictions: "+(response.predictions?"yes":"no")+", number of predictions: "+(response.predictions?response.predictions.length:0)
                        +", message: "+response.message
                    );

                    if (response.valid && response.changed && response.predictions && response.predictions.length == 1) {
                        var message = response.message + '<br/><br/>'
                            + '- ' + response.predictions[0].street+' '+response.predictions[0].houseNumber+', '+response.predictions[0].postCode+' '+response.predictions[0].city
                            +'<br/><br/>';

                        logger.logData(
                            "address/check: Single prediction with at least one change received"
                        );

                        if (window.checkoutConfig.cccc.addressvalidation.endereco.force_valid_address) {
                            logger.logData(
                                "address/check: Single prediction with at least one change received => valid address is forced by configuration, prediction will be applied automatically"
                            );
                            alert(message.split("<br/>").join('\n'))
                            baseView.ccccUpdateAddress(response.predictions[0]);
                            baseView.ccccContinue(type);
                            fullScreenLoader.stopLoader();
                            logger.logData(
                                "address/check: Loader hidden"
                            );
                        } else {
                            logger.logData(
                                "address/check: Single prediction with at least one change received => dialog displayed"
                            );
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
                                        logger.logData(
                                            "address/check: Single prediction with at least one change received => user selected prediction address"
                                        );
                                        baseView.ccccUpdateAddress(response.predictions[0]);
                                        baseView.ccccContinue(type);
                                    }, //callback on 'Ok' button click
                                    cancel: function(){
                                        logger.logData(
                                            "address/check: Single prediction with at least one change received => user cancelled dialog (keep current address)"
                                        );
                                        baseView.ccccContinue(type);
                                    }, //callback on 'Cancel' button click
                                    always: function(){
                                        fullScreenLoader.stopLoader();
                                        logger.logData(
                                            "address/check: Loader hidden"
                                        );
                                    }
                                }
                            });
                        }
                    } else if (response.valid && response.changed && response.predictions && response.predictions.length > 1) {
                        logger.logData(
                            "address/check: Multiple prediction with at least one change received"
                        );
                        var message = response.message + '\n\n';
                        message += '<select id="adress-valid-select">';

                        for (var i = 0; i < response.predictions.length; i++) {
                            message = message + '<option value="' + i +'">' + response.predictions[i].street+' '+response.predictions[i].houseNumber+', '+response.predictions[i].postCode+' '+response.predictions[i].city+'</option>';
                        }

                        message = message +'</select>';

                        var buttons = [];

                        if (!window.checkoutConfig.cccc.addressvalidation.endereco.force_valid_address) {
                            logger.logData(
                                "address/check: Multiple prediction with at least one change received => user won't be forced to select a valid address, adding 'Do not change address' button to dialog"
                            );
                            buttons.push(
                                {
                                    text: $.mage.__('Do not change address'),
                                    class: 'action-secondary action-dismiss',

                                    /**
                                     * Click handler.
                                     */
                                    click: function (event) {
                                        this.closeModal(event);
                                    }
                                }
                            );
                        }

                        buttons.push(
                            {
                                text: $.mage.__('Use selected address'),
                                class: 'action-primary action-accept',

                                /**
                                 * Click handler.
                                 */
                                click: function (event) {
                                    this.closeModal(event, true);
                                }
                            }
                        );

                        confirmation({
                            title: $.mage.__('Addressvalidation'),
                            content: message,
                            buttons: buttons,
                            actions: {
                                confirm: function(){
                                    var addressVal = $('#adress-valid-select').val();
                                    logger.logData(
                                        "address/check: Multiple prediction with at least one change received => user selected a prediction for correction"
                                    );

                                    baseView.ccccUpdateAddress(response.predictions[addressVal]);
                                    baseView.ccccContinue(type);
                                }, //callback on 'Ok' button click
                                cancel: function(){
                                    logger.logData(
                                        "address/check: Multiple prediction with at least one change received => user decided to keep current address"
                                    );

                                    baseView.ccccContinue(type);
                                }, //callback on 'Cancel' button click
                                always: function(){
                                    fullScreenLoader.stopLoader();
                                    logger.logData(
                                        "address/check: Disabled loader"
                                    );
                                }
                            }
                        });
                    } else if ((response.valid && !response.changed) || (!response.valid && !window.checkoutConfig.cccc.addressvalidation.endereco.force_valid_address)) {
                        logger.logData(
                            "address/check: Specified address is correct, no changes received, no further predictions returned"
                        );

                        baseView.ccccContinue(type);
                    } else if (!response.valid && window.checkoutConfig.cccc.addressvalidation.endereco.force_valid_address) {
                        logger.logData(
                            "address/check: Response was not valid, but user has to select a valid address by configuration. Showing error message"
                        );

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
                                    logger.logData(
                                        "address/check: Disabled loader"
                                    );
                                }
                            }
                        });
                    }
                } else {
                    var error = response.errormessage;
                    if (!error) {
                        error = $.mage.__('We are not able to verify your address. Please check your provided address again.');
                    }

                    logger.logData(
                        "address/check: Response was not successful. Error message:"+response.errormessage
                    );


                    confirmation({
                        title: $.mage.__('Addressvalidation'),
                        content: error,
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
                                logger.logData(
                                    "address/check: Disabled loader"
                                );
                            }
                        }
                    });
                }
                fullScreenLoader.stopLoader();
                logger.logData(
                    "address/check: Disabled loader"
                );
            }
        ).fail(
            function (response) {
                logger.logData(
                    "address/check: Retrieved failed response: "+JSON.stringify(response)
                );
                fullScreenLoader.stopLoader();
                logger.logData(
                    "address/check: Disabled loader"
                );
                baseView.ccccContinue(type);
            }
        );
    };
});
