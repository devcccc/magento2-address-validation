/*jshint browser:true jquery:true*/
/*global alert*/
define([
    'jquery',
    'CCCC_Addressvalidation/js/helper/logger',
    'mage/translate',
    'CCCC_Addressvalidation/js/endereco.min'
], function ($, logger, translate) {
    'use strict';

    function ccccGetAdressDataFieldselector(field, fallback) {
        var fieldSelector = window.checkoutConfig.cccc.addressvalidation.endereco.mapping && window.checkoutConfig.cccc.addressvalidation.endereco.mapping[field]
            ? window.checkoutConfig.cccc.addressvalidation.endereco.mapping[field] : fallback;

        logger.logData(
            "endereco-setup/ccccGetAdressDataFieldselector: Determined field selector for "+field+" (fallback: "+fallback+") => result: "+fieldSelector
        );

        return fieldSelector;
    }

    function ccccGetAddressDataByFieldSelector(field, fallback) {
        var fieldSelector = ccccGetAdressDataFieldselector(field, fallback);
        var val = fieldSelector.replace(/\[([0-9]+)\]/, ".$1");
        logger.logData(
            "endereco-setup/ccccGetAddressDataByFieldSelector: Determined field selector for "+field+" (fallback: "+fallback+") => normalized result: "+val
        );
        return val;
    }

    function ccccSetupJsSdkCheck() {
        var funcAllFieldsAreArrived = function() {
            var allFieldsArrived = window.fieldsArrivedChecks && window.fieldsArrivedChecks.length > 0;
            if (window.fieldsArrivedChecks) {
                for (var i = 0; i < window.fieldsArrivedChecks.length; i++) {
                    allFieldsArrived = allFieldsArrived && window.fieldsArrivedChecks[i]();
                }
                console.log("allFieldsArrived: "+allFieldsArrived);
            }
            return allFieldsArrived;
        };

        if (!window.amsInitialized && funcAllFieldsAreArrived()) {
            ccccSetupJsSdk();
        } else {
            var target = document.querySelector('body');
            var observer = new MutationObserver(function(mutations) {
                mutations.forEach(function(mutation) {
                    if (!window.amsInitialized && funcAllFieldsAreArrived()) {
                        observer.disconnect();
                        ccccSetupJsSdk();
                    }
                });
            });

            observer.observe(
                target,
                { attributes: false, childList: true, characterData: false, subtree: true }
            );
        }
    }

    function ccccSetupJsSdk() {
        if (!window.amsInitialized) {
            window.amsInitialized = true;
            if (!window.checkoutConfig.cccc.addressvalidation.endereco.enabled
                || !window.checkoutConfig.cccc.addressvalidation.endereco.check.shipping_enabled) {
                return;
            }
            window.EnderecoIntegrator.defaultCountry = window.checkoutConfig.cccc.addressvalidation.endereco.countryId;
            window.EnderecoIntegrator.defaultCountrySelect = true;
            window.EnderecoIntegrator.themeName = 'm2-addressvalidation';
            window.EnderecoIntegrator.config.agentName = window.checkoutConfig.cccc.addressvalidation.endereco.agentName;
            window.EnderecoIntegrator.config.apiUrl =  window.checkoutConfig.cccc.addressvalidation.endereco.directRequests
                ? window.checkoutConfig.cccc.addressvalidation.endereco.apiUrl.direct
                : window.checkoutConfig.cccc.addressvalidation.endereco.apiUrl.proxy;
            window.EnderecoIntegrator.config.remoteApiUrl = window.checkoutConfig.cccc.addressvalidation.endereco.directRequests
                ? window.checkoutConfig.cccc.addressvalidation.endereco.serverApiUrl
                : null;
            window.EnderecoIntegrator.config.apiKey = window.checkoutConfig.cccc.addressvalidation.endereco.directRequests
                ? window.checkoutConfig.cccc.addressvalidation.endereco.apiKey
                : null;
            window.EnderecoIntegrator.config.showDebugInfo = false;
            window.EnderecoIntegrator.config.trigger.onblur = false;
            window.EnderecoIntegrator.config.trigger.onsubmit = true;
            window.EnderecoIntegrator.config.ux.resumeSubmit = true;
            window.EnderecoIntegrator.config.useAutocomplete = window.checkoutConfig.cccc.addressvalidation.endereco.use_autocomplete;

            if (window.EnderecoIntegrator.config.useAutocomplete) {
                var selectorPostCode = ccccGetAddressDataByFieldSelector('postCode', 'postcode');
                var selectorCityName = ccccGetAddressDataByFieldSelector('cityName', 'city');
                var selectorStreet = ccccGetAddressDataByFieldSelector('street', 'street.0');
                var selectorHouseNumber = ccccGetAddressDataByFieldSelector('street', 'street.1');
                var selectorCountryId = ccccGetAddressDataByFieldSelector('country', 'country_id');
                var selectorEmail = ccccGetAddressDataByFieldSelector('email', '.checkout-shipping-address #customer-email');

                var cbBlur = function(e) {
                    $(e.target).change();
                }

                var fieldTemplate = window.checkoutConfig.cccc.addressvalidation.endereco.mapping.template;
                $(fieldTemplate.replace("##field##", selectorPostCode)).on('endereco-blur', cbBlur);
                $(fieldTemplate.replace("##field##", selectorCityName)).on('endereco-blur', cbBlur);
                $(fieldTemplate.replace("##field##", selectorStreet)).on('endereco-blur', cbBlur);
                $(fieldTemplate.replace("##field##", selectorHouseNumber)).on('endereco-blur', cbBlur);
                $(fieldTemplate.replace("##field##", selectorCountryId)).on('endereco-blur', cbBlur);
                $(fieldTemplate.replace("##field##", selectorEmail)).on('endereco-blur', cbBlur);
            }

            window.EnderecoIntegrator.config.ux.smartFill = true;
            window.EnderecoIntegrator.config.ux.resumeSubmit = true;
            window.EnderecoIntegrator.config.ux.useStandardCss = true;
            window.EnderecoIntegrator.config.ux.allowCloseModal = !window.checkoutConfig.cccc.addressvalidation.endereco.force_valid_address;
            window.EnderecoIntegrator.config.ux.confirmWithCheckbox = !window.checkoutConfig.cccc.addressvalidation.endereco.force_valid_address;
            window.EnderecoIntegrator.config.ux.changeFieldsOrder = true;
            window.EnderecoIntegrator.config.templates.primaryButtonClasses = 'button action continue primary';
            window.EnderecoIntegrator.config.templates.secondaryButtonClasses = 'button action continue';

            window.EnderecoIntegrator.countryCodeToNameMapping = window.checkoutConfig.cccc.addressvalidation.endereco.countries;

            // Country matching functions.
            window.EnderecoIntegrator.resolvers.countryCodeWrite = function (value) {
                return new Promise(function (resolve, reject) {
                    resolve(value.toUpperCase());
                });
            }
            window.EnderecoIntegrator.resolvers.countryCodeRead = function (value) {
                return new Promise(function (resolve, reject) {
                    resolve(value.toLowerCase());
                });
            }

            window.EnderecoIntegrator.config.texts = {
                popUpHeadline: $.mage.__('Address validation'),
                popUpSubline: $.mage.__('The address you entered seems to be incorrect or incomplete. Please select the correct address.'),
                mistakeNoPredictionSubline: $.mage.__('Your address could not be verified. Please check your entry and change or confirm it.'),
                notFoundSubline: $.mage.__('Your address could not be verified. Please check your entry and change or confirm it.'),
                confirmMyAddressCheckbox: $.mage.__('I confirm that my address is correct and deliverable.'),
                yourInput: $.mage.__('Your input:'),
                editYourInput: $.mage.__('(edit)'),
                ourSuggestions: $.mage.__('Our suggestions:'),
                useSelected: $.mage.__("Use selected"),
                confirmAddress: $.mage.__('Confirm address'),
                editAddress: $.mage.__('Edit address'),
                warningText: $.mage.__('Incorrect addresses can lead to problems in delivery and cause further costs.'),
                popupHeadlines: {
                    general_address: $.mage.__('Address validation'),
                    billing_address: $.mage.__('Validate billing address'),
                    shipping_address: $.mage.__('Validate shipping address'),
                },
                statuses: {
                    email_not_correct: $.mage.__('The e-mail address does not seem to be correct.'),
                    email_cant_receive: $.mage.__('The e-mail box is not accessible.'),
                    email_syntax_error: $.mage.__('Check the notation.'),
                    email_no_mx: $.mage.__('The e-mail address does not exist. Check the notation.'),
                    email_A5000: $.mage.__('General error occurred'),
                    email_A4900: $.mage.__('Spam traps detected'),
                    email_A4810: $.mage.__('eMail server is unreachable'),
                    email_A4400: $.mage.__('eMail delivery failed'),
                    email_A4300: $.mage.__('The server does not know this eMail address'),
                    email_A4200: $.mage.__('The eMail address is not formatted correctly'),
                    email_A4110: $.mage.__('The connection to the eMail server was interrupted'),
                    building_number_is_missing: $.mage.__('No house number included.'),
                    building_number_not_found: $.mage.__('This house number was not found.'),
                    street_name_needs_correction: $.mage.__('The spelling of the street is incorrect.'),
                    locality_needs_correction: $.mage.__('The spelling of the city is incorrect.'),
                    postal_code_needs_correction: $.mage.__('The postal code is invalid.'),
                    country_code_needs_correction: $.mage.__('The entered address was found in another country.'),
                    address_needs_correction: $.mage.__('The address needs correction.'),
                    address_selected_by_customer: $.mage.__('The address was selected and confirmed by the customer.'),
                },
                warnings: {
                    email_A4700: $.mage.__('The email account does not exist, is inactive, or cannot receive email. Check the spelling if necessary.'),
                    email_A4600: $.mage.__('Antispam blocks the eMail'),
                    email_A4500: $.mage.__('Relay error - the email server is probably not configured correctly.'),
                }
            };

            window.EnderecoIntegrator.activeServices = {
                ams: window.checkoutConfig.cccc.addressvalidation.endereco.enabled,
                emailService: window.checkoutConfig.cccc.addressvalidation.endereco.enabled
                    && window.checkoutConfig.cccc.addressvalidation.endereco.email_check,
                personService: false
            };

            window.EnderecoIntegrator.ready = true;

            if (window.amsCallback) {
                for (var i = 0; i < window.amsCallback.length; i++) {
                    window.amsCallback[i]();
                }
            }

            if(window.emailCallback) {
                window.emailCallback();
            }
        }
    }

    if (window.checkoutConfig) {
        ccccSetupJsSdkCheck();
    }

    return {
        startEmailServices: function(prefix, config)
        {
            if (!window.amsInitialized) {
                window.emailCallback = function() {
                    if (undefined !== window.EnderecoIntegrator.initEmailServices) {
                        window.EnderecoIntegrator.initEmailServices(prefix, config);
                    } else {
                        window.EnderecoIntegrator.onLoad.push(function () {
                            window.EnderecoIntegrator.initEmailServices(prefix, config);
                        });
                    }
                }
                return;
            }
            if (undefined !== window.EnderecoIntegrator.initEmailServices) {
                window.EnderecoIntegrator.initEmailServices(prefix, config);
            } else {
                window.EnderecoIntegrator.onLoad.push(function () {
                    window.EnderecoIntegrator.initEmailServices(prefix, config);
                });
            }
        },

        startAms: function(prefix, config) {
            if (!window.amsInitialized) {
                if (!window.amsCallback) {
                    window.amsCallback = [];
                    window.fieldsArrivedChecks = [];
                }

                var selectorPostCode = ccccGetAddressDataByFieldSelector('postCode', 'postcode');
                var selectorCityName = ccccGetAddressDataByFieldSelector('cityName', 'city');
                var selectorStreet = ccccGetAddressDataByFieldSelector('street', 'street.0');
                var selectorHouseNumber = ccccGetAddressDataByFieldSelector('street', 'street.1');
                var selectorCountryId = ccccGetAddressDataByFieldSelector('country', 'country_id');
                var selectorEmail = ccccGetAddressDataByFieldSelector('email', '.checkout-shipping-address #customer-email');

                var fieldsArrived = function() {
                    var fieldTemplate = window.checkoutConfig.cccc.addressvalidation.endereco.mapping.template
                        .replace("shippingAddress.", config.name+".");

                    return (
                            window.checkoutConfig.cccc.addressvalidation.endereco.enabled ?
                                (
                                    $(fieldTemplate.replace("##field##", selectorPostCode)).length
                                    && $(fieldTemplate.replace("##field##", selectorCityName)).length
                                    && $(fieldTemplate.replace("##field##", selectorStreet)).length
                                    && $(fieldTemplate.replace("##field##", selectorHouseNumber)).length
                                    && $(fieldTemplate.replace("##field##", selectorCountryId)).length
                                ) : true
                        )
                        && (!window.isCustomerLoggedIn && window.checkoutConfig.cccc.addressvalidation.endereco.email_check ? $(selectorEmail).length : true)
                }.bind(this);

                window.fieldsArrivedChecks.push(
                    fieldsArrived
                );

                window.amsCallback.push(
                    function() {
                        if (undefined !== window.EnderecoIntegrator.initAMS) {
                            window.EnderecoIntegrator.initAMS(prefix, config);
                            window.EnderecoIntegrator.integratedObjects[config.name + "_ams"]._changed = true;
                        } else {
                            window.EnderecoIntegrator.onLoad.push(function () {
                                window.EnderecoIntegrator.initAMS(prefix, config);
                                window.EnderecoIntegrator.integratedObjects[config.name + "_ams"]._changed = true;
                            });
                        }
                        window.EnderecoIntegrator.integratedObjects[config.name + "_ams"].waitForAllExtension().then(
                            function(EAO) {
                                EAO.onEditAddress.push(function () {
                                    window.location = '#shipping';
                                });

                                EAO.onAfterAddressCheckSelected.push( function(EAO) {
                                    EAO.waitForAllPopupsToClose().then(function () {
                                        EAO.waitUntilReady().then(function () {
                                        }).catch()
                                    }).catch();
                                });
                            }
                        );
                    }
                );

                if (config.callbacks) {
                    config.callbacks.forEach(function(callback) {
                        window.amsCallback.push(callback);
                    });
                }
                return;
            }
            // TODO - Check. Callback? Fields arrived?
            if (undefined !== window.EnderecoIntegrator.initAMS) {
                window.EnderecoIntegrator.initAMS(prefix, config);
                window.EnderecoIntegrator.integratedObjects[config.name + "_ams"]._changed = true;
            } else {
                window.EnderecoIntegrator.onLoad.push(function () {
                    window.EnderecoIntegrator.initAMS(prefix, config);
                    window.EnderecoIntegrator.integratedObjects[config.name + "_ams"]._changed = true;
                });
            }

            window.EnderecoIntegrator.integratedObjects[config.name + "_ams"].waitForAllExtension().then(
                function(EAO) {
                    EAO.onEditAddress.push(function () {
                        window.location = '#shipping';
                    });
                }
            );
        },

        getAddressStatusAsText: function (statusArray) {
            var statusText = [];
            if (!statusArray) {
                return "";
            }
            for (var i = 0; i < statusArray.length; i++) {
                if (window.EnderecoIntegrator.config.texts.statuses[statusArray[i]]) {
                    statusText.push(window.EnderecoIntegrator.config.texts.statuses[statusArray[i]]);
                }
            }
            return statusText.join(" ");
        },
    }
});
