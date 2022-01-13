/*jshint browser:true jquery:true*/
/*global alert*/
var config = {
    config: {
        mixins: {
            'Magento_Checkout/js/view/shipping': {
                'CCCC_Addressvalidation/js/view/shipping-mixin': true
            },
            'Magento_Checkout/js/view/form/element/email': {
                'CCCC_Addressvalidation/js/view/email-mixin': true
            },
            addressValidation: {
                'CCCC_Addressvalidation/js/view/customer-address-validation-mixin': true
            },
            'Magento_Customer/js/addressValidation': {
                'CCCC_Addressvalidation/js/view/customer-address-validation-mixin': true
            }
        }
    }
};
