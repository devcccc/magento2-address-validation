<?php
/**
 * Module: CCCC\Addressvalidation\Model\Config\Source
 * Copyright: (c) 2019 cccc.de
 * Date: 2019-05-21 09:00
 *
 *
 */

namespace CCCC\Addressvalidation\Model\Config\Source;


class RefererMode implements \Magento\Framework\Option\ArrayInterface
{
    const MODE_CURRENT_PAGE = 'currentpage';
    const MODE_BASEURL = 'baseurl';

    /**
     * Options getter
     *
     * @return array
     */
    public function toOptionArray()
    {
        return [
            ['value' => self::MODE_CURRENT_PAGE, 'label' => __('Use current page url')],
            ['value' => self::MODE_BASEURL, 'label' => __('Report base url only')],
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
