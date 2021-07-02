/*jshint browser:true jquery:true*/
/*global alert*/
define([
    'jquery',
    'ko',
    'CCCC_Addressvalidation/js/operation/edit-address',
    'Magento_Checkout/js/model/quote',
    'Magento_Checkout/js/action/select-shipping-address',
    'Magento_Checkout/js/checkout-data',
    'CCCC_Addressvalidation/js/helper/logger',
    'CCCC_Addressvalidation/js/helper/configuration',
    'CCCC_Addressvalidation/js/helper/address',
    'CCCC_Addressvalidation/js/endereco-setup',
    'Magento_Checkout/js/model/payment/place-order-hooks'
], function ($, ko, editAddress, quote, selectShippingAddressAction, checkoutData, logger, configurationHelper, addressHelper, enderecosdk, placeOrderHooks) {
    'use strict';

    var mixin = {
        initialize: function () {
            this._super();
            var amsPrefix = {
                countryCode: "[name='shippingAddress."+configurationHelper.ccccGetAddressDataByFieldSelector('country_id', 'country_id')+"'] select[name]",
                postalCode: "[name='shippingAddress."+configurationHelper.ccccGetAddressDataByFieldSelector('postCode', 'postcode')+"'] input[name]",
                locality: "[name='shippingAddress."+configurationHelper.ccccGetAddressDataByFieldSelector('cityName', 'city')+"'] input[name]",
                streetFull: configurationHelper.ccccGetAddressDataByFieldSelector('street', 'street.0') === configurationHelper.ccccGetAddressDataByFieldSelector('houseNumber', 'street.1')?"[name='shippingAddress."+configurationHelper.ccccGetAddressDataByFieldSelector('street', 'street.0')+"'] input[name]":"",
                streetName: configurationHelper.ccccGetAddressDataByFieldSelector('street', 'street.0') !== configurationHelper.ccccGetAddressDataByFieldSelector('houseNumber', 'street.1')?"[name='shippingAddress."+configurationHelper.ccccGetAddressDataByFieldSelector('street', 'street.0')+"'] input[name]":"",
                buldingNumber: configurationHelper.ccccGetAddressDataByFieldSelector('street', 'street.0') !== configurationHelper.ccccGetAddressDataByFieldSelector('houseNumber', 'street.1')?"[name='shippingAddress."+configurationHelper.ccccGetAddressDataByFieldSelector('houseNumber', 'street.1')+"'] input[name]":"",
                additionalInfo: '',
                addressStatus: '[name="enderecoamsstatus"]',
                addressTimestamp: '[name="enderecoamsts"]',
                addressPredictions: '[name="enderecoamsapredictions"]'
            };

            if (configurationHelper.isAddressValidationEnabled()) {
                enderecosdk.startAms(
                    amsPrefix,
                    {
                        name: 'shipping_address',
                        addressType: 'general_address'
                    }
                );

                placeOrderHooks.requestModifiers.push(function (headers, payload) {
                    if (!window.EnderecoIntegrator || !window.EnderecoIntegrator.integratedObjects || !window.EnderecoIntegrator.integratedObjects.shipping_address_ams) {
                        return;
                    }

                    if (payload.paymentMethod['extension_attributes'] === undefined) {
                        payload.paymentMethod['extension_attributes'] = {};
                    }

                    payload.paymentMethod['extension_attributes']['cccc_validation_shipping_result'] =
                        enderecosdk.getAddressStatusAsText(window.EnderecoIntegrator.integratedObjects.shipping_address_ams._addressStatus);
                });
            }
            return this;
        },

        ccccUpdateAddressFromEndereco: function(sType = 'setShippingInformation', amsKey = 'shipping_address_ams') {
            var amsData = window.EnderecoIntegrator.integratedObjects[amsKey];
            var addressData = {
                postCode: amsData._postalCode,
                city: amsData._locality,
                street: amsData._streetName,
                houseNumber: amsData._buildingNumber!="&nbsp;" ? amsData._buildingNumber : "",
                countryId: amsData._countryCode.toUpperCase()
            };


            this.ccccUpdateAddress(addressData);

            var validCodes = ['address_correct'];
            if(!window.checkoutConfig.cccc.addressvalidation.endereco.force_valid_address) {
                validCodes.push('address_selected_by_customer');
            }

            if ($.inArray(amsData._addressStatus, validCodes)) {
                this.ccccContinue(sType);
            }
        },

        ccccCheckAddress: function () {
            if (configurationHelper.isAddressValidationEnabled()) {
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
                window.EnderecoIntegrator.integratedObjects.shipping_address_ams._changed = true;
                window.EnderecoIntegrator.submitResume = this.ccccUpdateAddressFromEndereco.bind(this, 'saveNewAddress');
                window.EnderecoIntegrator.integratedObjects.shipping_address_ams.cb.onFormSubmit(new Event('check'))
            } else {
                logger.logData(
                    "shipping-mixin/saveNewAddress: Address already validated, resetting marker and storing address"
                );
                this.source.set('cccc_address_checked', false);
                return this._super();
            }
        },

        ccccUpdateAddress: function (addressData) {
            logger.logData(
                "shipping-mixin/ccccUpdateAddress: Doing address update => "+JSON.stringify(addressData)
            );
            if (this.isFormInline) {
                logger.logData(
                    "shipping-mixin/ccccUpdateAddress: Form is inline"
                );
                addressHelper.ccccUpdateAddressSource(addressData, this.source, 'shippingAddress');
            } else {
                logger.logData(
                    "shipping-mixin/ccccUpdateAddress: Update address book entry"
                );
                this.ccccUpdateAddressRegistered(addressData);
            }
        },

        ccccUpdateAddressRegistered: function (addressData) {
            var newShippingAddress = addressHelper.ccccUpdateAddressRegistered(addressData, quote.shippingAddress(), '.shipping-address-item.selected-item');
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

            if (this.ccccCheckAddress()) {
                logger.logData(
                    "shipping-mixin/ccccContinue: Start DoAccounting for AMS"
                );

                $.post(
                    {
                        url: window.EnderecoIntegrator.integratedObjects.shipping_address_ams.config.apiUrl,
                        data: JSON.stringify({
                            id: ++window.EnderecoIntegrator.integratedObjects.shipping_address_ams._addressCheckRequestIndex,
                            jsonrpc: '2.0',
                            method: 'doAccounting',
                            params: { sessionId: window.EnderecoIntegrator.integratedObjects.shipping_address_ams.sessionId}
                        }),
                        processData: false,
                        headers: {
                            'X-Agent': window.EnderecoIntegrator.integratedObjects.shipping_address_ams.config.agentName,
                            'X-Auth-Key': window.EnderecoIntegrator.integratedObjects.shipping_address_ams.apiKey,
                            'X-Transaction-Id': window.EnderecoIntegrator.integratedObjects.shipping_address_ams.sessionId,
                        },
                        method: 'POST',
                        contentType: 'application/json'
                    }
                );
                window.EnderecoIntegrator.integratedObjects.shipping_address_ams.sessionId = window.EnderecoIntegrator.integratedObjects.shipping_address_ams.util.generateId();

                if (window.checkoutConfig.cccc.addressvalidation.endereco.email_check && window.EnderecoIntegrator.integratedObjects.customer_email_emailservices.sessionCounter > 1) {
                    debugger;
                    $.post(
                        {
                            url: window.EnderecoIntegrator.integratedObjects.customer_email_emailservices.config.apiUrl,
                            data: JSON.stringify({
                                id: ++window.EnderecoIntegrator.integratedObjects.customer_email_emailservices._addressCheckRequestIndex,
                                jsonrpc: '2.0',
                                method: 'doAccounting',
                                params: { sessionId: window.EnderecoIntegrator.integratedObjects.customer_email_emailservices.sessionId}
                            }),
                            processData: false,
                            headers: {
                                'X-Agent': window.EnderecoIntegrator.integratedObjects.customer_email_emailservices.config.agentName,
                                'X-Auth-Key': window.EnderecoIntegrator.integratedObjects.customer_email_emailservices.apiKey,
                                'X-Transaction-Id': window.EnderecoIntegrator.integratedObjects.customer_email_emailservices.sessionId,
                            },
                            method: 'POST',
                            contentType: 'application/json'
                        }
                    );
                    window.EnderecoIntegrator.integratedObjects.customer_email_emailservices.sessionId = window.EnderecoIntegrator.integratedObjects.customer_email_emailservices.util.generateId();

                }

            }
        },

        validateShippingInformation: function() {
            logger.logData(
                "shipping-mixin/validateShippingInformation: Starting validation of shipping information"
            );

            var quoteAddress = quote.shippingAddress();
            if (this.ccccCheckAddress()) {
                if (window.EnderecoIntegrator.integratedObjects.shipping_address_ams.addressStatus.indexOf("address_selected_by_customer") != -1 &&
                    quoteAddress['city'] == "" && window.EnderecoIntegrator.integratedObjects.shipping_address_ams.locality != "") {
                    quoteAddress['city'] = window.EnderecoIntegrator.integratedObjects.shipping_address_ams.locality;
                    ko.dataFor(window.EnderecoIntegrator.integratedObjects.shipping_address_ams._subscribers.locality[0].object).value(
                        window.EnderecoIntegrator.integratedObjects.shipping_address_ams.locality
                    );
                }

                if (window.EnderecoIntegrator.integratedObjects.shipping_address_ams.addressStatus.indexOf("address_selected_by_customer") != -1 &&
                    window.EnderecoIntegrator.integratedObjects.shipping_address_ams.countryCode &&
                    quoteAddress['countryId'] != window.EnderecoIntegrator.integratedObjects.shipping_address_ams.countryCode.toUpperCase()) {
                    quoteAddress['countryId'] = window.EnderecoIntegrator.integratedObjects.shipping_address_ams.countryCode.toUpperCase()
                    ko.dataFor(window.EnderecoIntegrator.integratedObjects.shipping_address_ams._subscribers.countryCode[0].object).value(
                        window.EnderecoIntegrator.integratedObjects.shipping_address_ams.countryCode.toUpperCase()
                    );
                }
            }

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
                        var data = {
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
                        // TODO: Validate?
                        return true;
                    } else {
                        logger.logData(
                            "shipping-mixin/validateShippingInformation: Base check was valid, doing address check for a new address against Endereco-API: "+JSON.stringify(this.source.get('shippingAddress'))
                        );
                        logger.logData(
                            "shipping-mixin/validateShippingInformation: setShippingInformation will called directly after address check"
                        );

                        if (!this.source.get("cccc_initial_check")) {
                            window.EnderecoIntegrator.integratedObjects.shipping_address_ams._changed = true;
                            this.source.set("cccc_initial_check", true)
                        }

                        if (!window.EnderecoIntegrator.integratedObjects.shipping_address_ams._changed) {
                            this.ccccContinue("setShippingInformation");
                            return true;
                        }

                        window.EnderecoIntegrator.submitResume = this.ccccUpdateAddressFromEndereco.bind(this);
                        window.EnderecoIntegrator.integratedObjects.shipping_address_ams.cb.onFormSubmit(new Event('check'))
                    }
                    return false;
                }
                logger.logData(
                    "shipping-mixin/validateShippingInformation: No validation of the address against Endereco-API as the basse validation failed"
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
