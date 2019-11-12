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

    public function __construct(
        EditAddressResponseFactory $responseFactory,
        AddressRepositoryInterface $addressRepository
    ) {
        $this->responseFactory = $responseFactory;
        $this->addressRepository = $addressRepository;
    }

    /**
     *
     * @param  AddressInterface $addressData
     * @return \CCCC\Addressvalidation\Service\V1\Data\UpdateAddressResponse
     */
    public function updateAddress(AddressInterface $addressData)
    {
        $address = $this->addressRepository->getById($addressData->getCustomerAddressId());
        $address->setPostcode($addressData->getPostcode());
        $address->setCity($addressData->getCity());

        $street = $addressData->getStreet();
        if (!is_array($street)) {
            $street = [$street];
        }
        $address->setStreet($street);

        $this->addressRepository->save($address);

        $oResponse = $this->responseFactory->create();
        $oResponse->setData('success', true);
        return $oResponse;
    }
}