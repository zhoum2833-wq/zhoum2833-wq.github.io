@echo off
cd /d "%~dp0"

echo.
echo ========================================
echo   Training Docs - One-Click Update
echo ========================================
echo.

:: Prepare output directories
if not exist "output\site" mkdir "output\site"

echo [1/4] Splitting to docs/ for VitePress...
python scripts\split-md.py
if %errorlevel% neq 0 (
    echo [FAIL] Split failed!
    pause
    exit /b %errorlevel%
)
echo [OK] Split done
echo.

echo [2/4] Building VitePress site...
call npm run docs:build
if %errorlevel% neq 0 (
    echo [FAIL] Build failed!
    pause
    exit /b %errorlevel%
)
echo [OK] Build done
echo.

echo [3/4] Copying site files...
xcopy /E /Y /Q "docs\.vitepress\dist\*" "output\site\" >nul
if not exist "..\static\training" mkdir "..\static\training"
xcopy /E /Y /Q "docs\.vitepress\dist\*" "..\static\training\" >nul
echo [OK] Copy done
echo.

echo [4/4] Generating Word document...
python scripts\generate-docx-simple.py
if %errorlevel% neq 0 (
    echo [WARN] Word generation failed (non-critical)
)
echo.

echo ========================================
echo   All done!
echo.
echo   Output: output\site\ + docx
echo   Deploy: https://zhoum2833-wq.github.io/training/
echo ========================================
echo.

start "" "output"
pause
