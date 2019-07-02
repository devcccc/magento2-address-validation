<?php
/**
 * Module: CCCC\Addressvalidation\Service\V1\Data
 * Copyright: (c) 2019 cccc.de
 * Date: 2019-07-02 11:25
 *
 *
 */

namespace CCCC\Addressvalidation\Service\V1\Data;

use CCCC\Addressvalidation\Api\Data\UpdateAddressResponseInterface;

class UpdateAddressResponse extends \Magento\Framework\Api\AbstractExtensibleObject implements UpdateAddressResponseInterface
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
