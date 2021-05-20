/*jshint browser:true jquery:true*/
/*global alert*/
define([
    'jquery',
    'Magento_Checkout/js/model/full-screen-loader',
    'CCCC_Addressvalidation/js/helper/logger'
], function ($, fullScreenLoader, logger) {
    'use strict';

    /** Override default place order action and add agreement_ids to request */
    return async function (email, baseView, type) {
        var serviceUrl = window.checkoutConfig.cccc.addressvalidation.endereco.urls.checkemail.replace(/\/$/, '');

        logger.logData(
            "email/check: Service-URL selected: "+serviceUrl
        );

        var request = {
            email: email
        };

        logger.logData(
            "email/check: Request data to backend: "+JSON.stringify(request)
        );

        for (var paramKey in request) {
            serviceUrl = serviceUrl + "/" + encodeURI(paramKey) + "/" + encodeURI(request[paramKey]);
        }

        logger.logData(
            "email/check: Service-URL generated with request data: "+serviceUrl
        );

        fullScreenLoader.startLoader();

        logger.logData(
            "email/check: Loader displayed, sending request to  "+serviceUrl
        );

        const response = await $.ajax(
            {
                type: "POST",
                url: serviceUrl,
                dataType: "json"
            }
        );

        if (response.success) {
            logger.logData(
                "email/check: Retrieved successful response: "+JSON.stringify(response)
            );
            if (response.success && response.valid) {
                logger.logData(
                    "email/check: Response analysis; success: yes"
                    +", disposable: "+(response.disposable?"yes":"no")
                    +", status codes: "+response.statuscodes.join(', ')
                );

                logger.logData(
                    "email/check: eMail address valid"
                );
                return true;
            } else {
                let error = $.mage.__('We are not able to verify your email address.'+"\r\n");
                for (let i = 0; i < response.statuscodes.length; i++) {
                    switch (response.statuscodes[i]) {
                        case 'A4100':
                            error = error + $.mage.__(' Error while connecting to the eMail-Server (SMTP-Error).');
                            break;
                        case 'A4110':
                            error = error + $.mage.__(' A connection to the eMail-Server is possbile, but the connection got interrupted unexpected.');
                            break;
                        case 'A4200':
                        case 'email_not_correct':
                        case 'email_syntax_error':
                            error = error + $.mage.__(' eMail is not in a valid format.');
                            break;
                        case 'A4300':
                            error = error + $.mage.__(' eMail-Server reports: Recipient unknown.');
                            break;
                        case 'A4400':
                            error = error + $.mage.__(' Delivery of an eMail will fail.');
                            break;
                        case 'A4500':
                            error = error + $.mage.__(' Relay error while trying to check the eMail-address.');
                            break;
                        case 'A4600':
                            error = error + $.mage.__(' eMail will not be delivered due to AntiSpam-restrictions.');
                            break;
                        case 'A4700':
                            error = error + $.mage.__(' eMail-account is inactive, does not exist or can not received any message.');
                            break;
                        case 'A4800':
                            error = error + $.mage.__(' For the domain specified no eMail-server is configured.');
                            break;
                        case 'A4810':
                            error = error + $.mage.__(' The eMail-server is offline.');
                            break;
                        case 'A4900':
                        case 'email_no_mx':
                            error = error + $.mage.__(' For the domain specified no eMail-server is configured.');
                            break;
                        case 'email_unknown_tld':
                            error = error + $.mage.__(' The domain is invalid.');
                            break;
                        case 'A5000':
                            error = error + $.mage.__(' Spam trap detected.')
                            break;
                    }
                }

                logger.logData(
                    "email/check: Error message: "+error
                );

                fullScreenLoader.stopLoader();
                logger.logData(
                    "email/check: Disabled loader"
                );
                return error;
            }
        } else {
            logger.logData(
                "email/check: Retrieved failed response: "+JSON.stringify(response)
            );
            fullScreenLoader.stopLoader();
            logger.logData(
                "email/check: Disabled loader"
            );
            return false;
        }

    };
});
