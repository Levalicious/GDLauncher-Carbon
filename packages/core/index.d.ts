/* tslint:disable */
/* eslint-disable */

/* auto-generated by NAPI-RS */

export function initGlobalStorage(): Promise<void>
export interface JavaComponent {
  path: string
  arch: string
  /** Indicates whether the component has manually been added by the user */
  isCustom: boolean
  version: JavaVersion
}
export interface JavaVersion {
  major: number
  minor?: number
  patch?: string
  updateNumber?: string
  prerelease?: string
  buildMetadata?: string
}
export function initJava(): Promise<Array<JavaComponent>>
export function fibonacci(num: number, num1: number): Promise<number>
export function computePathMurmur(path: string): Promise<number>
