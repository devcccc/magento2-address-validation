/*jshint browser:true jquery:true*/
/*global alert*/
define([
    'jquery',
    'Magento_Checkout/js/model/url-builder',
    'mage/storage',
    'CCCC_Addressvalidation/js/helper/logger',
    'Magento_Checkout/js/model/full-screen-loader'
], function ($, urlBuilder, storage, logger, fullScreenLoader) {
    'use strict';

    return function (addressData) {
        var serviceUrl = urlBuilder.createUrl('/carts/mine/cccc-updateAddress', {});
        logger.logData(
            "operation/edit-address: Service-URL selected: "+serviceUrl
        );

        var request = {
            addressData: addressData
        };

        logger.logData(
            "operation/edit-address: Request data: "+JSON.stringify(request)
        );

        fullScreenLoader.startLoader();
        logger.logData(
            "operation/edit-address: Displayed loader"
        );

        return storage.post(
            serviceUrl,
            JSON.stringify(request)
        ).done(
            function (response) {
                logger.logData(
                    "operation/edit-address: Request was successful - response: "+JSON.stringify(response)
                );
                fullScreenLoader.stopLoader();
                logger.logData(
                    "operation/edit-address: Hiding loader"
                );
            }
        ).fail(
            function (response) {
                logger.logData(
                    "operation/edit-address: Request failed - response: "+JSON.stringify(response)
                );
                fullScreenLoader.stopLoader();
                logger.logData(
                    "operation/edit-address: Hiding loader"
                );
            }
        );
    };
});
