<?php
/**
 * Module: CCCC\Addressvalidation\Service\V1\Data
 * Copyright: (c) 2019 cccc.de
 * Date: 12.11.19 10:18
 */

namespace CCCC\Addressvalidation\Service\V1\Data;

use CCCC\Addressvalidation\Api\Data\UpdateAddressResponseInterface;

class EditAddressResponse extends \Magento\Framework\Api\AbstractExtensibleObject implements UpdateAddressResponseInterface
{
    /**
     * Returns if editing the address was a success
     *
     * @return bool
     */
    public function getSuccess()
    {
        return $this->_get('success');
    }
}