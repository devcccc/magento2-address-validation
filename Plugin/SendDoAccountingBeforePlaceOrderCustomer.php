<?php
/**
 * Module: CCCC\Addressvalidation\Plugin
 * Copyright: (c) 2021 cccc.de
 * Date: 23.06.21 10:11
 *
 *
 */

namespace CCCC\Addressvalidation\Plugin;

use CCCC\Addressvalidation\Model\ConfigProvider;
use CCCC\Addressvalidation\Operation\DoAccountingOperation;

class SendDoAccountingBeforePlaceOrderCustomer
{
    /** @var DoAccountingOperation */
    protected $doAccountingOperation;

    /** @var ConfigProvider  */
    protected $configProvider;

    /**
     * @param DoAccountingOperation $doAccountingOperation
     * @param ConfigProvider $configProvider
     */
    public function __construct(DoAccountingOperation $doAccountingOperation, ConfigProvider $configProvider)
    {
        $this->doAccountingOperation = $doAccountingOperation;
        $this->configProvider = $configProvider;
    }


    public function beforeSavePaymentInformationAndPlaceOrder($subject, $cartId,
                                                              \Magento\Quote\Api\Data\PaymentInterface $paymentMethod,
                                                              \Magento\Quote\Api\Data\AddressInterface $billingAddress = null) {
        if (!$this->configProvider->isEnabled()) {
            return;
        }

        $this->doAccountingOperation->doRequest();
    }
}
