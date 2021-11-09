/*jshint browser:true jquery:true*/
/*global alert*/
define([
    'jquery',
    'ko',
    'CCCC_Addressvalidation/js/operation/edit-address',
    'Magento_Checkout/js/model/quote',
    'Magento_Checkout/js/action/select-shipping-address',
    'Magento_Checkout/js/action/select-billing-address',
    'Magento_Checkout/js/view/billing-address',
    'Magento_Checkout/js/checkout-data',
    'CCCC_Addressvalidation/js/helper/logger',
    'CCCC_Addressvalidation/js/helper/configuration',
    'CCCC_Addressvalidation/js/helper/address',
    'CCCC_Addressvalidation/js/endereco-setup',
    'Magento_Checkout/js/model/payment/place-order-hooks',
    'Magento_Checkout/js/model/step-navigator'
], function ($, ko, editAddress, quote, selectShippingAddressAction, selectBillingAddressAction, billingAddress, checkoutData, logger, configurationHelper, addressHelper, enderecosdk, placeOrderHooks, stepNavigator) {
    'use strict';

    var mixin = {

        fieldSelectors: {},

        initialize: function () {
            this._super();

            var amsPrefix = {
                countryCode: "[name='shippingAddress."+configurationHelper.ccccGetAddressDataByFieldSelector('country_id', 'country_id')+"'] select[name]",
                postalCode: "[name='shippingAddress."+configurationHelper.ccccGetAddressDataByFieldSelector('postCode', 'postcode')+"'] input[name]",
                locality: "[name='shippingAddress."+configurationHelper.ccccGetAddressDataByFieldSelector('cityName', 'city')+"'] input[name]",
                streetFull: configurationHelper.useStreetFull() ?"[name='shippingAddress."+configurationHelper.ccccGetAddressDataByFieldSelector('street', 'street.0')+"'] input[name]":"",
                streetName: !configurationHelper.useStreetFull()?"[name='shippingAddress."+configurationHelper.ccccGetAddressDataByFieldSelector('street', 'street.0')+"'] input[name]":"",
                buildingNumber: !configurationHelper.useStreetFull()?"[name='shippingAddress."+configurationHelper.ccccGetAddressDataByFieldSelector('houseNumber', 'street.1')+"'] input[name]":"",
                additionalInfo: '',
                addressStatus: '[name="enderecoamsstatus"]',
                addressTimestamp: '[name="enderecoamsts"]',
                addressPredictions: '[name="enderecoamsapredictions"]'
            };
            this.fieldSelectors = amsPrefix;

            if (configurationHelper.useStreetFull()) {
                delete amsPrefix.streetName;
                delete amsPrefix.buildingNumber;
            } else {
                delete amsPrefix.streetFull;
            }

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

                var that = this;
                placeOrderHooks.afterRequestListeners.push(function() {
                    if (that.ccccCheckAddress()) {
                        logger.logData(
                            "shipping-mixin/ccccContinue: Start DoAccounting for AMS"
                        );

                        if ((!that.lastAmsAddressCheckIndex || that.lastAmsAddressCheckIndex != window.EnderecoIntegrator.integratedObjects.shipping_address_ams._addressCheckRequestIndex) &&
                            (!that.lastAmsSessionIdUsedForAccounting || that.lastAmsSessionIdUsedForAccounting != window.EnderecoIntegrator.integratedObjects.shipping_address_ams.sessionId)) {
                            that.lastAmsSessionIdUsedForAccounting = window.EnderecoIntegrator.integratedObjects.shipping_address_ams.sessionId;
                            $.post(
                                {
                                    url: window.EnderecoIntegrator.integratedObjects.shipping_address_ams.config.apiUrl,
                                    data: JSON.stringify({
                                        id: ++window.EnderecoIntegrator.integratedObjects.shipping_address_ams._addressCheckRequestIndex,
                                        jsonrpc: '2.0',
                                        method: 'doAccounting',
                                        params: {sessionId: window.EnderecoIntegrator.integratedObjects.shipping_address_ams.sessionId}
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
                            that.lastAmsAddressCheckIndex = window.EnderecoIntegrator.integratedObjects.shipping_address_ams._addressCheckRequestIndex;
                            window.EnderecoIntegrator.integratedObjects.shipping_address_ams.sessionId = window.EnderecoIntegrator.integratedObjects.shipping_address_ams.util.generateId();
                        }

                        if (window.checkoutConfig.cccc.addressvalidation.endereco.email_check && window.EnderecoIntegrator.integratedObjects.customer_email_emailservices && window.EnderecoIntegrator.integratedObjects.customer_email_emailservices.sessionCounter > 1
                            && (!that.lastEmailSessionIdUsedForAccounting || that.lastEmailSessionIdUsedForAccounting != window.EnderecoIntegrator.integratedObjects.customer_email_emailservices.sessionId)) {
                            that.lastEmailSessionIdUsedForAccounting = window.EnderecoIntegrator.integratedObjects.customer_email_emailservices.sessionId;
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


                });
            }
            return this;
        },

        ccccUpdateAddressFromEndereco: function(sType = 'setShippingInformation', amsKey = 'shipping_address_ams') {
            if (typeof sType == "object") {
                sType = "setShippingInformation";

            }

            var amsData = window.EnderecoIntegrator.integratedObjects[amsKey];
            var addressData = {
                postCode: amsData._postalCode,
                city: amsData._locality,
                street: amsData._streetName,
                houseNumber: amsData._buildingNumber!="&nbsp;" ? amsData._buildingNumber : "",
                countryId: amsData._countryCode.toUpperCase()
            };

            this.checkInProgress = false;

            this.ccccUpdateAddress(addressData);

            var validCodes = ['address_correct'];
            if(!window.checkoutConfig.cccc.addressvalidation.endereco.force_valid_address) {
                validCodes.push('address_selected_by_customer');
            }

            if ($.inArray(amsData._addressStatus, validCodes)) {
                this.ccccContinue(sType);
            } else {
                stepNavigator.setHash('#shipping');
            }
        },

        ccccCheckAddress: function () {
            if (configurationHelper.isAddressValidationEnabled() /*&& this.isFormInline*/) {
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
        ccccUpdateAddress: function (addressData) {
            logger.logData(
                "shipping-mixin/ccccUpdateAddress: Doing address update => "+JSON.stringify(addressData)
            );
            if (this.isFormInline) {
                logger.logData(
                    "shipping-mixin/ccccUpdateAddress: Form is inline"
                );
                addressHelper.ccccUpdateAddressSource(addressData, this.source, 'shippingAddress');

                var quoteAddress = quote.shippingAddress();
                if(configurationHelper.isFirstnameToUppercaseEnabled()) {
                    var currentFirstname = quoteAddress["firstname"].toUpperCase();
                    logger.logData(
                        "helper/address/ccccUpdateAddressRegistered: Setting field shippingAddress.firstname to upper case => "+" => "+currentFirstname
                    );
                    quoteAddress["firstname"] = currentFirstname;
                }

                if(configurationHelper.isLastnameToUppercaseEnabled()) {
                    var currentLastname = quoteAddress["lastname"].toUpperCase();
                    logger.logData(
                        "helper/address/ccccUpdateAddressRegistered: Setting field shippingAddress.lastname to upper case => "+" => "+currentLastname
                    );
                    quoteAddress["lastname"] = currentLastname;
                }
                selectShippingAddressAction(quoteAddress);

                var billingAddress = quote.billingAddress();
                var shippingAddress = quote.shippingAddress();
                if (billingAddress.getCacheKey() == shippingAddress.getCacheKey()) {
                    selectBillingAddressAction(shippingAddress);
                }
            } else {
                logger.logData(
                    "shipping-mixin/ccccUpdateAddress: Update address book entry"
                );
                this.ccccUpdateAddressRegistered(addressData, this.source, 'shippingAddress');
            }
        },

        ccccUpdateAddressRegistered: function (addressData, source, context) {
            var newShippingAddress = addressHelper.ccccUpdateAddressRegistered(addressData, quote.shippingAddress(), '.shipping-address-item.selected-item', source, context);
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
                //this.setShippingInformation();
            }
        },

        validateShippingInformation: function() {
            if (this.checkInProgress) {
                return false;
            }
            logger.logData(
                "shipping-mixin/validateShippingInformation: Starting validation of shipping information"
            );

            var quoteAddress = quote.shippingAddress();
            if (this.ccccCheckAddress() && window.EnderecoIntegrator.integratedObjects.shipping_address_ams) {
                if (!configurationHelper.useStreetFull() && window.EnderecoIntegrator.integratedObjects.shipping_address_ams.buildingNumber == "") {
                    window.EnderecoIntegrator.integratedObjects.shipping_address_ams.buildingNumber = quoteAddress['street'].length>1 ? quoteAddress['street'][1] : "";
                    window.EnderecoIntegrator.integratedObjects.shipping_address_ams._buildingNumber = quoteAddress['street'].length>1 ? quoteAddress['street'][1] : "";
                }

                if (quoteAddress['city'] == "" && window.EnderecoIntegrator.integratedObjects.shipping_address_ams.locality != "") {
                    quoteAddress['city'] = window.EnderecoIntegrator.integratedObjects.shipping_address_ams.locality;
                    ko.dataFor(window.EnderecoIntegrator.integratedObjects.shipping_address_ams._subscribers.locality[0].object).value(
                        window.EnderecoIntegrator.integratedObjects.shipping_address_ams.locality
                    );
                }

                if (((typeof quoteAddress['postcode'] === "object" && !quoteAddress['postcode']) || quoteAddress['postcode'] == "") && window.EnderecoIntegrator.integratedObjects.shipping_address_ams.postalCode != "") {
                    quoteAddress['postcode'] = window.EnderecoIntegrator.integratedObjects.shipping_address_ams.postalCode;
                    ko.dataFor(window.EnderecoIntegrator.integratedObjects.shipping_address_ams._subscribers.postalCode[0].object).value(
                        window.EnderecoIntegrator.integratedObjects.shipping_address_ams.postalCode
                    );
                }

                if (window.EnderecoIntegrator.integratedObjects.shipping_address_ams.countryCode &&
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

                        window.EnderecoIntegrator.integratedObjects.shipping_address_ams.cb._countryCode = (quoteAddress['countryId']);
                        window.EnderecoIntegrator.integratedObjects.shipping_address_ams.cb._postalCode = (quoteAddress['postcode']);
                        window.EnderecoIntegrator.integratedObjects.shipping_address_ams.cb._locality = (quoteAddress['city']);
  /*                      $(this.fieldSelectors.countryCode).val(quoteAddress['countryId']).change();
                        $(this.fieldSelectors.postalCode).val(quoteAddress['postcode']).change();
                        $(this.fieldSelectors.locality).val(quoteAddress['city']).change();
*/
                        if (configurationHelper.useStreetFull()) {
                            window.EnderecoIntegrator.integratedObjects.shipping_address_ams._streetFull =quoteAddress['street'][0] + (quoteAddress['street'].length>1 ? " "+quoteAddress['street'][1]:"");
//                            $(this.fieldSelectors.streetFull).val(quoteAddress['street'][0] + (quoteAddress['street'].length>1 ? " "+quoteAddress['street'][1]:"")).change();
                        } else {
                            window.EnderecoIntegrator.integratedObjects.shipping_address_ams._buildingNumber = (quoteAddress['street'].length>1 ? quoteAddress['street'][1]:"");
                            window.EnderecoIntegrator.integratedObjects.shipping_address_ams._streetName = quoteAddress['street'][0];
//                            $(this.fieldSelectors.streetName).val(quoteAddress['street'][0]).change();
//                            $(this.fieldSelectors.buildingNumber).val((quoteAddress['street'].length>1 ? quoteAddress['street'][1]:"")).change();
                        }
                        logger.logData(
                            "shipping-mixin/validateShippingInformation: Transferred data from address book to inline form: "
                            +$(this.fieldSelectors.countryCode).val()+" "+$(this.fieldSelectors.postalCode).val()+" "+$(this.fieldSelectors.locality).val()
                        );
                    }

                    logger.logData(
                        "shipping-mixin/validateShippingInformation: Base check was valid, doing address check for a new address against Endereco-API: "+JSON.stringify(this.source.get('shippingAddress'))
                    );
                    logger.logData(
                        "shipping-mixin/validateShippingInformation: setShippingInformation will called directly after address check"
                    );

                    window.EnderecoIntegrator.integratedObjects.shipping_address_ams._changed = true;

                    if (window.EnderecoIntegrator.submitResume==undefined) {
                        window.EnderecoIntegrator.submitResume = this.ccccUpdateAddressFromEndereco.bind(this);
                    }
                    if (window.EnderecoIntegrator.integratedObjects.shipping_address_ams.onConfirmAddress ==undefined) {
                        window.EnderecoIntegrator.integratedObjects.shipping_address_ams.onConfirmAddress.push(this.ccccUpdateAddressFromEndereco.bind(this));
                    }
                    if (window.EnderecoIntegrator.integratedObjects.shipping_address_ams.onAfterAddressCheckNoAction==undefined) {
                        window.EnderecoIntegrator.integratedObjects.shipping_address_ams.onAfterAddressCheckNoAction.push(this.ccccUpdateAddressFromEndereco.bind(this));
                    }
                    window.EnderecoIntegrator.integratedObjects.shipping_address_ams.cb.onFormSubmit(new Event('check'));

                    this.checkInProgress = true;
                    var self = this;
                    setTimeout(
                        function() {
                            delete self.checkInProgress;
                        },
                        2000
                    )
                    this.setShippingInformation();
                    return superResult;
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
