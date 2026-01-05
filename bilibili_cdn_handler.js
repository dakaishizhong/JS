/*
 * Bilibili CDN Handler - Minimalist Version
 * 极致精简版
 * 前置要求：Loon 正则必须排除 httpdns 和 mirror
 * 正则表达式: ^https?:\/\/(?!httpdns|.*mirror)[^\/]+\.bilivideo\.(com|cn|net)        
 * * 逻辑：能触发本脚本的，全都是劣质节点，直接根据路径类型进行“处决”。
 */

const targetHost = "upos-sz-mirrorali.bilivideo.com";
const proxyHost = "proxy-tf-all-ws.bilivideo.com";

const url = $request.url;

// 提取当前 Host，仅用于日志展示和替换
const hostMatch = url.match(/:\/\/(.*?)\//);
const currentHost = hostMatch ? hostMatch[1] : "";

// 只有一种特殊情况需要分流：/v1/resource 必须走 Proxy
if (url.includes("/v1/resource") || /:\d{1,5}\//.test(url)) {
    const newUrl = url.replace(currentHost, proxyHost);
    console.log(`[BiliCDN] ⚠️ 拦截特殊 PCDN (/v1/resource) -> Proxy`);
    $done({ url: newUrl });
} 
// 其他所有情况（MCDN, BCache, UPOS），统统换成阿里 Mirror
else {
    const newUrl = url.replace(currentHost, targetHost);
    console.log(`[BiliCDN] 🛠️ 净化线路 (${currentHost}) -> Ali Mirror`);
    $done({ url: newUrl });
}
