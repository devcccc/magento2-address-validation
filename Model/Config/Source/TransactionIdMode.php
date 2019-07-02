<?php
/**
 * Module: CCCC\Addressvalidation\Model\Config\Source
 * Copyright: (c) 2019 cccc.de
 * Date: 2019-05-21 08:48
 *
 *
 */

namespace CCCC\Addressvalidation\Model\Config\Source;


class TransactionIdMode implements \Magento\Framework\Option\ArrayInterface
{
    const MODE_FULL_RANDOM = 'random';
    const MODE_SESSION_RANDOM = 'sessionrandom';

    /**
     * Options getter
     *
     * @return array
     */
    public function toOptionArray()
    {
        return [
            ['value' => self::MODE_FULL_RANDOM, 'label' => __('Full random')],
            ['value' => self::MODE_SESSION_RANDOM, 'label' => __('Random with session id prefixed')],
        ];
    }

    /**
     * Get options in "key-value" format
     *
     * @return array
     */
    public function toArray()
    {
        $data = $this->toOptionArray();

        $result = [];
        foreach ($data as $entry) {
            $result[$entry['value']] = $entry['label'];
        }

        return $result;
    }
}
