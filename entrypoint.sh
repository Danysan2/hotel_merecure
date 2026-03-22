#!/bin/sh

# Genera config.js con las variables de entorno en runtime
cat > /usr/share/nginx/html/config.js << EOF
window.__SUPABASE_URL__ = "${VITE_SUPABASE_URL}";
window.__SUPABASE_KEY__ = "${VITE_SUPABASE_KEY}";
EOF

# Inicia nginx
nginx -g "daemon off;"
