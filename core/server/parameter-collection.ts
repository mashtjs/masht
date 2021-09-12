export class ParameterCollection<T = Record<string, any>> {
  constructor (
    protected params: T
  ) {}

  public keys (): string[] {
    return Object.keys(this.params)
  }

  public replace (params: T) {
    this.params = params
  }

  public add (params: T) {
    this.params = {
      ...this.params,
      ...params
    }
  }

  public get (key: string, defaultValue: any = null) {
    const value = this.params[key]
    return value === void 0
      ? defaultValue
      : value
  }

  public set (key: string, value: any) {
    this.params[key] = value
  }

  public has (key: string) {
    return this.params[key] !== void 0
  }

  public remove (key: string) {
    delete this.params[key]
  }

  *[Symbol.iterator] () {
    const keys = this.keys()

    for (const key of keys) {
      yield this.params[key]
    }
  }

  *entries () {
    const keys = this.keys()

    for (const key of keys) {
      yield [key, this.params[key]]
    }
  }
}