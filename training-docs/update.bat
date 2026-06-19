@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo.
echo ========================================
echo   电赛入门指南 - 一键更新
echo ========================================
echo.

:: 准备输出目录
if not exist "output\site" mkdir "output\site"

echo [1/6] 拆分到 docs/（供 VitePress 使用）...
python scripts\split-md.py
if %errorlevel% neq 0 (
    echo [FAIL] 拆分失败！
    pause
    exit /b %errorlevel%
)
echo [OK] 拆分完成
echo.

echo [2/6] 构建 VitePress 站点...
call npm run docs:build
if %errorlevel% neq 0 (
    echo [FAIL] 构建失败！
    pause
    exit /b %errorlevel%
)
echo [OK] 构建完成
echo.

echo [3/6] 复制网站文件...
xcopy /E /Y /Q "docs\.vitepress\dist\*" "output\site\" >nul
if not exist "..\static\training" mkdir "..\static\training"
xcopy /E /Y /Q "docs\.vitepress\dist\*" "..\static\training\" >nul
echo [OK] 复制完成
echo.

echo [4/6] 生成 Word 文档...
python scripts\generate-docx-simple.py
if %errorlevel% neq 0 (
    echo [FAIL] Word 文档生成失败！
    pause
    exit /b %errorlevel%
)
echo [OK] Word 文档生成完成
echo.

echo [5/6] 生成 PDF 文档...
python scripts\generate-pdf.py
if %errorlevel% neq 0 (
    echo [WARN] PDF 生成失败（可忽略）
)
echo.

echo [6/6] 提交并推送到 GitHub...
cd ..
git add training-docs/
git commit -m "update: 更新电赛入门指南"
if %errorlevel% neq 0 (
    echo [WARN] 没有新内容需要提交
) else (
    git push
    if %errorlevel% neq 0 (
        echo [FAIL] 推送失败！请检查网络或手动 git push
        pause
        exit /b %errorlevel%
    )
    echo [OK] 已推送到 GitHub
)
echo.

echo ========================================
echo   全部完成！
echo.
echo   本地产物：output\site\ + docx + pdf
echo   网站部署：https://zhoum2833-wq.github.io/training/
echo ========================================
echo.

start "" "output"
pause
