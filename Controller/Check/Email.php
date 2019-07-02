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
use CCCC\Addressvalidation\Operation\Check\EmailOperation;
use CCCC\Addressvalidation\Request\Validation\Check\EmailValidator;

class EMail extends BaseController
{
    /** @var string */
    protected $operationClass = EmailOperation::class;

    /** @var string */
    protected $validatorClass = EmailValidator::class;

    /**
     * @var \Magento\Framework\Controller\Result\JsonFactory
     */
    protected $resultJsonFactory;

    protected function getParamsForData(): array
    {
        return ['email'];
    }
}