/*jshint browser:true jquery:true*/
/*global alert*/
define([
    'jquery',
    'Magento_Checkout/js/model/url-builder',
    'mage/storage',
    'Magento_Checkout/js/model/full-screen-loader'
], function ($, urlBuilder, storage, fullScreenLoader) {
    'use strict';

    return function (addressData) {
        var serviceUrl = urlBuilder.createUrl('/carts/mine/cccc-updateAddress', {});
        var request = {
            addressData: addressData
        };
/*
        request.addressData.postcode = request.addressData.postCode;
        delete request.addressData.postCode;

        request.addressData.street = [request.addressData.street, request.addressData.houseNumber];
        delete request.addressData.houseNumber;*/

        fullScreenLoader.startLoader();

        return storage.post(
            serviceUrl,
            JSON.stringify(request)
        ).done(
            function (response) {
                fullScreenLoader.stopLoader();
            }
        ).fail(
            function (response) {
                fullScreenLoader.stopLoader();
            }
        );
    };
});
