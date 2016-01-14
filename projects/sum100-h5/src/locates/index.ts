import {FluentBundle, FluentResource} from '@fluent/bundle'
import {createFluentVue} from 'fluent-vue'

import enUsMessages from './en-us.ftl?raw'
import zhHansMessages from './zh-hans.ftl?raw'

const enUs = new FluentBundle('en-US')
enUs.addResource(new FluentResource(enUsMessages))
const zhHans = new FluentBundle('zh-Hans')
zhHans.addResource(new FluentResource(zhHansMessages))

const locates = createFluentVue({
    bundles: [enUs, zhHans],
})

export default locates