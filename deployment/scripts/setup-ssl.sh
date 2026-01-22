#!/bin/bash
# ==============================================================================
# SSL 证书配置脚本 - IntervAI
# ==============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
export PROJECT_ROOT
source "${SCRIPT_DIR}/utils.sh"

# 配置
detect_env_config() {
    local env_file="${PROJECT_ROOT}/.env.production"
    if [ -f "${env_file}" ]; then
        load_env "${env_file}"
        COMPOSE_FILE="${PROJECT_ROOT}/deployment/docker-compose.prod.yml"
    else
        log_error "SSL 配置仅适用于生产环境，未找到 .env.production"
        exit 1
    fi
}

render_nginx_domain() {
    local file_path="$1"
    local domain_value="$2"
    local temp_file
    temp_file="$(mktemp)"
    if grep -q "__DOMAIN__" "${file_path}"; then
        sed "s/__DOMAIN__/${domain_value}/g" "${file_path}" > "${temp_file}"
    else
        sed -E "s#server_name ([^;]*\\.[^;]*);#server_name ${domain_value} www.${domain_value};#g; s#/etc/letsencrypt/live/[^/]+/#/etc/letsencrypt/live/${domain_value}/#g" "${file_path}" > "${temp_file}"
    fi
    mv "${temp_file}" "${file_path}"
}

setup_ssl() {
    detect_env_config

    local domain=${DOMAIN:-yourdomain.com}
    local email=${LETSENCRYPT_EMAIL:-admin@yourdomain.com}
    local staging=${LETSENCRYPT_STAGING:-false}
    local ssl_dir="${PROJECT_ROOT}/deployment/config/ssl"
    local nginx_conf_dir="${PROJECT_ROOT}/deployment/config/nginx/conf.d"
    local prod_conf="${nginx_conf_dir}/default.conf"
    local init_conf="${nginx_conf_dir}/default.conf.init"

    log_info "SSL 配置信息:"
    echo "  域名: ${domain}"
    echo "  邮箱: ${email}"
    echo "  测试模式: ${staging}"

    if [[ "${domain}" == "yourdomain.com" ]]; then
        log_error "请在 .env.production 中配置正确的 DOMAIN"
        exit 1
    fi

    # 创建目录
    mkdir -p "${ssl_dir}"
    mkdir -p "${PROJECT_ROOT}/certbot/www"
    mkdir -p "${PROJECT_ROOT}/certbot/conf"

    # 1. 生成自签名证书（用于首次启动 Nginx）
    if [ ! -f "${ssl_dir}/cert.pem" ]; then
        log_step "生成初始自签名证书..."
        openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
            -keyout "${ssl_dir}/key.pem" \
            -out "${ssl_dir}/cert.pem" \
            -subj "/C=CN/ST=State/L=City/O=Organization/CN=${domain}"
    fi

    # 2. 切换到初始配置 (Self-Signed)
    log_step "应用初始 Nginx 配置..."
    render_nginx_domain "${prod_conf}" "${domain}"
    render_nginx_domain "${init_conf}" "${domain}"
    cp "${prod_conf}" "${prod_conf}.prod.bak"
    cp "${init_conf}" "${prod_conf}"

    # 3. 启动 Nginx (确保 upstream 可解析)
    log_step "启动 Nginx 及依赖..."
    # 必须启动 backend 和 frontend，否则 nginx upstream 解析会失败
    docker compose -f "${COMPOSE_FILE}" up -d --build backend frontend nginx
    
    log_step "等待服务启动..."
    sleep 10

    # 4. 申请 Let's Encrypt 证书
    log_step "申请 Let's Encrypt 证书..."

    local staging_arg=""
    if [ "${staging}" = "true" ]; then
        staging_arg="--staging"
    fi

    docker compose -f "${COMPOSE_FILE}" run --rm certbot certonly \
        --webroot \
        --webroot-path=/var/www/certbot \
        --email "${email}" \
        --agree-tos \
        --no-eff-email \
        --force-renewal \
        ${staging_arg} \
        -d "${domain}" \
        -d "www.${domain}"

    if [ $? -eq 0 ]; then
        log_info "✓ 证书申请成功"

        # 5. 恢复生产配置 (Let's Encrypt)
        log_step "恢复生产 Nginx 配置..."
        mv "${prod_conf}.prod.bak" "${prod_conf}"

        # 6. 更新 Nginx 配置并重载
        log_step "重载 Nginx..."
        docker compose -f "${COMPOSE_FILE}" exec nginx nginx -s reload

        log_info "SSL 配置完成! 访问: https://${domain}"
    else
        log_error "证书申请失败，请检查日志"
        # 恢复配置以便下次尝试
        mv "${prod_conf}.prod.bak" "${prod_conf}"
        exit 1
    fi
}

setup_ssl
