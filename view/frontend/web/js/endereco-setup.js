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
        var fieldsArrived = function() {
            return (
                window.checkoutConfig.cccc.addressvalidation.endereco.enabled ?
                    (
                        $("[name='shippingAddress."+ccccGetAddressDataByFieldSelector('postCode', 'postcode')+"'] input[name]").length
                        && $("[name='shippingAddress."+ccccGetAddressDataByFieldSelector('cityName', 'city')+"'] input[name]").length
                        && $("[name='shippingAddress."+ccccGetAddressDataByFieldSelector('street', 'street.0')+"'] input[name]").length
                        && $("[name='shippingAddress."+ccccGetAddressDataByFieldSelector('houseNumber', 'street.1')+"'] input[name]").length
                        && $("[name='shippingAddress."+ccccGetAddressDataByFieldSelector('country_id', 'country_id')+"'] select[name]").length
                    ) : true
                )
                && (window.checkoutConfig.cccc.addressvalidation.endereco.email_check ? $(ccccGetAddressDataByFieldSelector('email', '.checkout-shipping-address #customer-email')).length : true)
        }.bind(this);

        if (!window.amsInitialized && fieldsArrived()) {
            window.amsInitialized = true;
            ccccSetupJsSdk();
        } else {
            var cb = function(e) {
                if (!window.amsInitialized && fieldsArrived()) {
                    $(document).off(
                        'DOMSubtreeModified',
                        "#shipping",
                        cb
                    );
                    ccccSetupJsSdk();
                } else if(window.amsInitialized) {
                    $(document).off(
                        'DOMSubtreeModified',
                        "#shipping",
                        cb
                    );
                }
            }.bind(this);
            $(document).on(
                'DOMSubtreeModified',
                '#shipping',
                cb
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
            // TODO: Get from store view
            window.EnderecoIntegrator.defaultCountry = 'DE';
            window.EnderecoIntegrator.defaultCountrySelect = true;
            window.EnderecoIntegrator.themeName = 'm2-addressvalidation';
            window.EnderecoIntegrator.config.agentName = "Magento 2 Address Validation";
            window.EnderecoIntegrator.config.apiUrl = '/4cAddress/proxy/proxy';
            window.EnderecoIntegrator.config.showDebugInfo = false;
            window.EnderecoIntegrator.config.trigger.onblur = false;
            window.EnderecoIntegrator.config.trigger.onsubmit = true;
            window.EnderecoIntegrator.config.ux.smartFill = true;
            window.EnderecoIntegrator.config.ux.resumeSubmit = true;
            window.EnderecoIntegrator.config.ux.useStandardCss = true;
            window.EnderecoIntegrator.config.ux.allowCloseModal = !window.checkoutConfig.cccc.addressvalidation.endereco.force_valid_address;
            window.EnderecoIntegrator.config.ux.confirmWithCheckbox = !window.checkoutConfig.cccc.addressvalidation.endereco.force_valid_address;
            window.EnderecoIntegrator.config.ux.changeFieldsOrder = true;
            window.EnderecoIntegrator.config.templates.primaryButtonClasses = 'button action continue primary';
            window.EnderecoIntegrator.config.templates.secondaryButtonClasses = 'button action continue';
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

            window.EnderecoIntegrator.activeServices = {
                ams: window.checkoutConfig.cccc.addressvalidation.endereco.enabled,
                emailService: window.checkoutConfig.cccc.addressvalidation.endereco.enabled
                    && window.checkoutConfig.cccc.addressvalidation.endereco.email_check,
                personService: false
            };

            window.EnderecoIntegrator.ready = true;

            if (window.amsCallback) {
                window.amsCallback();
            }

            if(window.emailCallback) {
                window.emailCallback();
            }
        }
    }

    ccccSetupJsSdkCheck();

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
                window.amsCallback = function() {
                    if (undefined !== window.EnderecoIntegrator.initAMS) {
                        window.EnderecoIntegrator.initAMS(prefix, config);
                        window.EnderecoIntegrator.integratedObjects.shipping_address_ams._changed = true;
                    } else {
                        window.EnderecoIntegrator.onLoad.push(function () {
                            window.EnderecoIntegrator.initAMS(prefix, config);
                            window.EnderecoIntegrator.integratedObjects.shipping_address_ams._changed = true;
                        });
                    }
                }
                return;
            }
            if (undefined !== window.EnderecoIntegrator.initAMS) {
                window.EnderecoIntegrator.initAMS(prefix, config);
                window.EnderecoIntegrator.integratedObjects.shipping_address_ams._changed = true;
            } else {
                window.EnderecoIntegrator.onLoad.push(function () {
                    window.EnderecoIntegrator.initAMS(prefix, config);
                    window.EnderecoIntegrator.integratedObjects.shipping_address_ams._changed = true;
                });
            }
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
