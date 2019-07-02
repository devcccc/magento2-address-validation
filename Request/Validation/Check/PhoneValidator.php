<?php
/**
 * Module: CCCC\Addressvalidation\Request\Validation\Check
 * Copyright: (c) 2019 cccc.de
 * Date: 2019-05-22 12:32
 *
 *
 */

namespace CCCC\Addressvalidation\Request\Validation\Check;

use CCCC\Addressvalidation\Request\Validation\AbstractValidator;
use Magento\Framework\Validator\NotEmpty;
use Magento\Framework\Validator\StringLength;

class PhoneValidator extends AbstractValidator
{
    protected function getRules(): array
    {
        $rules = [
            'phone' => [['class' => NotEmpty::class], ['class' => StringLength::class, 'options' => ['min' => 2]]],
            'format' => [['class' => NotEmpty::class]]
        ];

        return $rules;
    }
}