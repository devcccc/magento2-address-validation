<?php

/**
 * Module: CCCC\Addressvalidation\Controller\Check
 * Copyright: (c) 2019 cccc.de
 * Date: 2019-05-22 11:54
 *
 *
 */

namespace CCCC\Addressvalidation\Controller\Check;

use CCCC\Addressvalidation\Controller\BaseController;
use CCCC\Addressvalidation\Operation\Check\AddressOperation;
use CCCC\Addressvalidation\Request\Validation\Check\AddressValidator;

class Address extends BaseController
{
    /** @var string */
    protected $operationClass = AddressOperation::class;

    /** @var string */
    protected $validatorClass = AddressValidator::class;

    /**
     * @var \Magento\Framework\Controller\Result\JsonFactory
     */
    protected $resultJsonFactory;

    protected function getParamsForData(): array
    {
        return ['country', 'postCode', 'city', 'street', 'houseNumber'];
    }
}