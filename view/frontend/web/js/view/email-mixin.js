/*jshint browser:true jquery:true*/
/*global alert*/
define([
    'jquery',
    'Magento_Checkout/js/model/full-screen-loader',
    'CCCC_Addressvalidation/js/endereco-setup'
], function ($, fullScreenLoader, enderecosdk) {
    'use strict';

    var mixin = {
        default: {
            emailInitialized: false
        },

        initialize: function () {
            this._super();

            if (window.checkoutConfig.cccc.addressvalidation.endereco.email_check) {
                this.emailInitialized = true;
                enderecosdk.startEmailServices(
                    "",
                    {
                        postfixCollection:
                            {
                                email: ".checkout-shipping-address #customer-email"
                            }, name: 'customer_email'
                    }
                );
            }

            return this;
        },

        /**
         * Local email validation.
         *
         * @param {Boolean} focused - input focus.
         * @returns {Boolean} - validation result.
         */
        validateEmail: async function (focused) {
            if (!this._super()) {
                return false;
            }

            if (!window.checkoutConfig.cccc.addressvalidation.endereco.email_check) {
                return true;
            }

            var loginFormSelector = 'form[data-role=email-with-possible-login]',
                usernameSelector = loginFormSelector + ' input[name=username]',
                emailField = $(usernameSelector);

            var regex = /^([a-zA-Z0-9_.+-])+\@(([a-zA-Z0-9-])+\.)+([a-zA-Z0-9]{2,4})+$/;

            if (focused === false && !!this.email() && this.email().length > 0 && regex.test(this.email())) {
                $('#customer-email-error-api').remove();
                $('#customer-email-warning-api').remove();
                emailField.removeClass('mage-error');

                if (!this.emailInitialized) {
                    this.emailInitialized = true;
                    enderecosdk.startEmailServices(
                        "",
                        {
                            postfixCollection:
                                {
                                    email: ".checkout-shipping-address #customer-email"
                                }, name: 'customer_email'
                        }
                    );
                }

                var rtc = await window.EnderecoIntegrator.integratedObjects.customer_email_emailservices.util.checkEmail();

                this.isLoading(false);
                fullScreenLoader.stopLoader();
                var errors = [], warnings = [];
                if (rtc && rtc.status && rtc.status.length) {
                    for (var x = 0 ; x < rtc.status.length; x++) {
                        if (window.EnderecoIntegrator.config.texts.statuses[rtc.status[x]]) {
                            errors.push(window.EnderecoIntegrator.config.texts.statuses[rtc.status[x]]);
                        } else if (window.EnderecoIntegrator.config.texts.statuses['email_' + rtc.status[x]]) {
                            errors.push(window.EnderecoIntegrator.config.texts.statuses['email_' + rtc.status[x]]);
                        } else if (window.EnderecoIntegrator.config.texts.warnings[rtc.status[x]]) {
                            warnings.push(window.EnderecoIntegrator.config.texts.warnings[rtc.status[x]]);
                        } else if (window.EnderecoIntegrator.config.texts.warnings['email_' + rtc.status[x]]) {
                            warnings.push(window.EnderecoIntegrator.config.texts.warnings['email_' + rtc.status[x]]);
                        }
                    }
                }

                if (errors.length == 0) {
                    if (window.checkoutConfig.cccc.addressvalidation.endereco.email_show_warnings && warnings.length) {
                        var warningDiv = $('<div role="alert" class="message warning" generated="true" id="customer-email-warning-api" style="display: block;"><span>'+warnings.join(' ')+'</span></div>');
                        emailField.after(warningDiv);
                    }
                    return true;
                }

                emailField.addClass('mage-error');
                var errorDiv = $('<div for="customer-email" generated="true" class="mage-error" id="customer-email-error-api" style="display: block;">'+errors.join(' ')+'</div>');
                emailField.after(errorDiv);
                emailField.attr('aria-invalid', 'true');
                emailField.attr('aria-describedby', 'customer-email-error');
                emailField[0].scrollIntoViewIfNeeded();

                return false;
            }

            return true;
        }
    }

    return function (email) {
        return email.extend(mixin);
    };
});
