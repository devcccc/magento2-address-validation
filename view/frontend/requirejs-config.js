/*jshint browser:true jquery:true*/
/*global alert*/
var config = {
    config: {
        mixins: {
            'Magento_Checkout/js/view/shipping': {
                'CCCC_Addressvalidation/js/view/shipping-mixin': true
            },
            'Magento_Checkout/js/view/billing-address': {
                'CCCC_Addressvalidation/js/view/billing-address-mixin': true
            },
            'Magento_Checkout/js/view/form/element/email': {
                'CCCC_Addressvalidation/js/view/email-mixin': true
            }
        }
    }
};
