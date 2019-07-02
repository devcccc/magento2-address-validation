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
use CCCC\Addressvalidation\Operation\Autocomplete\PostcodeOperation;
use CCCC\Addressvalidation\Request\Validation\Autocomplete\PostcodeValidator;


class Postcode extends BaseController
{
    /** @var string */
    protected $operationClass = PostcodeOperation::class;

    /** @var string */
    protected $validatorClass = PostcodeValidator::class;

    /**
     * @var \Magento\Framework\Controller\Result\JsonFactory
     */
    protected $resultJsonFactory;

    protected function getParamsForData(): array
    {
        return ['country', 'postCode'];
    }

    protected function canExecute() : bool {
        return parent::canExecute() && $this->scopeConfig->getValue($this->configPrefix . '/features/postcode_autocomplete') == 1;
    }
}