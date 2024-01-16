import path from 'node:path'
import dayjs from 'dayjs'
import { defineConfig, loadEnv } from 'vite'
import Uni from '@dcloudio/vite-plugin-uni'
// @see https://uni-helper.js.org/vite-plugin-uni-pages
import UniPages from '@uni-helper/vite-plugin-uni-pages'
// @see https://uni-helper.js.org/vite-plugin-uni-layouts
import UniLayouts from '@uni-helper/vite-plugin-uni-layouts'
// @see https://github.com/uni-helper/vite-plugin-uni-platform
// 需要与 @uni-helper/vite-plugin-uni-pages 插件一起使用
import UniPlatform from '@uni-helper/vite-plugin-uni-platform'
// @see https://github.com/uni-helper/vite-plugin-uni-manifest
import UniManifest from '@uni-helper/vite-plugin-uni-manifest'
// @see https://unocss.dev/
import UnoCSS from 'unocss/vite'
import autoprefixer from 'autoprefixer'
// @see https://github.com/jpkleemans/vite-svg-loader
import svgLoader from 'vite-svg-loader'
import { createSvgIconsPlugin } from 'vite-plugin-svg-icons'
// @see https://github.com/vbenjs/vite-plugin-vue-setup-extend
import vueSetupExtend from 'vite-plugin-vue-setup-extend'
// @see https://github.com/vbenjs/vite-plugin-svg-icons
import AutoImport from 'unplugin-auto-import/vite'
import viteCompression from 'vite-plugin-compression'
import ViteRestart from 'vite-plugin-restart'
import { visualizer } from 'rollup-plugin-visualizer'
// TODO: 很多用户无法安装这个插件所以先注释掉了，如果你可以安装成功，那就可以放开这个注释，以及下面的viteImagemin配置
// 另外，小程序有主包2M的限制，所以一般图片会放到图片服务器（不放本地），那这个插件就没用，所以在开发h5的时候，使用本地图片才用得到，既然如此那就不装吧
// import viteImagemin from 'vite-plugin-imagemin'

// 微信生产环境、本地真机调试不要demo路由，本地开发可以有；
// TODO: 下面2个根据使用条件选一个即可
export const hideDemoPages = process.env.UNI_PLATFORM === 'mp-weixin'
// export const hideDemoPages =
//   process.env.UNI_PLATFORM === 'mp-weixin' && process.env.NODE_ENV === 'production'

// https://vitejs.dev/config/
export default ({ command, mode }) => {
  console.log(mode === process.env.NODE_ENV)

  // mode: 区分生产环境还是开发环境
  console.log(command, mode)
  // pnpm dev:h5 时得到 => serve development
  // pnpm build:h5 时得到 => build development
  // pnpm dev:mp-weixin 时得到 => build development (注意区别，command为build)
  // pnpm build:mp-weixin 时得到 => build production

  // process.cwd(): 获取当前文件的目录跟地址
  // loadEnv(): 返回当前环境env文件中额外定义的变量
  const env = loadEnv(mode, path.resolve(process.cwd(), 'env'))
  // console.log(env)
  console.log(process.env.UNI_PLATFORM) // 得到 mp-weixin, h5 等

  return defineConfig({
    envDir: './env', // 自定义env目录
    plugins: [
      UniPages({
        // TODO: 生产环境小程序要过滤掉demo（demo里面很多图片，超过2M的包大小）
        exclude: hideDemoPages
          ? ['**/components/**/**.*', '**/demo/**/**.*']
          : ['**/components/**/**.*'],
      }),
      UniLayouts(),
      UniPlatform(),
      UniManifest(),
      // UniXXX 需要在 Uni 之前引入
      Uni(),
      UnoCSS(),
      // svg 可以当做组件来使用(Vite plugin to load SVG files as Vue components, using SVGO for optimization.)
      svgLoader(),
      createSvgIconsPlugin({
        // 指定要缓存的文件夹
        iconDirs: [path.resolve(process.cwd(), 'src/assets/svg')],
        // 指定symbolId格式
        symbolId: 'icon-[dir]-[name]',
      }),
      vueSetupExtend(),
      AutoImport({
        imports: ['vue'],
        dts: 'src/auto-import.d.ts',
      }),

      viteCompression(),
      ViteRestart({
        // 通过这个插件，在修改vite.config.js文件则不需要重新运行也生效配置
        restart: ['vite.config.js'],
      }),
      // h5环境增加编译时间
      process.env.UNI_PLATFORM === 'h5' && {
        name: 'html-transform',
        transformIndexHtml(html) {
          return html.replace('%BUILD_DATE%', dayjs().format('YYYY-MM-DD HH:mm:ss'))
        },
      },
      // 打包分析插件
      mode === 'production' &&
        visualizer({
          filename: './node_modules/.cache/visualizer/stats.html',
          open: true,
          gzipSize: true,
          brotliSize: true,
        }),
      // 这个图片压缩插件比较耗时，希望仅在生产环境使用
      // mode === 'production' &&
      //   viteImagemin({
      //     gifsicle: {
      //       // gif图片压缩
      //       optimizationLevel: 3, // 选择1到3之间的优化级别
      //       interlaced: false, // 隔行扫描gif进行渐进式渲染
      //       // colors: 2 // 将每个输出GIF中不同颜色的数量减少到num或更少。数字必须介于2和256之间。
      //     },
      //     optipng: {
      //       // png
      //       optimizationLevel: 7, // 选择0到7之间的优化级别
      //     },
      //     mozjpeg: {
      //       // jpeg
      //       quality: 20, // 压缩质量，范围从0(最差)到100(最佳)。
      //     },
      //     pngquant: {
      //       // png
      //       quality: [0.8, 0.9], // Min和max是介于0(最差)到1(最佳)之间的数字，类似于JPEG。达到或超过最高质量所需的最少量的颜色。如果转换导致质量低于最低质量，图像将不会被保存。
      //       speed: 4, // 压缩速度，1(强力)到11(最快)
      //     },
      //     svgo: {
      //       // svg压缩
      //       plugins: [
      //         {
      //           name: 'removeViewBox',
      //         },
      //         {
      //           name: 'removeEmptyAttrs',
      //           active: false,
      //         },
      //       ],
      //     },
      //   }),
    ],
    css: {
      postcss: {
        plugins: [
          autoprefixer({
            // 指定目标浏览器
            overrideBrowserslist: ['> 1%', 'last 2 versions'],
          }),
        ],
      },
    },

    resolve: {
      alias: {
        '@': path.join(process.cwd(), './src'),
      },
    },
    server: {
      host: '0.0.0.0',
      hmr: true,
      port: Number.parseInt(env.VITE_APP_PORT, 10),
      // 自定义代理规则
      proxy: {
        // 选项写法
        '/api': {
          target: 'http://localhost:6666',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, ''),
        },
      },
    },
    build: {
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: env.VITE_DELETE_CONSOLE === 'true',
          drop_debugger: env.VITE_DELETE_CONSOLE === 'true',
        },
      },
    },
  })
}
