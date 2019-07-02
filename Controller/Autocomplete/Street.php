<?php
/**
 * Module: CCCC\Addressvalidation\Controller\Autocomplete
 * Copyright: (c) 2019 cccc.de
 * Date: 2019-05-22 11:54
 *
 *
 */

namespace CCCC\Addressvalidation\Controller\Autocomplete;

use CCCC\Addressvalidation\Controller\BaseController;
use CCCC\Addressvalidation\Operation\Autocomplete\StreetOperation;
use CCCC\Addressvalidation\Request\Validation\Autocomplete\StreetValidator;

class Street extends BaseController
{
    /** @var string */
    protected $operationClass = StreetOperation::class;

    /** @var string */
    protected $validatorClass = StreetValidator::class;

    /**
     * @var \Magento\Framework\Controller\Result\JsonFactory
     */
    protected $resultJsonFactory;

    protected function getParamsForData(): array
    {
        return ['country', 'city', 'postCode', 'street'];
    }
}