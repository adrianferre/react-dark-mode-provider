import React, {
    useState,
    useEffect,
    useCallback,
    useContext,
    ReactNode,
    ComponentType
  } from 'react'
  
  export const colorSchemes: {
    dark: DarkModeValues
    light: DarkModeValues
    noPreference: string
  } = {
    dark: 'dark',
    light: 'light',
    noPreference: 'no-preference'
  }
  
  const defaultConfig = {
    localStorageKey: '__userColorScheme',
    listenWindowEvents: true,
    useLocalStorage: false
  }
  
  const DarkModeContext = React.createContext<
    [DarkModeValues, (colorSchema: DarkModeValues) => void]
  >([colorSchemes.light, () => null])
  
  type DarkModeValues = 'dark' | 'light'
  
  interface IDarkModeProvider {
    defaultValue?: DarkModeValues
    config: {
      localStorageKey?: string
      listenWindowEvents?: boolean
      useLocalStorage?: boolean
    }
    children: ([colorScheme, handleChangeColorScheme]: [
      DarkModeValues,
      (colorScheme: DarkModeValues) => void
    ]) => ReactNode | ReactNode
  }
  
  const DarkModeProvider = ({
    defaultValue = colorSchemes.light,
    config = {},
    children
  }: IDarkModeProvider) => {
    const { listenWindowEvents, useLocalStorage, localStorageKey } = {
      ...defaultConfig,
      ...config
    }
  
    const [colorScheme, setColorScheme] = useState<DarkModeValues>(() =>
      getInitialColorScheme(defaultValue, useLocalStorage, localStorageKey)
    )
  
    const handleChangeColorScheme = useCallback(
      (colorSchema) => {
        setColorScheme(colorSchema)
  
        if (useLocalStorage && localStorage) {
          localStorage.setItem(localStorageKey, colorSchema)
        }
      },
      [localStorageKey, useLocalStorage]
    )
  
    const handleSetDarkColorScheme = useCallback(
      (event) => event.matches && handleChangeColorScheme(colorSchemes.dark),
      [handleChangeColorScheme]
    )
  
    const handleSetLightColorScheme = useCallback(
      (event) => event.matches && handleChangeColorScheme(colorSchemes.light),
      [handleChangeColorScheme]
    )
  
    const handleSetDefaultColorScheme = useCallback(
      (event) => event.matches && handleChangeColorScheme(defaultValue),
      [defaultValue, handleChangeColorScheme]
    )
  
    useEffect(() => {
      if (
        listenWindowEvents &&
        // Doesn't choose LS
        !(useLocalStorage && localStorage) &&
        // Dark mode is supported
        window &&
        window.matchMedia('(prefers-color-scheme)').media !== 'not all'
      ) {
        window
          .matchMedia(`(prefers-color-scheme: ${colorSchemes.dark})`)
          .addEventListener('change', handleSetDarkColorScheme)
        window
          .matchMedia(`(prefers-color-scheme: ${colorSchemes.light})`)
          .addEventListener('change', handleSetLightColorScheme)
        window
          .matchMedia(`(prefers-color-scheme: ${colorSchemes.noPreference})`)
          .addEventListener('change', handleSetDefaultColorScheme)
        return () => {
          window
            .matchMedia(`(prefers-color-scheme: ${colorSchemes.dark})`)
            .removeEventListener('change', handleSetDarkColorScheme)
          window
            .matchMedia(`(prefers-color-scheme: ${colorSchemes.light})`)
            .removeEventListener('change', handleSetLightColorScheme)
          window
            .matchMedia(`(prefers-color-scheme: ${colorSchemes.noPreference})`)
            .removeEventListener('change', handleSetDefaultColorScheme)
        }
      }
    }, [
      handleSetDarkColorScheme,
      handleSetDefaultColorScheme,
      handleSetLightColorScheme,
      listenWindowEvents,
      useLocalStorage
    ])
  
    return (
      <DarkModeContext.Provider value={[colorScheme, handleChangeColorScheme]}>
        {typeof children === 'function'
          ? children([colorScheme, handleChangeColorScheme])
          : children}
      </DarkModeContext.Provider>
    )
  }
  
  const useDarkMode = () =>
    useContext<[DarkModeValues, (colorSchema: DarkModeValues) => void]>(
      DarkModeContext
    )
  
  function DarkModeConsumer(Component: ComponentType) {
    return function WrapperComponent(props: any) {
      return (
        <DarkModeContext.Consumer>
          {(value) => {
            return <Component {...props} {...value} />
          }}
        </DarkModeContext.Consumer>
      )
    }
  }
  
  function getInitialColorScheme(
    defaultValue: DarkModeValues,
    useLocalStorage: boolean,
    localStorageKey: string
  ) {
    if (useLocalStorage && localStorage) {
      const localValue = localStorage.getItem(localStorageKey) || ''
      if (localValue === 'dark' || localValue === 'light') {
        return localValue
      }
    }
  
    if (
      window &&
      window.matchMedia &&
      window.matchMedia(`(prefers-color-scheme: ${colorSchemes.dark})`).matches
    ) {
      return colorSchemes.dark
    } else if (
      window &&
      window.matchMedia &&
      window.matchMedia(`(prefers-color-scheme: ${colorSchemes.light})`).matches
    ) {
      return colorSchemes.light
    } else {
      return defaultValue
    }
  }
  
  export default DarkModeProvider
  
  export { DarkModeProvider, DarkModeConsumer, useDarkMode }