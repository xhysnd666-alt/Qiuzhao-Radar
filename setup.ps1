# 秋招雷达 · 一键安装（Windows PowerShell）
$ErrorActionPreference = 'Stop'
$repo = 'https://github.com/xhysnd666-alt/Qiuzhao-Radar.git'
$dir = Join-Path $PWD 'qiuzhao-radar'
if (Test-Path $dir) {
  Write-Host "目录已存在，直接使用：$dir" -ForegroundColor Yellow
} else {
  git clone $repo $dir
}
Set-Location $dir
Write-Host ''
Write-Host "✓ 秋招雷达已就绪：$dir" -ForegroundColor Green
Write-Host '打开方式：' -ForegroundColor Cyan
Write-Host '  1) 直接双击 index.html（内地）/ hk.html（留港专区）'
Write-Host '  2) 或本地起服务：npx serve .'
Write-Host ''
Write-Host '想接自己的数据？看 HANDOUT.md' -ForegroundColor Cyan
if (Get-Command npx -ErrorAction SilentlyContinue) {
  npx serve .
} else {
  Start-Process (Join-Path $dir 'index.html')
}
