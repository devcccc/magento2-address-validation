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
use CCCC\Addressvalidation\Operation\Check\NameOperation;
use CCCC\Addressvalidation\Request\Validation\Check\NameValidator;

class Name extends BaseController
{
    /** @var string */
    protected $operationClass = NameOperation::class;

    /** @var string */
    protected $validatorClass = NameValidator::class;

    /**
     * @var \Magento\Framework\Controller\Result\JsonFactory
     */
    protected $resultJsonFactory;

    protected function getParamsForData(): array
    {
        return ['name'];
    }
}