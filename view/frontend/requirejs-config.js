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
            }/*,
            'Magento_Checkout/js/model/error-processor': {
                'Payone_Core/js/model/error-processor-mixin': true
            }*/
        }
    }
};
