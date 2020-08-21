<?php
/**
 * Module: CCCC\Addressvalidation\Request\Validation
 * Copyright: (c) 2019 cccc.de
 * Date: 2019-05-22 12:32
 *
 *
 */

namespace CCCC\Addressvalidation\Request\Validation;


use Magento\Framework\Validator\ValidatorInterface;
use Zend\Di\Exception\ClassNotFoundException;

abstract class AbstractValidator
{
    /** @var array */
    protected $dataToValidate;

    protected $lastMessages = [];

    protected abstract function getRules() : array;

    public function __construct(array $data)
    {
        $this->dataToValidate = $data;
    }

    public function isValid() {
        $keysValid = [];
        $keysInvalid = [];

        $messages = [];

        foreach ($this->getRules() as $field => $ruleCollection) {
            $value = array_key_exists($field, $this->dataToValidate) ? $this->dataToValidate[$field] : null;

            $isValid = false;
            foreach ($ruleCollection as $rule) {
                $validatorInstance = $this->getValidatorInstance($rule);

                $check = $validatorInstance->isValid($value);
                if (!$check) {
                    if (!array_key_exists($field, $messages)) {
                        $messages[$field] = $validatorInstance->getMessages();
                    } else {
                        $messages[$field] = array_merge($messages[$field], $validatorInstance->getMessages());
                    }
                    $isValid = false;
                }
            }

            if (!$isValid) {
                $keysInvalid[] = $field;
            } else {
                $keysValid[] = $field;
            }
        }

        $allKeysChecked = array_merge($keysValid, $keysInvalid);
        sort($allKeysChecked);
        $fieldNames = array_keys($this->dataToValidate);
        sort($fieldNames);

        if (!empty($messages)) {
            $this->lastMessages = $messages;
            return false;
        }

        $this->lastMessages = [];
        return true;
    }

    public function getMessages() : array {
        return $this->lastMessages;
    }

    protected function getValidatorInstance($validatorConfig) : ?ValidatorInterface {
        $options = array_key_exists('options', $validatorConfig) ? $validatorConfig['options'] : null;
        $class = array_key_exists('class', $validatorConfig) ? $validatorConfig['class'] : null;

        if (!$class) {
            throw new ClassNotFoundException("Class not defined in rule within ".__CLASS__);
        }

        if (!class_exists($class)) {
            throw new ClassNotFoundException("Class not found '$class' in rule within ".__CLASS__);
        }

        /** @var ValidatorInterface $validatorInstance */
        if (!empty($options)) {
            $validatorInstance = new $class($options);
        } else {
            $validatorInstance = new $class();
        }

        if (!$validatorInstance || !is_a($validatorInstance, ValidatorInterface::class)) {
            throw new ClassNotFoundException("Class '$class' is not a ".ValidatorInterface::class." in rule within ".__CLASS__);
        }

        return $validatorInstance;
    }
}