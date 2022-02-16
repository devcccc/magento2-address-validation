/*jshint browser:true jquery:true*/
/*global alert*/
define([
    'jquery',
    'Magento_Checkout/js/model/full-screen-loader',
    'CCCC_Addressvalidation/js/endereco-setup',
    'CCCC_Addressvalidation/js/helper/configuration'
], function ($, loader, enderecosdk, configurationHelper) {
    'use strict';

    var mixin = {
        default: {
            handlerSet: false
        },

        _init: function() {
            this._super();

            var fieldTemplate = window.checkoutConfig.cccc.addressvalidation.endereco.mapping.template;

            var amsPrefix = {
                countryCode: fieldTemplate.replace("##field##", configurationHelper.ccccGetAddressDataByFieldSelector('country_id', 'country_id')),
                postalCode: fieldTemplate.replace("##field##", configurationHelper.ccccGetAddressDataByFieldSelector('postCode', 'postcode')),
                locality: fieldTemplate.replace("##field##", configurationHelper.ccccGetAddressDataByFieldSelector('cityName', 'city')),
                streetFull: configurationHelper.useStreetFull() ?fieldTemplate.replace("##field##",configurationHelper.ccccGetAddressDataByFieldSelector('street', 'street.0')):"",
                streetName: !configurationHelper.useStreetFull()?fieldTemplate.replace("##field##",configurationHelper.ccccGetAddressDataByFieldSelector('street', 'street.0')):"",
                buildingNumber: !configurationHelper.useStreetFull()?fieldTemplate.replace("##field##",configurationHelper.ccccGetAddressDataByFieldSelector('houseNumber', 'street.1')):"",
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
                        name: 'customer_address',
                        addressType: 'general_address'
                    }
                );

                window.EnderecoIntegrator.config.ux.resumeSubmit = true;

                var that = this;
                var button = $(this.options.selectors.button, this.element);
                button.on('click', function (evt) {
                    if (!that.handlerSet) {
                        that.handlerSet = true;
                        window.EnderecoIntegrator.integratedObjects.customer_address_ams.onConfirmAddress.push(that._updateAddressFromEndereco.bind(that));
                        window.EnderecoIntegrator.integratedObjects.customer_address_ams.onAfterAddressCheckNoAction.push(that._updateAddressFromEndereco.bind(that));
                        window.EnderecoIntegrator.submitResume = that._updateAddressFromEndereco.bind(that);
                    }

                    window.EnderecoIntegrator.integratedObjects.customer_address_ams._changed=true;
                    window.EnderecoIntegrator.integratedObjects.customer_address_ams.cb.onFormSubmit(new Event('check'));
                    debugger;
                    evt.preventDefault();
                    return false;

                });
            }
        },

        _renderValidationResult: function (valid) {
            if (configurationHelper.isAddressValidationEnabled) {
                this._super(valid);
            }
        },

        _updateAddressFromEndereco: function() {
            this._doSubmitAfterAddressValidation();
        },

        _doSubmitAfterAddressValidation: function() {
            var button = $(this.options.selectors.button, this.element);
            button.attr('disabled', false);

            var form = this.element.first();
            window.EnderecoIntegrator.config.ux.resumeSubmit = false;
            window.EnderecoIntegrator.config.trigger.onsubmit = false;
            form.submit();
        },
    }

    return function (widget) {
        $.widget(
            'mage.addressValidation',
            widget,
            mixin
        );
        return $.mage.addressValidation;

    };
});
