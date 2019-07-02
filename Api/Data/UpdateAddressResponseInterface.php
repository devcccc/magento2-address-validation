<?php
/**
 * Module: CCCC\Addressvalidation\Api\Data
 * Copyright: (c) 2019 cccc.de
 * Date: 2019-07-02 11:26
 *
 *
 */

namespace CCCC\Addressvalidation\Api\Data;


interface UpdateAddressResponseInterface
{
    /**
     * Returns if editing the address was a success
     *
     * @return bool
     */
    public function getSuccess();
}