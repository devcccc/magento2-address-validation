/*jshint browser:true jquery:true*/
/*global alert*/
define([
    'jquery',
    'ko',
    'Magento_Checkout/js/model/quote',
    'Magento_Checkout/js/checkout-data',
    'Magento_Customer/js/model/customer',
    'Magento_Checkout/js/action/create-billing-address',
    'Magento_Checkout/js/action/select-billing-address',
    'Magento_Checkout/js/model/payment/place-order-hooks',
    'CCCC_Addressvalidation/js/helper/logger',
    'CCCC_Addressvalidation/js/helper/configuration',
    'CCCC_Addressvalidation/js/helper/address',
    'CCCC_Addressvalidation/js/endereco-setup',
    'Magento_Checkout/js/model/shipping-save-processor'
], function ($, ko, quote, checkoutData, customer, createBillingAddress, selectBillingAddress, placeOrderHooks, logger, configurationHelper, addressHelper, enderecosdk, shippingSaveProcessor) {
    'use strict';

    var mixin = {
        fieldSelectors: {},
        amsInitialized: false,
        eventsInitialized: false,

        initialize: function() {
            this._super();
            this.isAddressDetailsVisible.subscribe(function(val) {
                if (!val) {
                    this.doAmsInit();
                }
            }.bind(this));
        },


        doAmsInit: function() {
            if (this.amsInitialized) {
                return;
            }

            if (!this.amsInitialized && !configurationHelper.isAddressValidationEnabledBilling()) {
                this.amsInitialized = true;
                return;
            }

            var amsPrefix = {
                countryCode: "[name='"+this.dataScopePrefix+"."+configurationHelper.ccccGetAddressDataByFieldSelector('country_id', 'country_id')+"'] select[name]",
                postalCode: "[name='"+this.dataScopePrefix+"."+configurationHelper.ccccGetAddressDataByFieldSelector('postCode', 'postcode')+"'] input[name]",
                locality: "[name='"+this.dataScopePrefix+"."+configurationHelper.ccccGetAddressDataByFieldSelector('cityName', 'city')+"'] input[name]",
                streetFull: configurationHelper.useStreetFull() ?"[name='"+this.dataScopePrefix+"."+configurationHelper.ccccGetAddressDataByFieldSelector('street', 'street.0')+"'] input[name]":"",
                streetName: !configurationHelper.useStreetFull()?"[name='"+this.dataScopePrefix+"."+configurationHelper.ccccGetAddressDataByFieldSelector('street', 'street.0')+"'] input[name]":"",
                buildingNumber: !configurationHelper.useStreetFull()?"[name='"+this.dataScopePrefix+"."+configurationHelper.ccccGetAddressDataByFieldSelector('houseNumber', 'street.1')+"'] input[name]":"",
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

            if (configurationHelper.isAddressValidationEnabledBilling()) {
                enderecosdk.startAms(
                    amsPrefix,
                    {
                        name: this.dataScopePrefix,
                        addressType: 'general_address'
                    }
                );

                var that = this;
                placeOrderHooks.afterRequestListeners.push(function() {
                    var accountingConfig = [
                        {
                            enabled: true,
                            scopeName: that.dataScopePrefix + "_ams",
                            lastAddressCheckIndexVarName: 'lastAmsAddressCheckIndex',
                            lastSessionIdUsedForAccountVarName: 'lastAmsSessionIdUsedForAccounting'
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
                });
            }
            this.amsInitialized = true;

            window.EnderecoIntegrator.integratedObjects[that.dataScopePrefix+"_ams"].addEventListener(
                'change',
                function(event) {
                    if (event.fieldName == "postalCode") {
                        var data = ko.dataFor(jQuery("[name='"+that.dataScopePrefix+"."+configurationHelper.ccccGetAddressDataByFieldSelector('postCode', 'postcode')+"'] input[name]").first()[0]);
                        if (data.value() != event.newValue) {
                            data.value(event.newValue);
                        }
                    } else if (event.fieldName == "locality") {
                        var data = ko.dataFor(jQuery("[name='"+that.dataScopePrefix+"."+configurationHelper.ccccGetAddressDataByFieldSelector('cityName', 'city')+"'] input[name]").first()[0]);
                        if (data.value() != event.newValue) {
                            data.value(event.newValue);
                        }
                    }
                }
            );
        },

        initEvents: function() {
            if (!this.eventsInitialized) {
                this.eventsInitialized = true;
                window.EnderecoIntegrator.integratedObjects[this.dataScopePrefix+"_ams"].onAfterAddressCheckNoAction.push(
                    function() {
                        this.ccccAddressUpdate(null);
                    }.bind(this)
                );

                window.EnderecoIntegrator.integratedObjects[this.dataScopePrefix+"_ams"].onConfirmAddress.push(
                    function() {
                        this.ccccAddressUpdate(null);
                    }.bind(this)
                );

                window.EnderecoIntegrator.integratedObjects[this.dataScopePrefix+"_ams"].onAfterAddressCheckSelected.push(
                    function() {
                        var amsData = window.EnderecoIntegrator.integratedObjects[this.dataScopePrefix+"_ams"];
                        var addressData = {
                            country_id: amsData._countryCode.toUpperCase(),
                            city: amsData._locality,
                            postcode: amsData._postalCode,
                            street: !configurationHelper.useStreetFull() ?
                                [amsData._streetName, amsData._buildingNumber!="&nbsp;" ? amsData._buildingNumber : ""]
                                : [amsData._streetName+amsData._buildingNumber!="&nbsp;" ? amsData._streetName+" "+amsData._buildingNumber : ""]
                        };
                        this.ccccAddressUpdate(addressData);
                    }.bind(this)
                );
            }
        },

        updateAddress: function () {
            if (!configurationHelper.isAddressValidationEnabledBilling() || !this.isAddressFormVisible()) {
                return this._super();
            }

            this.initEvents();

            this.source.set('params.invalid', false);
            this.source.trigger(this.dataScopePrefix + '.data.validate');

            if (this.source.get(this.dataScopePrefix + '.custom_attributes')) {
                this.source.trigger(this.dataScopePrefix + '.custom_attributes.data.validate');
            }

            if (!this.source.get('params.invalid')) {

                logger.logData(
                    "billing-address-mixin/updateAddress: Base check was valid, now doing own address check/validation against Endereco-API"
                );
                window.EnderecoIntegrator.integratedObjects[this.dataScopePrefix+"_ams"]._changed = true;

                var promise = new Promise(
                    function (resolve, reject) {
                        resolve(false);
                    }
                );
                if (configurationHelper.useStreetFull()) {
                    promise = window.EnderecoIntegrator.integratedObjects[this.dataScopePrefix+"_ams"].util.splitStreet();
                }

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

                        setTimeout(
                            function () {
                                delete self.checkInProgress;
                            },
                            1000
                        );
                    }
                );

            }
        },

        ccccAddressUpdate: function(updatedData) {
            var addressData, newBillingAddress;

            if (!this.source.get('params.invalid')) {
                addressData = this.source.get(this.dataScopePrefix);

                var loggedIn = customer.isLoggedIn();
                var hasAdress = this.customerHasAddresses;
                if (loggedIn && !hasAdress) { //eslint-disable-line max-depth
                    this.saveInAddressBook(1);
                }
                addressData['save_in_address_book'] = this.saveInAddressBook() ? 1 : 0;

                if (updatedData) {
                    addressData.city = updatedData.city;
                    addressData.country_id = updatedData.country_id;
                    addressData.postcode = updatedData.postcode;
                    addressData.street = updatedData.street;
                }

                newBillingAddress = createBillingAddress(addressData);
                // New address must be selected as a billing address
                selectBillingAddress(newBillingAddress);
                checkoutData.setSelectedBillingAddress(newBillingAddress.getKey());
                checkoutData.setNewCustomerBillingAddress(addressData);
                shippingSaveProcessor.saveShippingInformation();
            }

            this.updateAddresses();
        },
    };

    return function (billing) {
        return billing.extend(mixin);
    };
});
