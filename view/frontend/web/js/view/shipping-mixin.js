/*jshint browser:true jquery:true*/
/*global alert*/
define([
    'jquery',
    'ko',
    'Magento_Checkout/js/model/quote',
    'Magento_Checkout/js/action/select-shipping-address',
    'Magento_Checkout/js/checkout-data',
    'CCCC_Addressvalidation/js/helper/logger',
    'CCCC_Addressvalidation/js/helper/configuration',
    'CCCC_Addressvalidation/js/helper/address',
    'CCCC_Addressvalidation/js/endereco-setup',
    'Magento_Checkout/js/model/payment/place-order-hooks',
    'Magento_Checkout/js/model/step-navigator',
    'Magento_Checkout/js/model/shipping-save-processor'
], function ($, ko, quote, selectShippingAddressAction, checkoutData, logger, configurationHelper, addressHelper, enderecosdk, placeOrderHooks, stepNavigator, shippingSaveProcessor) {
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
                var that = this;
                enderecosdk.startAms(
                    amsPrefix,
                    {
                        name: this.dataScopePrefix,
                        addressType: 'general_address',
                        callbacks: [
                            function() {
                                window.EnderecoIntegrator.integratedObjects[this.dataScopePrefix+"_ams"].waitForAllExtension().then(
                                    function (EAO) {
                                        window.EnderecoIntegrator.submitResume = this.ccccUpdateAddressFromEndereco.bind(this);
                                        EAO.onConfirmAddress.push(this.ccccUpdateAddressFromEndereco.bind(this));
                                        EAO.onAfterAddressCheckNoAction.push(this.ccccUpdateAddressFromEndereco.bind(this));
                                        EAO.onAfterAddressCheckSelected.push(this.ccccUpdateAddressFromEndereco.bind(this));
                                    }.bind(this)
                                );

                                placeOrderHooks.requestModifiers.push(function (headers, payload) {
                                    if (payload.paymentMethod['extension_attributes'] === undefined) {
                                        payload.paymentMethod['extension_attributes'] = {};
                                    }
                                    payload.paymentMethod['extension_attributes']['cccc_validation_shipping_result'] =
                                        enderecosdk.getAddressStatusAsText(window.EnderecoIntegrator.integratedObjects[that.dataScopePrefix+"_ams"]._addressStatus);
                                });
                            }.bind(this)
                        ]
                    }
                );

                placeOrderHooks.afterRequestListeners.push(function() {
                    if (configurationHelper.isAddressValidationEnabled()) {
                        logger.logData(
                            "shipping-mixin/ccccContinue: Start DoAccounting for AMS."
                        );

                        var accountingConfig = [
                            {
                                enabled: true,
                                scopeName: that.dataScopePrefix + "_ams",
                                lastAddressCheckIndexVarName: 'lastAmsAddressCheckIndex',
                                lastSessionIdUsedForAccountVarName: 'lastAmsSessionIdUsedForAccounting'
                            },
                            {
                                enabled: window.checkoutConfig.cccc.addressvalidation.endereco.email_check,
                                scopeName: "customer_email_emailservices",
                                lastAddressCheckIndexVarName: null,
                                lastSessionIdUsedForAccountVarName: 'lastEmailSessionIdUsedForAccounting'
                            }
                        ];

                        accountingConfig.forEach(
                            function(config) {
                                    window.EnderecoIntegrator.integratedObjects[config.scopeName] && window.EnderecoIntegrator.integratedObjects[config.scopeName].waitForAllExtension().then(function() {
                                        if ((config.lastAddressCheckIndexVarName && (!that[config.lastAddressCheckIndexVarName] || that[config.lastAddressCheckIndexVarName] != window.EnderecoIntegrator.integratedObjects[config.scopeName]._addressCheckRequestIndex)) &&
                                            (!that[config.lastSessionIdUsedForAccountVarName] || [config.lastSessionIdUsedForAccountVarName] != window.EnderecoIntegrator.integratedObjects[config.scopeName].sessionId)) {
                                            $.post(
                                                {
                                                    url: window.EnderecoIntegrator.integratedObjects[config.scopeName].config.apiUrl,
                                                    data: JSON.stringify({
                                                        id: ++window.EnderecoIntegrator.integratedObjects[config.scopeName]._addressCheckRequestIndex,
                                                        jsonrpc: '2.0',
                                                        method: 'doAccounting',
                                                        params: {sessionId: window.EnderecoIntegrator.integratedObjects[config.scopeName].sessionId}
                                                    }),
                                                    processData: false,
                                                    headers: {
                                                        'X-Agent': window.EnderecoIntegrator.integratedObjects[config.scopeName].config.agentName,
                                                        'X-Auth-Key': window.EnderecoIntegrator.integratedObjects[config.scopeName].config.apiKey,
                                                        'X-Transaction-Id': window.EnderecoIntegrator.integratedObjects[config.scopeName].sessionId,
                                                        'X-Remote-Api-Url': window.checkoutConfig.cccc.addressvalidation.endereco.directRequests
                                                            ? window.checkoutConfig.cccc.addressvalidation.endereco.serverApiUrl
                                                            : null
                                                    },
                                                    method: 'POST',
                                                    contentType: 'application/json'
                                                }
                                            ).success(
                                                function(data) {
                                                    that[config.lastSessionIdUsedForAccountVarName] = window.EnderecoIntegrator.integratedObjects[config.scopeName].sessionId;
                                                    if (config.lastAddressCheckIndexVarName) {
                                                        that[config.lastAddressCheckIndexVarName] = window.EnderecoIntegrator.integratedObjects[config.scopeName]._addressCheckRequestIndex;
                                                    }
                                                    window.EnderecoIntegrator.integratedObjects[config.scopeName].sessionId = window.EnderecoIntegrator.integratedObjects[config.scopeName].util.generateId();
                                                }
                                            );
                                        }
                                    });
                            }
                        );
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

        ccccUpdateAddress: function (addressData) {
            logger.logData(
                "shipping-mixin/ccccUpdateAddress: Doing address update => " + JSON.stringify(addressData)
            );
            if (this.isFormInline) {
                addressHelper.ccccUpdateAddressSource(addressData, this.source, 'shippingAddress');

                var quoteAddress = quote.shippingAddress();
                if (configurationHelper.isFirstnameToUppercaseEnabled()) {
                    quoteAddress["firstname"] = quoteAddress["firstname"].toUpperCase();
                }
                if (configurationHelper.isLastnameToUppercaseEnabled()) {
                    quoteAddress["lastname"] = quoteAddress["lastname"].toUpperCase();
                }

                quote.shippingAddress().city = this.source.shippingAddress.city;
                quote.shippingAddress().countryId = this.source.shippingAddress.country_id;
                quote.shippingAddress().postcode = this.source.shippingAddress.postcode;
                quote.shippingAddress().street = [];
                for (var key in this.source.shippingAddress.street) {
                    if (this.source.shippingAddress.street.hasOwnProperty(key)) {
                        quote.shippingAddress().street.push(this.source.shippingAddress.street[key]);
                    }
                }

                quote.shippingAddress().lastname = this.source.shippingAddress.lastname;
                quote.shippingAddress().firstname = this.source.shippingAddress.firstname;

                if (quote.shippingAddress().getCacheKey() === quote.billingAddress().getCacheKey()) {
                    quote.billingAddress(quote.shippingAddress());
                }

                shippingSaveProcessor.saveShippingInformation();
                selectShippingAddressAction(quoteAddress);
            } else {
                this.ccccUpdateAddressRegistered(addressData, this.source, 'shippingAddress');
            }
        },

        ccccUpdateAddressRegistered: function (addressData, source, context) {
            var newShippingAddress = addressHelper.ccccUpdateAddressRegistered(addressData, quote.shippingAddress(), '.shipping-address-item.selected-item', source, context);
            return;

            //selectShippingAddressAction(newShippingAddress);
            //checkoutData.setSelectedShippingAddress(newShippingAddress.getKey());
            if (quote.shippingAddress().getCacheKey() === quote.billingAddress().getCacheKey()) {
                quote.billingAddress(newShippingAddress);
            }
            //shippingSaveProcessor.saveShippingInformation();
            logger.logData(
                "shipping-mixin/ccccUpdateAddressRegistered: Select shipping  alithin checkout by key  "+newShippingAddress.getKey()
            );

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

            var superResult = this._super();
            logger.logData(
                "shipping-mixin/validateShippingInformation: Result of base functionality: "+(superResult?"valid":"invalid")
            );

            if (!configurationHelper.isAddressValidationEnabled() || !superResult) {
                logger.logData(
                    "shipping-mixin/validateShippingInformation: Skipping own validation, returning result of base functionality: "+(superResult?"valid":"invalid")
                );
                return superResult;
            }

            var promise = new Promise(
                function (resolve, reject) {
                    resolve(false);
                }
            );

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

            var self = this;
            promise.then(
                function(data) {
                    if (data) {
                        window.EnderecoIntegrator.integratedObjects[self.dataScopePrefix + "_ams"]._buildingNumber = data.houseNumber;
                        window.EnderecoIntegrator.integratedObjects[self.dataScopePrefix + "_ams"]._streetName = data.streetName;
                    }
                }
            ).finally(
                function() {
                    window.EnderecoIntegrator.integratedObjects[self.dataScopePrefix+"_ams"].cb.onFormSubmit(new Event('check'));
                    self.checkInProgress = true;
                    setTimeout(
                        function () {
                            delete self.checkInProgress;
                        },
                        1000
                    )
                    self.setShippingInformation();
                }
            );

            return superResult;
        }
    };

    return function (shipping) {
        return shipping.extend(mixin);
    };
});
