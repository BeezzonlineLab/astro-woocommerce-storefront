#!/bin/sh
set -eu

escape_json() {
  printf '%s' "$1" | sed -e 's/\\/\\\\/g' -e 's/"/\\"/g'
}

wordpress_url=$(escape_json "${PUBLIC_WORDPRESS_URL:-}")
store_api_url=$(escape_json "${PUBLIC_WOOCOMMERCE_STORE_API_URL:-}")

cat > /usr/share/nginx/html/runtime-config.json <<EOF
{"wordpressUrl":"${wordpress_url}","storeApiUrl":"${store_api_url}"}
EOF
