<?php
/**
 * Module: CCCC\Addressvalidation\Plugin
 * Copyright: (c) 2021 cccc.de
 * Date: 22.06.21 16:16
 *
 *
 */

namespace CCCC\Addressvalidation\Plugin;

use CCCC\Addressvalidation\Model\ConfigProvider;
use Magento\Sales\Model\Order;
use Magento\Sales\Model\OrderFactory;
class SaveValidationResultToQuote
{
    /** @var \Magento\Sales\Model\OrderRepository  */
    protected $orderRepository;

    /** @var ConfigProvider  */
    protected $configProvider;

    public function __construct(\Magento\Sales\Model\OrderRepository $orderRepository, ConfigProvider $configProvider)
    {
        $this->orderRepository = $orderRepository;
        $this->configProvider = $configProvider;
    }


    public function afterSavePaymentInformationAndPlaceOrder(
        $subject, $result, $cartId, $email,
        \Magento\Quote\Api\Data\PaymentInterface $paymentMethod,
        \Magento\Quote\Api\Data\AddressInterface $billingAddress = null) {

        if (!$this->configProvider->isEnabled()) {
            return $result;
        }

        /** @var Order $order */
        $order = $this->orderRepository->get($result);
        $ext = $paymentMethod->getExtensionAttributes();

        if (!$order->isObjectNew() && $order->getIncrementId()) {
            $order->addCommentToStatusHistory(
                __("Shipping Address status:")." ".$ext->getCcccValidationShippingResult()
            );
            $this->orderRepository->save($order);
        }
        return $result;
    }


}
