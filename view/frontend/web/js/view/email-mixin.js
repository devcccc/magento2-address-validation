/*jshint browser:true jquery:true*/
/*global alert*/
define([
    'jquery',
    'CCCC_Addressvalidation/js/operation/check/email',
    'Magento_Checkout/js/model/full-screen-loader',
    'uiRegistry'
], function ($, emailcheck, fullScreenLoader, uiRegistry) {
    'use strict';

    var mixin = {
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

            if (focused === false && !!this.email()) {
                $('#customer-email-error-api').remove();
                emailField.removeClass('mage-error');

                var rtc = await emailcheck(this.email());
                this.isLoading(false);
                fullScreenLoader.stopLoader();
                if (rtc === true) {
                    return true;
                }

                emailField.addClass('mage-error');

                var errorDiv = $('<div for="customer-email" generated="true" class="mage-error" id="customer-email-error-api" style="display: block;">'+rtc+'</div>');
                emailField.after(errorDiv);
                emailField.attr('aria-invalid', 'true');
                emailField.attr('aria-describedby', 'customer-email-error');
                emailField[0].scrollIntoViewIfNeeded();


                return false;
            }

            this.isLoading(false);
            fullScreenLoader.stopLoader();
            return true;
        }
    }

    return function (email) {
        return email.extend(mixin);
    };
});
