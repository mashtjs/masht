import { LazyObject } from '../utils/functional'
import { environ } from '../utils/system'
import { ImproperlyConfigured } from '../core/errors'
import globalSettings from './global-settings'

const SETTINGS_ENV = 'SETTINGS'

type GlobalSettingsType = typeof globalSettings

export interface SettingsType {}

export type LazyObjectType<T extends object> = {
  [P in keyof T]: T[P]
}

class LazySettings extends LazyObject<SettingsType> {
  protected setup (name = null) {
    const settingsModule = environ.get(SETTINGS_ENV)
    if (!settingsModule) {
      const desc = `settings ${name || 'settings'}`
      throw new ImproperlyConfigured(
        `Requested "${desc}" but settings are not configured.` +
        `You must either define the environment variable "${SETTINGS_ENV}"` +
        'or call settings.configure() before accessing settings.'
      )
    }

    this.wrapped = Settings(settingsModule)
  }
}

function Settings (settingsModule: string): GlobalSettingsType & SettingsType  {
  const object: any = Object.create(null)
  for (const setting of Object.keys(globalSettings)) {
    if (setting.toUpperCase() === setting) {
      object[setting] = globalSettings[setting]
    }
  }

  return object
}

const lazySettings = new LazySettings() as unknown

export const settings = lazySettings as LazyObjectType<GlobalSettingsType & SettingsType>