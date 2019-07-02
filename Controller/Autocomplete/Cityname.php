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
use CCCC\Addressvalidation\Operation\Autocomplete\CitynameOperation;
use CCCC\Addressvalidation\Request\Validation\Autocomplete\CitynameValidator;

class Cityname extends BaseController
{
    /** @var string */
    protected $operationClass = CitynameOperation::class;

    /** @var string */
    protected $validatorClass = CitynameValidator::class;
    /**
     * @var \Magento\Framework\Controller\Result\JsonFactory
     */
    protected $resultJsonFactory;

    protected function getParamsForData(): array
    {
        return ['country', 'city', 'postCode', 'street'];
    }

    protected function canExecute() : bool {
        return parent::canExecute() && $this->scopeConfig->getValue($this->configPrefix . '/features/city_autocomplete') == 1;
    }
}