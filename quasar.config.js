// Configuration for your app
// https://v2.quasar.dev/quasar-cli-vite/quasar-config-file

import { defineConfig } from '#q-app'

export default defineConfig((/* ctx */) => {
  return {
    // https://v2.quasar.dev/quasar-cli-vite/prefetch-feature
    // preFetch: true,

    // app boot file (/src/boot)
    // --> boot files are part of "main.js"
    // https://v2.quasar.dev/quasar-cli-vite/boot-files
    boot: [],

    // https://v2.quasar.dev/quasar-cli-vite/quasar-config-file#css
    css: ['app.scss'],

    // https://github.com/quasarframework/quasar/tree/dev/extras
    extras: [
      'roboto-font',
      'material-icons',
      'material-icons-outlined',
      'material-icons-round',
      'material-symbols-outlined',
    ],

    // https://v2.quasar.dev/quasar-cli-vite/quasar-config-file#build
    build: {
      target: {
        // browser: 'baseline-widely-available',
        // node: 'node22'
      },
      publicPath:
        process.env.NODE_ENV === 'production'
          ? '/ruang-belajar-digital/'
          : '/',
      // https://v2.quasar.dev/quasar-cli-vite/page-routing-with-vue-router#filename-based-routing
      filenameBasedRouting: true,

      vueRouterMode: 'hash', // available values: 'hash', 'history'
      // vueRouterBase,

      // publicPath: '/',
      // define: {},
      // defineEnv: {}
      // ignorePublicFolder: true,
      // minify: false,
      // distDir

      // extendViteConf (viteConf) {},
      // viteVuePluginOptions: {},

      // to write components with JSX/TSX:
      // https://v2.quasar.dev/quasar-cli-vite/handling-vite#jsx-tsx
      // vueJsx: true,

      vitePlugins: [
        [
          'vite-plugin-checker',
          {
            eslint: {
              lintCommand: 'eslint -c ./eslint.config.js "./src*/**/*.{js,mjs,cjs,vue}"',
              useFlatConfig: true,
            },
          },
          { server: false },
        ],
      ],
    },

    // https://v2.quasar.dev/quasar-cli-vite/quasar-config-file#devserver
    devServer: {
      // vueDevtools: true,
      // https: true,
      open: true, // opens browser window automatically
    },

    // https://v2.quasar.dev/quasar-cli-vite/quasar-config-file#framework
    framework: {
      config: {},

      // iconSet: 'material-icons', // Quasar icon set
      // lang: 'en-US', // Quasar language pack

      // For special cases outside of where the auto-import strategy can have an impact
      // (like functional components as one of the examples),
      // you can manually specify Quasar components/directives to be available everywhere:
      //
      // components: [],
      // directives: [],

      // Quasar plugins
      plugins: ['Notify', 'Dialog'],
    },

    // animations: 'all', // --- includes all animations
    // https://v2.quasar.dev/options/animations
    animations: [],

    // https://v2.quasar.dev/quasar-cli-vite/quasar-config-file#sourcefiles
    // sourceFiles: {
    //   rootComponent: 'src/App.vue',
    //   router: 'src/router/index',
    //   store: 'src/store/index',
    //   pwaRegisterServiceWorker: 'src-pwa/register-sw',
    //   pwaServiceWorker: 'src-pwa/sw/custom-sw',
    //   pwaManifestFile: 'src-pwa/manifest.json',
    //   electronMain: 'src-electron/electron-main',
    //   electronPreload: 'src-electron/electron-preload'
    //   bexManifestFile: 'src-bex/manifest.json
    // },

    // https://v2.quasar.dev/quasar-cli-vite/developing-ssr/configuring-ssr
    ssr: {
      /**
       * The default port that the production server should use
       * (gets superseded if process.env.PORT is specified at runtime)
       */
      prodPort: 3000,
      middlewares: [
        'render', // keep this as last one
      ],

      // clientSideRenderingRoutes: [],
      // noPreloadTagRoutes: [],
      // manualStoreSerialization: true,
      // manualStoreSsrContextInjection: true,
      // manualStoreHydration: true,
      // manualPostHydrationTrigger: true,
      // prodScriptNamedExport: false,

      // extendSSRPackageJson (pkgJson) {},
      // extendSSRManifestJson (json) {},
      // extendSSRWebserverConf (rolldownConf) {},

      // pwa: true,
      // pwaOfflineHtmlFilename: 'offline.html', // do NOT use index.html as name!
      // extendSSRGenerateSWOptions (cfg) {},
      // extendSSRInjectManifestOptions (cfg) {},
    },

    // https://v2.quasar.dev/quasar-cli-vite/developing-ssg/configuring-ssg
    ssg: {
      // onSsgRendererError: 'abort',
      // ssgRendererConcurrency: 1,
      // ssgRendererRetryCount: 0,
      // ssgRendererRetryDelay: 1000,
      // ssgRendererDirectoryIndexes: true,
      // error404HtmlFilename: '404.html',
      // clientSideRenderingHtmlFilename: 'csr.html',
      // clientSideRenderingRoutes: [],
      // noPreloadTagRoutes: []
      // extendSSGRendererConf (rolldownConf) {},
      // extendSSGManifestJson (json) {},
      // manualStoreSerialization: true,
      // manualStoreSsrContextInjection: true,
      // manualStoreHydration: true,
      // manualPostHydrationTrigger: true,
      // pwa: true,
      // pwaOfflineHtmlFilename: 'offline.html',
      // extendSSGGenerateSWOptions (cfg) {},
      // extendSSGInjectManifestOptions (cfg) {},
    },

    // https://v2.quasar.dev/quasar-cli-vite/developing-pwa/configuring-pwa
    // quasar.config.js
    pwa: {
      workboxMode: 'GenerateSW', // GenerateSW cukup untuk offline-first standar
      swFilename: 'sw.js',
      manifestFilename: 'manifest.json',
      useCredentialsForManifestTag: false,
      injectPwaMetaTags: true,

      // ═══════════════════════════════════════════════════════════════
      // TUNING CACHING
      // ═══════════════════════════════════════════════════════════════
      extendGenerateSWOptions(cfg) {
        // (1) Runtime caching: strategi per jenis resource
        cfg.runtimeCaching = [
          // ① MATERI & KONTEN JSON → Cache-first + fallback network
          //    Konten inti e-modul, harus SELALU tersedia offline.
          {
            urlPattern: ({ url }) => url.pathname.endsWith('.json'),
            handler: 'CacheFirst',
            options: {
              cacheName: 'ppkn-content-v1',
              expiration: {
                maxEntries: 20,
                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 tahun
              },
              cacheableResponse: { statuses: [0, 200] },
            },
          },

          // ② GAMBAR (ikon, ilustrasi) → Cache-first
          {
            urlPattern: ({ request }) => request.destination === 'image',
            handler: 'CacheFirst',
            options: {
              cacheName: 'ppkn-images-v1',
              expiration: {
                maxEntries: 60,
                maxAgeSeconds: 60 * 60 * 24 * 90, // 90 hari
              },
              cacheableResponse: { statuses: [0, 200] },
            },
          },

          // ③ FONT → Cache-first (jarang berubah)
          {
            urlPattern: ({ request }) =>
              request.destination === 'font' || request.url.match(/\.(woff2?|ttf|otf|eot)(\?.*)?$/),
            handler: 'CacheFirst',
            options: {
              cacheName: 'ppkn-fonts-v1',
              expiration: {
                maxEntries: 20,
                maxAgeSeconds: 60 * 60 * 24 * 365,
              },
            },
          },

          // ④ HTML NAVIGASI → Network-first + fallback offline.html
          //    Pastikan siswa selalu mendapat versi terbaru, tapi tetap
          //    bisa membuka aplikasi saat offline.
          {
            urlPattern: ({ request }) => request.mode === 'navigate',
            handler: 'NetworkFirst',
            options: {
              cacheName: 'ppkn-pages-v1',
              networkTimeoutSeconds: 3,
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 30,
              },
            },
          },

          // ⑤ CSS & JS → Stale-while-revalidate
          //    Load cepat dari cache, refresh di background.
          {
            urlPattern: ({ request }) =>
              request.destination === 'style' || request.destination === 'script',
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'ppkn-assets-v1',
              expiration: {
                maxEntries: 60,
                maxAgeSeconds: 60 * 60 * 24 * 30,
              },
            },
          },
        ]

        // (2) Tambahkan file offline.html ke precache
        //     (agar fallback navigasi tersedia saat offline)
        cfg.additionalManifestEntries = cfg.additionalManifestEntries || []
        cfg.additionalManifestEntries.push({
          url: 'offline.html',
          revision: new Date().toISOString().slice(0, 10), // auto-bust saat build
        })

        // (3) Skip waiting & clientsClaim — supaya update cepat aktif
        cfg.skipWaiting = true
        cfg.clientsClaim = true

        // (4) Cleanup cache lama
        cfg.cleanupOutdatedCaches = true

        // (5) Debug log hanya di dev
        cfg.mode = process.env.NODE_ENV === 'development' ? 'development' : 'production'
      },

      // Override manifest (jika perlu, selain yang ada di src-pwa/manifest.json)
      extendManifestJson(json) {
        json.name = 'Ruang Belajar Digital'
        json.short_name = 'Ruang Belajar'
        json.description =
          'Platform pembelajaran mandiri multi-mata-pelajaran untuk siswa SMK. Pendidikan Pancasila, Ilmu Hukum, dan Komputer & Jaringan dalam satu aplikasi.'
        json.theme_color = '#0B1F33' // navy-900
        json.background_color = '#F4F6F8' // paper
        json.display = 'standalone'
        json.orientation = 'portrait-primary'
        json.lang = 'id'
        json.start_url = '.'
        json.scope = '.'
        json.categories = ['education', 'books']
        return json
      },
    },

    // https://v2.quasar.dev/quasar-cli-vite/developing-cordova-apps/configuring-cordova
    cordova: {},

    // https://v2.quasar.dev/quasar-cli-vite/developing-capacitor-apps/configuring-capacitor
    capacitor: {
      hideSplashscreen: true,
    },

    // https://v2.quasar.dev/quasar-cli-vite/developing-electron-apps/configuring-electron
    electron: {
      // extendElectronMainConf (rolldownConf) {},
      // extendElectronPreloadConf (rolldownConf) {},
      // extendElectronPackageJson (pkgJson) {},

      // Electron preload scripts (if any) from /src-electron, WITHOUT file extension
      preloadScripts: ['electron-preload'],

      // specify the debugging port to use for the Electron app when running in development mode
      inspectPort: 5858,

      bundler: 'packager', // 'packager' or 'builder'

      packager: {
        // https://github.com/electron-userland/electron-packager/blob/master/docs/api.md#options
        // OS X / Mac App Store
        // appBundleId: '',
        // appCategoryType: '',
        // osxSign: '',
        // protocol: 'myapp://path',
        // Windows only
        // win32metadata: { ... }
      },

      builder: {
        // https://www.electron.build/configuration

        appId: 'blog-pancasila',
      },
    },

    // https://v2.quasar.dev/quasar-cli-vite/developing-browser-extensions/configuring-bex
    bex: {
      // extendBexScriptsConf (rolldownConf) {},
      // extendBexManifestJson (json) {},

      /**
       * The list of extra scripts (js/ts) not in your bex manifest that you want to
       * compile and use in your browser extension. Maybe dynamic use them?
       *
       * Each entry in the list should be a relative filename to /src-bex/
       *
       * @example [ 'my-script.ts', 'sub-folder/my-other-script.js' ]
       */
      extraScripts: [],
    },
  }
})
