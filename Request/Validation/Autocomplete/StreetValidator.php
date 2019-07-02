<?php
/**
 * Module: CCCC\Addressvalidation\Request\Validation\Autocomplete
 * Copyright: (c) 2019 cccc.de
 * Date: 2019-05-22 12:32
 *
 *
 */

namespace CCCC\Addressvalidation\Request\Validation\Autocomplete;


use CCCC\Addressvalidation\Request\Validation\AbstractValidator;
use Magento\Framework\Validator\NotEmpty;
use Magento\Framework\Validator\StringLength;

class StreetValidator extends AbstractValidator
{
    protected function getRules(): array
    {
        $rules = [
            'country' => [['class' => NotEmpty::class], ['class' => StringLength::class, 'options' => ['min' => 2, 'max' => 2]]],
            'postCode' => [['class' => NotEmpty::class], ['class' => StringLength::class, 'options' => ['min' => 3, 'max' => 7]]],
            'city' => [['class' => NotEmpty::class], ['class' => StringLength::class, 'options' => ['min' => 2]]],
            'street' => [['class' => NotEmpty::class], ['class' => StringLength::class, 'options' => ['min' => 2]]],
        ];

        return $rules;
    }
}