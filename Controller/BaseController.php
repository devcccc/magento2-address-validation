<?php
/**
 * Module: CCCC\Addressvalidation\Controller
 * Copyright: (c) 2019 cccc.de
 * Date: 2019-05-22 14:46
 *
 *
 */

namespace CCCC\Addressvalidation\Controller;

use bar\foo\baz\Object;
use CCCC\Addressvalidation\Request\Validation\AbstractValidator;
use Magento\Framework\App\Action\Action;
use Magento\Framework\App\Action\Context;
use Magento\Framework\App\Config\ScopeConfigInterface;
use Magento\Framework\App\ObjectManager;
use Psr\Log\LoggerInterface;

abstract class BaseController  extends Action
{
    protected $configPrefix = 'cccc_addressvalidation_endereco_section';

    /** @var string */
    protected $operationClass;

    /** @var string */
    protected $validatorClass;

    /**
     * @var \Magento\Framework\Controller\Result\JsonFactory
     */
    protected $resultJsonFactory;

    /** @var ScopeConfigInterface  */
    protected $scopeConfig;

    public function __construct(
        Context $context,
        ScopeConfigInterface $scopeConfig,
        \Magento\Framework\Controller\Result\JsonFactory $resultJsonFactory
    )
    {
        parent::__construct($context);
        $this->resultJsonFactory= $resultJsonFactory;
        $this->scopeConfig = $scopeConfig;
    }

    protected function canExecute() : bool {
        $sessionIdentified = array_key_exists('default', $_SESSION) && !empty($_SESSION['default']);

        return $this->scopeConfig->getValue($this->configPrefix . '/connection/enabled') == 1 && $sessionIdentified;
    }

    /**
     * @return \Magento\Framework\Controller\Result\Json
     */
    public function execute() {
        /** @var \Magento\Framework\Controller\Result\Json $result */
        $result = $this->resultJsonFactory->create();

        if ($this->canExecute()) {


            $validationResult = $this->validateRequest();

            $jsonData = ['success' => $validationResult === true];
            if (!$jsonData['success']) {
                $jsonData['messages'] = $validationResult;
                return $result->setData($jsonData);
            }

            $operation = ObjectManager::getInstance()->create($this->operationClass);

            $jsonData = $operation->doRequest($this->getParamsAsArray());

            $result->setHttpResponseCode($jsonData['success'] == true ? 200 : 400);
        } else {
            $jsonData = ['success' => false];
            $result->setHttpResponseCode(503);
        }

        return $result->setData($jsonData);
    }

    protected function getParamsAsArray() {
        $data = [];
        foreach ($this->getParamsForData() as $param) {
            $data[$param] = $this->getRequest()->getParam($param);
        }
        return $data;
    }

    protected function validateRequest() {
        $data = $this->getParamsAsArray();

        $validatorClassName = $this->getValidatorClass();
        /** @var AbstractValidator $validatorInstance */
        $validatorInstance = new $validatorClassName($data);

        if (!is_a($validatorInstance, AbstractValidator::class)) {
            throw new \InvalidArgumentException("Validator in controller ".__CLASS__.' is not a valid implementation: '.$validatorClassName);
        }
        if (!$validatorInstance->isValid()) {
            return $validatorInstance->getMessages();
        }

        return true;
    }

    protected abstract function getParamsForData() : array;

    protected function getValidatorClass(): string
    {
        return $this->validatorClass;
    }
}