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
use CCCC\Addressvalidation\Operation\Check\PhoneOperation;
use CCCC\Addressvalidation\Request\Validation\Check\PhoneValidator;

class Phone extends BaseController
{
    /** @var string */
    protected $operationClass = PhoneOperation::class;

    /** @var string */
    protected $validatorClass = PhoneValidator::class;

    /**
     * @var \Magento\Framework\Controller\Result\JsonFactory
     */
    protected $resultJsonFactory;

    protected function getParamsForData(): array
    {
        return ['phone', 'format'];
    }
}