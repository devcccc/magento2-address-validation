<?php
/**
 * Module: CCCC\Addressvalidation\Api
 * Copyright: (c) 2019 cccc.de
 * Date: 2019-07-02 11:19
 *
 *
 */

namespace CCCC\Addressvalidation\Api;


interface UpdateAddressInterface
{
    /**
     * @param \Magento\Quote\Api\Data\AddressInterface $addressData
     * @return \CCCC\Addressvalidation\Service\V1\Data\UpdateAddressResponse
     */
    public function updateAddress(\Magento\Quote\Api\Data\AddressInterface $addressData);
}
