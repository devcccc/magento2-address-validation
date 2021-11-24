<?php
/**
 * Module: CCCC\Addressvalidation\Service\V1
 * Copyright: (c) 2019 cccc.de
 * Date: 2019-07-02 11:23
 *
 *
 */

namespace CCCC\Addressvalidation\Service\V1;

use Magento\Quote\Api\Data\AddressInterface;
use Magento\Customer\Api\AddressRepositoryInterface;
use CCCC\Addressvalidation\Service\V1\Data\EditAddressResponseFactory;
use CCCC\Addressvalidation\Api\UpdateAddressInterface;
use Magento\Quote\Model\Quote;

class UpdateAddress implements UpdateAddressInterface
{
    /**
     * Factory for the response object
     *
     * @var \CCCC\Addressvalidation\Service\V1\Data\EditAddressResponseFactory
     */
    protected $responseFactory;

    /**
     * Address repository
     *
     * @var \Magento\Customer\Api\AddressRepositoryInterface
     */
    protected $addressRepository;

    /** @var \Magento\Quote\Model\QuoteFactory  */
    protected $quoteFactory;

    /** @var \Magento\Quote\Model\ResourceModel\Quote  */
    protected $quoteRm;

    public function __construct(
        EditAddressResponseFactory $responseFactory,
        AddressRepositoryInterface $addressRepository,
        \Magento\Quote\Model\QuoteFactory $quoteFactory,
        \Magento\Quote\Model\ResourceModel\Quote $quoteRm
    ) {
        $this->responseFactory = $responseFactory;
        $this->addressRepository = $addressRepository;
        $this->quoteFactory = $quoteFactory;
        $this->quoteRm = $quoteRm;
    }

    /**
     * @param  mixed $cartId
     * @param  AddressInterface $addressData
     * @return \CCCC\Addressvalidation\Service\V1\Data\UpdateAddressResponse
     */
    public function updateAddress($cartId, AddressInterface $addressData)
    {
        if ($addressData->getCustomerAddressId()) {
            $address = $this->addressRepository->getById($addressData->getCustomerAddressId());
            $address->setPostcode($addressData->getPostcode());
            $address->setCity($addressData->getCity());

            $street = $addressData->getStreet();
            if (!is_array($street)) {
                $street = [$street];
            }
            $address->setStreet($street);

            $this->addressRepository->save($address);
        }

        /** @var Quote $quote */
        $quote = $this->quoteFactory->create()->loadActive($cartId);
        $quoteAddress = $quote->getShippingAddress();
        $quoteAddress->setStreet($address->getStreet());
        $quoteAddress->setPostcode($address->getPostcode());
        $quoteAddress->setCity($address->getCity());
        $quote->setShippingAddress($quoteAddress);
        $this->quoteRm->save($quote);

        $oResponse = $this->responseFactory->create();
        $oResponse->setData('success', true);
        return $oResponse;
    }
}
