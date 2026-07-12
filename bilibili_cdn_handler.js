/*
 * Bilibili MCDN Redirect for Loon
 *
 * HTTP-REQUEST 表达式：
 * ^https:\/\/[\w.-]+\.mcdn\.bilivideo\.(?:com|cn|net)(?::\d+)?\/
 *
 * 功能：
 * 1. /v1/resource 使用 TF Proxy。
 * 2. 其他 MCDN 根据 og 参数切换至对应 Mirror。
 * 3. og 缺失或无法识别时使用阿里云 Mirror。
 */

(() => {
    "use strict";

    const PROXY_HOST =
        "proxy-tf-all-ws.bilivideo.com";

    const originalUrl = $request.url;

    if (!originalUrl) {
        return $done({});
    }

    try {
        const uri = new URL(originalUrl);

        const isMcdn =
            /(^|\.)mcdn\.bilivideo\.(?:com|cn|net)$/i
                .test(uri.hostname);

        if (!isMcdn) {
            return $done({});
        }

        const isV1Resource =
            /^\/v1\/resource(?:\/|$)/i
                .test(uri.pathname);

        if (isV1Resource) {
            return redirect(
                `https://${PROXY_HOST}/?url=` +
                encodeURIComponent(originalUrl)
            );
        }

        const og = (
            uri.searchParams.get("og") || ""
        ).toLowerCase();

        let mirrorSuffix = "ali";

        if (og.startsWith("cos")) {
            mirrorSuffix = "cos";
        } else if (og.startsWith("hw")) {
            mirrorSuffix = "08c";
        } else if (og.startsWith("bd")) {
            mirrorSuffix = "bd";
        }

        const mirrorHost =
            `upos-sz-mirror${mirrorSuffix}.bilivideo.com`;

        const newUrl = originalUrl.replace(
            /^https:\/\/[^/]+/i,
            `https://${mirrorHost}`
        );

        if (newUrl === originalUrl) {
            return $done({});
        }

        return redirect(newUrl);
    } catch (_) {
        return $done({});
    }

    function redirect(newUrl) {
        const targetHost = new URL(newUrl).host;
        const headers = Object.assign(
            {},
            $request.headers || {}
        );

        for (const key of Object.keys(headers)) {
            const name = key.toLowerCase();

            if (
                name === "host" ||
                name === ":authority"
            ) {
                headers[key] = targetHost;
            }
        }

        return $done({
            url: newUrl,
            headers
        });
    }
})();
