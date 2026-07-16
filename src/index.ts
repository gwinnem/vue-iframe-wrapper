import IframeWrapper from './components/IframeWrapper.vue'

export { IframeWrapper }
export default IframeWrapper

export { useIframeInjection } from './composables/useIframeInjection'
export type {
  UseIframeInjectionOptions,
  UseIframeInjectionReturn,
} from './composables/useIframeInjection'

export {
  createIframeError,
  createInjectionId,
  getSameOriginDocument,
  injectCssIntoDocument,
  injectCssUrlIntoDocument,
  injectJsIntoDocument,
  injectJsUrlIntoDocument,
  normaliseArray,
} from './utils/iframe-injection'

export { IframeError } from './types/iframe'
export type {
  IframeAssetConfig,
  IframeAssetPlacement,
  IframeAssetType,
  IframeErrorReason,
  IframeInjectionResult,
  IframeWrapperEmits,
  IframeWrapperProps,
  InjectionOptions,
} from './types/iframe'

import './styles/iframe-wrapper.css'
