<?php
/**
 * Module: CCCC\Addressvalidation\Operation\Check
 * Copyright: (c) 2019 cccc.de
 * Date: 2019-05-22 16:00
 *
 *
 */

namespace CCCC\Addressvalidation\Operation\Check;


use CCCC\Addressvalidation\Operation\BaseOperation;
use CCCC\Addressvalidation\Operation\ResponseObject;
use Magento\Framework\App\ObjectManager;
use Magento\Framework\Locale\Resolver;
use Psr\Log\LoggerInterface;

class AddressOperation extends BaseOperation
{
    public function doRequest(array $data) {
        $requestData = $this->getBaseRequestData('addressCheck', true);

        /** @var Resolver $resolver */
        $resolver = ObjectManager::getInstance()->get(Resolver::class);
        $locale = $resolver->getLocale();
        unset($resolver);
        if (strpos($locale, '_') !== FALSE) {
            $locale = substr($locale, 0, strpos($locale, '_'));
        }

        $requestData['params'] = [
            'country' => strtolower($data['country']),
            'language' => $locale,
            'postCode' => $data['postCode'],
            'cityName' => $data['city'],
            'street' => $data['street'],
            'houseNumber' => $data['houseNumber']
        ];

        $result =  $this->doApiRequest($requestData);
        return $result;
    }

    protected function doApiRequest(array $requestDataCompiled)
    {
        /** @var ResponseObject $response */
        $response = parent::doApiRequest($requestDataCompiled);

        $result = ['success' => $response->isSuccess(), 'valid' => false, 'predictions' => [], 'changed' => false];

        if ($response->isSuccess() && $response->hasData()) {
            $data = $response->getResultData();
            $result['changed'] = in_array('A1100', $data['result']['status']) || in_array('A2000', $data['result']['status']);
            $result['valid'] = $result['changed'] || in_array('A1000', $data['result']['status']) || in_array('A3000', $data['result']['status']);

            if ($result['valid'] && array_key_exists('predictions', $data['result']) && count($data['result']['predictions'])) {
                array_walk(
                    $data['result']['predictions'],
                    function ($item) use (&$result) {
                        $result['predictions'][] = ['postCode' => $item['postCode'], 'city' => $item['cityName'], 'street' => $item['street'], 'houseNumber' => $item['houseNumber']];
                    }
                );

                if (count($result['predictions']) > 1) {
                    $result['message'] = __('The address validation identified several possible addresses. Please choose of the listed addresses.');
                } else {
                    $result['message'] = __('The address validation was able to correct the address.');
                }
            }
        } else if (!$response->isSuccess()) {
            ObjectManager::getInstance()->get(LoggerInterface::class)->error("Error while doing address check with data ".json_encode($requestDataCompiled)." => ".json_encode($response->getResultData()["error"]));
            $result['message'] = __("We're sorry, an error has occurred while validating the address. The address entered will be used.");
        }

        return $result;
    }
}