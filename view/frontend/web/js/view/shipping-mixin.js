/*jshint browser:true jquery:true*/
/*global alert*/
define([
    'jquery',
    'ko',
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
    'Magento_Checkout/js/model/step-navigator',
    'Magento_Checkout/js/model/shipping-save-processor'
], function ($, ko, quote, selectShippingAddressAction, selectBillingAddressAction, billingAddress, checkoutData, logger, configurationHelper, addressHelper, enderecosdk, placeOrderHooks, stepNavigator, shippingSaveProcessor) {
    'use strict';

    var mixin = {

        fieldSelectors: {},

        initialize: function () {
            this._super();

            if (!this.dataScopePrefix) {
                this.dataScopePrefix = 'shippingAddress';
            }

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
                        name: this.dataScopePrefix,
                        addressType: 'general_address'
                    }
                );

                var that = this;
                placeOrderHooks.requestModifiers.push(function (headers, payload) {
                    if (!window.EnderecoIntegrator || !window.EnderecoIntegrator.integratedObjects || !window.EnderecoIntegrator.integratedObjects[that.dataScopePrefix+"_ams"]) {
                        return;
                    }

                    if (payload.paymentMethod['extension_attributes'] === undefined) {
                        payload.paymentMethod['extension_attributes'] = {};
                    }

                    payload.paymentMethod['extension_attributes']['cccc_validation_shipping_result'] =
                        enderecosdk.getAddressStatusAsText(window.EnderecoIntegrator.integratedObjects[that.dataScopePrefix+"_ams"]._addressStatus);
                });

                placeOrderHooks.afterRequestListeners.push(function() {
                    if (that.ccccCheckAddress()) {
                        logger.logData(
                            "shipping-mixin/ccccContinue: Start DoAccounting for AMS."
                        );

                        window.EnderecoIntegrator.waitUntilReady().then(function() {
                            window.EnderecoIntegrator.integratedObjects[that.dataScopePrefix+"_ams"].waitForActive().then(function() {
                                window.EnderecoIntegrator.integratedObjects[that.dataScopePrefix+"_ams"] && window.EnderecoIntegrator.integratedObjects[that.dataScopePrefix+"_ams"].waitForAllExtension().then(function() {
                                    if ((!that.lastAmsAddressCheckIndex || that.lastAmsAddressCheckIndex != window.EnderecoIntegrator.integratedObjects[that.dataScopePrefix+"_ams"]._addressCheckRequestIndex) &&
                                        (!that.lastAmsSessionIdUsedForAccounting || that.lastAmsSessionIdUsedForAccounting != window.EnderecoIntegrator.integratedObjects[that.dataScopePrefix+"_ams"].sessionId)) {
                                        $.post(
                                            {
                                                url: window.EnderecoIntegrator.integratedObjects[that.dataScopePrefix+"_ams"].config.apiUrl,
                                                data: JSON.stringify({
                                                    id: ++window.EnderecoIntegrator.integratedObjects[that.dataScopePrefix+"_ams"]._addressCheckRequestIndex,
                                                    jsonrpc: '2.0',
                                                    method: 'doAccounting',
                                                    params: {sessionId: window.EnderecoIntegrator.integratedObjects[that.dataScopePrefix+"_ams"].sessionId}
                                                }),
                                                processData: false,
                                                headers: {
                                                    'X-Agent': window.EnderecoIntegrator.integratedObjects[that.dataScopePrefix+"_ams"].config.agentName,
                                                    'X-Auth-Key': window.EnderecoIntegrator.integratedObjects[that.dataScopePrefix+"_ams"].apiKey,
                                                    'X-Transaction-Id': window.EnderecoIntegrator.integratedObjects[that.dataScopePrefix+"_ams"].sessionId,
                                                },
                                                method: 'POST',
                                                contentType: 'application/json'
                                            }
                                        ).success(
                                            function(data) {
                                                that.lastAmsSessionIdUsedForAccounting = window.EnderecoIntegrator.integratedObjects[that.dataScopePrefix+"_ams"].sessionId;
                                                that.lastAmsAddressCheckIndex = window.EnderecoIntegrator.integratedObjects[that.dataScopePrefix+"_ams"]._addressCheckRequestIndex;
                                                window.EnderecoIntegrator.integratedObjects[that.dataScopePrefix+"_ams"].sessionId = window.EnderecoIntegrator.integratedObjects[that.dataScopePrefix+"_ams"].util.generateId();
                                            }
                                        );
                                    }

                                });
                            });

                            window.checkoutConfig.cccc.addressvalidation.endereco.email_check && window.EnderecoIntegrator.integratedObjects.customer_email_emailservices.waitForActive().then( function() {
                                if (window.checkoutConfig.cccc.addressvalidation.endereco.email_check && window.EnderecoIntegrator.integratedObjects.customer_email_emailservices && window.EnderecoIntegrator.integratedObjects.customer_email_emailservices.sessionCounter > 1
                                    && (!that.lastEmailSessionIdUsedForAccounting || that.lastEmailSessionIdUsedForAccounting != window.EnderecoIntegrator.integratedObjects.customer_email_emailservices.sessionId)) {
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
                                    ).success(
                                        function(data) {
                                            that.lastEmailSessionIdUsedForAccounting = window.EnderecoIntegrator.integratedObjects.customer_email_emailservices.sessionId;
                                            window.EnderecoIntegrator.integratedObjects.customer_email_emailservices.sessionId = window.EnderecoIntegrator.integratedObjects.customer_email_emailservices.util.generateId();
                                        }
                                    );
                                }
                            });
                        });
                    }
                });
            }
            return this;
        },

        ccccUpdateAddressFromEndereco: function(sType = 'setShippingInformation', amsKey = 'shippingAddress_ams') {
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
                "shipping-mixin/ccccUpdateAddress: Doing address update => " + JSON.stringify(addressData)
            );
            if (this.isFormInline) {
                logger.logData(
                    "shipping-mixin/ccccUpdateAddress: Form is inline"
                );
                addressHelper.ccccUpdateAddressSource(addressData, this.source, 'shippingAddress');

                var quoteAddress = quote.shippingAddress();
                if (configurationHelper.isFirstnameToUppercaseEnabled()) {
                    var currentFirstname = quoteAddress["firstname"].toUpperCase();
                    logger.logData(
                        "helper/address/ccccUpdateAddressRegistered: Setting field shippingAddress.firstname to upper case => " + " => " + currentFirstname
                    );
                    quoteAddress["firstname"] = currentFirstname;
                }

                if (configurationHelper.isLastnameToUppercaseEnabled()) {
                    var currentLastname = quoteAddress["lastname"].toUpperCase();
                    logger.logData(
                        "helper/address/ccccUpdateAddressRegistered: Setting field shippingAddress.lastname to upper case => " + " => " + currentLastname
                    );
                    quoteAddress["lastname"] = currentLastname;
                }
                selectShippingAddressAction(quoteAddress);

                quote.shippingAddress().city = this.source.shippingAddress.city;
                quote.shippingAddress().countryId = this.source.shippingAddress.country_id;
                quote.shippingAddress().postcode = this.source.shippingAddress.postcode;
                quote.shippingAddress().street = [];
                for (var key in this.source.shippingAddress.street) {
                    if (this.source.shippingAddress.street.hasOwnProperty(key)) {
                        quote.shippingAddress().street.push(this.source.shippingAddress.street[key]);
                    }
                }


                quote.shippingAddress().street = this.source.shippingAddress.street;
                quote.shippingAddress().lastname = this.source.shippingAddress.lastname;
                quote.shippingAddress().firstname = this.source.shippingAddress.firstname;
                shippingSaveProcessor.saveShippingInformation();

                var that = this;
                window.EnderecoIntegrator.waitUntilReady().then(function () {
                    window.EnderecoIntegrator.integratedObjects[that.dataScopePrefix + "_ams"].waitForActive().then(function () {
                        window.EnderecoIntegrator.integratedObjects[that.dataScopePrefix + "_ams"] && window.EnderecoIntegrator.integratedObjects[that.dataScopePrefix + "_ams"].waitForAllExtension().then(function () {
                            if ((!that.lastAmsAddressCheckIndex || that.lastAmsAddressCheckIndex != window.EnderecoIntegrator.integratedObjects[that.dataScopePrefix + "_ams"]._addressCheckRequestIndex) &&
                                (!that.lastAmsSessionIdUsedForAccounting || that.lastAmsSessionIdUsedForAccounting != window.EnderecoIntegrator.integratedObjects[that.dataScopePrefix + "_ams"].sessionId)) {
                                $.post(
                                    {
                                        url: window.EnderecoIntegrator.integratedObjects[that.dataScopePrefix + "_ams"].config.apiUrl,
                                        data: JSON.stringify({
                                            id: ++window.EnderecoIntegrator.integratedObjects[that.dataScopePrefix + "_ams"]._addressCheckRequestIndex,
                                            jsonrpc: '2.0',
                                            method: 'doAccounting',
                                            params: {sessionId: window.EnderecoIntegrator.integratedObjects[that.dataScopePrefix + "_ams"].sessionId}
                                        }),
                                        processData: false,
                                        headers: {
                                            'X-Agent': window.EnderecoIntegrator.integratedObjects[that.dataScopePrefix + "_ams"].config.agentName,
                                            'X-Auth-Key': window.EnderecoIntegrator.integratedObjects[that.dataScopePrefix + "_ams"].apiKey,
                                            'X-Transaction-Id': window.EnderecoIntegrator.integratedObjects[that.dataScopePrefix + "_ams"].sessionId,
                                        },
                                        method: 'POST',
                                        contentType: 'application/json'
                                    }
                                ).success(
                                    function (data) {
                                        that.lastAmsSessionIdUsedForAccounting = window.EnderecoIntegrator.integratedObjects[that.dataScopePrefix + "_ams"].sessionId;
                                        that.lastAmsAddressCheckIndex = window.EnderecoIntegrator.integratedObjects[that.dataScopePrefix + "_ams"]._addressCheckRequestIndex;
                                        window.EnderecoIntegrator.integratedObjects[that.dataScopePrefix + "_ams"].sessionId = window.EnderecoIntegrator.integratedObjects[that.dataScopePrefix + "_ams"].util.generateId();
                                        setTimeout(function () {
                                            window.EnderecoIntegrator.globalSpace.reloadPage();
                                        }, 1000);
                                    }
                                ).error(
                                    function (data) {
                                        setTimeout(function () {
                                            window.EnderecoIntegrator.globalSpace.reloadPage();
                                        }, 1000);
                                    }
                                );
                            } else {
                                setTimeout(function () {
                                    window.EnderecoIntegrator.globalSpace.reloadPage();
                                }, 1000);
                            }

                        });
                    });
                });
                var checkbox = jQuery("input[name=billing-address-same-as-shipping][type=checkbox]");
                if (checkbox.length) {
                    checkbox.click();
                    setTimeout(
                        function () {
                            checkbox.click();
                        },
                        500
                    );
                }
            } else {
                setTimeout(function () {
                    window.EnderecoIntegrator.globalSpace.reloadPage();
                }, 1000);
            }
        },

        ccccUpdateAddressRegistered: function (addressData, source, context) {
            var newShippingAddress = addressHelper.ccccUpdateAddressRegistered(addressData, quote.shippingAddress(), '.shipping-address-item.selected-item', source, context);
            selectShippingAddressAction(newShippingAddress);
            logger.logData(
                "shipping-mixin/ccccUpdateAddressRegistered: Select shipping  alithin checkout by key  "+newShippingAddress.getKey()
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
            if (this.ccccCheckAddress() && window.EnderecoIntegrator.integratedObjects[this.dataScopePrefix+"_ams"]) {
                if (!configurationHelper.useStreetFull() && window.EnderecoIntegrator.integratedObjects[this.dataScopePrefix+"_ams"].buildingNumber == "") {
                    window.EnderecoIntegrator.integratedObjects[this.dataScopePrefix+"_ams"].buildingNumber = quoteAddress['street'].length>1 ? quoteAddress['street'][1] : "";
                    window.EnderecoIntegrator.integratedObjects[this.dataScopePrefix+"_ams"]._buildingNumber = quoteAddress['street'].length>1 ? quoteAddress['street'][1] : "";
                }

                if (quoteAddress['city'] == "" && window.EnderecoIntegrator.integratedObjects[this.dataScopePrefix+"_ams"].locality != "") {
                    quoteAddress['city'] = window.EnderecoIntegrator.integratedObjects[this.dataScopePrefix+"_ams"].locality;
                    ko.dataFor(window.EnderecoIntegrator.integratedObjects[this.dataScopePrefix+"_ams"]._subscribers.locality[0].object).value(
                        window.EnderecoIntegrator.integratedObjects[this.dataScopePrefix+"_ams"].locality
                    );
                }

                if (((typeof quoteAddress['postcode'] === "object" && !quoteAddress['postcode']) || quoteAddress['postcode'] == "") && window.EnderecoIntegrator.integratedObjects[this.dataScopePrefix+"_ams"].postalCode != "") {
                    quoteAddress['postcode'] = window.EnderecoIntegrator.integratedObjects[this.dataScopePrefix+"_ams"].postalCode;
                    ko.dataFor(window.EnderecoIntegrator.integratedObjects[this.dataScopePrefix+"_ams"]._subscribers.postalCode[0].object).value(
                        window.EnderecoIntegrator.integratedObjects[this.dataScopePrefix+"_ams"].postalCode
                    );
                }

                if (window.EnderecoIntegrator.integratedObjects[this.dataScopePrefix+"_ams"].countryCode &&
                    quoteAddress['countryId'] != window.EnderecoIntegrator.integratedObjects[this.dataScopePrefix+"_ams"].countryCode.toUpperCase()) {
                    quoteAddress['countryId'] = window.EnderecoIntegrator.integratedObjects[this.dataScopePrefix+"_ams"].countryCode.toUpperCase()
                    ko.dataFor(window.EnderecoIntegrator.integratedObjects[this.dataScopePrefix+"_ams"]._subscribers.countryCode[0].object).value(
                        window.EnderecoIntegrator.integratedObjects[this.dataScopePrefix+"_ams"].countryCode.toUpperCase()
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

            var promise;

            if (superResult) {
                logger.logData(
                    "shipping-mixin/validateShippingInformation: Base check was valid, now doing own address check/validation against Endereco-API"
                );
                if (!this.isFormInline) {

                    window.EnderecoIntegrator.integratedObjects[this.dataScopePrefix+"_ams"]._countryCode = (quoteAddress['countryId']);
                    window.EnderecoIntegrator.integratedObjects[this.dataScopePrefix+"_ams"]._postalCode = (quoteAddress['postcode']);
                    window.EnderecoIntegrator.integratedObjects[this.dataScopePrefix+"_ams"]._locality = (quoteAddress['city']);

                    if (configurationHelper.useStreetFull()) {
                        window.EnderecoIntegrator.integratedObjects[this.dataScopePrefix+"_ams"]._streetFull =quoteAddress['street'][0] + (quoteAddress['street'].length>1 ? " "+quoteAddress['street'][1]:"");
                        promise = window.EnderecoIntegrator.integratedObjects[this.dataScopePrefix+"_ams"].util.splitStreet();
                    } else {
                        window.EnderecoIntegrator.integratedObjects[this.dataScopePrefix+"_ams"]._buildingNumber = (quoteAddress['street'].length>1 ? quoteAddress['street'][1]:"");
                        window.EnderecoIntegrator.integratedObjects[this.dataScopePrefix+"_ams"]._streetName = quoteAddress['street'][0];
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

                window.EnderecoIntegrator.integratedObjects[this.dataScopePrefix+"_ams"]._changed = true;

                if (window.EnderecoIntegrator.submitResume==undefined) {
                    window.EnderecoIntegrator.submitResume = this.ccccUpdateAddressFromEndereco.bind(this);
                }
                if (window.EnderecoIntegrator.integratedObjects[this.dataScopePrefix+"_ams"].onConfirmAddress ==undefined) {
                    window.EnderecoIntegrator.integratedObjects[this.dataScopePrefix+"_ams"].onConfirmAddress.push(this.ccccUpdateAddressFromEndereco.bind(this));
                }
                if (window.EnderecoIntegrator.integratedObjects[this.dataScopePrefix+"_ams"].onAfterAddressCheckNoAction==undefined) {
                    window.EnderecoIntegrator.integratedObjects[this.dataScopePrefix+"_ams"].onAfterAddressCheckNoAction.push(this.ccccUpdateAddressFromEndereco.bind(this));
                }

                var self = this;
                if (!promise) {
                    window.EnderecoIntegrator.integratedObjects[this.dataScopePrefix+"_ams"].cb.onFormSubmit(new Event('check'));

                    this.checkInProgress = true;
                    setTimeout(
                        function () {
                            delete self.checkInProgress;
                        },
                        2000
                    )
                    this.setShippingInformation();
                } else {
                    promise.then(
                        function(data) {
                            window.EnderecoIntegrator.integratedObjects[self.dataScopePrefix+"_ams"]._buildingNumber = data.houseNumber;
                            window.EnderecoIntegrator.integratedObjects[self.dataScopePrefix+"_ams"]._streetName = data.streetName;
                        }
                    ).finally(
                        function() {
                            setTimeout(
                                function() {
                                    window.EnderecoIntegrator.integratedObjects[self.dataScopePrefix+"_ams"].cb.onFormSubmit(new Event('check'));
                                    self.checkInProgress = true;
                                    setTimeout(
                                        function () {
                                            delete self.checkInProgress;
                                        },
                                        2000
                                    )
                                    self.setShippingInformation();
                                },
                                3000
                            );
                        }
                    );

                }
                return superResult;
            }
            logger.logData(
                "shipping-mixin/validateShippingInformation: No validation of the address against Endereco-API as the base validation failed"
            );

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
