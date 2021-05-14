/*jshint browser:true jquery:true*/
/*global alert*/
define([
    'jquery'
], function ($) {
    'use strict';

    return {
        logData: function(data)
        {
            var shouldLog = window.checkoutConfig.cccc.addressvalidation.endereco && window.checkoutConfig.cccc.addressvalidation.endereco.development
                && window.checkoutConfig.cccc.addressvalidation.endereco.development.javascript_debug;

            if (shouldLog) {
                console.debug(data);
            }
        }
    };
});