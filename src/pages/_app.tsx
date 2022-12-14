import '@upshot-tech/upshot-ui/dist/css/typekit.css'
import 'react-virtualized/styles.css'

import { ApolloProvider } from '@apollo/client'
import Bugsnag from '@bugsnag/js'
import BugsnagPluginReact from '@bugsnag/plugin-react'
import { UpshotThemeProvider } from '@upshot-tech/upshot-ui'
import { Web3ReactProvider } from '@web3-react/core'
import Metadata from 'components/Meta'
import { providers } from 'ethers'
import type { AppProps } from 'next/app'
import { useRouter } from 'next/router'
import { ReactNode, useEffect } from 'react'
import { Provider, useDispatch, useSelector } from 'react-redux'
import { selectAlertState, setAlertState } from 'redux/reducers/layout'
import { persistor, store } from 'redux/store'
import { PersistGate } from 'redux-persist/integration/react'
import { Alert } from 'theme-ui'
import client from 'utils/apolloClient'
import { initGA } from 'utils/googleAnalytics'
import Layout from 'views/Layout'

/**
 * Instantiate an Ethers web3 provider library.
 *
 * @param provider Low-level provider.
 * @returns {Web3Provider} Web3 library object.
 */
const getLibrary = (
  provider: providers.ExternalProvider | providers.JsonRpcFetchFunc
): providers.Web3Provider => new providers.Web3Provider(provider)

function PreviousRouterWrapper({ children }) {
  const router = useRouter()

  useEffect(() => storePathValues, [router.asPath])

  const storePathValues = () => {
    const storage = globalThis?.sessionStorage
    if (!storage) return
    // Set the previous path as the value of the current path.
    const prevPath = storage.getItem('currentPath')
    storage.setItem('prevPath', prevPath as string)
    // Set the current path value by looking at the browser's location object.
    storage.setItem(
      'currentPath',
      globalThis.location.href.replace(`${globalThis.location.origin}`, '')
    )
  }

  return <> {children} </>
}

const AlertWrapper = ({ children }: { children: ReactNode }) => {
  const dispatch = useDispatch()
  const { showAlert, alertText } = useSelector(selectAlertState)

  const closeAlert = () => {
    dispatch(
      setAlertState({
        showAlert: false,
        alertText: '',
      })
    )
  }

  useEffect(() => {
    if (showAlert) {
      setTimeout(() => {
        closeAlert()
      }, 3000)
    }
  }, [showAlert])

  return (
    <>
      {showAlert && (
        <Alert
          variant="primary"
          sx={{
            position: 'fixed',
            bottom: 4,
            right: 4,
            zIndex: 100,
            width: '300px',
          }}
        >
          {alertText}
        </Alert>
      )}
      {children}
    </>
  )
}

export default function App({ Component, pageProps }: AppProps) {
  useEffect(() => {
    /* Initialize telemetry on enabled release stages. */
    const enabledTelemetryStages = ['production']

    if (enabledTelemetryStages.includes(process.env.NEXT_PUBLIC_ENV!)) {
      /* Start google analytics */
      initGA(process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS!)

      /* Start BugSnag */
      Bugsnag.start({
        apiKey: process.env.NEXT_PUBLIC_BUGSNAG_API_KEY!,
        releaseStage: process.env.NEXT_PUBLIC_ENV,
        plugins: [new BugsnagPluginReact()],
      })
    }
  }, [])
  const router = useRouter()

  return (
    <>
      <UpshotThemeProvider>
        <ApolloProvider {...{ client }}>
          <Metadata key={router.asPath} />

          <Web3ReactProvider {...{ getLibrary }}>
            <Provider store={store}>
              <PersistGate {...{ persistor }}>
                <PreviousRouterWrapper>
                  <Layout>
                    <AlertWrapper>
                      <Component {...pageProps} />
                    </AlertWrapper>
                  </Layout>
                </PreviousRouterWrapper>
              </PersistGate>
            </Provider>
          </Web3ReactProvider>
        </ApolloProvider>
      </UpshotThemeProvider>
    </>
  )
}
