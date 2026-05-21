import path from 'path'
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  output: 'standalone',
  experimental: {
    // モノレポ構成でスタンドアロン出力のファイルトレースをルートから行う
    outputFileTracingRoot: path.join(__dirname, '../'),
  },
}

export default nextConfig
