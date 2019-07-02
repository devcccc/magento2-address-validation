<?php
/**
 * Module: CCCC\Addressvalidation\Operation\Autocomplete
 * Copyright: (c) 2019 cccc.de
 * Date: 2019-05-22 16:00
 *
 *
 */

namespace CCCC\Addressvalidation\Operation\Autocomplete;


use CCCC\Addressvalidation\Operation\BaseOperation;
use CCCC\Addressvalidation\Operation\ResponseObject;

class CitynameOperation extends BaseOperation
{
    public function doRequest(array $data) {
        $requestData = $this->getBaseRequestData('cityNameAutocomplete', true);

        $requestData['params'] = [
            'country' => strtolower($data['country']),
            'language' => $this->getLanguage(),
            'cityName' => $data['city']
        ];

        $result = $this->doApiRequest($requestData);
        return $result;
    }

    protected function doApiRequest(array $requestDataCompiled)
    {
        /** @var ResponseObject $response */
        $response = parent::doApiRequest($requestDataCompiled);

        $result = ['success' => $response->isSuccess(), 'predictions' => []];
        if ($response->isSuccess() && $response->hasData()) {
            $data = $response->getResultData();
            if (in_array($data['result']['status'][0], ['A1000', 'A2000'])) {
                array_walk(
                    $data['result']['predictions'],
                    function ($item) use (&$result) {
                        $result['predictions'][] = ['zip' => (array_key_exists('postCode', $item)?$item['postCode']:null), 'city' => $item['cityName']];
                    }
                );
            }
        }

        return $result;
    }
}